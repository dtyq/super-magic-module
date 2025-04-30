from typing import Any, Dict, List, Optional

from openai.types.chat import ChatCompletionMessage, ChatCompletionMessageToolCall

from app.core.context.agent_context import AgentContext
from app.core.context.tool_context import ToolContext
from app.core.entity.message.client_message import ChatClientMessage
from app.core.entity.tool.tool_result import ToolResult
from app.core.event.event import BaseEventData
from app.tools.core.base_tool import BaseTool


class BeforeInitEventData(BaseEventData):
    """初始化前事件的数据结构"""

    tool_context: ToolContext


class AfterInitEventData(BaseEventData):
    """初始化后事件的数据结构"""

    tool_context: ToolContext
    agent_context: Optional[AgentContext] = None
    success: bool
    error: Optional[str] = None


class AfterClientChatEventData(BaseEventData):
    """客户端聊天后的事件数据结构"""

    agent_context: AgentContext
    client_message: ChatClientMessage


class BeforeSafetyCheckEventData(BaseEventData):
    """安全检查前事件的数据结构"""

    agent_context: AgentContext
    query: str  # 需要检查的查询内容


class AfterSafetyCheckEventData(BaseEventData):
    """安全检查后事件的数据结构"""

    agent_context: AgentContext
    query: str  # 已检查的查询内容
    is_safe: bool  # 是否安全


class BeforeLlmRequestEventData(BaseEventData):
    """请求大模型前的事件数据结构"""

    model_name: str
    chat_history: List[Dict[str, Any]]
    tools: Optional[List[Dict[str, Any]]] = None
    tool_context: ToolContext


class AfterLlmResponseEventData(BaseEventData):
    """请求大模型后的事件数据结构"""

    model_name: str
    request_time: float  # 请求耗时（秒）
    success: bool
    error: Optional[str] = None
    tool_context: ToolContext
    llm_response_message: ChatCompletionMessage  # 大模型返回的消息内容


class BeforeToolCallEventData(BaseEventData):
    """工具调用前的事件数据结构"""

    tool_call: ChatCompletionMessageToolCall
    tool_context: ToolContext
    tool_name: str
    arguments: Dict[str, Any]
    tool_instance: BaseTool
    llm_response_message: ChatCompletionMessage  # 大模型返回的消息内容


class AfterToolCallEventData(BaseEventData):
    """工具调用后的事件数据结构"""

    tool_call: ChatCompletionMessageToolCall
    tool_context: ToolContext
    tool_name: str
    arguments: Dict[str, Any]
    result: ToolResult
    execution_time: float  # 执行耗时（秒）
    tool_instance: BaseTool


class AgentSuspendedEventData(BaseEventData):
    """agent终止事件的数据结构"""

    agent_context: AgentContext


class MainAgentFinishedEventData(BaseEventData):
    """主 agent 运行完成的事件数据结构"""

    agent_context: AgentContext
    agent_name: str
    agent_state: str


class ErrorEventData(BaseEventData):
    """错误事件的数据结构"""
    agent_context: AgentContext
    error_message: str
