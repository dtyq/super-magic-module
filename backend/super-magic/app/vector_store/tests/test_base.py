from datetime import datetime
from typing import List, Optional

import pytest

from ..base import (
    BaseVectorStore,
    ConfigurationError,
    SearchResult,
    VectorDocument,
    VectorStoreConfig,
    VectorStoreFactory,
)


class MockVectorStore(BaseVectorStore):
    """用于测试的模拟向量数据库实现"""

    def __init__(self, config: VectorStoreConfig):
        self.config = config
        self.collections = {}
        self.initialized = False

    async def initialize(self) -> None:
        self.initialized = True

    async def close(self) -> None:
        self.initialized = False

    async def create_collection(
        self, collection_name: str, vector_size: int, distance_metric: str = "cosine", **kwargs
    ) -> None:
        self.collections[collection_name] = {
            "vector_size": vector_size,
            "distance_metric": distance_metric,
            "documents": {},
        }

    async def delete_collection(self, collection_name: str) -> None:
        if collection_name in self.collections:
            del self.collections[collection_name]

    async def list_collections(self) -> List[str]:
        return list(self.collections.keys())

    async def insert(self, collection_name: str, documents: VectorDocument | List[VectorDocument]) -> List[str]:
        if isinstance(documents, VectorDocument):
            documents = [documents]

        doc_ids = []
        for doc in documents:
            self.collections[collection_name]["documents"][doc.id] = doc
            doc_ids.append(doc.id)
        return doc_ids

    async def delete(self, collection_name: str, document_ids: str | List[str]) -> List[str]:
        if isinstance(document_ids, str):
            document_ids = [document_ids]

        deleted_ids = []
        for doc_id in document_ids:
            if doc_id in self.collections[collection_name]["documents"]:
                del self.collections[collection_name]["documents"][doc_id]
                deleted_ids.append(doc_id)
        return deleted_ids

    async def search(
        self,
        collection_name: str,
        query_vector: List[float],
        limit: int = 10,
        score_threshold: Optional[float] = None,
        **kwargs,
    ) -> List[SearchResult]:
        # 简单模拟搜索，返回前N个文档
        docs = list(self.collections[collection_name]["documents"].values())
        return [SearchResult(document=doc, score=0.9) for doc in docs[:limit]]

    async def update(self, collection_name: str, document: VectorDocument) -> bool:
        if document.id in self.collections[collection_name]["documents"]:
            self.collections[collection_name]["documents"][document.id] = document
            return True
        return False

    async def get(self, collection_name: str, document_id: str) -> Optional[VectorDocument]:
        return self.collections[collection_name]["documents"].get(document_id)

    async def count(self, collection_name: str) -> int:
        return len(self.collections[collection_name]["documents"])


@pytest.fixture
def vector_store_config():
    return VectorStoreConfig(host="localhost", port=6333, database_type="mock")


@pytest.fixture
def mock_store(vector_store_config):
    VectorStoreFactory.register("mock", MockVectorStore)
    return MockVectorStore(vector_store_config)


@pytest.mark.asyncio
async def test_vector_store_basic_operations(mock_store):
    # 测试初始化
    await mock_store.initialize()
    assert mock_store.initialized is True

    # 测试创建集合
    await mock_store.create_collection("test_collection", vector_size=128)
    collections = await mock_store.list_collections()
    assert "test_collection" in collections

    # 测试插入文档
    doc = VectorDocument(
        id="test1",
        vector=[0.1] * 128,
        metadata={"test": "value"},
        content="test content",
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )
    inserted_ids = await mock_store.insert("test_collection", doc)
    assert inserted_ids == ["test1"]

    # 测试获取文档
    retrieved_doc = await mock_store.get("test_collection", "test1")
    assert retrieved_doc.id == doc.id
    assert retrieved_doc.content == doc.content

    # 测试搜索
    search_results = await mock_store.search("test_collection", query_vector=[0.1] * 128, limit=1)
    assert len(search_results) == 1
    assert search_results[0].document.id == "test1"

    # 测试更新文档
    doc.content = "updated content"
    update_success = await mock_store.update("test_collection", doc)
    assert update_success is True

    # 测试删除文档
    deleted_ids = await mock_store.delete("test_collection", "test1")
    assert deleted_ids == ["test1"]

    # 测试计数
    count = await mock_store.count("test_collection")
    assert count == 0

    # 测试删除集合
    await mock_store.delete_collection("test_collection")
    collections = await mock_store.list_collections()
    assert "test_collection" not in collections

    # 测试关闭连接
    await mock_store.close()
    assert mock_store.initialized is False


@pytest.mark.asyncio
async def test_vector_store_factory(vector_store_config):
    # 测试工厂创建实例
    store = await VectorStoreFactory.create(vector_store_config)
    assert isinstance(store, MockVectorStore)

    # 测试不支持的数据库类型
    invalid_config = VectorStoreConfig(host="localhost", port=6333, database_type="unsupported")
    with pytest.raises(ConfigurationError):
        await VectorStoreFactory.create(invalid_config)

    # 测试获取支持的类型
    supported_types = VectorStoreFactory.get_supported_types()
    assert "mock" in supported_types
