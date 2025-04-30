"""
Magic Space 配置模块

负责加载和管理 Magic Space 相关的配置
"""

import logging
import os
from typing import Any, Dict, Optional

import yaml

from .exceptions import ConfigurationError

logger = logging.getLogger(__name__)

# 默认配置文件名
DEFAULT_CONFIG_FILE = "magic_space.yaml"


class ConfigManager:
    """Magic Space 配置管理器"""

    def __init__(self):
        self._config: Dict[str, Any] = {}
        self._loaded = False

    def load_config(self, config_path: Optional[str] = None) -> Dict[str, Any]:
        """
        加载配置文件
        
        Args:
            config_path: 配置文件路径，如果为None则寻找默认位置
            
        Returns:
            Dict[str, Any]: 加载的配置
            
        Raises:
            ConfigurationError: 配置加载失败时抛出
        """
        # 确定配置文件路径
        if config_path is None:
            # 尝试从环境变量获取
            config_path = os.environ.get("MAGIC_SPACE_CONFIG")

            # 如果环境变量未设置，尝试在常见位置查找配置文件
            if not config_path:
                search_paths = [
                    os.path.join(os.getcwd(), DEFAULT_CONFIG_FILE),
                    os.path.join(os.getcwd(), "config", DEFAULT_CONFIG_FILE),
                    os.path.join(os.path.expanduser("~"), ".magic_space", DEFAULT_CONFIG_FILE),
                    os.path.join("/etc/magic_space", DEFAULT_CONFIG_FILE)
                ]

                for path in search_paths:
                    if os.path.exists(path):
                        config_path = path
                        break

        if not config_path or not os.path.exists(config_path):
            raise ConfigurationError(f"配置文件未找到: {config_path}")

        logger.info(f"正在加载配置文件: {config_path}")

        try:
            # 根据文件扩展名决定如何解析配置文件
            _, ext = os.path.splitext(config_path)

            with open(config_path, 'r', encoding='utf-8') as f:
                if ext.lower() in ['.yaml', '.yml']:
                    config = yaml.safe_load(f)
                else:
                    raise ConfigurationError(f"不支持的配置文件格式: {ext}")

            self._config = config
            self._loaded = True

            logger.info("配置加载成功")
            return self._config

        except Exception as e:
            logger.error(f"加载配置文件失败: {e!s}")
            raise ConfigurationError(f"加载配置文件失败: {e!s}", cause=e)

    def get_config(self) -> Dict[str, Any]:
        """
        获取完整配置
        
        Returns:
            Dict[str, Any]: 完整配置
            
        Raises:
            ConfigurationError: 如果配置尚未加载
        """
        if not self._loaded:
            raise ConfigurationError("配置尚未加载，请先调用 load_config()")

        return self._config

    def get(self, path: str, default: Any = None) -> Any:
        """
        通过点分隔路径访问配置值
        
        Args:
            path: 配置路径，如 "api.base_url"
            default: 如果路径不存在，返回的默认值
            
        Returns:
            Any: 配置值或默认值
        """
        if not self._loaded:
            raise ConfigurationError("配置尚未加载，请先调用 load_config()")

        parts = path.split('.')
        value = self._config

        for part in parts:
            if isinstance(value, dict) and part in value:
                value = value[part]
            else:
                return default

        return value


# 创建全局配置管理器实例
config_manager = ConfigManager() 
