import os
from typing import Any, Dict, List, Optional

from app.filebase.parsers.base_parser import BaseParser
from app.filebase.parsers.docx_parser import DocxParser
from app.filebase.parsers.excel_parser import ExcelParser
from app.filebase.parsers.markdown_parser import MarkdownParser
from app.filebase.parsers.pdf_parser import PDFParser
from app.filebase.parsers.text_parser import TextParser
from app.logger import get_logger

logger = get_logger(__name__)


class ParserFactory:
    """
    解析器工厂类，用于创建和管理文件解析器
    """

    def __init__(self, vector_store=None):
        """
        初始化解析器工厂
        
        Args:
            vector_store: 向量存储实例，用于传递给解析器
        """
        self._parsers: List[BaseParser] = []
        self.vector_store = vector_store

        # 注册所有解析器
        self._register_parsers()

    def _register_parsers(self):
        """
        注册所有可用的解析器
        """
        if self.vector_store is None:
            # 只记录一次警告，避免重复输出
            logger.debug("未提供vector_store，无法初始化解析器")
            self._parsers = []
            return

        self._parsers = [
            TextParser(self.vector_store),
            MarkdownParser(self.vector_store),
            PDFParser(self.vector_store),
            DocxParser(self.vector_store),
            ExcelParser(self.vector_store),
        ]

        # 记录已注册的解析器类型
        logger.info(f"已注册 {len(self._parsers)} 个解析器：{[parser.__class__.__name__ for parser in self._parsers]}")

    @staticmethod
    def should_skip_file(file_path: str) -> bool:
        """
        检查是否应该跳过处理该文件或目录
        
        Args:
            file_path: 文件或目录路径
            
        Returns:
            bool: 如果应该跳过则返回True，否则返回False
        """
        # 检查文件名是否以点开头
        file_name = os.path.basename(file_path)
        if file_name.startswith('.'):
            logger.info(f"跳过以点开头的文件: {file_path}")
            return True

        # 检查是否在以点开头的目录中
        path_parts = file_path.split(os.path.sep)
        for i, part in enumerate(path_parts):
            # 如果是以点开头的目录
            if part.startswith('.') and i < len(path_parts) - 1:
                # 特殊处理 .workspace 目录
                if part == '.workspace':
                    continue

                # 检查下一级是否也是以点开头
                next_part = path_parts[i+1]
                if next_part.startswith('.'):
                    logger.info(f"跳过以点开头的目录中的以点开头的文件: {file_path}")
                    return True

        return False

    def get_parser(self, file_path: str) -> Optional[BaseParser]:
        """
        根据文件路径获取适用的解析器
        
        Args:
            file_path: 文件路径
            
        Returns:
            Optional[BaseParser]: 适用的解析器，如果没有则返回None
        """
        # 如果没有初始化解析器，直接返回None
        if not self._parsers:
            return None

        # 检查文件是否存在
        if not os.path.exists(file_path):
            logger.warning(f"文件不存在：{file_path}")
            return None

        # 遍历所有解析器，查找能处理该文件的解析器
        for parser in self._parsers:
            if parser.can_handle(file_path):
                logger.info(f"找到解析器 {parser.__class__.__name__} 用于文件 {file_path}")
                return parser

        logger.warning(f"没有找到能处理文件 {file_path} 的解析器")
        return None

    def parse_file(self, file_path: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        解析文件
        
        Args:
            file_path: 文件路径
            metadata: 附加元数据
            
        Returns:
            Dict[str, Any]: 解析结果，包含元数据、内容和FileChunk对象列表
        """
        # 检查是否应该跳过该文件
        if self.should_skip_file(file_path):
            logger.info(f"跳过解析以点开头的文件: {file_path}")
            return {
                'metadata': metadata or {},
                'content': f"跳过以点(.)开头的文件: {file_path}",
                'chunks': []  # 返回空的 chunks 列表
            }

        if metadata is None:
            metadata = {}

        # 添加文件相关信息到元数据
        file_metadata = self._get_file_metadata(file_path)
        metadata.update(file_metadata)

        # 获取解析器
        parser = self.get_parser(file_path)

        # 如果找到解析器，使用它解析文件
        if parser:
            try:
                return parser.parse(file_path, metadata)
            except Exception as e:
                logger.error(f"解析文件 {file_path} 时出错: {e!s}")

        # 如果没有找到解析器或解析出错，返回默认结果
        return {
            'metadata': metadata,
            'content': f"无法解析文件 {file_path}，找不到适用的解析器或解析过程出错",
            'chunks': []  # 返回空的 chunks 列表
        }

    def _get_file_metadata(self, file_path: str) -> Dict[str, Any]:
        """
        获取文件的基本元数据
        
        Args:
            file_path: 文件路径
            
        Returns:
            Dict[str, Any]: 文件元数据
        """
        try:
            # 获取文件基本信息
            file_name = os.path.basename(file_path)
            file_extension = os.path.splitext(file_name)[1].lower()
            file_size = os.path.getsize(file_path)
            file_created = os.path.getctime(file_path)
            file_modified = os.path.getmtime(file_path)

            # 处理文件路径，确保一定只保留 .workspace 后的部分
            workspace_path = file_path
            workspace_index = file_path.find('.workspace')
            if workspace_index != -1:
                # 找到 .workspace 后的路径，确保包含 .workspace
                workspace_path = file_path[workspace_index:]
                logger.debug(f"文件路径处理: {file_path} -> {workspace_path}")

            return {
                'file_name': file_name,
                'file_extension': file_extension,
                'file_size': file_size,
                'file_created': file_created,
                'file_modified': file_modified,
                'file_path': workspace_path  # 确保只包含 .workspace 后的路径
            }
        except Exception as e:
            logger.error(f"获取文件 {file_path} 元数据时出错: {e!s}")

            # 即使出错，也尝试处理文件路径
            workspace_path = file_path
            try:
                workspace_index = file_path.find('.workspace')
                if workspace_index != -1:
                    workspace_path = file_path[workspace_index:]
                    logger.debug(f"出错后文件路径处理: {file_path} -> {workspace_path}")
            except Exception as path_error:
                logger.error(f"处理文件路径时出错: {path_error!s}")

            return {
                'file_name': os.path.basename(file_path),
                'file_path': workspace_path  # 确保只包含 .workspace 后的路径
            }

    @classmethod
    def get_supported_extensions(cls) -> List[str]:
        """
        获取所有支持的文件扩展名列表
        
        Returns:
            List[str]: 支持的文件扩展名列表
        """
        # 从所有解析器类中获取支持的扩展名
        all_extensions = []

        # 导入所有解析器类
        from app.filebase.parsers.code_parser import CodeParser
        from app.filebase.parsers.docx_parser import DocxParser
        from app.filebase.parsers.excel_parser import ExcelParser
        from app.filebase.parsers.image_parser import ImageParser
        from app.filebase.parsers.json_parser import JSONParser
        from app.filebase.parsers.markdown_parser import MarkdownParser
        from app.filebase.parsers.pdf_parser import PDFParser
        from app.filebase.parsers.powerpoint_parser import PowerPointParser
        from app.filebase.parsers.text_parser import TextParser
        from app.filebase.parsers.yaml_parser import YAMLParser

        # 收集所有解析器支持的扩展名
        parser_classes = [
            TextParser, MarkdownParser, CodeParser, JSONParser, YAMLParser,
            ImageParser, ExcelParser, PDFParser, PowerPointParser, DocxParser,
        ]

        for parser_class in parser_classes:
            if hasattr(parser_class, 'SUPPORTED_EXTENSIONS'):
                all_extensions.extend(parser_class.SUPPORTED_EXTENSIONS)

        # 去重并排序
        return sorted(list(set(all_extensions)))

    @classmethod
    def is_supported_file_type(cls, file_path: str) -> bool:
        """
        检查文件类型是否被支持
        
        Args:
            file_path: 文件路径
            
        Returns:
            bool: 如果文件类型被支持返回True，否则返回False
        """
        # 检查是否应该跳过该文件
        if cls.should_skip_file(file_path):
            return False

        ext = os.path.splitext(file_path)[1].lower()
        return ext in cls.get_supported_extensions()

    @classmethod
    def get_parser_for_file(cls, file_path: str, vector_store=None) -> Optional[BaseParser]:
        """
        根据文件路径获取适用的解析器（类方法版本）
        
        Args:
            file_path: 文件路径
            vector_store: 向量存储实例
            
        Returns:
            Optional[BaseParser]: 适用的解析器，如果没有则返回None
        """
        # 检查是否应该跳过该文件
        if cls.should_skip_file(file_path):
            return None

        factory = cls(vector_store)
        return factory.get_parser(file_path) 
