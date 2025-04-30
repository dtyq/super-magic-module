#!/usr/bin/env python
"""
Filebase CLI工具 - 用于管理和操作Filebase向量库

命令列表:
    watch - 监控.workspace目录文件变化并自动向量化到指定sandbox
"""

from pathlib import Path
import os
import sys

# 获取项目根目录，使用文件所在位置的父目录
project_root = Path(__file__).resolve().parent.parent

# 在导入其他模块前设置项目根目录
from app.paths import PathManager
PathManager.set_project_root(project_root)

# 加载环境变量
from dotenv import load_dotenv

import argparse
import asyncio
import logging
import os
import sys
import time
import queue
import functools
from pathlib import Path
from typing import Dict, Set, Optional, List, Tuple, Any

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

load_dotenv(override=True)

from app.service.filebase_watcher_service import FilebaseWatcher
from app.filebase.filebase import Filebase
from app.filebase.filebase_config import FilebaseConfig
from app.core.config_manager import config

# 导入watchdog库用于文件监控
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler, FileSystemEvent

from app.logger import configure_logging_intercept, get_logger, logger, setup_logger

# 初始化日志配置
os.makedirs("logs", exist_ok=True)
# 使用app.logger模块的配置函数，从环境变量获取日志级别，默认为INFO
log_level = os.getenv("LOG_LEVEL", "DEBUG")
setup_logger(log_name="app", console_level=log_level)
configure_logging_intercept()

# 获取日志记录器
logger = get_logger(__name__)

def parse_args():
    """解析命令行参数

    Returns:
        argparse.Namespace: 解析后的命令行参数对象
    """
    parser = argparse.ArgumentParser(description='Filebase CLI工具')
    subparsers = parser.add_subparsers(dest='command', help='操作命令')

    # watch 子命令
    watch_parser = subparsers.add_parser('watch', help='监控目录变化并自动向量化')
    watch_parser.add_argument('--sandbox', type=str, default='default_sandbox', help='沙盒ID，默认为default_sandbox')
    watch_parser.add_argument('--dir', type=str, default='.workspace', help='要监控的目录路径，默认为.workspace')
    watch_parser.add_argument('--once', action='store_true', help='只扫描已有文件后退出，不持续监控')
    watch_parser.add_argument('--refresh', action='store_true', help='清空集合并重新建立索引')

    return parser.parse_args()

async def main():
    """主函数"""

    args = parse_args()

    if args.command == 'watch':
        filebase_watcher = FilebaseWatcher(args.sandbox, args.dir)
        await filebase_watcher.watch_command(args.sandbox, args.dir, args.once, args.refresh)
    else:
        logger.error(f"未知命令: {args.command}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
