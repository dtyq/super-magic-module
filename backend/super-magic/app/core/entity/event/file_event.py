"""
文件事件相关数据类定义

用于定义与文件操作相关的事件数据结构
"""
from app.core.context.tool_context import ToolContext
from app.core.event.event import BaseEventData, EventType


class FileEventData(BaseEventData):
    """文件事件数据类"""

    filepath: str  # 文件路径
    event_type: EventType  # 事件类型
    tool_context: ToolContext  # 工具上下文 
    is_screenshot: bool = False  # 是否是截图
