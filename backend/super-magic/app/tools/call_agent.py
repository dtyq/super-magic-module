from typing import Any, Dict, List, Optional
from pathlib import Path

from pydantic import Field

from app.core.context.tool_context import ToolContext
from app.core.entity.tool.tool_result import ToolResult
from app.logger import get_logger
from app.tools.abstract_file_tool import AbstractFileTool
from app.tools.core import BaseToolParams, tool
from app.utils.file_info_utils import get_file_info

logger = get_logger(__name__)


class CallAgentParams(BaseToolParams):
    """调用智能体参数"""
    agent_name: str = Field(
        ...,
        description="要调用的智能体名称"
    )
    agent_id: str = Field(
        ...,
        description="本次任务的唯一标识，人类可读且有辨识度，不允许重复，由单词或短语组成，例如 'kk-group-background-research'"
    )
    task_description: str = Field(
        ...,
        description="任务描述，交代必要的背景信息"
    )
    task_completion_standard: str = Field(
        ...,
        description="任务完成标准，需要量化，如产出一份文件名为 XXX 的精美的 HTML 文件"
    )
    reference_files: List[str] = Field(
        [],
        description="参考文件路径列表，如 ['./webview_reports/foo.md', './webview_reports/bar.md']"
    )

@tool()
class CallAgent(AbstractFileTool[CallAgentParams]):
    """请求其它智能体来完成部分任务"""

    # 设置参数类
    params_class = CallAgentParams

    # 设置工具元数据
    name = "call_agent"
    description = """调用其它智能体来完成任务。"""

    async def execute(self, tool_context: ToolContext, params: CallAgentParams) -> ToolResult:
        """
        执行代理调用

        Args:
            tool_context: 工具上下文
            params: 参数对象，包含代理名称和任务描述

        Returns:
            ToolResult: 包含操作结果
        """
        try:
            # 根据 agent_name 实例化 Agent
            from app.core.context.agent_context import AgentContext
            from app.magic.agent import Agent
            new_agent_context = AgentContext()
            new_agent_context.copy_common_context_from(tool_context.agent_context)
            agent = Agent(params.agent_name, agent_id=params.agent_id, agent_context=new_agent_context)

            # 调用 agent 的 run 方法
            query_content = f"任务描述: {params.task_description}\n任务完成标准: {params.task_completion_standard}"

            # 添加参考文件列表及元信息
            if params.reference_files and len(params.reference_files) > 0:
                query_content += "\n\n参考文件列表："
                for file_path in params.reference_files:
                    file_info = get_file_info(file_path)
                    query_content += f"\n- {file_info}"

            result = await agent.run(query_content)

            # 确保result是字符串类型
            if result is None:
                result = f"智能体 {params.agent_name} 执行成功，但没有返回结果"
            elif not isinstance(result, str):
                result = str(result)

            return ToolResult(content=result)

        except Exception as e:
            logger.exception(f"调用智能体失败: {e!s}")
            return ToolResult(error=f"调用智能体失败: {e!s}")

    async def get_before_tool_call_friendly_content(self, tool_context: ToolContext, arguments: Dict[str, Any] = None) -> str:
        """
        获取工具调用前的友好内容
        """
        return ""
