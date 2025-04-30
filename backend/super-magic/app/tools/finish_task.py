from typing import Any, Dict, List

from pydantic import Field

from app.core.context.tool_context import ToolContext
from app.core.entity.tool.tool_result import ToolResult
from app.tools.core import BaseTool, BaseToolParams, tool

_FINISH_TASK_DESCRIPTION = """当您完成了所有必需的任务并想要提供最终回复时，应调用此工具。调用此工具后，当前会话轮次将结束，因此请确保在调用此工具之前已完成当前轮次任务的所有必要操作。"""


class FinishTaskParams(BaseToolParams):
    """完成任务参数"""
    message: str = Field(
        ...,
        description="在完成任务前向用户提供的最终消息。"
    )
    files: List[str] = Field(
        ...,
        description="与最终消息相关的文件路径列表，如：['final_report.md', 'final_report.html', '.webview_report/xxx.md']"
    )


@tool()
class FinishTask(BaseTool[FinishTaskParams]):
    """完成任务工具"""

    # 设置参数类
    params_class = FinishTaskParams

    # 设置工具元数据
    name = "finish_task"
    description = _FINISH_TASK_DESCRIPTION

    async def execute(self, tool_context: ToolContext, params: FinishTaskParams) -> ToolResult:
        """完成当前任务并提供最终消息"""
        return ToolResult(
            content=params.message,
            system="FINISH_TASK",  # 系统指令，用于标记任务完成
        )
