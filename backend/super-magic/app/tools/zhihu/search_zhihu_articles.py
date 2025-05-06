"""
知乎工具模块 - 搜索知乎文章

此模块不依赖TikHub API，而是使用aiohttp直接请求知乎相关接口。
提供对知乎平台文章搜索功能，接口返回格式保持与原tikhub实现兼容。

支持的功能:
- 搜索知乎文章 (search_zhihu_articles)

最后更新: 2024-06-14
"""

from datetime import datetime
import json
import re
import traceback
from typing import Any, Dict, List, Optional
from urllib.parse import urlencode

import aiohttp
from bs4 import BeautifulSoup
from pydantic import Field

from app.core.config_manager import config
from app.core.context.tool_context import ToolContext
from app.core.entity.tool.tool_result import ToolResult, WebpageToolResult
from app.logger import get_logger
from app.tools.core import BaseTool, BaseToolParams, tool
from app.tools.zhihu.base_zhihu import BaseZhihu

logger = get_logger(__name__)


class SearchZhihuArticlesParams(BaseToolParams):
    """知乎文章搜索参数"""
    keyword: str = Field(
        ...,
        description="搜索关键词，用于查找相关文章"
    )
    offset: int = Field(
        0,
        description="偏移量，用于分页查询"
    )
    limit: int = Field(
        20,
        description="每页返回的文章数量，默认为20"
    )
    show_all_topics: int = Field(
        1,
        description="是否显示所有主题，0不显示话题，1显示话题"
    )
    search_source: str = Field(
        "Normal",
        description="搜索来源，Filter过滤参数生效，Normal为普通结果"
    )
    search_hash_id: str = Field(
        "",
        description="搜索哈希ID，用于过滤重复搜索结果"
    )
    vertical: str = Field(
        "article",
        description="内容类型筛选，空不限类型，answer只看回答，article只看文章，zvideo只看视频"
    )
    sort: str = Field(
        "",
        description="排序方式，空为综合排序，upvoted_count为最多赞同，created_time为最新发布"
    )
    format: str = Field(
        "markdown",
        description="返回格式，支持json或markdown"
    )


@tool()
class SearchZhihuArticles(BaseZhihu[SearchZhihuArticlesParams]):
    """知乎工具，提供知乎文章搜索功能"""

    # 设置参数类
    params_class = SearchZhihuArticlesParams

    # 设置工具元数据
    name = "search_zhihu_articles"
    description = "用于搜索知乎平台文章、回答和视频，支持多种筛选条件"

    # 知乎搜索API端点
    _api_endpoint = "/api/v1/zhihu/web/fetch_article_search_v3"

    def __init__(self, **data):
        super().__init__(**data)
        # 初始化参数
        self.base_url = "https://api.tikhub.io"
        self.api_key = None

    @property
    def headers(self) -> Dict[str, str]:
        """获取请求头"""
        if self.api_key is None:
            self.api_key = config.get("tikhub.api_key")
            if not self.api_key:
                raise ValueError("未在配置文件中找到tikhub.api_key")

        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    async def _search_zhihu_articles(self, params: SearchZhihuArticlesParams) -> Dict[str, Any]:
        """
        搜索知乎文章并返回结果
        
        Args:
            params: 搜索参数
            
        Returns:
            Dict[str, Any]: 搜索结果
        """
        # 准备请求参数
        request_params = {
            "keyword": params.keyword,
            "offset": params.offset,
            "limit": params.limit,
            "show_all_topics": params.show_all_topics,
            "search_source": params.search_source,
        }
        
        if params.search_hash_id:
            request_params["search_hash_id"] = params.search_hash_id
        if params.vertical:
            request_params["vertical"] = params.vertical
        if params.sort:
            request_params["sort"] = params.sort

        url_with_query_params = f"{self._api_endpoint}?{urlencode(request_params)}"
        logger.info(f"请求知乎文章搜索: {url_with_query_params}")

        result = await self._make_request(url_with_query_params)
        articles = result.get("data", {})
        
        return articles

    async def execute(
        self,
        tool_context: ToolContext,
        params: SearchZhihuArticlesParams
    ) -> ToolResult:
        """
        执行工具并搜索知乎文章
        
        Args:
            tool_context: 工具上下文
            params: 工具参数对象，包含keyword、limit、offset等参数
            
        Returns:
            ToolResult: 包含知乎文章搜索结果的工具结果对象
        """
        try:
            # 验证参数
            if not params.keyword:
                return ToolResult(error="搜索关键词不能为空")
                
            search_results = await self._search_zhihu_articles(params)

            # 清洗 search_results
            search_results = self._clean_search_results(search_results)

            if params.format == "markdown":
                # 将搜索结果转换为markdown格式
                search_results = self._convert_to_markdown(search_results)
                
            # 构建工具结果
            return WebpageToolResult(
                content=search_results
            )
            
        except Exception as e:
            logger.exception(f"搜索知乎文章失败: {e!s}")
            return ToolResult(error=f"搜索知乎文章失败: {e!s}")

    async def get_after_tool_call_friendly_action_and_remark(self, tool_name: str, tool_context: ToolContext, result: ToolResult, execution_time: float, arguments: Dict[str, Any] = None) -> Dict:
        """获取工具调用后的友好动作和备注"""
        keyword = arguments.get("keyword", "") if arguments else ""
        return {
            "action": "搜索知乎文章",
            "remark": f"关键词: {keyword}"
        } 
    
    def _clean_search_results(self, search_results: Dict[str, Any]) -> Dict[str, Any]:
        """清洗搜索结果"""
        # 过滤 type 不为 search_result 且 object.type 不为 article 的结果
        search_results = [result for result in search_results if result.get("type") == "search_result" and result.get("object", {}).get("type") == "article"]
        return search_results
    
    def _convert_to_markdown(self, search_results: Dict[str, Any]) -> str:
        """将搜索结果从转换为markdown格式"""
        content = "搜索结果:\n"
        for result in search_results:
            object = result.get('object', {})
            if object.get('type') != 'article':
                continue
            created_time = datetime.fromtimestamp(object.get('created_time', 0))
            updated_time = datetime.fromtimestamp(object.get('updated_time', 0))
            author = object.get('author', {})
            markdown_content = self._convert_html_to_markdown(object.get('content', ''))
            url = f"https://zhuanlan.zhihu.com/p/{object.get('id', '')}"
            article_content = f"====================\n"
            article_content += f"ID: {object.get('id', '')}\n"
            article_content += f"URL: {url}\n"
            article_content += f"标题: {object.get('title', '')}\n"
            article_content += f"作者: {author.get('name', '')}\n"
            article_content += f"内容: \n```\n{markdown_content}\n```\n"
            article_content += f"赞同数: {object.get('upvoted_count', 0)}\n"
            article_content += f"评论数: {object.get('comment_count', 0)}\n"
            article_content += f"创建时间: {created_time}\n"
            article_content += f"更新时间: {updated_time}\n"
            content += article_content

        print(content)
        exit()
        return content