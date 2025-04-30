# AI警告: 环境变量加载必须放在所有导入之前
import multiprocessing
from dotenv import load_dotenv
load_dotenv(override=True)

# 设置正确的工作目录
import os
import sys
from pathlib import Path

# 初始化 PathManager
from app.paths import PathManager
# 获取项目根目录，使用文件所在位置的父目录
project_root = Path(__file__).resolve().parent
PathManager.set_project_root(project_root)

import os
import sys
from pathlib import Path

# 导入Typer库
import typer
import asyncio

from app.logger import configure_logging_intercept, get_logger, logger, setup_logger
from app.command.ws_server import start_ws_server
from app.command.extract_pyinstaller import extract_pyinstaller_resources
from app.command.tos_uploader import start_tos_uploader_watcher

# 初始化日志配置
os.makedirs("logs", exist_ok=True)
# 使用app.logger模块的配置函数，从环境变量获取日志级别，默认为INFO
log_level = os.getenv("LOG_LEVEL", "INFO")
setup_logger(log_name="app", console_level=log_level)
configure_logging_intercept()

# 获取日志记录器
logger = get_logger(__name__)

cli = typer.Typer(help="SuperMagic CLI", no_args_is_help=True)

app_cmds = typer.Typer(help="启动相关命令")
cli.add_typer(app_cmds, name="start")

tos_cmds = typer.Typer(help="TOS上传工具命令")
cli.add_typer(tos_cmds, name="tos-uploader")

@app_cmds.command("ws-server", help="启动WebSocket服务器")
def ws_server_command():
    """启动WebSocket服务器命令封装"""
    start_ws_server()

@cli.command("extract-pyinstaller", help="只提取 PyInstaller 打包的资源文件，不启动应用")
def extract_pyinstaller_command():
    """提取 PyInstaller 打包的资源文件并退出命令封装"""
    extract_pyinstaller_resources()

@tos_cmds.command("watch", help="监控目录变化并自动上传到TOS")
def tos_uploader_watch_command(
    sandbox: str = typer.Option("default", "--sandbox", help="沙盒ID，默认为default"),
    dir: str = typer.Option(".workspace", "--dir", help="要监控的目录路径，默认为.workspace"),
    once: bool = typer.Option(False, "--once", help="只扫描一次已有文件后退出，不持续监控"),
    refresh: bool = typer.Option(False, "--refresh", help="强制刷新所有文件"),
    credentials: str = typer.Option(None, "--credentials", help="指定凭证文件路径"),
    use_context: bool = typer.Option(False, "--use-context", help="使用已存在的上下文凭证(config/upload_credentials.json)"),
    task_id: str = typer.Option(None, "--task-id", help="任务ID，用于注册上传的文件"),
    organization_code: str = typer.Option(None, "--organization-code", help="组织编码")
):
    """监控目录变化并自动上传到TOS的命令封装"""
    start_tos_uploader_watcher(
        sandbox_id=sandbox, 
        workspace_dir=dir, 
        once=once, 
        refresh=refresh,
        credentials_file=credentials,
        use_context=use_context,
        task_id=task_id,
        organization_code=organization_code
    )

if __name__ == "__main__":
    multiprocessing.freeze_support()

    try:
        cli()
    except KeyboardInterrupt:
        logger.info("程序通过 KeyboardInterrupt 退出")
    except Exception as e:
        import traceback
        traceback.print_exc()
        logger.error(f"程序异常退出: {e}")
    finally:
        logger.info("程序已完全退出")
