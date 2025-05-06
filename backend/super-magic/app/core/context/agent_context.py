"""
代理上下文类

管理与代理相关的业务参数
"""

import asyncio
import os
from typing import Any, Callable, Dict, List, Optional
from datetime import datetime, timedelta

from app.core.config.communication_config import STSTokenRefreshConfig
from app.core.context.base_context import BaseContext
from app.core.entity.attachment import Attachment
from app.core.entity.message.client_message import ChatClientMessage, InitClientMessage
from app.core.entity.project_archive import ProjectArchiveInfo
from app.core.environment import Environment
from app.core.event.dispatcher import EventDispatcher
from app.core.event.event import BaseEventData, Event, EventType, StoppableEvent
from app.core.stream import Stream
from app.infrastructure.storage.types import BaseStorageCredentials
from app.logger import get_logger
from app.paths import PathManager

# 获取日志记录器
logger = get_logger(__name__)

class AgentCommonContext(BaseContext):
    """
    代理通用上下文类，包含代理运行需要的上下文信息
    """

    def __init__(self):
        super().__init__()

        self._event_dispatcher = EventDispatcher()
        self._streams: Dict[str, "Stream"] = {}
        self._workspace_dir: str = str(PathManager.get_workspace_dir())
        self._todo_items: Dict[str, Dict[str, Any]] = {}
        self._attachments: Dict[str, Attachment] = {}
        self.chat_client_message: Optional[ChatClientMessage] = None
        self.init_client_message: Optional[InitClientMessage] = None
        self.task_id: Optional[str] = None
        self.interrupt_queue: Optional[asyncio.Queue] = None
        self.sandbox_id: str = ""
        self.project_archive_info: Optional[ProjectArchiveInfo] = None  # 添加项目压缩包信息属性
        self.prompt_dict = {}  # 存储各模块的提示词
        self.default_prompts = {}  # 存储默认的提示词
        self.organization_code = None  # 组织编码

        self.last_activity_time = datetime.now()
        self.idle_timeout = timedelta(seconds=Environment.get_agent_idle_timeout())

