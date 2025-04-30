from typing import Dict, List, Optional, Union

from qdrant_client import QdrantClient
from qdrant_client.http import models

from app.filebase.vector.base_driver import BaseDriver
from app.logger import get_logger

logger = get_logger(__name__)


class QdrantDriver(BaseDriver):
    """
    Qdrant 向量数据库驱动类，封装对 Qdrant 的所有操作
    """

    def __init__(self, url: Optional[str] = None, api_key: Optional[str] = None):
        """
        初始化 Qdrant 客户端

        Args:
            url: Qdrant 服务的 URL，默认为 http://127.0.0.1:6333
            api_key: Qdrant 服务的 API 密钥
        """
        self.url = url or "http://127.0.0.1:6333"
        self.api_key = api_key or ""
        logger.info( f"QdrantDriver初始化: url={self.url}")
        self.client = QdrantClient(
            url=self.url,
            api_key=self.api_key,
        )

    async def create_collection(self, collection_name: str, vector_size: int = 1536, distance: str = "Cosine") -> bool:
        """
        创建一个新的集合

        Args:
            collection_name: 集合名称
            vector_size: 向量维度大小
            distance: 距离计算方式，可选值为 "Cosine", "Euclid", "Dot"

        Returns:
            bool: 操作是否成功
        """
        try:
            # 将距离值转换为大写，以匹配 models.Distance 枚举值
            distance_upper = distance.upper()

            self.client.create_collection(
                collection_name=collection_name,
                vectors_config=models.VectorParams(
                    size=vector_size,
                    distance=models.Distance[distance_upper]
                )
            )
            logger.info(f"Collection {collection_name} created successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to create collection {collection_name}: {e!s}")
            return False

    async def collection_exists(self, collection_name: str) -> bool:
        """
        检查集合是否存在

        Args:
            collection_name: 集合名称

        Returns:
            bool: 集合是否存在
        """
        try:
            # 获取所有集合列表然后检查目标集合是否存在
            # 注意：Qdrant客户端没有直接的collection_exists方法
            # 改用获取所有集合然后检查是否存在
            collections = self.client.get_collections()
            collection_names = [collection.name for collection in collections.collections]
            is_exists = collection_name in collection_names
            return is_exists
        except Exception as e:
            logger.error(f"Error checking if collection {collection_name} exists: {e!s}")
            return False

    async def delete_collection(self, collection_name: str) -> bool:
        """
        删除集合

        Args:
            collection_name: 集合名称

        Returns:
            bool: 操作是否成功
        """
        try:
            self.client.delete_collection(collection_name)
            logger.info(f"Collection {collection_name} deleted successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to delete collection {collection_name}: {e!s}")
            return False

    async def upsert_points(self, collection_name: str, points: List[dict]) -> bool:
        """
        插入或更新点

        Args:
            collection_name: 集合名称
            points: 要插入或更新的点列表，每个点应包含 id, vector 和 payload

        Returns:
            bool: 操作是否成功
        """
        try:
            self.client.upsert(
                collection_name=collection_name,
                points=points
            )
            logger.info(f"Upserted {len(points)} points to collection {collection_name}")
            return True
        except Exception as e:
            logger.error(f"Failed to upsert points to collection {collection_name}: {e!s}")
            return False

    async def search(self, collection_name: str, query_vector: List[float], limit: int = 10,
              filter_condition: Optional[Dict] = None) -> List[Dict]:
        """
        搜索最相似的点

        Args:
            collection_name: 集合名称
            query_vector: 查询向量
            limit: 返回结果的最大数量
            filter_condition: 过滤条件，需符合Qdrant的过滤条件格式

        Returns:
            List[Dict]: 搜索结果
        """
        try:
            # 确保查询向量非空
            if not query_vector or len(query_vector) == 0:
                logger.error("Query vector cannot be empty")
                # 当只有过滤条件时，使用零向量搜索
                if filter_condition:
                    try:
                        # 获取集合信息以确定正确的向量维度
                        try:
                            collection_info = self.client.get_collection(collection_name)
                            vector_size = collection_info.config.params.vectors.size
                            logger.info(f"Using collection's vector size: {vector_size}")
                        except Exception as e:
                            logger.error(f"Failed to get collection info, using default vector size: {e!s}")
                            vector_size = 1536  # 默认向量维度，但这里已经不太重要，因为外部会传递正确尺寸的零向量

                        logger.info(f"Using zero vector with dimension {vector_size} with filter for search")
                        zero_vector = [0.0] * vector_size

                        # 转换过滤条件为Qdrant过滤器对象
                        query_filter = models.Filter(**filter_condition)

                        # 执行带过滤条件的零向量搜索
                        results = self.client.search(
                            collection_name=collection_name,
                            query_vector=zero_vector,
                            limit=limit,
                            query_filter=query_filter
                        )

                        return [
                            {
                                "id": r.id,
                                "score": getattr(r, "score", 1.0),  # 如果没有分数属性，设为最大值
                                "payload": r.payload
                            } for r in results
                        ]
                    except Exception as e:
                        logger.error(f"Zero vector search failed: {e!s}", exc_info=True)
                        return []
                return []

            # 转换过滤条件为Qdrant过滤器对象
            query_filter = None
            if filter_condition:
                try:
                    # 使用Qdrant的Filter对象来表示过滤条件
                    query_filter = models.Filter(**filter_condition)
                    logger.debug(f"Using filter condition: {query_filter}")
                except Exception as filter_error:
                    logger.error(f"Invalid filter condition format: {filter_error!s}", exc_info=True)
                    return []

            # 执行搜索
            results = self.client.search(
                collection_name=collection_name,
                query_vector=query_vector,
                limit=limit,
                query_filter=query_filter
            )

            if not results:
                logger.info(f"No search results found in collection {collection_name}")

            return [
                {
                    "id": r.id,
                    "score": r.score,
                    "payload": r.payload
                } for r in results
            ]
        except Exception as e:
            logger.error(f"Search failed in collection {collection_name}: {e!s}", exc_info=True)
            return []

    async def get_points(self, collection_name: str, ids: List[Union[str, int]]) -> List[Dict]:
        """
        获取指定 ID 的点

        Args:
            collection_name: 集合名称
            ids: 点 ID 列表

        Returns:
            List[Dict]: 点列表
        """
        try:
            results = self.client.retrieve(
                collection_name=collection_name,
                ids=ids
            )
            return [
                {
                    "id": r.id,
                    "vector": r.vector,
                    "payload": r.payload
                } for r in results
            ]
        except Exception as e:
            logger.error(f"Failed to get points from collection {collection_name}: {e!s}")
            return []

    async def delete_points(self, collection_name: str, ids: List[Union[str, int]]) -> bool:
        """
        删除指定 ID 的点

        Args:
            collection_name: 集合名称
            ids: 点 ID 列表

        Returns:
            bool: 操作是否成功
        """
        try:
            self.client.delete(
                collection_name=collection_name,
                points_selector=ids
            )
            logger.info(f"Deleted {len(ids)} points from collection {collection_name}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete points from collection {collection_name}: {e!s}")
            return False
