"""
文件监听服务，启动上传文件进程
"""

import os
from pathlib import Path
from app.core.context.agent_context import AgentContext
from app.core.event.event import Event, EventType
from app.logger import get_logger
from app.utils.executable_utils import get_executable_command
from app.utils.process_manager import ProcessManager

logger = get_logger(__name__)

class FileListenerService:
    """文件监听服务，启动上传文件的进程"""

    @staticmethod
    def register_standard_listeners(agent_context: AgentContext) -> None:
        """
        注册标准的文件相关事件监听器

        Args:
            agent_context: 代理上下文对象
        """
        # 监听初始化完成事件
        agent_context.add_event_listener(
            EventType.AFTER_INIT,
            FileListenerService._handle_after_init
        )

        logger.info("已注册文件监听器")

    @staticmethod
    async def _start_tos_uploader(agent_context: AgentContext) -> None:
        """
        启动TOS上传程序（使用ProcessManager直接通过命令启动子进程）

        Args:
            agent_context: 代理上下文对象
        """
        try:
            # 获取项目根目录
            project_root = Path(__file__).resolve().parent.parent.parent.parent

            # 获取沙盒ID
            sandbox_id = agent_context.get_sandbox_id()
            if not sandbox_id:
                logger.warning("AgentContext中没有设置沙盒ID，TOS上传程序可能无法正常工作")

            # 获取组织编码
            organization_code = agent_context.get_organization_code()

            # 工作目录
            workspace_dir = agent_context.get_workspace_dir()

            # 使用和当前相同的日志级别
            log_level = os.getenv("LOG_LEVEL", "INFO")

            # 构建命令
            cmd = get_executable_command() + [
                "tos-uploader",
                "watch",
                "--dir", workspace_dir,
                "--credentials", ".credentials/upload_credentials.json"  # 指定凭证文件路径
            ]

            # 添加沙盒ID（如果有）
            if sandbox_id:
                cmd.extend(["--sandbox", sandbox_id])
            else:
                logger.warning("未设置沙盒ID，上传程序可能无法正常工作")

            # 如果有组织编码，添加
            if organization_code:
                cmd.extend(["--organization-code", organization_code])

            # 记录启动命令
            logger.info(f"准备启动TOS上传程序（直接命令行模式）: {' '.join(cmd)}")

            sandbox_info = f"沙盒ID: {sandbox_id}" if sandbox_id else "未设置沙盒ID"
            logger.info(f"使用 {sandbox_info}")

            # 终止现有进程（如果有）
            await FileListenerService._terminate_existing_uploader()

            # 使用ProcessManager启动进程
            process_manager = ProcessManager.get_instance()
            worker_name = "tos_uploader"

            # 使用新的方法直接通过命令启动工作进程
            pid = await process_manager.start_worker_with_cmd(
                worker_name,
                cmd,
                cwd=str(project_root)
            )

            logger.info(f"TOS上传器子进程已启动，PID: {pid}")

        except Exception as e:
            logger.error(f"启动TOS上传程序失败: {e}")
            import traceback
            logger.error(traceback.format_exc())

    @staticmethod
    async def _terminate_existing_uploader() -> None:
        """终止现有的上传进程"""
        try:
            process_manager = ProcessManager.get_instance()
            worker_name = "tos_uploader"

            # 获取进程信息
            worker_info = await process_manager.get_worker_info(worker_name)

            if worker_info and worker_name in worker_info:
                # 停止进程
                success = await process_manager.stop_worker(worker_name)
                if success:
                    logger.info("已终止之前的TOS上传子进程")
                else:
                    logger.warning("终止之前的TOS上传子进程失败")
        except Exception as e:
            logger.error(f"终止之前的上传进程失败: {e}")

    @staticmethod
    async def _handle_after_init(event: Event) -> None:
        """
        处理初始化事件，启动上传程序

        Args:
            event: 事件对象
        """
        try:
            # 从事件数据中获取agent_context
            agent_context = event.data.agent_context

            if agent_context:
                # 确保凭证目录存在
                if not os.path.exists(".credentials"):
                    os.makedirs(".credentials", exist_ok=True)

                # 创建异步任务来启动TOS上传程序，不阻塞当前流程
                await FileListenerService._start_tos_uploader(agent_context)
                logger.info("TOS上传程序启动任务已创建（直接命令行模式）")

        except Exception as e:
            logger.error(f"处理初始化事件启动上传程序出错: {e}")
