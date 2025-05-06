import logging
import sys
from typing import Optional

from loguru import logger as _logger

from app.paths import PathManager


def setup_logger(log_name: str = "app", console_level: str = "INFO", logfile_level: Optional[str] = "DEBUG", log_file: Optional[str] = None) -> None:
    """
    设置日志记录器

    Args:
        log_name: 日志文件名
        console_level: 控制台日志级别
        logfile_level: 文件日志级别，如果为 None 则不记录到文件
        log_file: 日志文件路径，如果为 None，则使用默认路径
    """
    # 移除所有默认处理器
    _logger.remove()

    # 添加控制台处理器，并配置 DEBUG 级别为灰色
    _logger.configure(
        handlers=[
            {
                "sink": sys.stderr,
                "level": console_level,
                "format": "<green>{time:HH:mm:ss.SSS}</green> | "
                "<level>{level: <8}</level> | "
                "<cyan>{file.path}</cyan>:<cyan>{line}</cyan> - "
                "<level>{message}</level>",
                "colorize": True,
            }
        ],
        levels=[
            {"name": "DEBUG", "color": "<dim>"}  # 使用 dim 样式（灰色）代替默认的蓝色
        ],
    )

    # 如果指定了文件日志级别，添加文件处理器
    if logfile_level:
        if log_file:
            _logger.add(
                log_file,
                level=logfile_level,
                format="{time:HH:mm:ss.SSS} | {level: <8} | {file.path}:{line} - {message}",
            )
        else:
            _logger.add(
                PathManager.get_logs_dir() / f"{log_name}.log",
                level=logfile_level,
                format="{time:HH:mm:ss.SSS} | {level: <8} | {file.path}:{line} - {message}",
            )


def get_logger(name: str = None):
    """
    获取命名的日志记录器

    Args:
        name: 日志记录器名称，通常是模块名

    Returns:
        日志记录器实例
    """
    return _logger.bind(name=name) if name else _logger


# 导出 logger 实例
logger = _logger


# 添加 logging 到 loguru 的拦截器
class InterceptHandler(logging.Handler):
    """
    将标准库 logging 消息拦截并重定向到 loguru 的处理器

    这确保使用标准 logging 模块的代码最终也使用统一的 loguru 输出格式
    """

    def emit(self, record):
        # 获取对应的 loguru 级别
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        # 查找调用者帧记录
        frame, depth = logging.currentframe(), 2
        while frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1

        # 使用 loguru 记录消息
        logger.opt(depth=depth, exception=record.exc_info).log(level, record.getMessage())


def configure_logging_intercept():
    """
    配置标准库 logging 拦截

    这应该在项目启动时调用一次，以确保所有使用标准库 logging 的代码
    都会被正确地重定向到 loguru
    """
    # 删除所有其他处理器
    logging.basicConfig(handlers=[InterceptHandler()], level=0)

    # 替换所有已存在的处理器
    for name in logging.root.manager.loggerDict.keys():
        logging.getLogger(name).handlers = []
        logging.getLogger(name).propagate = True


if __name__ == "__main__":
    logger.info("Starting application")
    logger.debug("Debug message")
    logger.warning("Warning message")
    logger.error("Error message")
    logger.critical("Critical message")

    try:
        raise ValueError("Test error")
    except Exception as e:
        logger.exception(f"An error occurred: {e}")
