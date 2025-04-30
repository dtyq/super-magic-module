import os
from typing import Any, Dict, List, Optional

from app.filebase.parsers.base_parser import BaseParser
from app.filebase.vector.file_chunk import FileChunk
from app.logger import get_logger

logger = get_logger(__name__)


class ImageParser(BaseParser):
    """
    图片文件解析器，处理常见图片格式
    """

    # 支持的文件扩展名
    SUPPORTED_EXTENSIONS: List[str] = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']

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
        解析图片文件
        
        Args:
            file_path: 文件路径
            metadata: 附加元数据
            
        Returns:
            Dict[str, Any]: 解析结果，包括元数据、内容和FileChunk对象列表
        """
        if metadata is None:
            metadata = {}

        # 添加解析器信息到元数据
        metadata['parser'] = 'image'
        metadata['file_type'] = 'image'

        try:
            # 获取图片文件信息
            file_size = os.path.getsize(file_path)
            metadata['file_size'] = file_size

            # 对于图片，我们创建一个特殊的文本描述
            image_description = f"[图片文件: {os.path.basename(file_path)}]\n路径: {file_path}\n大小: {file_size} 字节"

            # 尝试获取更多图片元数据（如尺寸等）
            try:
                from PIL import Image
                img = Image.open(file_path)
                width, height = img.size
                format_name = img.format
                mode = img.mode

                metadata['width'] = width
                metadata['height'] = height
                metadata['format'] = format_name
                metadata['color_mode'] = mode

                image_description += f"\n尺寸: {width}x{height} 像素\n格式: {format_name}\n色彩模式: {mode}"
            except ImportError:
                logger.warning("未安装Pillow库，无法获取图片尺寸信息")
            except Exception as img_error:
                logger.warning(f"获取图片元数据失败: {img_error!s}")

            # 创建 FileChunk
            file_chunk = FileChunk(
                text=image_description,
                file_metadata=metadata,
                chunk_metadata={
                    'is_image': True,
                    'has_text_content': False,
                    'is_complete_file': True
                },
                chunk_index=0,
                total_chunks=1
            )

            return {
                'metadata': metadata,
                'content': image_description,
                'chunks': [file_chunk]
            }
        except Exception as e:
            logger.error(f"解析图片文件 {file_path} 时出错: {e!s}")
            return {
                'metadata': metadata,
                'content': f"图片文件: {file_path} (无法解析)",
                'chunks': []
            } 
