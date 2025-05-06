from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Optional, Union


@dataclass
class VectorDocument:
    """向量文档数据类"""

    id: str
    vector: List[float]
    metadata: Dict[str, Any]
    content: str
    created_at: datetime = None
    updated_at: datetime = None


@dataclass
class SearchResult:
    """搜索结果数据类"""

    document: VectorDocument
    score: float


class BaseVectorStore(ABC):
    """向量数据库抽象基类"""

    @abstractmethod
    async def initialize(self) -> None:
        """初始化向量数据库连接和必要的设置"""
        pass

    @abstractmethod
    async def close(self) -> None:
        """关闭数据库连接"""
        pass

    @abstractmethod
    async def create_collection(
        self, collection_name: str, vector_size: int, distance_metric: str = "cosine", **kwargs
    ) -> None:
        """创建新的集合

        Args:
            collection_name: 集合名称
            vector_size: 向量维度
            distance_metric: 距离度量方式
            **kwargs: 额外的集合配置参数
        """
        pass

    @abstractmethod
    async def delete_collection(self, collection_name: str) -> None:
        """删除集合

        Args:
            collection_name: 集合名称
        """
        pass

    @abstractmethod
    async def list_collections(self) -> List[str]:
        """列出所有集合

        Returns:
            集合名称列表
        """
        pass

    @abstractmethod
    async def insert(self, collection_name: str, documents: Union[VectorDocument, List[VectorDocument]]) -> List[str]:
        """插入一个或多个向量文档

        Args:
            collection_name: 集合名称
            documents: 单个文档或文档列表

        Returns:
            插入文档的ID列表
        """
        pass

    @abstractmethod
    async def delete(self, collection_name: str, document_ids: Union[str, List[str]]) -> List[str]:
        """删除一个或多个文档

        Args:
            collection_name: 集合名称
            document_ids: 单个文档ID或ID列表

        Returns:
            成功删除的文档ID列表
        """
        pass

    @abstractmethod
    async def search(
        self,
        collection_name: str,
        query_vector: List[float],
        limit: int = 10,
        score_threshold: Optional[float] = None,
        **kwargs,
    ) -> List[SearchResult]:
        """向量相似度搜索

        Args:
            collection_name: 集合名称
            query_vector: 查询向量
            limit: 返回结果数量
            score_threshold: 相似度阈值
            **kwargs: 额外的搜索参数

        Returns:
            搜索结果列表
        """
        pass

    @abstractmethod
    async def update(self, collection_name: str, document: VectorDocument) -> bool:
        """更新文档

        Args:
            collection_name: 集合名称
            document: 更新后的文档

        Returns:
            更新是否成功
        """
        pass

    @abstractmethod
    async def get(self, collection_name: str, document_id: str) -> Optional[VectorDocument]:
        """获取指定文档

        Args:
            collection_name: 集合名称
            document_id: 文档ID

        Returns:
            文档对象，如果不存在则返回None
        """
        pass

    @abstractmethod
    async def count(self, collection_name: str) -> int:
        """获取集合中的文档数量

        Args:
            collection_name: 集合名称

        Returns:
            文档数量
        """
        pass

    @abstractmethod
    async def list_documents(
        self, collection_name: str, filter_condition: Optional[Dict] = None, limit: int = 100
    ) -> List[VectorDocument]:
        """列出满足过滤条件的文档

        Args:
            collection_name: 集合名称
            filter_condition: 过滤条件
            limit: 返回结果数量限制

        Returns:
            满足条件的文档列表
        """
        pass
