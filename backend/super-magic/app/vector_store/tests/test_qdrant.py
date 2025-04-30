from datetime import datetime
from unittest.mock import Mock, patch

import pytest

from ..base import (
    CollectionError,
    ConnectionError,
    DocumentError,
    QdrantConfig,
    SearchError,
    SearchResult,
    VectorDocument,
)
from ..providers.qdrant import QdrantVectorStore


@pytest.fixture
def qdrant_config():
    return QdrantConfig.from_env()


@pytest.fixture
def mock_qdrant_client():
    with patch("qdrant_client.QdrantClient") as mock:
        yield mock


@pytest.fixture
def qdrant_store(qdrant_config, mock_qdrant_client):
    store = QdrantVectorStore(qdrant_config)
    store.client = mock_qdrant_client
    return store


def create_test_document(doc_id: str = "test1") -> VectorDocument:
    return VectorDocument(
        id=doc_id,
        vector=[0.1] * 128,
        metadata={"test": "value"},
        content="test content",
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )


@pytest.mark.asyncio
async def test_initialize(qdrant_config, mock_qdrant_client):
    store = QdrantVectorStore(qdrant_config)

    # 测试成功初始化
    await store.initialize()
    mock_qdrant_client.assert_called_once()

    # 测试初始化失败
    mock_qdrant_client.side_effect = Exception("Connection failed")
    store = QdrantVectorStore(qdrant_config)
    with pytest.raises(ConnectionError):
        await store.initialize()


@pytest.mark.asyncio
async def test_create_collection(qdrant_store):
    await qdrant_store.create_collection(collection_name="test_collection", vector_size=128)
    qdrant_store.client.create_collection.assert_called_once()

    # 测试创建失败
    qdrant_store.client.create_collection.side_effect = Exception("Creation failed")
    with pytest.raises(CollectionError):
        await qdrant_store.create_collection(collection_name="test_collection", vector_size=128)


@pytest.mark.asyncio
async def test_list_collections(qdrant_store):
    mock_collection = Mock()
    mock_collection.name = "test_collection"
    mock_collections = Mock()
    mock_collections.collections = [mock_collection]
    qdrant_store.client.get_collections.return_value = mock_collections

    collections = await qdrant_store.list_collections()
    assert collections == ["test_collection"]

    # 测试列表获取失败
    qdrant_store.client.get_collections.side_effect = Exception("List failed")
    with pytest.raises(CollectionError):
        await qdrant_store.list_collections()


@pytest.mark.asyncio
async def test_insert_and_get(qdrant_store):
    doc = create_test_document()

    # 测试插入
    await qdrant_store.insert("test_collection", doc)
    qdrant_store.client.upsert.assert_called_once()

    # 测试获取
    mock_point = Mock()
    mock_point.id = doc.id
    mock_point.vector = doc.vector
    mock_point.payload = {
        "content": doc.content,
        "metadata": doc.metadata,
        "created_at": doc.created_at.isoformat(),
        "updated_at": doc.updated_at.isoformat(),
    }
    qdrant_store.client.retrieve.return_value = [mock_point]

    retrieved_doc = await qdrant_store.get("test_collection", doc.id)
    assert retrieved_doc.id == doc.id
    assert retrieved_doc.content == doc.content

    # 测试获取不存在的文档
    qdrant_store.client.retrieve.return_value = []
    retrieved_doc = await qdrant_store.get("test_collection", "non_existent")
    assert retrieved_doc is None


@pytest.mark.asyncio
async def test_search(qdrant_store):
    # 模拟搜索结果
    mock_result = Mock()
    mock_result.id = "test1"
    mock_result.score = 0.9
    mock_result.payload = {
        "content": "test content",
        "metadata": {"test": "value"},
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
    }
    qdrant_store.client.search.return_value = [mock_result]

    results = await qdrant_store.search(collection_name="test_collection", query_vector=[0.1] * 128, limit=1)

    assert len(results) == 1
    assert isinstance(results[0], SearchResult)
    assert results[0].score == 0.9

    # 测试搜索失败
    qdrant_store.client.search.side_effect = Exception("Search failed")
    with pytest.raises(SearchError):
        await qdrant_store.search(collection_name="test_collection", query_vector=[0.1] * 128)


