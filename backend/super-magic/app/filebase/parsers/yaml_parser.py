import os
from typing import Any, Dict, List, Optional

import yaml

from app.filebase.parsers.base_parser import BaseParser
from app.filebase.vector.file_chunk import FileChunk
from app.logger import get_logger

logger = get_logger(__name__)


class YAMLParser(BaseParser):
    """
    YAML文件解析器，处理.yml/.yaml文件
    """

    # 支持的文件扩展名
    SUPPORTED_EXTENSIONS: List[str] = ['.yml', '.yaml']

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
        解析YAML文件
        
        Args:
            file_path: 文件路径
            metadata: 附加元数据
            
        Returns:
            Dict[str, Any]: 解析结果，包括元数据、内容和FileChunk对象列表
        """
        if metadata is None:
            metadata = {}

        # 添加解析器信息到元数据
        metadata['parser'] = 'yaml'
        metadata['file_type'] = 'yaml'

        try:
            # 读取YAML文件内容
            with open(file_path, 'r', encoding='utf-8', errors='replace') as file:
                content = file.read()

            # 尝试解析YAML文件
            yaml_data = yaml.safe_load(content)

            # 创建单个 FileChunk 对象
            file_chunk = FileChunk(
                text=content,
                file_metadata=metadata,
                chunk_metadata={
                    'is_complete_file': True
                },
                chunk_index=0,
                total_chunks=1
            )

            return {
                'metadata': metadata,
                'content': content,
                'chunks': [file_chunk]
            }
        except Exception as e:
            logger.error(f"解析YAML文件 {file_path} 时出错: {e!s}")
            return {
                'metadata': metadata,
                'content': f"YAML content from {file_path} will be parsed here",
                'chunks': []
            } 
