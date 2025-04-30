from typing import Any, Dict, List, Optional

from app.filebase.filebase_config import FilebaseConfig
from app.filebase.index_manager import IndexManager
from app.filebase.parsers.parser_factory import ParserFactory
from app.filebase.vector.vector_database_client import VectorDatabaseClient
from app.filebase.vector.vector_store import VectorStore
from app.logger import get_logger

logger = get_logger(__name__)


class Filebase:
    sandbox_id: str

    def __init__(self, config: FilebaseConfig):
        self.config = config
        # 初始化向量数据库客户端
        vector_database_client = VectorDatabaseClient()
        # 传递向量数据库客户端给VectorStore
        self.vector_store = VectorStore(vector_database_client)
        self.index_manager = IndexManager(self.vector_store, config)
        self.sandbox_id = None

    async def initialize(self, sandbox_id: str):
        """
        初始化Filebase，设置沙盒ID并确保沙盒集合存在
        
        Args:
            sandbox_id: 沙盒ID
        """
        self.sandbox_id = sandbox_id
        if not self.sandbox_id:
            raise ValueError("sandbox_id is required")

        # 设置IndexManager的sandbox_id
        self.index_manager.sandbox_id = self.sandbox_id

        # 检查 sandbox collection 是否存在，只有不存在时才创建
        if not await self.index_manager.is_sandbox_collection_exists(self.sandbox_id):
            logger.info(f"沙盒集合不存在，创建新集合: {self.sandbox_id}")
            await self.index_manager.create_sandbox_collection(self.sandbox_id)
        else:
            logger.info(f"沙盒集合已存在: {self.sandbox_id}")

    async def index_file(self, file_path: str, metadata: Dict[str, Any]) -> Optional[str]:
        """
        索引文件
        
        Args:
            file_path: 文件路径
            metadata: 文件元数据
            
        Returns:
            Optional[str]: 文件ID，如果索引失败则返回None
        """
        if not self.sandbox_id:
            raise ValueError("必须先调用initialize方法设置sandbox_id")

        # 调用IndexManager的index_file方法
        result = await self.index_manager.index_file(file_path, metadata)
        return result

    async def delete_file(self, file_path: str):
        """
        删除文件索引
        
        Args:
            file_path: 文件路径
        """
        if not self.sandbox_id:
            raise ValueError("必须先调用initialize方法设置sandbox_id")

        # 调用IndexManager的delete_file方法，并传递sandbox_id
        await self.index_manager.delete_file(file_path, sandbox_id=self.sandbox_id)

    async def search(self, queries: List[str], limit: int = 10, filter_condition: Optional[Dict] = None) -> List[List[Dict]]:
        """
        批量查询与多个查询文本相似的向量
        
        Args:
            queries: 查询文本列表
            limit: 每个查询返回的结果数量限制
            filter_condition: 过滤条件，需要符合向量数据库的过滤条件格式
            
        Returns:
            List[List[Dict]]: 查询结果列表的列表，每个子列表对应一个查询的结果
        """
        if not self.sandbox_id:
            raise ValueError("必须先调用initialize方法设置sandbox_id")

        collection_name = self.index_manager.build_collection_name(self.sandbox_id)
        results = []

        # 检查集合是否存在
        if not await self.vector_store.collection_exists(collection_name):
            logger.warning(f"集合 {collection_name} 不存在")
            return [[] for _ in range(len(queries))]  # 为每个查询返回空结果

        # 依次处理每个查询
        for query in queries:
            # 首先尝试基于文件名进行匹配
            file_name_matches = await self._search_by_file_name(collection_name, query, limit)

            # 如果找到文件名匹配的结果，直接返回
            if file_name_matches and len(file_name_matches) > 0:
                logger.info(f"找到 {len(file_name_matches)} 个文件名匹配结果，查询: {query}")
                results.append(file_name_matches)
                continue

            # 如果文件名匹配没有结果，再进行向量相似性搜索
            query_result = await self.vector_store.search(
                collection_name=collection_name,
                query_text=query,
                limit=limit,
                filter_condition=filter_condition
            )
            results.append(query_result)

        logger.info(f"完成 {len(queries)} 个查询，每个查询限制 {limit} 条结果")
        return results

    async def _search_by_file_name(self, collection_name: str, query: str, limit: int = 10) -> List[Dict]:
        """
        基于文件名搜索文档
        
        Args:
            collection_name: 集合名称
            query: 查询文本，将作为文件名模糊匹配的关键字
            limit: 返回结果数量限制
            
        Returns:
            List[Dict]: 搜索结果列表
        """
        # 创建文件名匹配过滤条件
        # 使用空的查询向量，只依赖过滤条件
        try:
            # 如果查询可能是完整文件名，创建精确匹配过滤条件
            exact_match_filter = {
                "must": [
                    {
                        "key": "metadata.file_name",
                        "match": {
                            "value": query
                        }
                    }
                ]
            }

            # 尝试精确匹配
            exact_matches = await self.vector_store.search(
                collection_name=collection_name,
                query_text="",  # 空查询文本，仅使用过滤条件
                limit=limit,
                filter_condition=exact_match_filter
            )

            if exact_matches and len(exact_matches) > 0:
                logger.info(f"找到精确文件名匹配: {query}, 结果数: {len(exact_matches)}")
                # 给精确匹配的结果设置较高的得分
                for match in exact_matches:
                    match["score"] = 1.0  # 设置最高得分
                return exact_matches

            # 如果没有精确匹配，尝试部分匹配（文件名包含查询词）
            # 注意：这需要向量数据库支持模糊文本匹配
            # 目前只能用普通向量搜索，并在结果中后处理筛选
            content_results = await self.vector_store.search(
                collection_name=collection_name,
                query_text=query,  # 使用查询文本
                limit=limit * 3,  # 获取更多结果进行后处理
                filter_condition=None  # 不使用额外过滤条件
            )

            # 后处理：筛选文件名包含查询词的结果
            file_name_matches = []
            query_lower = query.lower()

            for result in content_results:
                if "payload" in result and "metadata" in result["payload"]:
                    metadata = result["payload"]["metadata"]
                    file_name = metadata.get("file_name", "").lower()

                    # 检查文件名是否包含查询词
                    if query_lower in file_name:
                        # 计算匹配分数：文件名越接近查询词，分数越高
                        similarity = len(query_lower) / max(len(file_name), 1)
                        # 调整得分：文件名匹配的得分至少为0.8
                        result["score"] = max(0.8, similarity, result.get("score", 0))
                        file_name_matches.append(result)

            # 按照得分排序并限制结果数量
            file_name_matches.sort(key=lambda x: x.get("score", 0), reverse=True)
            return file_name_matches[:limit]

        except Exception as e:
            logger.error(f"文件名搜索失败: {e!s}", exc_info=True)
            return []

    @classmethod
    def get_supported_file_types(cls) -> List[str]:
        """
        获取支持的文件类型列表
        
        Returns:
            List[str]: 支持的文件扩展名列表
        """
        return ParserFactory.get_supported_extensions()

    @classmethod
    def is_file_type_supported(cls, file_path: str) -> bool:
        """
        检查文件类型是否被支持
        
        Args:
            file_path: 文件路径
            
        Returns:
            bool: 如果文件类型被支持返回True，否则返回False
        """
        return ParserFactory.is_supported_file_type(file_path)

