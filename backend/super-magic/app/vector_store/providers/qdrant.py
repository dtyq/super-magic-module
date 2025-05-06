from datetime import datetime
from typing import Dict, List, Optional, Union

from qdrant_client import QdrantClient, models
from qdrant_client.http import models as rest
from tenacity import retry, stop_after_attempt, wait_exponential

from ..base import (
    BaseVectorStore,
    CollectionError,
    ConnectionError,
    DocumentError,
    QdrantConfig,
    SearchError,
    SearchResult,
    VectorDocument,
)


class QdrantVectorStore(BaseVectorStore):
    """Qdrant 向量数据库实现"""

    def __init__(self, config: QdrantConfig):
        """初始化 Qdrant 客户端

        Args:
            config: Qdrant 配置对象
        """
        self.config = config
        self.client = None

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10), reraise=True)
    async def initialize(self) -> None:
        """初始化 Qdrant 连接"""
        try:
            self.client = QdrantClient(
                url=f"{'https' if self.config.https else 'http'}://{self.config.host}:{self.config.port}",
                api_key=self.config.api_key,
                prefer_grpc=self.config.prefer_grpc,
                timeout=self.config.connection_timeout,
            )
            # 测试连接
            self.client.get_collections()
        except Exception as e:
            raise ConnectionError(f"Failed to initialize Qdrant connection: {e!s}") from e

    async def close(self) -> None:
        """关闭 Qdrant 连接"""
        if self.client:
            self.client.close()

    def _get_prefixed_collection_name(self, collection_name: str) -> str:
        """获取添加前缀的集合名称

        Args:
            collection_name: 原始集合名称

        Returns:
            添加前缀后的集合名称
        """
        if collection_name.startswith(self.config.collection_prefix):
            return collection_name
        return f"{self.config.collection_prefix}{collection_name}"

    async def create_collection(
        self, collection_name: str, vector_size: int, distance_metric: str = "cosine", **kwargs
    ) -> None:
        """创建新的集合"""
        try:
            # 添加前缀
            prefixed_collection_name = self._get_prefixed_collection_name(collection_name)

            # 转换距离度量方式
            distance_map = {
                "cosine": models.Distance.COSINE,
                "euclid": models.Distance.EUCLID,
                "dot": models.Distance.DOT,
            }
            distance = distance_map.get(distance_metric.lower(), models.Distance.COSINE)

            # 创建集合
            self.client.create_collection(
                collection_name=prefixed_collection_name,
                vectors_config=models.VectorParams(size=vector_size, distance=distance),
                **kwargs,
            )
        except Exception as e:
            raise CollectionError(f"Failed to create collection {collection_name}: {e!s}") from e

    async def delete_collection(self, collection_name: str) -> None:
        """删除集合"""
        try:
            prefixed_collection_name = self._get_prefixed_collection_name(collection_name)
            self.client.delete_collection(collection_name=prefixed_collection_name)
        except Exception as e:
            raise CollectionError(f"Failed to delete collection {collection_name}: {e!s}") from e

    async def list_collections(self) -> List[str]:
        """列出所有集合"""
        try:
            collections = self.client.get_collections()
            # 过滤出带有前缀的集合并去除前缀
            prefix_len = len(self.config.collection_prefix)

            collection_names = []
            for collection in collections.collections:
                # 如果集合名称以前缀开始，去掉前缀后返回
                if collection.name.startswith(self.config.collection_prefix):
                    collection_names.append(collection.name[prefix_len:])
                else:
                    # 集合名称没有前缀，原样返回
                    collection_names.append(collection.name)

            return collection_names
        except Exception as e:
            raise CollectionError(f"Failed to list collections: {e!s}") from e

    def _convert_to_qdrant_point(self, document: VectorDocument) -> models.PointStruct:
        """转换文档为 Qdrant 点结构"""
        return models.PointStruct(
            id=document.id,
            vector=document.vector,
            payload={
                "content": document.content,
                "metadata": document.metadata,
                "created_at": document.created_at.isoformat() if document.created_at else None,
                "updated_at": document.updated_at.isoformat() if document.updated_at else None,
            },
        )

    def _convert_from_qdrant_point(self, point: models.Record) -> VectorDocument:
        """转换 Qdrant 点结构为文档"""
        return VectorDocument(
            id=str(point.id),
            vector=point.vector,
            content=point.payload.get("content", ""),
            metadata=point.payload.get("metadata", {}),
            created_at=datetime.fromisoformat(point.payload["created_at"]) if point.payload.get("created_at") else None,
            updated_at=datetime.fromisoformat(point.payload["updated_at"]) if point.payload.get("updated_at") else None,
        )

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    async def insert(self, collection_name: str, documents: Union[VectorDocument, List[VectorDocument]]) -> List[str]:
        """插入文档"""
        try:
            if isinstance(documents, VectorDocument):
                documents = [documents]

            prefixed_collection_name = self._get_prefixed_collection_name(collection_name)
            points = [self._convert_to_qdrant_point(doc) for doc in documents]
            operation_info = self.client.upsert(collection_name=prefixed_collection_name, points=points)
            return [str(point.id) for point in points]
        except Exception as e:
            raise DocumentError(f"Failed to insert documents: {e!s}") from e

    async def delete(self, collection_name: str, document_ids: Union[str, List[str]]) -> List[str]:
        """删除文档"""
        try:
            if isinstance(document_ids, str):
                document_ids = [document_ids]

            prefixed_collection_name = self._get_prefixed_collection_name(collection_name)
            self.client.delete(
                collection_name=prefixed_collection_name, points_selector=models.PointIdsList(points=document_ids)
            )
            return document_ids
        except Exception as e:
            raise DocumentError(f"Failed to delete documents: {e!s}") from e

    async def search(
        self,
        collection_name: str,
        query_vector: List[float],
        limit: int = 10,
        score_threshold: Optional[float] = None,
        **kwargs,
    ) -> List[SearchResult]:
        """向量搜索"""
        try:
            prefixed_collection_name = self._get_prefixed_collection_name(collection_name)
            search_params = {}
            if score_threshold is not None:
                search_params["score_threshold"] = score_threshold

            results = self.client.search(
                collection_name=prefixed_collection_name,
                query_vector=query_vector,
                limit=limit,
                search_params=rest.SearchParams(**search_params),
                **kwargs,
            )

            return [
                SearchResult(
                    document=self._convert_from_qdrant_point(
                        models.Record(
                            id=str(result.id),
                            payload=result.payload,
                            vector=query_vector,  # Qdrant 不返回向量，使用查询向量
                        )
                    ),
                    score=result.score,
                )
                for result in results
            ]
        except Exception as e:
            raise SearchError(f"Failed to perform search: {e!s}") from e

    async def update(self, collection_name: str, document: VectorDocument) -> bool:
        """更新文档"""
        try:
            prefixed_collection_name = self._get_prefixed_collection_name(collection_name)
            point = self._convert_to_qdrant_point(document)
            self.client.upsert(collection_name=prefixed_collection_name, points=[point])
            return True
        except Exception as e:
            raise DocumentError(f"Failed to update document: {e!s}") from e

    async def get(self, collection_name: str, document_id: str) -> Optional[VectorDocument]:
        """获取文档"""
        try:
            prefixed_collection_name = self._get_prefixed_collection_name(collection_name)
            points = self.client.retrieve(collection_name=prefixed_collection_name, ids=[document_id])
            if not points:
                return None
            return self._convert_from_qdrant_point(points[0])
        except Exception as e:
            raise DocumentError(f"Failed to get document: {e!s}") from e

    async def count(self, collection_name: str) -> int:
        """获取集合中的文档数量"""
        try:
            prefixed_collection_name = self._get_prefixed_collection_name(collection_name)
            collection_info = self.client.get_collection(collection_name=prefixed_collection_name)
            return collection_info.points_count
        except Exception as e:
            raise CollectionError(f"Failed to get collection count: {e!s}") from e

    async def list_documents(
        self, collection_name: str, filter_condition: Optional[Dict] = None, limit: int = 100
    ) -> List[VectorDocument]:
        """列出满足过滤条件的文档"""
        try:
            prefixed_collection_name = self._get_prefixed_collection_name(collection_name)

            # 获取所有文档 (Qdrant的scroll不直接支持复杂的筛选)
            scroll_result = self.client.scroll(
                collection_name=prefixed_collection_name, limit=limit, with_vectors=True, with_payload=True
            )

            # 手动进行筛选
            documents = []
            for point in scroll_result[0]:  # scroll返回(points, next_page_offset)元组
                doc = self._convert_from_qdrant_point(point)

                # 如果有筛选条件，执行简单的手动筛选
                if filter_condition and "must" in filter_condition:
                    match = True
                    for condition in filter_condition["must"]:
                        if "key" in condition and "match" in condition:
                            key = condition["key"]
                            match_value = condition["match"].get("value")

                            # 查看metadata中的值是否匹配
                            actual_value = None
                            if key == "type":
                                actual_value = doc.metadata.get("type")
                            elif key.startswith("metadata."):
                                keys = key.split(".")
                                if len(keys) > 1:
                                    nested_key = keys[1]
                                    model_data = doc.metadata.get("model_data", {})
                                    actual_value = model_data.get(nested_key)

                            if actual_value != match_value:
                                match = False
                                break

                    if not match:
                        continue

                documents.append(doc)
                if len(documents) >= limit:
                    break

            return documents
        except Exception as e:
            raise DocumentError(f"Failed to list documents: {e!s}") from e
