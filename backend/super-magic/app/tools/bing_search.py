import asyncio
import json
import os
import re
from typing import Any, Dict, List, Optional

from langchain_community.utilities import BingSearchAPIWrapper
from pydantic import Field

from app.core.config_manager import config
from app.core.context.tool_context import ToolContext
from app.core.entity.factory.tool_detail_factory import ToolDetailFactory
from app.core.entity.message.server_message import ToolDetail
from app.core.entity.tool.tool_result import BingSearchToolResult, ToolResult
from app.logger import get_logger
from app.tools.core import BaseTool, BaseToolParams, tool

logger = get_logger(__name__)

# 搜索结果最大数量
MAX_RESULTS = 10


class BingSearchParams(BaseToolParams):
    """必应搜索参数"""
    query: List[str] = Field(
        ...,
        description="搜索查询内容数组，可同时传入多个不同的查询词并行搜索，单个查询时传入只包含一个元素的数组即可"
    )
    num_results: int = Field(
        10,
        description="每个查询返回的结果数量 (默认: 10，最大: 20)"
    )
    language: str = Field(
        "zh-CN",
        description="搜索语言 (默认: zh-CN)"
    )
    region: str = Field(
        "CN",
        description="搜索区域 (默认: CN)"
    )
    safe_search: bool = Field(
        True,
        description="是否启用安全搜索 (默认: true)"
    )
    time_period: Optional[str] = Field(
        None,
        description="搜索时间范围 (可选): day, week, month, year"
    )