@pytest.mark.asyncio
async def test_delete(qdrant_store):
    # 测试删除文档
    doc_id = "test1"
    await qdrant_store.delete("test_collection", doc_id)
    qdrant_store.client.delete.assert_called_once()

    # 测试删除失败
    qdrant_store.client.delete.side_effect = Exception("Delete failed")
    with pytest.raises(DocumentError):
        await qdrant_store.delete("test_collection", doc_id)


@pytest.mark.asyncio
async def test_update(qdrant_store):
    doc = create_test_document()

    # 测试更新文档
    success = await qdrant_store.update("test_collection", doc)
    assert success is True
    qdrant_store.client.upsert.assert_called_once()

    # 测试更新失败
    qdrant_store.client.upsert.side_effect = Exception("Update failed")
    with pytest.raises(DocumentError):
        await qdrant_store.update("test_collection", doc)


@pytest.mark.asyncio
async def test_count(qdrant_store):
    # 模拟集合信息
    mock_collection_info = Mock()
    mock_collection_info.points_count = 42
    qdrant_store.client.get_collection.return_value = mock_collection_info

    count = await qdrant_store.count("test_collection")
    assert count == 42

    # 测试计数失败
    qdrant_store.client.get_collection.side_effect = Exception("Count failed")
    with pytest.raises(CollectionError):
        await qdrant_store.count("test_collection")


@pytest.mark.asyncio
async def test_collection_prefix(qdrant_store):
    """测试集合名称前缀功能"""
    # 测试创建集合时添加前缀
    await qdrant_store.create_collection(collection_name="test_collection", vector_size=128)
    qdrant_store.client.create_collection.assert_called_once_with(
        collection_name=f"{qdrant_store.config.collection_prefix}test_collection", vectors_config=pytest.ANY
    )

    # 测试列表集合时去除前缀
    mock_collection1 = Mock()
    mock_collection1.name = f"{qdrant_store.config.collection_prefix}test_collection1"
    mock_collection2 = Mock()
    mock_collection2.name = f"{qdrant_store.config.collection_prefix}test_collection2"
    mock_collections = Mock()
    mock_collections.collections = [mock_collection1, mock_collection2]
    qdrant_store.client.get_collections.return_value = mock_collections

    collections = await qdrant_store.list_collections()
    assert "test_collection1" in collections
    assert "test_collection2" in collections

    # 测试获取文档时使用前缀
    doc_id = "test1"
    await qdrant_store.get("test_collection", doc_id)
    qdrant_store.client.retrieve.assert_called_once_with(
        collection_name=f"{qdrant_store.config.collection_prefix}test_collection", ids=[doc_id]
    )

    # 测试插入文档时使用前缀
    doc = create_test_document()
    await qdrant_store.insert("test_collection", doc)
    qdrant_store.client.upsert.assert_called_with(
        collection_name=f"{qdrant_store.config.collection_prefix}test_collection", points=pytest.ANY
    )

    # 测试搜索时使用前缀
    await qdrant_store.search(collection_name="test_collection", query_vector=[0.1] * 128)
    qdrant_store.client.search.assert_called_with(
        collection_name=f"{qdrant_store.config.collection_prefix}test_collection",
        query_vector=[0.1] * 128,
        limit=10,
        search_params=pytest.ANY,
    )

    # 测试删除集合时使用前缀
    await qdrant_store.delete_collection("test_collection")
    qdrant_store.client.delete_collection.assert_called_once_with(
        collection_name=f"{qdrant_store.config.collection_prefix}test_collection"
    )
