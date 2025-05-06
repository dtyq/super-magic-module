import datetime
import json
import os
import re
from pathlib import Path
from typing import Any, Dict, Optional

import aiofiles
from pydantic import Field

from app.tools.abstract_file_tool import AbstractFileTool

from markitdown import MarkItDown
from app.tools.markitdown_plugins.pdf_plugin import PDFConverter
from app.tools.markitdown_plugins.excel_plugin import ExcelConverter
from app.tools.markitdown_plugins.csv_plugin import CSVConverter

try:
    import pandas as pd
except ImportError:
    pd = None

from app.core.context.tool_context import ToolContext
from app.core.entity.message.server_message import DisplayType, FileContent, ToolDetail
from app.core.entity.tool.tool_result import ToolResult
from app.logger import get_logger
from app.tools.core import BaseToolParams, tool
from app.tools.workspace_guard_tool import WorkspaceGuardTool
from app.utils.token_estimator import num_tokens_from_string

logger = get_logger(__name__)

# 设置最大Token限制
MAX_TOTAL_TOKENS = 30000


class ReadFileParams(BaseToolParams):
    """读取文件参数"""
    file_path: str = Field(..., description="要读取的文件路径，相对于工作目录或绝对路径")
    offset: Optional[int] = Field(0, description="开始读取的行号（从0开始）")
    limit: Optional[int] = Field(100, description="要读取的行数或页数，默认100行，如果要读取整个文件，请设置为-1")


