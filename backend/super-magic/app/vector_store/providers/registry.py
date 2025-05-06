"""向量存储提供程序注册模块"""

from app.vector_store.base import VectorStoreFactory
from app.vector_store.providers.qdrant import QdrantVectorStore


def register_providers() -> None:
    """注册所有向量存储提供程序"""
    factory = VectorStoreFactory()
    factory.register("qdrant", QdrantVectorStore)
