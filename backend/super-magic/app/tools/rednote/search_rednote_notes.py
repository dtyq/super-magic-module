"""
小红书工具模块 - 搜索小红书文章

此模块不依赖TikHub API，而是使用aiohttp直接请求小红书相关接口。
提供对小红书平台文章搜索功能，接口返回格式保持与原tikhub实现兼容。

支持的功能:
- 搜索小红书文章 (search_rednote_notes)

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
from app.tools.rednote.base_rednote import BaseRednote

logger = get_logger(__name__)


class SearchRednoteNotesParams(BaseToolParams):
    """小红书文章搜索参数"""
    keywords: str = Field(
        ...,
        description="搜索关键词，用于查找相关笔记"
    )
    page: int = Field(
        1,
        description="页码，用于分页查询"
    )
    note_type: str = Field(
        "2",
        description="内容类型筛选，0为全部，1为视频，2为图文"
    )
    sort_type: str = Field(
        "general",
        description="排序方式，general为综合排序，popularity_descending为最多赞同，time_descending为最新发布"
    )
    format: str = Field(
        "markdown",
        description="返回格式，支持json或markdown"
    )


@tool()
class SearchRednoteNotes(BaseRednote[SearchRednoteNotesParams]):
    """小红书工具，提供小红书文章搜索功能"""

    # 设置参数类
    params_class = SearchRednoteNotesParams

    # 设置工具元数据
    name = "search_rednote_notes"
    description = "用于搜索小红书平台文章、回答和视频，支持多种筛选条件"

    # 小红书搜索API端点
    _api_endpoint = "/api/v1/xiaohongshu/web_v2/fetch_search_notes"

    def __init__(self, **data):
        super().__init__(**data)
        # 初始化参数
        self.base_url = "https://api.tikhub.io"
        self.api_key = None

    async def _search_rednote_notes(self, params: SearchRednoteNotesParams) -> Dict[str, Any]:
        """
        搜索小红书文章并返回结果
        
        Args:
            params: 搜索参数
            
        Returns:
            Dict[str, Any]: 搜索结果
        """
        # 准备请求参数
        request_params = {
            "keywords": params.keywords,
            "page": params.page,
            "note_type": params.note_type,
            "sort_type": params.sort_type,
        }

        url_with_query_params = f"{self._api_endpoint}?{urlencode(request_params)}"
        logger.info(f"请求小红书文章搜索: {url_with_query_params}")

        notes = await self._make_request(url_with_query_params)

        return notes

    async def execute(
        self,
        tool_context: ToolContext,
        params: SearchRednoteNotesParams
    ) -> ToolResult:
        """
        执行工具并搜索小红书文章
        
        Args:
            tool_context: 工具上下文
            params: 工具参数对象，包含keyword、limit、offset等参数
            
        Returns:
            ToolResult: 包含小红书文章搜索结果的工具结果对象
        """
        try:
            # 验证参数
            if not params.keywords:
                return ToolResult(error="搜索关键词不能为空")
                
            search_results = await self._search_rednote_notes(params)

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
            logger.exception(f"搜索小红书文章失败: {e!s}")
            return ToolResult(error=f"搜索小红书文章失败: {e!s}")

    async def get_after_tool_call_friendly_action_and_remark(self, tool_name: str, tool_context: ToolContext, result: ToolResult, execution_time: float, arguments: Dict[str, Any] = None) -> Dict:
        """获取工具调用后的友好动作和备注"""
        keywords = arguments.get("keywords", "") if arguments else ""
        return {
            "action": "搜索小红书文章",
            "remark": f"关键词: {keywords}"
        } 
    
    def _clean_search_results(self, search_results: Dict[str, Any]) -> Dict[str, Any]:
        """清洗搜索结果"""
        # 取 search_results.items 结果
        return search_results.get("items", [])
    
    def _convert_to_markdown(self, search_results: Dict[str, Any]) -> str:
        """将搜索结果从转换为markdown格式"""
        content = "搜索结果:\n"
        for result in search_results:
            if result.get('model_type') != 'note':
                continue
            note_card = result.get('note_card', {})
            author = note_card.get('user', {})
            interact_info = note_card.get('interact_info', {})
            corner_tag_info = note_card.get('corner_tag_info', [])
            publish_time = corner_tag_info[0].get('text', '') if corner_tag_info else ''
            note_content = f"====================\n"
            note_content += f"ID: {result.get('id', '')}\n"
            note_content += f"标题: {note_card.get('display_title', '')}\n"
            note_content += f"作者: {author.get('nick_name', '')}\n"
            note_content += f"赞同数: {interact_info.get('liked_count', 0)}\n"
            note_content += f"评论数: {interact_info.get('comment_count', 0)}\n"
            note_content += f"收藏数: {interact_info.get('collected_count', 0)}\n"
            note_content += f"分享数: {interact_info.get('shared_count', 0)}\n"
            note_content += f"发布时间: {publish_time}\n"
            content += note_content

        return content