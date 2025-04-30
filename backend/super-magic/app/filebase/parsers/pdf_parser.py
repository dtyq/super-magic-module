import os
from typing import Any, Dict, List, Optional

import PyPDF2

from app.filebase.parsers.base_parser import BaseParser
from app.filebase.vector.file_chunk import FileChunk
from app.logger import get_logger

logger = get_logger(__name__)


class PDFParser(BaseParser):
    """
    PDF文件解析器，处理.pdf文件
    """

    # 支持的文件扩展名
    SUPPORTED_EXTENSIONS: List[str] = ['.pdf']

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
        解析PDF文件
        
        Args:
            file_path: 文件路径
            metadata: 附加元数据
            
        Returns:
            Dict[str, Any]: 解析结果，包括元数据、内容和FileChunk对象列表
        """
        if metadata is None:
            metadata = {}

        # 添加解析器信息到元数据
        metadata['parser'] = 'pdf'
        metadata['file_type'] = 'pdf'

        # 读取PDF文件
        try:
            with open(file_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)

                # 获取PDF信息
                num_pages = len(reader.pages)
                metadata['page_count'] = num_pages

                # 如果有文档信息，添加到元数据
                if reader.metadata:
                    doc_info = reader.metadata
                    if doc_info.title:
                        metadata['title'] = doc_info.title
                    if doc_info.author:
                        metadata['author'] = doc_info.author
                    if doc_info.subject:
                        metadata['subject'] = doc_info.subject
                    if doc_info.creator:
                        metadata['creator'] = doc_info.creator

                # 提取所有页面内容
                all_content = []
                file_chunks = []

                for page_num in range(num_pages):
                    page = reader.pages[page_num]

                    # 读取页面文本
                    try:
                        text = page.extract_text()
                        if text:
                            page_content = f"--- 第 {page_num + 1} 页 ---\n{text}\n"
                        else:
                            page_content = f"--- 第 {page_num + 1} 页 ---\n[无文本内容]\n"
                    except Exception as e:
                        logger.error(f"Error extracting text from page {page_num + 1}: {e!s}")
                        page_content = f"--- 第 {page_num + 1} 页 ---\n[提取文本失败]\n"

                    all_content.append(page_content)

                    # 为每个页面创建 FileChunk 对象
                    chunk_metadata = {
                        'page_num': page_num + 1,
                        'is_page_boundary': True
                    }

                    file_chunk = FileChunk(
                        text=page_content,
                        file_metadata=metadata,
                        chunk_metadata=chunk_metadata,
                        chunk_index=page_num,
                        total_chunks=num_pages
                    )
                    file_chunks.append(file_chunk)

                # 合并所有页面内容
                content = "\n".join(all_content)

                return {
                    'metadata': metadata,
                    'content': content,
                    'chunks': file_chunks
                }

        except Exception as e:
            logger.error(f"Error parsing PDF file {file_path}: {e!s}")

            # 返回空内容
            return {
                'metadata': metadata,
                'content': "",
                'chunks': []
            } 
