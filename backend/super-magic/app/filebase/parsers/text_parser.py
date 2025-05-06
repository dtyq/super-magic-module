import os
from typing import Any, Dict, List, Optional

from app.filebase.parsers.base_parser import BaseParser
from app.filebase.vector.file_chunk import FileChunk
from app.logger import get_logger

logger = get_logger(__name__)


class TextParser(BaseParser):
    """
    文本文件解析器，处理.txt文件
    """

    # 支持的文件扩展名
    SUPPORTED_EXTENSIONS: List[str] = ['.txt', '.text']

    def can_handle(self, file_path: str) -> bool:
        """
        检查是否可以处理该文件
        
        Args:
            file_path: 文件路径
            
        Returns:
            bool: 是否可以处理
        """
        ext = os.path.splitext(file_path)[1].lower()
        return ext in self.SUPPORTED_EXTENSIONS

    def parse(self, file_path: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        解析文本文件
        
        Args:
            file_path: 文件路径
            metadata: 附加元数据
            
        Returns:
            Dict[str, Any]: 解析结果
        """
        if metadata is None:
            metadata = {}

        # 添加解析器信息到元数据
        metadata['parser'] = 'text'
        metadata['file_type'] = 'text'

        # 读取文本文件内容
        try:
            with open(file_path, 'r', encoding='utf-8', errors='replace') as file:
                content = file.read()

            # 获取文件大小并添加到元数据
            file_size = os.path.getsize(file_path)
            metadata['file_size'] = file_size

            # 获取行数并添加到元数据
            line_count = content.count('\n') + 1
            metadata['line_count'] = line_count

            # 将文本分割成块并创建 FileChunk 对象
            chunks = self._split_text_into_chunks(content)
            file_chunks = []

            for i, chunk_text in enumerate(chunks):
                # 为每个分块创建 FileChunk 对象
                file_chunk = FileChunk(
                    text=chunk_text,
                    file_metadata=metadata,
                    chunk_index=i,
                    total_chunks=len(chunks)
                )
                file_chunks.append(file_chunk)

            return {
                'metadata': metadata,
                'content': content,
                'chunks': file_chunks
            }
        except Exception as e:
            logger.error(f"Error parsing text file {file_path}: {e!s}")

            # 返回空内容
            return {
                'metadata': metadata,
                'content': "",
                'chunks': []
            }

    def _split_text_into_chunks(self, text: str, chunk_size: int = 2000, 
                                chunk_overlap: int = 200) -> List[str]:
        """
        将文本分割成多个块
        
        Args:
            text: 要分割的文本
            chunk_size: 每个块的最大字符数
            chunk_overlap: 相邻块之间的重叠字符数
            
        Returns:
            List[str]: 分割后的文本块列表
        """
        if not text:
            return []

        # 简单按字符数分块，实际应用中可能需要更复杂的策略，例如按段落或语句分割
        chunks = []
        start = 0
        text_len = len(text)

        while start < text_len:
            end = min(start + chunk_size, text_len)

            # 如果不是最后一块，并且不是在句子或段落边界，尝试找到更好的分割点
            if end < text_len:
                # 尝试在句号、问号、感叹号后分割
                for sep in ['\n\n', '\n', '. ', '? ', '! ', ';', ':', ',']:
                    sep_pos = text.rfind(sep, start + chunk_size - chunk_overlap, end)
                    if sep_pos != -1:
                        end = sep_pos + len(sep)
                        break

            chunks.append(text[start:end])
            start = end - chunk_overlap if end < text_len else text_len

        return chunks 
