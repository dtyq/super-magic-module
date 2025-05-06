from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Union


class BaseDriver(ABC):
    """
    向量数据库驱动基类，定义所有向量数据库驱动需要实现的接口
    """

    @abstractmethod
    async def create_collection(self, collection_name: str, vector_size: int = 1536, distance: str = "Cosine") -> bool:
        """
        创建一个新的集合
        
        Args:
            collection_name: 集合名称
            vector_size: 向量维度大小
            distance: 距离计算方式
            
        Returns:
            bool: 操作是否成功
        """
        pass

    @abstractmethod
    async def collection_exists(self, collection_name: str) -> bool:
        """
        检查集合是否存在
        
        Args:
            collection_name: 集合名称
            
        Returns:
            bool: 集合是否存在
        """
        pass

    @abstractmethod
    async def delete_collection(self, collection_name: str) -> bool:
        """
        删除集合
        
        Args:
            collection_name: 集合名称
            
        Returns:
            bool: 操作是否成功
        """
        pass

    @abstractmethod
    async def upsert_points(self, collection_name: str, points: List[dict]) -> bool:
        """
        插入或更新点
        
        Args:
            collection_name: 集合名称
            points: 要插入或更新的点列表，每个点应包含 id, vector 和 payload
            
        Returns:
            bool: 操作是否成功
        """
        pass

    @abstractmethod
    async def search(self, collection_name: str, query_vector: List[float], limit: int = 10, 
               filter_condition: Optional[Dict] = None) -> List[Dict]:
        """
        搜索最相似的点
        
        Args:
            collection_name: 集合名称
            query_vector: 查询向量
            limit: 返回结果的最大数量
            filter_condition: 过滤条件
            
        Returns:
            List[Dict]: 搜索结果
        """
        pass

    @abstractmethod
    async def get_points(self, collection_name: str, ids: List[Union[str, int]]) -> List[Dict]:
        """
        获取指定 ID 的点
        
        Args:
            collection_name: 集合名称
            ids: 点 ID 列表
            
        Returns:
            List[Dict]: 点列表
        """
        pass

    @abstractmethod
    async def delete_points(self, collection_name: str, ids: List[Union[str, int]]) -> bool:
        """
        删除指定 ID 的点
        
        Args:
            collection_name: 集合名称
            ids: 点 ID 列表
            
        Returns:
            bool: 操作是否成功
        """
        pass 
