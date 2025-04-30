import json
import time
from typing import Any, Dict, List, Optional

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


class FilebaseReadFileParams(BaseToolParams):
    """Filebase读取文件参数"""
    file_path: str = Field(..., description="要读取的相对workspace目录的文件路径，必填，比如 .workspace/todo.md 只需传递 todo.md 即可")
    query: Optional[str] = Field(None, description="查询内容，用于匹配部分内容，可选。若提供query则返回最匹配的一个分片，若不提供则返回全部文件内容")

@tool()
class FilebaseReadFile(BaseTool[FilebaseReadFileParams]):
    """
    FilebaseReadFile工具，用于从Filebase索引中读取文件内容，可以根据file_path匹配索引中的文件内容
    """

    name: str = "filebase_read_file"
    description: str = "从Filebase中读取指定文件的内容，可以读取全部内容或基于查询匹配部分内容"

    # 设置参数类型
    params_class = FilebaseReadFileParams

    async def execute(self, tool_context: ToolContext, params: FilebaseReadFileParams) -> ToolResult:
        """
        执行文件读取操作

        Args:
            tool_context: 工具上下文
            params: 读取参数

        Returns:
            ToolResult: 读取结果
        """
        start_time = time.time()

        try:
            # 检查文件路径是否有效
            if not params.file_path:
                return ToolResult(
                    error="文件路径不能为空"
                )

            # 初始化Filebase
            filebase_config = FilebaseConfig()
            filebase = Filebase(filebase_config)

            # 从agent_context中获取sandbox_id
            sandbox_id = tool_context.agent_context.get_sandbox_id()
            if not sandbox_id:
                # 因为是每个话题都在一个独立的 sandbox 运行，所以不需要通过 sandbox_id 来区分 collection
                sandbox_id = "default"
            await filebase.initialize(sandbox_id)

            # 构建collection_name
            collection_name = filebase.index_manager.build_collection_name(sandbox_id)

            # 检查集合是否存在
            if not await filebase.vector_store.collection_exists(collection_name):
                return ToolResult(
                    error=f"沙盒集合 {collection_name} 不存在"
                )

            # 构建文件路径过滤条件
            filter_condition = {
                "must": [
                    {
                        "key": "metadata.file_path",
                        "match": {
                            "value": params.file_path
                        }
                    }
                ]
            }

            # 根据是否提供 query 参数决定读取模式
            is_full_content = params.query is None or params.query.strip() == ""

            if is_full_content:
                # 全文读取模式：使用空查询，只通过filter_condition过滤
                results = await filebase.vector_store.search(
                    collection_name=collection_name,
                    query_text="",  # 空查询
                    filter_condition=filter_condition
                )
            else:
                # 部分内容读取模式：使用query进行相似度搜索，只返回最匹配的1个结果
                results = await filebase.vector_store.search(
                    collection_name=collection_name,
                    query_text=params.query,
                    filter_condition=filter_condition,
                    limit=1
                )

            # 如果没有找到结果
            if not results or len(results) == 0:
                return ToolResult(
                    error=f"在Filebase中未找到路径为 '{params.file_path}' 的文件内容"
                )

            # 处理结果，提取文本内容和行号
            processed_results = self._process_results(results)

            # 格式化输出结果，还原原始文件格式，不添加分隔符或行号
            formatted_content = self._format_content(processed_results, params.file_path, is_full_content)

            execution_time = time.time() - start_time
            logger.info(f"文件 {params.file_path} 内容读取完成，耗时: {execution_time:.2f}秒")

            # 构建结果
            content_message = f"成功从Filebase读取文件 '{params.file_path}' 的内容"
            if not is_full_content:
                content_message += f"，基于查询 '{params.query}'，返回最匹配的片段"

            # 构建结果数据
            result_data = {
                "file_path": params.file_path,
                "content": formatted_content,
                "content_type": "text",
                "is_partial": not is_full_content,
                "query": params.query,
                "chunks": len(results),
                "message": content_message
            }

            return ToolResult(
                content=json.dumps(result_data, ensure_ascii=False)
            )

        except Exception as e:
            execution_time = time.time() - start_time
            error_msg = f"读取文件失败: {e!s}"
            logger.error(error_msg, exc_info=True)

            return ToolResult(
                error=error_msg
            )

    def _process_results(self, results: List[Dict]) -> List[Dict]:
        """
        处理搜索结果，提取文本内容和行号信息

        Args:
            results: 从Qdrant搜索得到的结果列表

        Returns:
            List[Dict]: 处理后的结果，包含文本内容和行号
        """
        processed_results = []

        for result in results:
            if "payload" in result:
                payload = result["payload"]
                text = payload.get("text", "")
                metadata = payload.get("metadata", {})

                # 从metadata或chunk_metadata中提取行信息
                start_line = metadata.get("start_line", None)
                end_line = metadata.get("end_line", None)

                # 如果没有明确的行号信息，尝试从文本内容中解析
                if start_line is None or end_line is None:
                    chunk_index = metadata.get("chunk_index", 0)
                    total_chunks = metadata.get("total_chunks", 1)
                    # 估算行号 - 实际使用时可能需要更准确的方法
                    estimated_line_count = text.count('\n') + 1
                    start_line = chunk_index * estimated_line_count
                    end_line = start_line + estimated_line_count - 1

                processed_results.append({
                    "text": text,
                    "start_line": start_line,
                    "end_line": end_line,
                    "score": result.get("score", 0),
                    "metadata": metadata
                })

        # 按行号排序
        processed_results.sort(key=lambda x: x.get("start_line", 0))
        return processed_results

    def _format_content(self, results: List[Dict], file_path: str, is_full_content: bool) -> str:
        """
        格式化内容，包括行号

        Args:
            results: 处理后的结果列表
            file_path: 文件路径
            is_full_content: 是否为全文内容

        Returns:
            str: 格式化后的内容
        """
        if not results:
            return f"文件 {file_path} 未找到内容"

        # 无论全文或部分内容，都尝试按行号排序并重建文件结构
        sorted_results = sorted(results, key=lambda x: x.get("start_line", 0))

        if is_full_content:
            # 全文返回模式，完整重建文件
            combined_text = ""
            current_line = 0

            for result in sorted_results:
                text = result.get("text", "")
                start_line = result.get("start_line", current_line)

                # 如果有行号间隔，添加占位符
                if start_line > current_line and current_line > 0:
                    combined_text += f"\n... (行 {current_line+1} 至 {start_line-1} 被省略) ...\n"

                # 添加当前文本块
                if start_line == 0:  # 第一个块
                    combined_text += text
                else:
                    # 避免文本重复，只添加新行
                    lines = text.split('\n')
                    new_lines = lines[max(0, current_line - start_line):]
                    combined_text += '\n'.join(new_lines)

                # 更新当前行号
                current_line = result.get("end_line", current_line + text.count('\n') + 1)

            return combined_text
        else:
            # 部分内容返回，但依然尝试构建连贯的内容
            # 按行号排序后组合文本内容，不添加分隔符，也不显示行号
            formatted_content = ""
            last_end_line = -1

            for result in sorted_results:
                text = result.get("text", "")
                start_line = result.get("start_line", 0)
                end_line = result.get("end_line", start_line + text.count('\n'))

                # 如果与上一个片段有很大间隔，添加提示性空行
                if last_end_line != -1 and start_line > last_end_line + 1:
                    # 添加一个空行作为间隔，不使用明显的分隔符
                    formatted_content += "\n\n"

                # 直接添加原始文本，不添加行号
                if formatted_content and not formatted_content.endswith('\n'):
                    formatted_content += '\n'

                formatted_content += text
                last_end_line = end_line

            return formatted_content

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

        # 从arguments中获取file_path和query
        file_path = arguments.get("file_path", "")
        query = arguments.get("query", "")
        is_full_content = query is None or query.strip() == ""

        # 检查结果是否成功
        if not result.ok:
            return f"读取文件失败: {result.content}"

        if not is_full_content:
            message = f"成功读取文件 '{file_path}' 的部分内容"
        else:
            message = f"成功读取文件 '{file_path}' 的全部内容"

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
        # 检查arguments是否为None
        if arguments is None:
            arguments = {}

        # 从arguments中获取file_path和query
        file_path = arguments.get("file_path", "")
        query = arguments.get("query", "")
        is_full_content = query is None or query.strip() == ""

        # 检查结果是否成功
        if not result.ok:
            return {
                "action": "读取文件",
                "remark": f"'{file_path}' 失败"
            }

        # 处理成功情况
        if is_full_content:
            return {
                "action": "读取文件",
                "remark": f"'{file_path}' 的全部内容（原始格式）"
            }
        else:
            return {
                "action": "读取文件",
                "remark": f"基于查询「{query}」读取 '{file_path}' 的最匹配片段（原始格式）"
            }
