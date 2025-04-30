import traceback
from typing import List

from app.core.context.agent_context import AgentContext
from app.core.context.tool_context import ToolContext
from app.core.entity.event.event import (
    AfterClientChatEventData,
    AfterInitEventData,
    AfterLlmResponseEventData,
    AfterSafetyCheckEventData,
    AfterToolCallEventData,
    AgentSuspendedEventData,
    BeforeInitEventData,
    BeforeLlmRequestEventData,
    BeforeSafetyCheckEventData,
    BeforeToolCallEventData,
    ErrorEventData,
    MainAgentFinishedEventData,
)
from app.core.entity.factory.task_message_factory import TaskMessageFactory
from app.core.entity.message.server_message import ServerMessage, TaskStatus, TaskStep
from app.core.event.event import Event, EventType
from app.core.stream.http_subscription_stream import HTTPSubscriptionStream
from app.core.stream.stdout_stream import StdoutStream
from app.logger import get_logger
from app.service.agent_event.base_listener_service import BaseListenerService

logger = get_logger(__name__)

class StreamListenerService:
    """
    SuperMagic事件监听服务，用于处理和发送SuperMagic事件
    """

    @staticmethod
    def register_standard_listeners(agent_context: AgentContext) -> None:
        """
        为代理上下文注册标准的事件监听器
        
        Args:
            agent_context: 代理上下文对象
        """
        # 创建事件类型到处理函数的映射
        event_listeners = {
            EventType.BEFORE_INIT: StreamListenerService._handle_before_init,
            EventType.AFTER_INIT: StreamListenerService._handle_after_init,
            EventType.BEFORE_SAFETY_CHECK: StreamListenerService._handle_before_safety_check,
            EventType.AFTER_SAFETY_CHECK: StreamListenerService._handle_after_safety_check,
            EventType.AFTER_CLIENT_CHAT: StreamListenerService._handle_after_client_chat,
            EventType.BEFORE_LLM_REQUEST: StreamListenerService._handle_before_llm_request,
            EventType.AFTER_LLM_REQUEST: StreamListenerService._handle_after_llm_response,
            EventType.BEFORE_TOOL_CALL: StreamListenerService._handle_before_tool_call,
            EventType.AFTER_TOOL_CALL: StreamListenerService._handle_after_tool_call,
            EventType.AGENT_SUSPENDED: StreamListenerService._handle_agent_suspended,
            EventType.MAIN_AGENT_FINISHED: StreamListenerService._handle_main_agent_finished,
            EventType.ERROR: StreamListenerService._handle_error,
        }

        # 使用基类方法批量注册监听器
        BaseListenerService.register_listeners(agent_context, event_listeners)

        logger.info("已为代理上下文注册所有标准事件监听器")

    @staticmethod
    async def _handle_before_init(event: Event[BeforeInitEventData]) -> None:
        """
        处理初始化前事件
        
        Args:
            event: 初始化前事件对象，包含BeforeInitEventData数据
        """
        # 使用工厂创建任务消息
        task_message = TaskMessageFactory.create_before_init_message(event)

        await StreamListenerService._send_task_message(event.data.tool_context, task_message, event)

    @staticmethod
    async def _handle_after_init(event: Event[AfterInitEventData]) -> None:
        """
        处理初始化后事件
        
        Args:
            event: 初始化后事件对象，包含AfterInitEventData数据
        """
        # 使用工厂创建任务消息
        task_message = TaskMessageFactory.create_after_init_message(event)

        await StreamListenerService._send_task_message(event.data.tool_context, task_message, event)

    @staticmethod
    async def _handle_after_client_chat(event: Event[AfterClientChatEventData]) -> None:
        """
        处理客户端聊天后事件
        
        Args:
            event: 客户端聊天后事件对象，包含AfterClientChatEventData数据
        """

        task_message = TaskMessageFactory.create_after_client_chat_message(event)
        tool_context = ToolContext(agent_context=event.data.agent_context)
        await StreamListenerService._send_task_message(tool_context, task_message, event)

    @staticmethod
    async def _handle_before_llm_request(event: Event[BeforeLlmRequestEventData]) -> None:
        """
        处理LLM请求前事件
        
        Args:
            event: LLM请求前事件对象，包含BeforeLlmRequestEventData数据
        """
        # 使用工厂创建任务消息
        task_message = TaskMessageFactory.create_before_llm_request_message(event)

        await StreamListenerService._send_task_message(event.data.tool_context, task_message, event)
        logger.info(f"开始请求LLM: {event.data.model_name}")

    @staticmethod
    async def _handle_after_llm_response(event: Event[AfterLlmResponseEventData]) -> None:
        """
        处理LLM响应后事件
        
        Args:
            event: LLM响应后事件对象，包含AfterLlmResponseEventData数据
        """
        # 使用工厂创建任务消息
        task_message = TaskMessageFactory.create_after_llm_response_message(event)

        if event.data.llm_response_message.content == "Continue":
            logger.info("大模型没有返回任何内容，不发送消息")
            return

        await StreamListenerService._send_task_message(event.data.tool_context, task_message, event)
        logger.info(f"结束请求LLM: {event.data.model_name}, 耗时: {event.data.request_time:.2f}秒")

    @staticmethod
    async def _handle_before_tool_call(event: Event[BeforeToolCallEventData]) -> None:
        """
        处理工具调用前事件
        
        Args:
            event: 工具调用前事件对象，包含BeforeToolCallEventData数据
        """
        # 使用工厂创建任务消息
        task_message = await TaskMessageFactory.create_before_tool_call_message(event)

        await StreamListenerService._send_task_message(event.data.tool_context, task_message, event)

    @staticmethod
    async def _handle_after_tool_call(event: Event[AfterToolCallEventData]) -> None:
        """
        处理工具调用后事件
        
        Args:
            event: 工具调用后事件对象，包含AfterToolCallEventData数据
        """

        task_message = await TaskMessageFactory.create_after_tool_call_message(event)
        await StreamListenerService._send_task_message(event.data.tool_context, task_message, event)

    @staticmethod
    async def _handle_agent_suspended(event: Event[AgentSuspendedEventData]) -> None:
        """
        处理agent终止事件
        
        Args:
            event: agent终止事件对象，包含AgentSuspendedEventData数据
        """
        task_message = TaskMessageFactory.create_agent_suspended_message(event.data.agent_context)
        tool_context = ToolContext(agent_context=event.data.agent_context)
        await StreamListenerService._send_task_message(tool_context, task_message, event)


    @staticmethod
    async def _handle_main_agent_finished(event: Event[MainAgentFinishedEventData]) -> None:
        """
        处理主agent完成事件
        
        Args:
            event: 主agent完成事件对象，包含MainAgentFinishedEventData数据
        """
        task_message = TaskMessageFactory.create_main_agent_finished_message(event)

        tool_context = ToolContext(agent_context=event.data.agent_context)
        await StreamListenerService._send_task_message(tool_context, task_message, event)

    @staticmethod
    async def _handle_error(event: Event[ErrorEventData]) -> None:
        """
        处理错误事件
        
        Args:
            event: 错误事件对象，包含ErrorEventData数据
        """
        task_message = TaskMessageFactory.create_error_message(event.data.agent_context, event.data.error_message)
        tool_context = ToolContext(agent_context=event.data.agent_context)
        await StreamListenerService._send_task_message(tool_context, task_message, event)

    @staticmethod
    async def _handle_before_safety_check(event: Event[BeforeSafetyCheckEventData]) -> None:
        """
        处理安全检查前事件
        
        Args:
            event: 安全检查前事件对象，包含BeforeSafetyCheckEventData数据
        """
        task_message = TaskMessageFactory.create_before_safety_check_message(event)

        tool_context = ToolContext(agent_context=event.data.agent_context)
        await StreamListenerService._send_task_message(tool_context, task_message, event)

    @staticmethod
    async def _handle_after_safety_check(event: Event[AfterSafetyCheckEventData]) -> None:
        """
        处理安全检查后事件
        
        Args:
            event: 安全检查后事件对象，包含AfterSafetyCheckEventData数据
        """
        task_message = TaskMessageFactory.create_after_safety_check_message(event)

        tool_context = ToolContext(agent_context=event.data.agent_context)
        await StreamListenerService._send_task_message(tool_context, task_message, event)

    @staticmethod
    def _create_steps_from_todo_items(agent_context: AgentContext) -> List[TaskStep]:
        """
        从agent_context中的todo_items创建步骤列表
        
        Args:
            agent_context: 包含todo_items的代理上下文
            
        Returns:
            List[TaskStep]: 步骤列表
        """
        steps = []
        todo_items = agent_context.get_todo_items()

        if not todo_items:
            return steps

        for todo_text, todo_info in todo_items.items():
            # 根据todo项的completed状态设置step状态
            step_status = TaskStatus.FINISHED if todo_info.get('completed', False) else TaskStatus.WAITING

            # 获取雪花ID
            snowflake_id = todo_info.get('id')

            # 创建TaskStep对象
            step = TaskStep(
                id=str(snowflake_id),  # 将雪花ID转换为字符串
                title=todo_text,
                status=step_status
            )
            steps.append(step)

        if steps:
            logger.info(f"从todo_items创建了 {len(steps)} 个步骤")

        return steps

    @staticmethod
    async def _send_task_message(tool_context: ToolContext, task_message: ServerMessage, event: Event) -> None:
        """
        通过WebSocket向客户端发送任务消息
        
        Args:
            tool_context: 工具上下文，包含agent_context和event_context
            task_message: 要发送的任务消息
        """
        if not tool_context.agent_context.streams:
            return

        agent_context = tool_context.agent_context

        try:
            event_context = tool_context.event_context
            payload = task_message.payload

            # 检查是否需要推送到客户端
            if payload.is_empty:
                logger.info(f"跳过向客户端发送消息，因为 ServerMessage content 为空, server_message: {task_message.model_dump_json()}")
                return

            if event_context:
                steps = StreamListenerService._create_steps_from_todo_items(agent_context)
                if steps:
                    payload.steps = steps
                    logger.info(f"发送消息时包含了 {len(steps)} 个步骤，因为steps_changed=True")

                event_context.steps_changed = False
                logger.debug("重置steps_changed标志为False")

            message_json = task_message.model_dump_json()

            # 发送到所有流
            # 创建字典的副本进行迭代，避免在迭代过程中修改字典引发错误
            for stream_id, stream in list(agent_context.streams.items()):
                try:
                    if stream.should_ignore_event(event.event_type):
                        logger.info(f"跳过往流中写入消息，stream type: {type(stream)}, 事件类型: {event.event_type}")
                        continue

                    logger.info(f"开始往流中写入消息, stream type: {type(stream)}")
                    await stream.write(message_json)
                    logger.info(f"成功往流中写入消息, stream type: {type(stream)}")
                except Exception as e:
                    logger.error(f"堆栈信息: {traceback.format_exc()}")
                    logger.error(f"失败往流中写入消息: {e!s}, 删除流, stream type: {type(stream)}")
                    # 如果stdoutstream或者httpstream，则不删除
                    if isinstance(stream, StdoutStream) or isinstance(stream, HTTPSubscriptionStream):
                        logger.info(f"不删除流, stream type: {type(stream)}")
                    else:
                        logger.info(f"删除流, stream type: {type(stream)}")
                        tool_context.agent_context.remove_stream(stream)
            logger.debug(f"成功发送任务消息: {payload.message_id}")
        except Exception as e:
            # 打印堆栈信息
            logger.error(f"堆栈信息: {traceback.format_exc()}")
            logger.error(f"发送任务消息失败: {e!s}")
