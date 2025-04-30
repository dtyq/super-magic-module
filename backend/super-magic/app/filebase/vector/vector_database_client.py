from typing import Dict, List, Optional, Union

from app.filebase.vector.base_driver import BaseDriver
from app.filebase.vector.driver_factory import DriverFactory
from app.logger import get_logger

logger = get_logger(__name__)

class VectorDatabaseClient:
    def __init__(self, vector_database_type: str = "qdrant"):
        """
        初始化向量数据库客户端
        
        Args:
            vector_database_type: 向量数据库类型，例如 "qdrant"，默认为 "qdrant"
        """
        self.vector_database_type = vector_database_type.lower()
        self.driver: Optional[BaseDriver] = None
        self.init_vector_database_client()

    def init_vector_database_client(self):
        """初始化向量数据库驱动"""
        try:
            self.driver = DriverFactory.create_driver(self.vector_database_type)
            logger.info(f"Vector database client initialized with {self.vector_database_type} driver")
        except ValueError as e:
            logger.error(f"Failed to initialize vector database client: {e!s}")
            raise

    async def create_collection(self, collection_name: str, vector_size: int = 1536, distance: str = "Cosine") -> bool:
        """创建向量数据库集合"""
        return await self.driver.create_collection(collection_name, vector_size, distance)

    async def collection_exists(self, collection_name: str) -> bool:
        """检查集合是否存在"""
        return await self.driver.collection_exists(collection_name)

    async def delete_collection(self, collection_name: str) -> bool:
        """删除集合"""
        return await self.driver.delete_collection(collection_name)

    async def upsert_points(self, collection_name: str, points: List[dict]) -> bool:
        """插入或更新点"""
        return await self.driver.upsert_points(collection_name, points)

    async def search(self, collection_name: str, query_vector: List[float], 
              limit: int = 10, filter_condition: Optional[Dict] = None) -> List[Dict]:
        """搜索最相似的点"""
        return await self.driver.search(collection_name, query_vector, limit, filter_condition)

    async def get_points(self, collection_name: str, ids: List[Union[str, int]]) -> List[Dict]:
        """获取指定 ID 的点"""
        return await self.driver.get_points(collection_name, ids)

    async def delete_points(self, collection_name: str, ids: List[Union[str, int]]) -> bool:
        """删除指定 ID 的点"""
        return await self.driver.delete_points(collection_name, ids)
