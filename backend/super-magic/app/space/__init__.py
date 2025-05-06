"""
Magic Space 模块
---------------

该模块提供连接 Magic Space 托管平台的功能，允许用户将HTML项目部署为可访问的网站。

主要组件:
- client: 处理与API的通信
- models: 数据模型定义
- service: 提供高级服务接口
- utils: 提供辅助功能
- exceptions: 异常类定义
- config: 配置管理
"""

from app.space.exceptions import (
    ApiError,
    ConfigurationError,
    MagicSpaceError,
    ResourceError,
    SecurityError,
    StorageError,
    ValidationError,
)
from app.space.models import Site, SiteConfig, SiteOwner, SiteStats
from app.space.service import MagicSpaceService
from app.space.utils import (
    create_zip_from_directory,
    extract_zip_to_directory,
    format_size,
    format_url,
    validate_project_directory,
)

__all__ = [
    # 服务类
    'MagicSpaceService',
    # 模型类
    'Site',
    'SiteOwner',
    'SiteStats',
    'SiteConfig',
    # 异常类
    'MagicSpaceError',
    'ConfigurationError',
    'ValidationError',
    'ResourceError',
    'StorageError',
    'SecurityError',
    'ApiError',
    # 实用工具
    'create_zip_from_directory',
    'extract_zip_to_directory',
    'validate_project_directory',
    'format_size',
    'format_url'
] 