class AgentContext(BaseContext):
    """
    代理上下文类，包含代理运行需要的上下文信息
    """

    agent_common_context: AgentCommonContext = AgentCommonContext()

    def __init__(
        self,
    ):
        """
        初始化代理上下文

        Args:
        """
        super().__init__()

        # 基本信息
        self.agent_common_context._workspace_dir = str(PathManager.get_workspace_dir())

        self.chat_history_dir = str(PathManager.get_chat_history_dir())
        self.agent_name = "magic"  # 默认代理名称
        self.is_main_agent = False  # 标记当前agent是否是主agent

        # 功能开关
        self.stream_mode = False
        self.use_dynamic_prompt = True

        # 动态资源管理字典，用于存储任何运行时资源（如浏览器实例等）
        self._resources: Dict[str, Any] = {}

    def copy_common_context_from(self, context: "AgentContext") -> None:
        """复制事件上下文

        Args:
            context: 要复制的上下文对象
        """
        self.agent_common_context = context.agent_common_context

    def set_task_id(self, task_id: str) -> None:
        """设置任务ID

        Args:
            task_id: 任务ID
        """
        self.agent_common_context.task_id = task_id
        logger.debug(f"已设置任务ID: {task_id}")

    def get_task_id(self) -> str:
        """获取任务ID

        Returns:
            str: 任务ID
        """
        return self.agent_common_context.task_id

    def set_interrupt_queue(self, interrupt_queue: asyncio.Queue) -> None:
        """设置中断队列

        Args:
            interrupt_queue: 中断队列
        """
        self.agent_common_context.interrupt_queue = interrupt_queue

    def get_interrupt_queue(self) -> asyncio.Queue:
        """获取中断队列

        Returns:
            asyncio.Queue: 中断队列
        """
        return self.agent_common_context.interrupt_queue

    def set_sandbox_id(self, sandbox_id: str) -> None:
        """设置沙盒ID

        Args:
            sandbox_id: 沙盒ID
        """
        self.agent_common_context.sandbox_id = sandbox_id

    def get_sandbox_id(self) -> str:
        """获取沙盒ID

        Returns:
            str: 沙盒ID
        """
        return self.agent_common_context.sandbox_id

    def set_organization_code(self, organization_code: str) -> None:
        """设置组织编码

        Args:
            organization_code: 组织编码
        """
        self.agent_common_context.organization_code = organization_code

    def get_organization_code(self) -> Optional[str]:
        """获取组织编码

        Returns:
            Optional[str]: 组织编码
        """
        return self.agent_common_context.organization_code

    def set_init_client_message(self, init_client_message: InitClientMessage) -> None:
        """设置初始化客户端消息

        Args:
            init_client_message: 初始化客户端消息
        """
        self.agent_common_context.init_client_message = init_client_message

    def get_init_client_message(self) -> Optional[InitClientMessage]:
        """获取初始化客户端消息

        Returns:
            InitClientMessage: 初始化客户端消息
        """
        return self.agent_common_context.init_client_message

    def get_init_client_message_metadata(self) -> Dict[str, Any]:
        """获取初始化客户端消息的元数据

        Returns:
            Dict[str, Any]: 初始化客户端消息的元数据
        """
        if self.agent_common_context.init_client_message is None:
            return {}

        if self.agent_common_context.init_client_message.metadata is None:
            return {}

        return self.agent_common_context.init_client_message.metadata

    def get_init_client_message_sts_token_refresh(self) -> Optional[STSTokenRefreshConfig]:
        """获取初始化客户端消息的STS Token刷新配置

        Returns:
            Optional[STSTokenRefreshConfig]: STS Token刷新配置
        """
        if self.agent_common_context.init_client_message is None:
            return None

        if self.agent_common_context.init_client_message.sts_token_refresh is None:
            return None

        return self.agent_common_context.init_client_message.sts_token_refresh

    def set_chat_client_message(self, chat_client_message: ChatClientMessage) -> None:
        """设置聊天客户端消息

        Args:
            chat_client_message: 聊天客户端消息
        """
        self.agent_common_context.chat_client_message = chat_client_message

    def get_chat_client_message(self) -> ChatClientMessage:
        """获取聊天客户端消息

        Returns:
            ChatClientMessage: 聊天客户端消息
        """
        return self.agent_common_context.chat_client_message

    def has_stream(self, stream: "Stream") -> bool:
        """检查是否存在指定的通信流

        Args:
            stream: 要检查的通信流实例
        """
        stream_id = str(id(stream))
        return stream_id in self.agent_common_context._streams

    def add_stream(self, stream: "Stream") -> None:
        """添加一个通信流到流字典中。

        Args:
            stream: 要添加的通信流实例。

        Raises:
            TypeError: 当传入的stream不是Stream接口的实现时抛出。
        """
        if not isinstance(stream, Stream):
            raise TypeError("stream必须是Stream接口的实现")

        stream_id = str(id(stream))  # 使用stream对象的id作为键
        self.agent_common_context._streams[stream_id] = stream
        logger.info(f"已添加新的Stream，当前Stream数量: {len(self.agent_common_context._streams)}")

    # 删除stream
    def remove_stream(self, stream: "Stream") -> None:
        """删除一个通信流。

        Args:
            stream: 要删除的通信流实例。
        """
        stream_id = str(id(stream))
        if stream_id in self.streams:
            del self.streams[stream_id]
            logger.info(f"已删除Stream, type: {type(stream)}, 当前Stream数量: {len(self.streams)}")

    @property
    def streams(self) -> Dict[str, "Stream"]:
        """获取所有通信流的字典。

        Returns:
            Dict[str, "Stream"]: 通信流字典，键为stream ID，值为Stream对象。
        """
        return self.agent_common_context._streams

    def _compute_workspace_dir(self) -> str:
        """
        计算工作目录路径

        Returns:
            str: 工作目录路径
        """
        workspace_dir = PathManager.get_workspace_dir()

        return workspace_dir

    def get_workspace_dir(self) -> str:
        """
        获取工作目录的绝对路径

        Returns:
            str: 工作目录的绝对路径
        """
        # 确保返回绝对路径
        return self.agent_common_context._workspace_dir

    def ensure_workspace_dir(self) -> str:
        """
        确保工作目录存在，并返回路径

        Returns:
            str: 工作目录路径
        """
        # 使用已计算好的工作目录
        workspace_dir = self.agent_common_context._workspace_dir
        os.makedirs(workspace_dir, exist_ok=True)
        return workspace_dir

    def set_llm_model(self, model: str) -> None:
        """
        设置LLM模型

        Args:
            model: 模型名称
        """
        self.llm_model = model

    def set_stream_mode(self, enabled: bool) -> None:
        """
        设置是否使用流式输出

        Args:
            enabled: 是否启用
        """
        self.stream_mode = enabled

    def set_use_dynamic_prompt(self, enabled: bool) -> None:
        """
        设置是否使用动态提示词

        Args:
            enabled: 是否启用
        """
        self.use_dynamic_prompt = enabled

    def set_project_archive_info(self, project_archive_info: ProjectArchiveInfo) -> None:
        """设置项目压缩包信息

        Args:
            project_archive_info: 项目压缩包信息
        """
        self.agent_common_context.project_archive_info = project_archive_info

    def get_project_archive_info(self) -> Optional[ProjectArchiveInfo]:
        """获取项目压缩包信息

        Returns:
            Optional[ProjectArchiveInfo]: 项目压缩包信息
        """
        return self.agent_common_context.project_archive_info

    def add_event_listener(self, event_type: EventType, listener: Callable[[Event[Any]], None]) -> None:
        """
        为指定事件类型添加监听器

        Args:
            event_type: 事件类型
            listener: 事件监听器函数，接收一个事件参数
        """
        self.agent_common_context._event_dispatcher.add_listener(event_type, listener)
        logger.info(f"添加事件监听器: {event_type}")

    async def dispatch_event(self, event_type: EventType, data: BaseEventData) -> Event[Any]:
        """
        触发指定类型的事件

        Args:
            event_type: 事件类型
            data: 事件数据，BaseEventData的子类实例

        Returns:
            Event: 处理后的事件对象
        """
        event = Event(event_type, data)
        return await self.agent_common_context._event_dispatcher.dispatch(event)

    async def dispatch_stoppable_event(self, event_type: EventType, data: BaseEventData) -> StoppableEvent[Any]:
        """
        触发可停止的事件

        Args:
            event_type: 事件类型
            data: 事件数据，BaseEventData的子类实例

        Returns:
            StoppableEvent: 处理后的事件对象
        """
        event = StoppableEvent(event_type, data)
        return await self.agent_common_context._event_dispatcher.dispatch(event)

    def get_todo_items(self) -> Dict[str, Dict[str, Any]]:
        """
        获取所有待办事项

        Returns:
            Dict[str, Dict[str, Any]]: 待办事项字典，键为待办事项内容，值为包含雪花ID等信息的字典
        """
        return self.agent_common_context._todo_items

    def add_todo_item(self, todo_text: str, snowflake_id: int) -> None:
        """
        添加新的待办事项

        Args:
            todo_text: 待办事项文本内容
            snowflake_id: 待办事项的雪花ID
        """
        if todo_text not in self.agent_common_context._todo_items:
            self.agent_common_context._todo_items[todo_text] = {
                'id': snowflake_id,
                'completed': False
            }
            logger.info(f"添加待办事项: {todo_text}, ID: {snowflake_id}")

    def update_todo_item(self, todo_text: str, completed: bool = None) -> None:
        """
        更新待办事项状态

        Args:
            todo_text: 待办事项文本内容
            completed: 是否完成
        """
        if todo_text in self.agent_common_context._todo_items:
            if completed is not None:
                self.agent_common_context._todo_items[todo_text]['completed'] = completed
            logger.info(f"更新待办事项状态: {todo_text}, completed: {self.agent_common_context._todo_items[todo_text]['completed']}")

    def get_todo_item_id(self, todo_text: str) -> Optional[int]:
        """
        获取待办事项的雪花ID

        Args:
            todo_text: 待办事项文本内容

        Returns:
            Optional[int]: 待办事项的雪花ID，如果不存在则返回None
        """
        return self.agent_common_context._todo_items.get(todo_text, {}).get('id')

    def has_todo_item(self, todo_text: str) -> bool:
        """
        检查待办事项是否存在

        Args:
            todo_text: 待办事项文本内容

        Returns:
            bool: 待办事项是否存在
        """
        return todo_text in self.agent_common_context._todo_items

    def update_activity_time(self):
        self.agent_common_context.last_activity_time = datetime.now()
        logger.info(f"更新agent活动时间为: {self.agent_common_context.last_activity_time}")

    def is_idle_timeout(self):
        current_time = datetime.now()
        logger.info(f"当前时间: {current_time}, 上次活动时间: {self.agent_common_context.last_activity_time}")
        return (current_time - self.agent_common_context.last_activity_time) > self.agent_common_context.idle_timeout

    def add_attachment(self, attachment: Attachment) -> None:
        """添加附件到代理上下文

        所有工具产生的附件都将被添加到这里，以便在任务完成时一次性发送
        如果文件名已存在，则更新对应的附件对象

        Args:
            attachment: 要添加的附件对象
        """
        filename = attachment.filename
        if filename in self.agent_common_context._attachments:
            logger.debug(f"更新附件 {filename} 在代理上下文中")
        else:
            logger.debug(f"添加新附件 {filename} 到代理上下文，当前附件总数: {len(self.agent_common_context._attachments) + 1}")

        self.agent_common_context._attachments[filename] = attachment

    def get_attachments(self) -> List[Attachment]:
        """获取所有附件

        Returns:
            List[Attachment]: 所有收集到的附件列表
        """
        return list(self.agent_common_context._attachments.values())

    async def get_resource(self, name: str, factory=None):
        """获取指定名称的资源，如果不存在且提供了factory，则创建

        Args:
            name: 资源名称
            factory: 资源创建工厂函数，只有在资源不存在时才会调用

        Returns:
            任何类型: 请求的资源实例，如果不存在且未提供工厂函数则返回None
        """
        # 资源不存在且提供了工厂函数，则创建
        if name not in self._resources and factory is not None:
            try:
                # 如果工厂是异步函数，等待其完成
                if asyncio.iscoroutinefunction(factory):
                    self._resources[name] = await factory()
                else:
                    self._resources[name] = factory()
                logger.debug(f"创建资源 {name}")
            except Exception as e:
                logger.error(f"创建资源 {name} 时出错: {e}")
                raise

        # 返回资源（可能为None）
        return self._resources.get(name)

    def add_resource(self, name: str, resource: Any) -> None:
        """添加资源到上下文

        Args:
            name: 资源名称
            resource: 资源实例
        """
        self._resources[name] = resource
        logger.debug(f"添加资源 {name}")

    async def close_resource(self, name: str) -> None:
        """关闭并移除指定资源

        Args:
            name: 资源名称
        """
        if name not in self._resources:
            return

        resource = self._resources[name]
        try:
            # 尝试关闭资源（如果它有close方法）
            if hasattr(resource, "close") and callable(getattr(resource, "close")):
                if asyncio.iscoroutinefunction(resource.close):
                    await resource.close()
                else:
                    resource.close()
                logger.debug(f"已关闭资源 {name}")
            # 移除资源
            del self._resources[name]
        except Exception as e:
            logger.error(f"关闭资源 {name} 时出错: {e}")
            # 尽管出错，仍然从字典中移除
            if name in self._resources:
                del self._resources[name]

    async def close_all_resources(self) -> None:
        """关闭并移除所有资源"""
        # 复制键列表，因为在迭代过程中会修改字典
        resource_names = list(self._resources.keys())
        for name in resource_names:
            await self.close_resource(name)
        logger.debug(f"已关闭所有资源 ({len(resource_names)} 个)")
