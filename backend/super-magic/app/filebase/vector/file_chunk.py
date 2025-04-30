from typing import Any, Dict, List, Optional


class FileChunk:
    """
    文件分块类，表示文件内容的一个分块及其相关元数据
    
    这个类用于在向量存储过程中，组织文件分块与其对应的元数据，
    确保共享的元数据和分块特有的元数据能够正确对应
    """

    def __init__(
        self, 
        text: str, 
        file_metadata: Dict[str, Any], 
        chunk_metadata: Optional[Dict[str, Any]] = None,
        chunk_index: int = 0,
        total_chunks: int = 1
    ):
        """
        初始化文件分块
        
        Args:
            text: 分块的文本内容
            file_metadata: 文件级别的元数据，所有分块共享
            chunk_metadata: 分块特有的元数据
            chunk_index: 当前分块的索引
            total_chunks: 总分块数
        """
        self.text = text
        self.file_metadata = file_metadata
        self.chunk_metadata = chunk_metadata or {}
        self.chunk_index = chunk_index
        self.total_chunks = total_chunks

    def get_text(self) -> str:
        """获取分块文本内容"""
        return self.text

    def get_metadata(self) -> Dict[str, Any]:
        """
        获取合并后的元数据，包括文件级别元数据和分块特有元数据
        
        Returns:
            Dict[str, Any]: 合并后的元数据
        """
        # 复制文件元数据，避免修改原始数据
        merged_metadata = self.file_metadata.copy()

        # 添加分块特有数据
        merged_metadata.update({
            "chunk_index": self.chunk_index, 
            "total_chunks": self.total_chunks
        })

        # 添加分块特有元数据
        if self.chunk_metadata:
            merged_metadata.update(self.chunk_metadata)

        return merged_metadata

    @classmethod
    def create_chunks(
        cls, 
        texts: List[str], 
        file_metadata: Dict[str, Any], 
        chunk_metadatas: Optional[List[Dict[str, Any]]] = None
    ) -> List["FileChunk"]:
        """
        从文本列表创建文件分块列表
        
        Args:
            texts: 文本分块列表
            file_metadata: 所有分块共享的文件元数据
            chunk_metadatas: 与文本列表对应的分块特有元数据列表，可选
            
        Returns:
            List[FileChunk]: 文件分块对象列表
        """
        chunks = []
        total_chunks = len(texts)

        for i, text in enumerate(texts):
            chunk_metadata = chunk_metadatas[i] if chunk_metadatas and i < len(chunk_metadatas) else None
            chunks.append(cls(
                text=text,
                file_metadata=file_metadata,
                chunk_metadata=chunk_metadata,
                chunk_index=i,
                total_chunks=total_chunks
            ))

        return chunks 
