import os
from typing import Any, Dict, List, Optional

from app.filebase.parsers.base_parser import BaseParser
from app.filebase.vector.file_chunk import FileChunk
from app.logger import get_logger

logger = get_logger(__name__)

class CodeParser(BaseParser):
    """
    代码文件解析器，处理各种编程语言文件
    """

    # 支持的文件扩展名
    SUPPORTED_EXTENSIONS: List[str] = [
        '.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.c', '.cpp', '.cs', '.go',
        '.rb', '.php', '.swift', '.kt', '.rs', '.sh', '.bash', '.html', '.css',
        '.scss', '.less'
    ]

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
        解析代码文件
        
        Args:
            file_path: 文件路径
            metadata: 附加元数据
            
        Returns:
            Dict[str, Any]: 解析结果，包括元数据、内容和FileChunk对象列表
        """
        # TODO: 实现代码文件解析逻辑
        if metadata is None:
            metadata = {}

        # 获取文件扩展名，判断编程语言
        ext = os.path.splitext(file_path)[1].lower()
        language = self._get_language_from_extension(ext)

        # 添加解析器信息到元数据
        metadata['parser'] = 'code'
        metadata['file_type'] = 'code'
        metadata['language'] = language

        try:
            # 读取代码文件内容
            with open(file_path, 'r', encoding='utf-8', errors='replace') as file:
                content = file.read()

            # 按行分割代码，便于后续分块
            lines = content.split('\n')

            # 创建 FileChunk 对象
            file_chunks = []

            # 根据代码量决定如何分块
            if len(lines) <= 300:  # 如果代码行数较少，整个文件作为一个块
                file_chunk = FileChunk(
                    text=content,
                    file_metadata=metadata,
                    chunk_metadata={
                        'line_range': f"1-{len(lines)}",
                        'is_complete_file': True
                    },
                    chunk_index=0,
                    total_chunks=1
                )
                file_chunks.append(file_chunk)
            else:  # 如果代码行数较多，按行分块
                lines_per_chunk = 300
                num_chunks = (len(lines) + lines_per_chunk - 1) // lines_per_chunk  # 向上取整

                for i in range(num_chunks):
                    start_line = i * lines_per_chunk
                    end_line = min((i + 1) * lines_per_chunk, len(lines))

                    # 创建当前块的内容
                    chunk_lines = lines[start_line:end_line]
                    chunk_content = '\n'.join(chunk_lines)

                    file_chunk = FileChunk(
                        text=chunk_content,
                        file_metadata=metadata,
                        chunk_metadata={
                            'line_range': f"{start_line+1}-{end_line}",
                            'is_complete_file': False
                        },
                        chunk_index=i,
                        total_chunks=num_chunks
                    )
                    file_chunks.append(file_chunk)

            return {
                'metadata': metadata,
                'content': content,
                'chunks': file_chunks
            }

        except Exception as e:
            logger.error(f"解析代码文件 {file_path} 时出错: {e!s}")
            return {
                'metadata': metadata,
                'content': f"Code content from {file_path} will be parsed here",
                'chunks': []
            }

    def _get_language_from_extension(self, ext: str) -> str:
        """
        根据文件扩展名获取编程语言
        
        Args:
            ext: 文件扩展名
            
        Returns:
            str: 编程语言名称
        """
        language_map = {
            '.py': 'python',
            '.js': 'javascript',
            '.ts': 'typescript',
            '.jsx': 'javascript',
            '.tsx': 'typescript',
            '.java': 'java',
            '.c': 'c',
            '.cpp': 'c++',
            '.cs': 'c#',
            '.go': 'go',
            '.rb': 'ruby',
            '.php': 'php',
            '.swift': 'swift',
            '.kt': 'kotlin',
            '.rs': 'rust',
            '.sh': 'shell',
            '.bash': 'bash',
            '.html': 'html',
            '.css': 'css',
            '.scss': 'scss',
            '.less': 'less'
        }

        return language_map.get(ext, 'unknown') 