@tool()
class ReadFile(AbstractFileTool[ReadFileParams], WorkspaceGuardTool[ReadFileParams]):
    """读取文件内容工具

    这个工具可以读取指定路径的文件内容，支持文本文件、PDF和DOCX等格式。

    支持的文件类型：
    - 文本文件（.txt、.md、.py、.js等）
    - PDF文件（.pdf）
    - Word文档（.docx）
    - Jupyter Notebook（.ipynb）
    - Excel文件（.xls、.xlsx）
    - CSV文件（.csv）

    注意：
    - 读取工作目录外的文件被禁止
    - 二进制文件可能无法正确读取
    - 过大的文件将被拒绝读取，你必须分段读取部分内容来理解文件概要
    - 对于Excel和CSV文件，建议使用代码处理数据而不是直接使用文本内容
    - 为避免内容过长，总token数超过30000时会自动截断内容
    """

    # 设置参数类型
    params_class = ReadFileParams

    # Excel处理的最大行数限制
    EXCEL_MAX_ROWS = 1000
    EXCEL_MAX_PREVIEW_ROWS = 50

    md = MarkItDown()
    md.register_converter(PDFConverter())
    md.register_converter(ExcelConverter())
    md.register_converter(CSVConverter())

    async def execute(self, tool_context: ToolContext, params: ReadFileParams) -> ToolResult:
        """
        执行文件读取操作

        Args:
            tool_context: 工具上下文
            params: 文件读取参数

        Returns:
            ToolResult: 包含文件内容或错误信息
        """
        return await self.execute_purely(params)

    async def execute_purely(self, params: ReadFileParams) -> ToolResult:
        """
        执行文件读取操作，无需工具上下文参数

        Args:
            params: 文件读取参数

        Returns:
            ToolResult: 包含文件内容或错误信息
        """
        try:
            # 使用父类方法获取安全的文件路径
            file_path, error = self.get_safe_path(params.file_path)

            if error:
                return ToolResult(error=error)

            # 检查是否是个文件夹
            if file_path.is_dir():
                return ToolResult(error=f"文件 {file_path} 路径是个文件夹，请使用 list_dir 工具获取文件夹内容")

            # 检查文件是否存在
            if not file_path.exists():
                return ToolResult(error=f"文件不存在: {file_path}")

            file_extension = file_path.suffix.lower()

            is_binary_file = await self._is_binary_file(file_path)
            if is_binary_file or file_extension in [".ipynb", ".csv"]:
                logger.info(f"文件 {file_path} 使用markitdown进行转换")
                try:
                    with open(file_path, "rb") as f:
                        result = self.md.convert(f, offset=params.offset, limit=params.limit)
                        content = result.markdown
                except Exception as e:
                    logger.exception(f"文件转换失败: {e!s}")
                    return ToolResult(error=f"文件转换失败: {e!s}")
            else:
                logger.info(f"文件 {file_path} 使用 read_text_file 进行读取")
                if params.limit is None or params.limit <= 0:
                    content = await self._read_text_file(file_path)
                else:
                    content = await self._read_text_file_with_range(
                        file_path, params.offset, params.limit
                    )

            # 计算token数量并处理截断
            content_tokens = num_tokens_from_string(content)
            total_chars = len(content)
            content_truncated = False

            if content_tokens > MAX_TOTAL_TOKENS:
                logger.info(f"文件 {file_path.name} 内容token数 ({content_tokens}) 超出限制 ({MAX_TOTAL_TOKENS})，进行截断")
                content_truncated = True

                # 使用二分查找确定最佳截断点
                left, right = 0, len(content)
                best_content = ""
                best_tokens = 0

                while left <= right:
                    mid = (left + right) // 2
                    truncated = content[:mid]
                    tokens = num_tokens_from_string(truncated)

                    if tokens <= MAX_TOTAL_TOKENS:
                        best_content = truncated
                        best_tokens = tokens
                        left = mid + 1
                    else:
                        right = mid - 1

                # 截断内容并更新token计数
                content = best_content
                content_tokens = best_tokens

                # 添加截断信息
                truncation_note = f"\n\n[内容已截断：原始token数超过{MAX_TOTAL_TOKENS}的限制]"
                content += truncation_note

            # 添加文件元信息
            shown_chars = len(content)
            truncation_status = "（已截断）" if content_truncated else ""
            meta_info = f"# 文件: {file_path.name}\n\n**文件信息**: 总字符数: {total_chars}，显示字符数: {shown_chars}{truncation_status}，Token数: {content_tokens}\n\n---\n\n"
            raw_content = content
            content = meta_info + content

            return ToolResult(
                content=content,
                system=f"file_path: {file_path!s}",
                extra_info={"raw_content": raw_content}
            )

        except Exception as e:
            logger.exception(f"读取文件失败: {e!s}")
            return ToolResult(error=f"读取文件失败: {e!s}")

    async def _is_binary_file(self, file_path: Path) -> bool:
        """检查文件是否为二进制文件"""
        try:
            # 读取文件前4KB来判断是否为二进制文件
            chunk_size = 4 * 1024
            async with aiofiles.open(file_path, "rb") as f:
                chunk = await f.read(chunk_size)

                # 如果刚好是4KB边界，可能会截断UTF-8多字节字符，多读几个字节
                if len(chunk) == chunk_size:
                    # 定位到刚才读取的位置
                    await f.seek(0)
                    # 多读几个字节，确保完整的UTF-8字符
                    chunk = await f.read(chunk_size + 4)

            # 检查是否包含NULL字节（二进制文件的特征）
            if b"\x00" in chunk:
                return True

            # 尝试以UTF-8解码，如果失败则可能是二进制文件
            try:
                chunk.decode("utf-8")
                return False
            except UnicodeDecodeError:
                # 尝试使用ignore错误处理，如果内容大部分可以解析为文本，就不认为是二进制
                decoded = chunk.decode("utf-8", errors="ignore")
                # 如果解码后的文本长度至少是原始数据的25%，认为是文本文件
                if len(decoded) > len(chunk) * 0.25:
                    return False
                return True
        except Exception:
            return False

    async def _read_text_file(self, file_path: Path) -> str:
        """读取整个文本文件内容"""
        async with aiofiles.open(file_path, "r", encoding="utf-8", errors="replace") as f:
            return await f.read()

    async def _read_text_file_with_range(self, file_path: Path, offset: int, limit: int) -> str:
        """读取指定范围的文本文件内容

        Args:
            file_path: 文件路径
            offset: 起始行号（从0开始）
            limit: 要读取的行数，如果为负数则读取到文件末尾

        Returns:
            包含行号信息和指定范围内容的字符串，如果范围无效则返回提示信息
        """
        # 统计文件总行数并读取指定范围内容
        all_lines = []
        target_lines = []

        async with aiofiles.open(file_path, "r", encoding="utf-8", errors="replace") as f:
            line_idx = 0
            async for line in f:
                all_lines.append(line)
                if offset <= line_idx < (offset + limit if limit > 0 else float('inf')):
                    target_lines.append(line)
                line_idx += 1

        total_lines = len(all_lines)
        start_line = offset + 1  # 转为1-indexed便于用户理解

        # 构建结果头部信息
        if not target_lines:
            if offset >= total_lines:
                header = f"# 读取内容为空：起始行 {start_line} 超过文件总行数 {total_lines}\n\n"
            else:
                end_line = min(total_lines, offset + limit if limit > 0 else total_lines)
                header = f"# 读取内容为空：指定范围第 {start_line} 行到第 {end_line} 行没有内容（文件共 {total_lines} 行）\n\n"
        else:
            end_line = offset + len(target_lines)
            header = f"# 显示第 {start_line} 行到第 {end_line} 行（共 {total_lines} 行）\n\n"

        return header + "".join(target_lines)

    async def get_tool_detail(self, tool_context: ToolContext, result: ToolResult, arguments: Dict[str, Any] = None) -> Optional[ToolDetail]:
        """
        根据工具执行结果获取对应的ToolDetail

        Args:
            tool_context: 工具上下文
            result: 工具执行的结果
            arguments: 工具执行的参数字典

        Returns:
            Optional[ToolDetail]: 工具详情对象，可能为None
        """
        if not result.ok:
            return None

        if not arguments or "file_path" not in arguments:
            logger.warning("没有提供file_path参数")
            return None

        file_path = arguments["file_path"]
        file_name = os.path.basename(file_path)

        # 检查是否是PDF转Markdown的结果
        if result.system and result.system.startswith("pdf_converted_path:"):
            # 对于PDF转Markdown的结果，只提供消息，不显示实际内容
            # 因为消息中已经包含了如何查看转换后MD文件的指引
            return ToolDetail(
                type=DisplayType.TEXT,
                data=FileContent(
                    file_name=f"PDF转换提示 - {file_name}",
                    # 不展示元数据给用户
                    content=result.extra_info["raw_content"]
                )
            )

        # 使用 AbstractFileTool 的方法获取显示类型
        display_type = self.get_display_type_by_extension(file_path)

        return ToolDetail(
            type=display_type,
            data=FileContent(
                file_name=file_name,
                # 不展示元数据给用户
                content=result.extra_info["raw_content"]
            )
        )

    async def get_after_tool_call_friendly_action_and_remark(self, tool_name: str, tool_context: ToolContext, result: ToolResult, execution_time: float, arguments: Dict[str, Any] = None) -> Dict:
        """
        获取工具调用后的友好动作和备注
        """
        file_path = arguments.get("file_path", "")
        file_name = os.path.basename(file_path) if file_path else "文件"

        if not result.ok:
            return {
                "action": "读取文件",
                "remark": f"读取「{file_name}」失败: {result.content}"
            }

        # 检查是否包含PDF转Markdown的信息
        if result.system and result.system.startswith("pdf_converted_path:"):
            converted_path = result.system.replace("pdf_converted_path:", "").strip()
            converted_file_name = os.path.basename(converted_path)
            return {
                "action": "转换并读取PDF文件",
                "remark": f"已将「{file_name}」转换为Markdown格式：「{converted_file_name}」"
            }

        return {
            "action": "读取文件",
            "remark": f"已读取「{file_name}」"
        }
