"""
配置初始化模块 - 向后兼容层

此模块提供与旧版本兼容的配置初始化函数，实际调用ConfigManager的reload_config方法。
新代码应直接使用config.reload_config()方法，而不是此模块中的函数。
"""

from app.logger import get_logger

logger = get_logger(__name__)
