import os
import re
from typing import Any, Dict, Generic, Optional, Type, TypeVar

import yaml
from pydantic import BaseModel

from app.logger import get_logger
from app.paths import PathManager

T = TypeVar("T", bound=BaseModel)


class ConfigManager(Generic[T]):
    """配置管理器，支持 YAML 配置文件和 Pydantic 模型验证"""

    _instance = None
    _config: Dict[str, Any] = {}
    _model: Optional[T] = None
    _logger = get_logger("app.core.config_manager")

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ConfigManager, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if not self._config:
            self.load_config()

    def set(self, key_path: str, value: Any) -> None:
        """设置配置值，支持使用点号(.)表示层级关系

        Args:
            key_path: 配置键路径，例如 'openai.api_key'
            value: 要设置的值
        """
        if not key_path:
            return

        # 将点号分隔的路径转换为键列表
        keys = key_path.split(".")

        # 从配置字典中逐层设置值
        current = self._config
        for key in keys[:-1]:
            current = current.setdefault(key, {})
        current[keys[-1]] = value

        # 如果有模型类，重新验证
        if self._model is not None:
            self._model = self._model.__class__(**self._config)

    def load_config(self, config_path: Optional[str] = None, model: Optional[Type[T]] = None) -> None:
        """加载配置文件

        Args:
            config_path: 配置文件路径，如果为 None 则使用默认路径
            model: Pydantic 模型类，用于配置验证
        """
        if config_path is None:
            config_path = os.getenv("CONFIG_PATH", PathManager.get_project_root() / "config/config.yaml")

        # 确保配置文件存在
        if not os.path.exists(config_path):
            raise FileNotFoundError(f"配置文件不存在: {config_path}")

        # 加载 YAML 配置
        with open(config_path, "r", encoding="utf-8") as f:
            raw_config = yaml.safe_load(f)

        # 处理配置中的环境变量占位符
        self._config = self._process_env_placeholders(raw_config)

        # 如果提供了模型类，进行验证
        if model is not None:
            self._model = model(**self._config)
            # 更新配置字典，确保所有默认值都被包含
            self._config = self._model.model_dump()

    def get_model(self) -> Optional[T]:
        """获取验证后的 Pydantic 模型实例"""
        return self._model

    def get(self, key_path: str, default: Any = None) -> Any:
        """获取配置值，支持使用点号(.)表示层级关系

        Args:
            key_path: 配置键路径，例如 'openai.api_key'
            default: 默认值，当配置项不存在时返回

        Returns:
            配置值或默认值
        """
        if not key_path:
            return default

        # 将点号分隔的路径转换为键列表
        keys = key_path.split(".")

        # 从配置字典中逐层获取值
        current = self._config
        for key in keys:
            if isinstance(current, dict) and key in current:
                current = current[key]
            else:
                return default

        return current

    def reload_config(self) -> None:
        """重新加载配置，可用于运行时刷新环境变量配置"""
        self._logger.info("正在重新加载配置...")
        # 重新处理环境变量占位符
        self._config = self._process_env_placeholders(self._config)
        self._logger.info("配置重新加载完成")

    def _process_env_placeholders(self, config_dict: Dict[str, Any]) -> Dict[str, Any]:
        """处理配置中的环境变量占位符

        支持两种格式:
        1. ${ENV_VAR} - 从环境变量获取值，无默认值
        2. ${ENV_VAR:-default} - 从环境变量获取值，如果不存在则使用默认值

        同时会进行数据类型转换:
        - 如果值为 "true" 或 "false"，会转换为对应的布尔值
        - 如果值看起来像数字，会转换为对应的数字类型

        Args:
            config_dict: 原始配置字典

        Returns:
            处理后的配置字典
        """
        if not isinstance(config_dict, dict):
            return config_dict

        result = {}
        for key, value in config_dict.items():
            if isinstance(value, dict):
                # 递归处理嵌套字典
                result[key] = self._process_env_placeholders(value)
            elif isinstance(value, str):
                # 处理字符串中的环境变量占位符
                pattern = r"\${([A-Za-z0-9_]+)(?::-([^}]*))?\}"
                match = re.fullmatch(pattern, value)
                if match:
                    env_var = match.group(1)
                    default_value = match.group(2) if match.group(2) is not None else ""

                    # 从环境变量获取值，如果不存在则使用默认值
                    env_value = os.getenv(env_var)
                    if env_value is not None:
                        result[key] = self._convert_value_type(env_value)
                    else:
                        result[key] = self._convert_value_type(default_value)
                else:
                    result[key] = value
            else:
                # 非字符串值直接保留
                result[key] = value

        return result

    def _convert_value_type(self, value: str) -> Any:
        """转换值的数据类型

        - 将 "true"/"false" 转换为布尔值
        - 将数字字符串转换为整数或浮点数

        Args:
            value: 要转换的字符串值

        Returns:
            转换后的值
        """
        # 处理布尔值
        if value.lower() == "true":
            return True
        elif value.lower() == "false":
            return False

        # 处理数字
        try:
            # 尝试转换为整数
            if value.isdigit() or (value.startswith("-") and value[1:].isdigit()):
                return int(value)

            # 尝试转换为浮点数
            if "." in value:
                float_val = float(value)
                # 检查是否是整数值的浮点数（如 5.0）
                if float_val.is_integer():
                    return int(float_val)
                return float_val
        except (ValueError, TypeError):
            pass

        # 无法转换，返回原始值
        return value

# 创建全局配置管理器实例
config = ConfigManager()
