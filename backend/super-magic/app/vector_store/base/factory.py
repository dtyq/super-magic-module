from typing import Dict, Type

from .config import VectorStoreConfig
from .exceptions import ConfigurationError
from .vector_store import BaseVectorStore


class VectorStoreFactory:
    """向量数据库工厂类"""

    _instance = None
    _stores: Dict[str, Type[BaseVectorStore]] = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(VectorStoreFactory, cls).__new__(cls)
        return cls._instance

    @classmethod
    def register(cls, database_type: str, store_class: Type[BaseVectorStore]) -> None:
        """注册向量数据库实现类

        Args:
            database_type: 数据库类型标识符
            store_class: 向量数据库实现类
        """
        cls._stores[database_type] = store_class

    @classmethod
    async def create(cls, config: VectorStoreConfig) -> BaseVectorStore:
        """创建向量数据库实例

        Args:
            config: 向量数据库配置

        Returns:
            向量数据库实例

        Raises:
            ConfigurationError: 当数据库类型未注册时抛出
        """
        if config.database_type not in cls._stores:
            raise ConfigurationError(f"Unsupported database type: {config.database_type}")

        store_class = cls._stores[config.database_type]
        store = store_class(config)
        await store.initialize()
        return store

    @classmethod
    def get_supported_types(cls) -> list[str]:
        """获取所有支持的数据库类型

        Returns:
            支持的数据库类型列表
        """
        return list(cls._stores.keys())
