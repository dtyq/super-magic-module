"""向量存储管理模块，提供向量存储的初始化和获取功能"""

import asyncio
from typing import Optional
from urllib.parse import urlparse

from app.core.config_manager import config
from app.logger import get_logger
from app.vector_store.base import BaseVectorStore, QdrantConfig, VectorStoreFactory

logger = get_logger(__name__)

# 全局向量存储实例
_vector_store: Optional[BaseVectorStore] = None
_init_lock = asyncio.Lock()


async def init_vector_store() -> None:
    """初始化向量存储

    初始化全局向量存储实例，如果已经初始化则不执行任何操作
    """
    global _vector_store

    async with _init_lock:
        if _vector_store is not None:
            logger.debug("Vector store already initialized")
            return

        try:
            # 从配置中获取Qdrant配置
            base_uri = config.get("qdrant.base_uri")
            api_key = config.get("qdrant.api_key")
            collection_prefix = config.get("qdrant.collection_prefix", "SUPERMAGIC-")

            # 验证必要的配置
            if not base_uri:
                raise ValueError("Qdrant base URI not configured")

            # 解析URL
            parsed_uri = urlparse(base_uri)
            https = parsed_uri.scheme == "https"
            host = parsed_uri.hostname or ""
            port = parsed_uri.port or (6333 if not https else 6334)

            # 创建向量存储配置
            vector_store_config = QdrantConfig(
                host=host,
                port=port,
                database_type="qdrant",
                api_key=api_key,
                https=https,
                collection_prefix=collection_prefix,
            )

            # 创建向量存储实例
            factory = VectorStoreFactory()
            _vector_store = await factory.create(vector_store_config)

            logger.info(f"Vector store initialized with provider: qdrant, url: {base_uri}")
        except Exception as e:
            logger.error(f"Failed to initialize vector store: {e}")
            raise


def get_vector_store() -> BaseVectorStore:
    """获取向量存储实例

    Returns:
        初始化后的向量存储实例

    Raises:
        RuntimeError: 如果向量存储尚未初始化
    """
    if _vector_store is None:
        raise RuntimeError("Vector store not initialized. Call init_vector_store() first.")
    return _vector_store
