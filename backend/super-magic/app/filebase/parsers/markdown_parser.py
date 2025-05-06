import os
import re
from typing import Any, Dict, List, Optional

from app.filebase.parsers.base_parser import BaseParser
from app.filebase.vector.file_chunk import FileChunk
from app.logger import get_logger

logger = get_logger(__name__)


class MarkdownParser(BaseParser):
    """
    Markdown文件解析器，处理.md文件
    """

    # 支持的文件扩展名
    SUPPORTED_EXTENSIONS: List[str] = ['.md', '.markdown']

    # 默认块大小和重叠大小
    DEFAULT_CHUNK_SIZE = 2000
    DEFAULT_CHUNK_OVERLAP = 200

    def __init__(self, vector_store=None, chunk_size=None, chunk_overlap=None):
        """
        初始化Markdown解析器
        
        Args:
            vector_store: 向量存储实例，用于存储解析后的内容
            chunk_size: 每个块的最大字符数，默认为 DEFAULT_CHUNK_SIZE
            chunk_overlap: 相邻块之间的重叠字符数，默认为 DEFAULT_CHUNK_OVERLAP
        """
        super().__init__(vector_store)
        self.chunk_size = chunk_size if chunk_size is not None else self.DEFAULT_CHUNK_SIZE
        self.chunk_overlap = chunk_overlap if chunk_overlap is not None else self.DEFAULT_CHUNK_OVERLAP

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
        解析Markdown文件
        
        Args:
            file_path: 文件路径
            metadata: 附加元数据
            
        Returns:
            Dict[str, Any]: 解析结果，包括元数据、内容和FileChunk对象列表
        """
        if metadata is None:
            metadata = {}

        # 添加解析器信息到元数据
        metadata['parser'] = 'markdown'
        metadata['file_type'] = 'markdown'

        # 获取分块参数，优先使用元数据中的参数，如果没有则使用实例变量
        chunk_size = metadata.get('chunk_size', self.chunk_size)
        chunk_overlap = metadata.get('chunk_overlap', self.chunk_overlap)

        # 读取Markdown文件内容
        try:
            with open(file_path, 'r', encoding='utf-8', errors='replace') as file:
                content = file.read()

            # 记录文件内容长度    
            logger.info(f"成功读取Markdown文件 {file_path}，内容长度: {len(content)} 字符")

            # 获取文件大小并添加到元数据
            file_size = os.path.getsize(file_path)
            metadata['file_size'] = file_size

            # 提取标题
            title = self._extract_title(content)
            if title:
                metadata['title'] = title

            # 提取头部元数据 (YAML front matter)
            front_matter = self._extract_front_matter(content)
            if front_matter:
                metadata.update(front_matter)

            # 分块处理
            initial_chunks = self._split_markdown(content)

            # 合并内容较少的分块，尽量接近设置的块大小上限
            optimized_chunks = self._optimize_chunk_size(initial_chunks, chunk_size)

            # 添加分块信息到元数据
            metadata['chunk_count'] = len(optimized_chunks)
            metadata['chunk_size'] = chunk_size
            metadata['chunk_overlap'] = chunk_overlap

            # 创建FileChunk对象列表
            file_chunks = []
            for i, chunk_text in enumerate(optimized_chunks):
                # 提取分块的标题和内容信息
                chunk_title = self._extract_chunk_title(chunk_text)
                chunk_metadata = {
                    'chunk_title': chunk_title if chunk_title else f"Section {i+1}",
                    'headings': self._extract_headings(chunk_text),
                    'word_count': len(chunk_text.split()),
                    'char_count': len(chunk_text)
                }

                # 创建FileChunk对象
                file_chunk = FileChunk(
                    text=chunk_text,
                    file_metadata=metadata,
                    chunk_metadata=chunk_metadata,
                    chunk_index=i,
                    total_chunks=len(optimized_chunks)
                )
                file_chunks.append(file_chunk)

            return {
                'metadata': metadata,
                'content': content,
                'chunks': file_chunks
            }
        except Exception as e:
            logger.error(f"解析Markdown文件 {file_path} 时出错: {e!s}")

            # 返回空内容
            return {
                'metadata': metadata,
                'content': "",
                'chunks': []
            }

    def _optimize_chunk_size(self, chunks: List[str], target_size: int) -> List[str]:
        """
        优化分块大小，合并小块以接近目标大小
        
        Args:
            chunks: 初始分块列表
            target_size: 目标块大小上限
            
        Returns:
            List[str]: 优化后的分块列表
        """
        if not chunks:
            return []

        # 如果只有一个块，直接返回
        if len(chunks) == 1:
            return chunks

        optimized = []
        current_chunk = chunks[0]

        for i in range(1, len(chunks)):
            next_chunk = chunks[i]
            combined_size = len(current_chunk) + len(next_chunk)

            # 判断是否可以合并
            if combined_size <= target_size:
                # 合并块
                current_chunk += "\n\n" + next_chunk
            else:
                # 如果当前块不足目标大小的50%，并且下一个块较小，可以尝试部分合并
                current_size = len(current_chunk)
                next_size = len(next_chunk)

                if current_size < target_size * 0.5 and next_size < target_size * 0.7:
                    # 提取下一个块的前半部分
                    split_point = self._find_best_split_point(next_chunk, target_size - current_size)
                    if split_point > 0:
                        current_chunk += "\n\n" + next_chunk[:split_point]
                        # 保存当前块
                        optimized.append(current_chunk)
                        # 余下部分作为新的当前块
                        current_chunk = next_chunk[split_point:]
                    else:
                        # 无法找到合适的分割点，保存当前块并设置下一个块为当前块
                        optimized.append(current_chunk)
                        current_chunk = next_chunk
                else:
                    # 块太大无法合并，保存当前块并设置下一个块为当前块
                    optimized.append(current_chunk)
                    current_chunk = next_chunk

        # 添加最后的块
        if current_chunk:
            optimized.append(current_chunk)

        # 再次尝试合并非常小的块
        if len(optimized) > 1:
            return self._merge_small_chunks(optimized, target_size)

        return optimized

    def _merge_small_chunks(self, chunks: List[str], target_size: int) -> List[str]:
        """
        合并非常小的块
        
        Args:
            chunks: 分块列表
            target_size: 目标块大小上限
            
        Returns:
            List[str]: 合并后的分块列表
        """
        # 如果块数量太少，不进行处理
        if len(chunks) <= 2:
            return chunks

        result = []
        i = 0

        while i < len(chunks):
            current = chunks[i]

            # 如果当前块足够大或者已经是最后一个块
            if len(current) >= target_size * 0.6 or i == len(chunks) - 1:
                result.append(current)
                i += 1
                continue

            # 查找后续可以合并的小块
            combined = current
            j = i + 1

            while j < len(chunks) and len(combined) + len(chunks[j]) <= target_size:
                combined += "\n\n" + chunks[j]
                j += 1

            result.append(combined)
            i = j

        return result

    def _find_best_split_point(self, text: str, max_length: int) -> int:
        """
        找到最佳分割点，尽量在段落或句子边界
        
        Args:
            text: 要分割的文本
            max_length: 最大长度限制
            
        Returns:
            int: 分割点的位置
        """
        if len(text) <= max_length:
            return len(text)

        # 尝试在段落处分割
        last_para = text[:max_length].rfind("\n\n")
        if last_para > max_length * 0.5:
            return last_para + 2  # +2 for the two newlines

        # 尝试在句子处分割
        for sep in ['. ', '。', '! ', '！', '? ', '？', '；', '; ']:
            last_sent = text[:max_length].rfind(sep)
            if last_sent > max_length * 0.5:
                return last_sent + len(sep)

        # 如果没有找到合适的分割点，在单词边界分割
        if ' ' in text:
            last_space = text[:max_length].rfind(' ')
            if last_space > max_length * 0.7:
                return last_space + 1

        # 无法找到理想的分割点，直接在最大长度处分割
        return max_length

    def _extract_title(self, content: str) -> Optional[str]:
        """
        从Markdown内容中提取标题
        
        Args:
            content: Markdown内容
            
        Returns:
            Optional[str]: 标题，如果找不到则返回None
        """
        # 查找第一个一级标题
        title_match = re.search(r'^# (.+)$', content, re.MULTILINE)
        if title_match:
            return title_match.group(1).strip()
        return None

    def _extract_front_matter(self, content: str) -> Dict[str, Any]:
        """
        提取Markdown头部的YAML front matter
        
        Args:
            content: Markdown内容
            
        Returns:
            Dict[str, Any]: 提取的元数据
        """
        # 简化实现，实际应该使用YAML解析器
        front_matter = {}
        front_matter_match = re.search(r'^---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)
        if front_matter_match:
            front_matter_text = front_matter_match.group(1)
            for line in front_matter_text.split('\n'):
                if ':' in line:
                    key, value = line.split(':', 1)
                    front_matter[key.strip()] = value.strip()
        return front_matter

    def _split_markdown(self, content: str) -> List[str]:
        """
        将Markdown内容分割成多个块
        
        Args:
            content: Markdown内容
            
        Returns:
            List[str]: 分块列表
        """
        # 按二级标题分块，如果没有二级标题，则按一级标题分块
        if '## ' in content:
            # 先处理特殊情况，如果文档以##开头，保留所有内容
            if content.lstrip().startswith('## '):
                return re.split(r'(?=^## )', content, flags=re.MULTILINE)

            # 正常情况，保留第一部分（一级标题到第一个二级标题之间的内容）和后续的二级标题块
            first_part_end = content.find('## ')
            first_part = content[:first_part_end].strip()

            # 按二级标题分块剩余内容
            remaining_parts = re.split(r'(?=^## )', content[first_part_end:], flags=re.MULTILINE)

            if first_part:
                return [first_part] + remaining_parts
            else:
                return remaining_parts
        elif '# ' in content:
            # 按一级标题分块
            return re.split(r'(?=^# )', content, flags=re.MULTILINE)
        else:
            # 无法按标题分块，整体返回
            return [content]

    def _extract_chunk_title(self, chunk: str) -> Optional[str]:
        """
        从chunk中提取标题
        
        Args:
            chunk: Markdown块
            
        Returns:
            Optional[str]: 标题，如果找不到则返回None
        """
        # 查找一级或二级标题
        title_match = re.search(r'^(#|##) (.+)$', chunk, re.MULTILINE)
        if title_match:
            return title_match.group(2).strip()
        return None

    def _extract_headings(self, chunk: str) -> List[str]:
        """
        从chunk中提取所有标题
        
        Args:
            chunk: Markdown块
            
        Returns:
            List[str]: 标题列表
        """
        headings = []
        heading_pattern = re.compile(r'^(#{1,6}) (.+)$', re.MULTILINE)
        for match in heading_pattern.finditer(chunk):
            level = len(match.group(1))
            text = match.group(2).strip()
            headings.append(f"{'#' * level} {text}")
        return headings 
