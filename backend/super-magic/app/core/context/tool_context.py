"""
工具上下文类

为工具提供执行环境所需的上下文信息，由代理上下文派生
"""

import uuid
from typing import Any, Dict

from app.core.context.agent_context import AgentContext
from app.core.context.base_context import BaseContext
from app.core.entity.event.event_context import EventContext


class ToolContext(BaseContext):
    """
    工具上下文类，提供工具执行所需的上下文信息
    """

    def __init__(
        self, agent_context: AgentContext, tool_call_id: str = "", tool_name: str = "", arguments: Dict[str, Any] = None
    ):
        """
        初始化工具上下文

        Args:
            agent_context: 代理上下文
            tool_call_id: 工具调用ID
            tool_name: 工具名称
            arguments: 工具参数
        """
        super().__init__()

        self.id = str(uuid.uuid4())

        # 保存代理上下文的引用
        self.agent_context = agent_context

        # 工具特定属性
        self.tool_call_id = tool_call_id
        self.tool_name = tool_name
        self.arguments = arguments or {}

        # 继承代理上下文的元数据
        self._metadata = agent_context._metadata.copy()

        # 事件上下文
        self._event_context = EventContext()

    def to_dict(self) -> Dict[str, Any]:
        """
        将工具上下文转换为字典格式

        Returns:
            Dict[str, Any]: 上下文的字典表示
        """
        result = super().to_dict()

        # 从agent_context获取必要字段
        result.update(
            {
                "task_id": self.agent_context.get_task_id(),
                "workspace_dir": self.agent_context.get_workspace_dir(),
                "tool_call_id": self.tool_call_id,
                "tool_name": self.tool_name,
            }
        )
        return result

    def get_argument(self, name: str, default: Any = None) -> Any:
        """
        获取工具参数

        Args:
            name: 参数名
            default: 默认值

        Returns:
            Any: 参数值或默认值
        """
        return self.arguments.get(name, default)

    def has_argument(self, name: str) -> bool:
        """
        检查是否存在指定的参数

        Args:
            name: 参数名

        Returns:
            bool: 是否存在参数
        """
        return name in self.arguments

    @property
    def task_id(self) -> str:
        """获取任务ID"""
        return self.agent_context.get_task_id()
    @property
    def base_dir(self) -> str:
        """获取基础目录"""
        return self.agent_context.workspace_dir

    # 事件上下文相关方法

    @property
    def event_context(self) -> EventContext:
        """获取事件上下文"""
        return self._event_context