@tool()
class BingSearch(BaseTool[BingSearchParams]):
    """必应搜索工具"""

    # 设置参数类
    params_class = BingSearchParams

    # 设置工具元数据
    name = "bing_search"
    description = """必应搜索工具，用于进行网络搜索。
支持多个查询并行处理，善用并发搜索，可大幅提高搜索效率。
根据信息收集规则，搜索结果中的摘要不是有效来源，必须通过浏览器访问原始页面获取完整信息。
搜索结果将包含标题、URL、摘要和来源网站。

使用场景：
- 查找最新信息和新闻
- 搜索特定主题的资料和参考
- 查询事实和数据
- 寻找解决方案和教程
- 同时搜索多个相关主题，高效并发获取多种信息

注意：
- 搜索结果仅提供线索，需要通过浏览器工具访问原始页面获取完整信息
- 应从多个搜索结果中获取信息以进行交叉验证
- 对于复杂查询，应分解为多个简单查询并利用工具的并发能力
"""

    def __init__(self, **data):
        super().__init__(**data)
        # 从配置中获取API密钥和端点
        self.api_key = config.get("bing.search_api_key", default="")
        self.endpoint = config.get("bing.search_endpoint", default="https://api.bing.microsoft.com/v7.0/search")

    async def execute(
        self,
        tool_context: ToolContext,
        params: BingSearchParams
    ) -> ToolResult:
        """
        执行必应搜索并返回格式化的结果。

        Args:
            tool_context: 工具上下文
            params: 搜索参数对象

        Returns:
            BingSearchToolResult: 包含搜索结果的工具结果
        """
        try:
            # 获取参数
            query = params.query
            num_results = params.num_results
            language = params.language
            region = params.region
            safe_search = params.safe_search
            time_period = params.time_period

            # 验证参数
            if not query:
                return BingSearchToolResult(content="搜索查询不能为空")

            if num_results > MAX_RESULTS:
                num_results = MAX_RESULTS

            # 记录搜索请求
            logger.info(f"执行互联网搜索: 查询数量={len(query)}, 每个查询结果数量={num_results}")

            # 并发执行所有查询
            tasks = [
                self._perform_search(
                    query=q,
                    num_results=num_results,
                    language=language,
                    region=region,
                    safe_search=safe_search,
                    time_period=time_period,
                )
                for q in query
            ]
            all_results = await asyncio.gather(*tasks)

            # 创建结构化结果
            result = self._handle_queries_results(query, all_results)

            if len(query) > 1:
                message = f"我已从搜索引擎中分别搜索了: {', '.join(query)}"
            else:
                message = f"我已从搜索引擎中搜索了: {query[0]}"
            # 设置输出文本
            output_dict = {
                "message": message,
                "results": result.output_results_to_dict()
            }
            result.content = json.dumps(output_dict, ensure_ascii=False)

            return result

        except Exception as e:
            logger.exception(f"必应搜索操作失败: {e!s}")
            return BingSearchToolResult(error=f"搜索操作失败: {e!s}")

    def _handle_queries_results(self, queries: List[str], all_results: List[List[Dict[str, Any]]]) -> BingSearchToolResult:
        """
        格式化多个查询的搜索结果

        Args:
            queries: 查询字符串列表
            all_results: 每个查询对应的搜索结果列表

        Returns:
            BingSearchToolResult: 包含所有格式化搜索结果的工具结果
        """
        result = BingSearchToolResult(content="")

        # 格式化所有结果
        for q, search_results in zip(queries, all_results):
            result.set_output_results(q, search_results)
            result.set_search_results(q, search_results)

        return result

    async def _perform_search(
        self, query: str, num_results: int, language: str, region: str, safe_search: bool, time_period: Optional[str]
    ) -> List[Dict[str, Any]]:
        """执行实际的搜索请求，使用langchain-community的BingSearchAPIWrapper"""
        # 设置搜索参数
        search_params = {
            "count": num_results,
            "setLang": language,
            "mkt": f"{language}-{region}",
        }

        # 设置安全搜索
        if safe_search:
            search_params["safeSearch"] = "Strict"
        else:
            search_params["safeSearch"] = "Off"

        # 设置时间范围
        if time_period:
            if time_period == "day":
                search_params["freshness"] = "Day"
            elif time_period == "week":
                search_params["freshness"] = "Week"
            elif time_period == "month":
                search_params["freshness"] = "Month"

        try:
            search = BingSearchAPIWrapper(
                k=num_results,  # 返回结果数量
                search_kwargs={
                    "mkt": f"{language}-{region}",  # 设置区域
                    "setLang": language,  # 设置语言
                },
            )

            # 设置 API 密钥
            os.environ["BING_SEARCH_URL"] = self.endpoint
            os.environ["BING_SUBSCRIPTION_KEY"] = self.api_key

            # 执行搜索请求
            result_str = search.run(query)

            # 转换为结构化结果
            search_results = search.results(query, num_results)
            # 增强结果，添加来源网站和favicon
            for item in search_results:
                # 提取域名（来源网站）
                domain = self._extract_domain(item["link"])
                item["domain"] = domain
                item["icon_url"] = self._get_favicon_url(domain)

            return search_results

        except Exception as e:
            logger.error(f"必应搜索API请求失败: {e!s}")
            return []  # 返回空结果

    def _extract_domain(self, url: str) -> str:
        """从URL中提取域名"""
        try:
            domain = re.search(r"https?://([^/]+)", url)
            if domain:
                return domain.group(1)
            return url
        except Exception:
            return url

    def _get_favicon_url(self, domain: str) -> str:
        """生成网站favicon的URL"""
        return f"https://{domain}/favicon.ico"

    async def get_tool_detail(self, tool_context: ToolContext, result: ToolResult, arguments: Dict[str, Any] = None) -> Optional[ToolDetail]:
        """
        生成工具详情，用于前端展示

        Args:
            tool_context: 工具上下文
            result: 工具结果
            arguments: 工具参数

        Returns:
            Optional[ToolDetail]: 工具详情
        """
        if not result.content:
            return None

        try:
            if not isinstance(result, BingSearchToolResult):
                return None

            # 使用工厂创建展示详情
            return ToolDetailFactory.create_search_detail_from_search_results(
                search_results=result.search_results,
            )
        except Exception as e:
            logger.error(f"生成工具详情失败: {e!s}")
            return None

    async def get_after_tool_call_friendly_action_and_remark(self, tool_name: str, tool_context: ToolContext, result: ToolResult, execution_time: float, arguments: Dict[str, Any] = None) -> Dict:
        """获取工具调用后的友好动作和备注"""
        if not arguments or "query" not in arguments:
            return {
                "action": "互联网搜索",
                "remark": "已完成搜索"
            }

        query = arguments["query"]
        if len(query) > 1:
            return {
                "action": "互联网搜索",
                "remark": f"搜索: {', '.join(query)}"
            }
        return {
            "action": "互联网搜索",
            "remark": f"搜索: {query[0]}"
        }
