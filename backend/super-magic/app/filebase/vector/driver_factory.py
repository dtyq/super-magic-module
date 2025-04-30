from typing import Any, Dict, Optional

from app.core.config_manager import config
from app.filebase.vector.base_driver import BaseDriver
from app.filebase.vector.qdrant_driver import QdrantDriver
from app.logger import get_logger

logger = get_logger(__name__)


class DriverFactory:
    """
    向量数据库驱动工厂类，用于创建不同类型的向量数据库驱动
    """

    @staticmethod
    def create_driver(driver_type: str, custom_config: Optional[Dict[str, Any]] = None) -> BaseDriver:
        """
        创建向量数据库驱动
        
        Args:
            driver_type: 驱动类型，例如 "qdrant"
            custom_config: 自定义配置，如果提供将覆盖从配置管理器获取的配置
            
        Returns:
            BaseDriver: 驱动实例
            
        Raises:
            ValueError: 不支持的驱动类型
        """
        driver_type = driver_type.lower()

        if driver_type == "qdrant":
            # 从配置管理器获取 Qdrant 配置
            driver_config = config.get("qdrant", {})

            # 如果提供了自定义配置，则与系统配置合并
            if custom_config:
                driver_config.update(custom_config)

            # 检查配置是否存在
            if not driver_config:
                logger.warning("Qdrant configuration not found, using default settings")

            return QdrantDriver(
                url=driver_config.get("base_uri"),
                api_key=driver_config.get("api_key")
            )
        else:
            logger.error(f"Unsupported vector database driver type: {driver_type}")
            raise ValueError(f"Unsupported vector database driver type: {driver_type}") 
