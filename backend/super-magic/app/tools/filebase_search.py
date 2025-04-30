import json
import time
from typing import Any, Dict

from pydantic import Field

from app.core.context.tool_context import ToolContext
from app.core.entity.tool.tool_result import ToolResult
from app.filebase.filebase import Filebase
from app.filebase.filebase_config import FilebaseConfig
from app.logger import get_logger
from app.tools.core import tool
from app.tools.core.base_tool import BaseTool
from app.tools.core.base_tool_params import BaseToolParams

logger = get_logger(__name__)


class FilebaseSearchParams(BaseToolParams):
    """Filebase搜索参数"""
    query: str = Field(..., description="要搜索的模糊文件名或文件内容，可以是单个查询或以逗号分隔的多个查询")
    limit: int = Field(3, description="返回结果的数量限制")


@tool()
class FilebaseSearch(BaseTool[FilebaseSearchParams]):
    """
    FilebaseSearch工具，用于根据查询从Filebase中搜索索引，可以搜索 workspace 目录下的文件
    """

    name: str = "filebase_search"
    description: str = "根据query在Filebase中搜索相关内容，可以搜索 workspace 目录下的文件及文件内容"

    # 设置参数类型
    params_class = FilebaseSearchParams

    async def execute(self, tool_context: ToolContext, params: FilebaseSearchParams) -> ToolResult:
        """
        执行Filebase搜索

        Args:
            tool_context: 工具上下文
            params: 搜索参数

        Returns:
            ToolResult: 搜索结果
        """
        start_time = time.time()

        try:
            # 检查query是否为空
            if not params.query:
                # 处理空查询的情况
                logger.warning("Filebase搜索查询为空，请检查")
                result_data = {
                    "hint": "请在参数中提供query字段以进行搜索",
                    "example": {
                        "query": "要搜索的内容或以逗号分隔的多个查询",
                        "limit": 3
                    }
                }
                return ToolResult(
                    content="请提供搜索Filebase查询Query",
                    system=json.dumps(result_data, ensure_ascii=False)
                )

            # 初始化Filebase
            filebase_config = FilebaseConfig()
            filebase = Filebase(filebase_config)

            # 从 agent_context 中获取 sandbox_id
            sandbox_id = tool_context.agent_context.get_sandbox_id()
            if not sandbox_id:
                # 因为是每个话题都在一个独立的 sandbox 运行，所以不需要通过 sandbox_id 来区分 collection
                sandbox_id = "default"
            await filebase.initialize(sandbox_id)

            # 处理查询字符串，支持多个查询（以逗号分隔）
            queries = [q.strip() for q in params.query.split(',') if q.strip()]
            if not queries:
                queries = [params.query]  # 如果分割后为空，则使用原始查询

            logger.info(f"处理 {len(queries)} 个查询：{queries}")

            # 执行搜索
            results_list = await filebase.search(
                queries=queries,
                limit=params.limit
            )

            # 格式化结果
            all_formatted_results = []

            for i, results in enumerate(results_list):
                current_query = queries[i] if i < len(queries) else params.query
                formatted_results = []

                for result in results:
                    if "payload" in result:
                        payload = result["payload"]
                        # 创建基本结果对象
                        formatted_result = {
                            "id": result.get("id", ""),
                            "score": result.get("score", 0),
                            "query": current_query  # 添加对应的查询文本
                        }

                        # 确保添加 text 和 metadata
                        formatted_result["text"] = payload.get("text", "")
                        formatted_result["metadata"] = payload.get("metadata", {})

                        # 检查是否为文件名匹配的结果
                        file_name = formatted_result["metadata"].get("file_name", "")
                        if file_name and current_query.lower() in file_name.lower():
                            formatted_result["match_type"] = "file_name"
                            # 保留原始分数，但确保文件名匹配的结果有较高的分数
                            if formatted_result["score"] < 0.8:
                                formatted_result["score"] = 0.8
                        else:
                            formatted_result["match_type"] = "content"

                        # 添加 payload 中的其他可能的字段
                        for key, value in payload.items():
                            if key not in ["text", "metadata"]:
                                formatted_result[key] = value

                        formatted_results.append(formatted_result)

                all_formatted_results.extend(formatted_results)

            # 按相似度得分降序排序
            all_formatted_results.sort(key=lambda x: x.get("score", 0), reverse=True)

            # 如果结果超过限制，只保留前 limit 个
            if len(all_formatted_results) > params.limit:
                all_formatted_results = all_formatted_results[:params.limit]

            execution_time = time.time() - start_time
            logger.info(f"搜索完成，找到 {len(all_formatted_results)} 个结果，耗时: {execution_time:.2f}秒")

            # 分析结果类型
            file_name_matches = sum(1 for result in all_formatted_results if result.get("match_type") == "file_name")
            content_matches = sum(1 for result in all_formatted_results if result.get("match_type") == "content")

            message = f"在沙盒 {sandbox_id} 中找到 {len(all_formatted_results)} 个匹配结果"
            if file_name_matches > 0:
                message += f"，其中 {file_name_matches} 个为文件名匹配"

            return ToolResult(
                content=message,
                system=json.dumps(all_formatted_results, ensure_ascii=False)
            )

        except Exception as e:
            execution_time = time.time() - start_time
            error_msg = f"搜索执行失败: {e!s}"
            logger.error(error_msg, exc_info=True)

            # 使用 error 字段，验证器会自动处理
            return ToolResult(
                error=error_msg
            )

    async def get_after_tool_call_friendly_content(
        self,
        tool_context: ToolContext,
        result: ToolResult,
        execution_time: float,
        arguments: Dict[str, Any] = None
    ) -> str:
        """
        获取工具调用后的友好内容

        Args:
            tool_context: 工具上下文
            result: 工具执行结果
            execution_time: 执行耗时
            arguments: 执行参数

        Returns:
            str: 友好的执行结果消息
        """
        # 检查arguments是否为None
        if arguments is None:
            arguments = {}

        # 因为验证器已经处理了 error 字段，所以这里只需检查 ok 字段
        if not result.ok:
            return f"搜索失败: {result.content}"

        # 尝试从system字段解析数据
        data = []
        if result.system:
            try:
                data = json.loads(result.system)
            except json.JSONDecodeError:
                pass

        if not data:
            return "未找到匹配的结果"

        # 处理空参数情况 - 检查hint是否存在于第一个元素中
        if isinstance(data, dict) and "hint" in data:
            return data["hint"]

        query = arguments.get("query", "")
        # 如果query为空但结果中有数据，可能是使用了默认查询
        if not query:
            message = f"搜索完成，找到 {len(data)} 条结果"
        else:
            # 处理多查询的情况
            if ',' in query:
                message = f"在工作区中找到 {len(data)} 个与多个查询相关的结果"
            else:
                message = f"在工作区中找到 {len(data)} 个与 '{query}' 相关的结果"

        return message

    async def get_after_tool_call_friendly_action_and_remark(
        self,
        tool_name: str,
        tool_context: ToolContext,
        result: ToolResult,
        execution_time: float,
        arguments: Dict[str, Any] = None
    ) -> Dict:
        """
        获取工具调用后的友好动作和备注

        Args:
            tool_name: 工具名称
            tool_context: 工具上下文
            result: 工具执行结果
            execution_time: 执行耗时
            arguments: 执行参数

        Returns:
            Dict: 包含action和remark的字典
        """
        query = arguments.get("query", "") if arguments else ""

        # 因为验证器已经处理了 error 字段，所以这里只需检查 ok 字段
        if not result.ok:
            return {
                "action": "搜索文件",
                "remark": f"搜索失败: {result.content}"
            }

        # 尝试从system字段解析数据
        data_count = 0
        if result.system:
            try:
                data = json.loads(result.system)
                if isinstance(data, list):
                    data_count = len(data)
                elif isinstance(data, dict) and "hint" not in data:
                    data_count = 1
            except json.JSONDecodeError:
                pass

        return {
            "action": "搜索文件",
            "remark": f"搜索「{query}」，找到 {data_count} 个结果"
        }
