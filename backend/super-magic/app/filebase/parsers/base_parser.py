from abc import ABC, abstractmethod
from typing import Any, Dict, Optional

from app.filebase.vector.vector_store import VectorStore


class BaseParser(ABC):
    """
    文件解析器的基类，定义解析文件的通用接口
    """

    def __init__(self, vector_store: VectorStore):
        """
        初始化解析器
        
        Args:
            vector_store: 向量存储实例，用于存储解析后的内容
        """
        self.vector_store = vector_store

    @abstractmethod
    def parse(self, file_path: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        解析文件内容
        
        Args:
            file_path: 文件路径
            metadata: 附加元数据
            
        Returns:
            Dict[str, Any]: 解析结果，包含以下字段：
                - metadata: Dict[str, Any] - 元数据字典
                - content: str - 文件内容
                - chunks: List[FileChunk] - 文件分块对象列表，解析器必须返回这个字段
        """
        pass

    @abstractmethod
    def can_handle(self, file_path: str) -> bool:
        """
        检查解析器是否能处理该文件
        
        Args:
            file_path: 文件路径
            
        Returns:
            bool: 是否可以处理
        """
        pass 
