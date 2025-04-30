import uuid
from typing import Dict, List, Optional, Union

from qdrant_client import QdrantClient

from app.filebase.filebase_config import FilebaseConfig
from app.filebase.vector.file_chunk import FileChunk
from app.llm.factory import LLMFactory
from app.logger import get_logger
from app.utils.async_utils import gather_with_concurrency
from app.utils.retry_utils import retry_with_exponential_backoff

logger = get_logger(__name__)


class VectorStore:
    """
    向量存储外观类 (Facade)，提供向量存储的所有操作接口
    包括向量化、存储、检索等功能
    """

    def __init__(self, vector_database_client: QdrantClient):
        self.vector_database_client = vector_database_client
        self.embedding_model_id = FilebaseConfig.embedding_model_id
        self.embedding_client = LLMFactory.get_embedding_client(self.embedding_model_id)
        self.embedding_dimension = LLMFactory.get_embedding_dimension(self.embedding_model_id)
        logger.info(f"向量存储初始化，使用嵌入模型: {self.embedding_model_id}，向量维度: {self.embedding_dimension}")

    async def create_collection(self, collection_name: str, vector_size: Optional[int] = None) -> bool:
        """
        创建集合

        Args:
            collection_name: 集合名称
            vector_size: 向量维度大小，默认使用嵌入模型的维度

        Returns:
            bool: 操作是否成功
        """
        # 如果未指定向量维度，使用模型的默认维度
        if vector_size is None:
            vector_size = self.embedding_dimension

        logger.info(f"Creating collection {collection_name} with vector size {vector_size}")
        return await self.vector_database_client.create_collection(
            collection_name=collection_name,
            vector_size=vector_size
        )

    async def collection_exists(self, collection_name: str) -> bool:
        """
        检查集合是否存在

        Args:
            collection_name: 集合名称

        Returns:
            bool: 集合是否存在
        """
        return await self.vector_database_client.collection_exists(collection_name)

    async def delete_collection(self, collection_name: str) -> bool:
        """
        删除集合

        Args:
            collection_name: 集合名称

        Returns:
            bool: 操作是否成功
        """
        logger.info(f"Deleting collection {collection_name}")
        return await self.vector_database_client.delete_collection(collection_name)

    async def get_embedding(self, text: str) -> List[float]:
        """
        获取文本的嵌入向量

        Args:
            text: 需要向量化的文本

        Returns:
            List[float]: 嵌入向量，如果文本为空则返回空列表，表示该文本不应被索引
        """
        try:
            if not text or text.strip() == "":
                # 如果文本为空，返回空列表，表示该文本不应被索引
                logger.warning("文本为空，返回空向量以跳过索引")
                return []

            # 记录文本的开头部分，用于调试
            debug_text = text[:100] + "..." if len(text) > 100 else text
            logger.debug(f"正在为文本生成嵌入向量: {debug_text}")

            # 获取嵌入客户端
            if not self.embedding_client:
                logger.error("嵌入客户端未初始化")
                return []

            # 获取模型配置
            try:
                model_config = LLMFactory.get_model_config(self.embedding_model_id)
                # 使用模型配置中的name而非model_id
                model_name = model_config.name
                logger.debug(f"使用嵌入模型: {model_name} (ID: {self.embedding_model_id})")
            except Exception as e:
                logger.error(f"获取模型配置失败: {e!s}, 使用模型ID作为名称")
                model_name = self.embedding_model_id

            # 确保文本是字符串
            if not isinstance(text, str):
                text = str(text)

            # 定义实际的嵌入函数，将用于重试
            async def _get_embedding_with_api():
                response = await self.embedding_client.embeddings.create(
                    model=model_name,
                    input=text
                )
                
                # 确保响应中有数据
                if response and hasattr(response, 'data') and len(response.data) > 0:
                    embedding = response.data[0].embedding
                    logger.debug(f"嵌入向量生成成功，长度: {len(embedding)}")
                    return embedding
                else:
                    logger.error(f"嵌入API返回空响应: {response}")
                    return []

            # 使用重试机制调用 API
            try:
                return await retry_with_exponential_backoff(
                    _get_embedding_with_api,
                    max_retries=FilebaseConfig.max_embedding_retry_attempts,
                    initial_delay=1.0
                )
            except Exception as api_error:
                # 打印异常堆栈信息
                import traceback
                traceback.print_exc()
                logger.error(f"嵌入API调用错误，所有重试都失败: {api_error!s}", exc_info=True)
                return []
                
        except Exception as e:
            # 打印异常堆栈信息
            import traceback
            traceback.print_exc()
            logger.error(f"获取嵌入向量失败: {e!s}", exc_info=True)
            # 发生错误时返回空列表，避免索引错误数据
            return []

    async def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        批量获取文本的嵌入向量

        Args:
            texts: 需要向量化的文本列表

        Returns:
            List[List[float]]: 嵌入向量列表，空文本对应的位置为空列表，表示该文本不应被索引
        """
        try:
            # 过滤掉空文本
            valid_texts = []
            text_map = []

            # 记录每个文本的原始索引和是否为空
            for i, text in enumerate(texts):
                if text and text.strip() != "":
                    valid_texts.append(text)
                    text_map.append((i, True))  # (原始索引, 有效)
                else:
                    text_map.append((i, False))  # (原始索引, 无效)

            if not valid_texts:
                logger.warning("No valid texts provided for embeddings, returning empty list to skip indexing")
                return [[]] * len(texts)  # 返回与输入文本数量相同的空向量列表

            # 获取模型配置
            try:
                model_config = LLMFactory.get_model_config(self.embedding_model_id)
                # 使用模型配置中的name而非model_id
                model_name = model_config.name
                logger.debug(f"批量嵌入使用模型: {model_name} (ID: {self.embedding_model_id})")
            except Exception as e:
                logger.error(f"获取模型配置失败: {e!s}, 使用模型ID作为名称")
                model_name = self.embedding_model_id

            # 定义批量嵌入的函数，用于重试
            async def _get_embeddings_with_api():
                response = await self.embedding_client.embeddings.create(
                    model=model_name,
                    input=valid_texts
                )
                return response
                
            # 使用重试机制调用 API
            try:
                # 只对有效文本调用 API
                response = await retry_with_exponential_backoff(
                    _get_embeddings_with_api,
                    max_retries=FilebaseConfig.max_embedding_retry_attempts,
                    initial_delay=5.0
                )

                # 将API结果与空文本的空列表按原始顺序合并
                result_vectors = [[] for _ in range(len(texts))]  # 初始化与输入文本数量相同的结果列表

                valid_idx = 0
                for i, is_valid in text_map:
                    if is_valid:
                        # 确保索引有效
                        if valid_idx < len(response.data):
                            result_vectors[i] = response.data[valid_idx].embedding
                            valid_idx += 1
                        else:
                            logger.error(f"Response data index out of range: {valid_idx} >= {len(response.data)}")
                            result_vectors[i] = []
                    # 对于无效文本，保持空列表

                return result_vectors
            except Exception as api_error:
                logger.error(f"批量嵌入API调用错误，所有重试都失败: {api_error!s}", exc_info=True)
                # 发生API错误时，返回所有空向量
                return [[]] * len(texts)

        except Exception as e:
            logger.error(f"Failed to get embeddings batch: {e!s}", exc_info=True)
            # 返回空列表，避免索引错误数据
            return [[]] * len(texts)

    async def add_chunks(self, collection_name: str, chunks: List[FileChunk]) -> List[str]:
        """
        添加 FileChunk 对象列表到向量存储

        Args:
            collection_name: 集合名称
            chunks: FileChunk 对象列表

        Returns:
            List[str]: 插入文档的 ID 列表
        """
        # 检查输入是否为空
        if not chunks:
            logger.warning("未提供文件分块用于添加到向量存储")
            return []

        # 检查集合是否存在，只有在不存在时才创建
        if not await self.collection_exists(collection_name):
            logger.info(f"集合 {collection_name} 不存在，正在创建...")
            await self.create_collection(collection_name)
        else:
            logger.info(f"集合 {collection_name} 已存在，跳过创建")

        try:
            # 准备并行向量化
            chunk_data_list = []
            skipped_count = 0

            # 第一阶段：准备所有有效的chunk数据
            for chunk in chunks:
                # 生成唯一ID
                text_id = str(uuid.uuid4())

                # 获取文本和元数据
                text = chunk.get_text()
                metadata = chunk.get_metadata()

                # 检查文本是否有效
                if not text or text.strip() == "":
                    logger.info(f"跳过ID为 {text_id} 的点，因为文本为空")
                    skipped_count += 1
                    continue

                # 记录元数据中的文件路径，用于调试
                file_path = metadata.get('file_path', 'unknown')
                logger.debug(f"Chunk 元数据中的 file_path: {file_path}")

                # 收集有效的chunk数据
                chunk_data_list.append({
                    "id": text_id,
                    "text": text,
                    "metadata": metadata
                })

            if not chunk_data_list:
                logger.warning(f"没有有效的文本可向量化，跳过了 {skipped_count} 个无效文本")
                return []

            # 第二阶段：并行获取嵌入向量
            logger.info(f"开始并行向量化处理 {len(chunk_data_list)} 个文本块，最大并行数: {FilebaseConfig.max_vectorization_concurrency}")

            # 定义单个向量化任务，带有重试机制
            async def vectorize_chunk(chunk_data):
                try:
                    # 使用支持重试的 get_embedding 方法获取嵌入向量
                    embedding = await self.get_embedding(chunk_data["text"])
                    return {
                        "id": chunk_data["id"],
                        "embedding": embedding,
                        "text": chunk_data["text"],
                        "metadata": chunk_data["metadata"],
                        "is_valid": embedding and len(embedding) > 0
                    }
                except Exception as e:
                    logger.error(f"向量化ID为 {chunk_data['id']} 的文本时出错: {e!s}")
                    return {
                        "id": chunk_data["id"],
                        "embedding": [],
                        "text": chunk_data["text"],
                        "metadata": chunk_data["metadata"],
                        "is_valid": False,
                        "error": str(e)
                    }

            # 使用有限并发并行处理向量化
            vectorization_tasks = [vectorize_chunk(chunk_data) for chunk_data in chunk_data_list]
            vectorized_results = await gather_with_concurrency(
                FilebaseConfig.max_vectorization_concurrency,
                *vectorization_tasks
            )

            # 第三阶段：准备有效的向量数据点
            points = []
            valid_ids = []
            invalid_count = 0

            for result in vectorized_results:
                if result["is_valid"]:
                    # 构建点数据
                    point = {
                        "id": result["id"],
                        "vector": result["embedding"],
                        "payload": {
                            "text": result["text"],
                            "metadata": result["metadata"]
                        }
                    }
                    points.append(point)
                    valid_ids.append(result["id"])
                else:
                    # 记录无效向量
                    if "error" in result:
                        logger.warning(f"跳过ID为 {result['id']} 的点，向量化失败: {result.get('error', '未知错误')}")
                    else:
                        logger.warning(f"跳过ID为 {result['id']} 的点，因为嵌入向量为空或无效")
                    invalid_count += 1

            # 如果没有有效的点，则直接返回
            if not points:
                logger.warning(f"向量化后没有有效的点可插入，跳过了 {skipped_count} 个无效文本，{invalid_count} 个向量化失败的文本")
                return []

            # 插入向量数据库
            logger.info(f"尝试向集合 {collection_name} 中插入 {len(points)} 个点，"
                        f"跳过了 {skipped_count} 个无效文本，{invalid_count} 个向量化失败的文本")
            success = await self.vector_database_client.upsert_points(collection_name, points)
            if success:
                logger.info(f"成功向集合 {collection_name} 添加 {len(points)} 个分块")
                return valid_ids
            else:
                logger.error(f"向集合 {collection_name} 添加分块失败")
                return []
        except Exception as e:
            logger.error(f"向向量存储添加分块时出错: {e!s}")
            return []

    async def search(self, collection_name: str, query_text: str, limit: int = 10,
              filter_condition: Optional[Dict] = None) -> List[Dict]:
        """
        根据文本查询向量存储

        Args:
            collection_name: 集合名称
            query_text: 查询文本，如果为空则只使用过滤条件
            limit: 返回结果数量限制
            filter_condition: 过滤条件，需要符合 Qdrant 的过滤条件格式

        Returns:
            List[Dict]: 搜索结果列表
        """
        try:
            # 检查集合是否存在
            if not await self.collection_exists(collection_name):
                logger.warning(f"Collection {collection_name} does not exist")
                return []

            # 检查是否有文本或过滤条件
            has_query_text = query_text is not None and query_text.strip() != ""
            has_filter = filter_condition is not None and len(filter_condition) > 0

            if not has_query_text and not has_filter:
                logger.warning("Empty query text and no filter condition, returning empty results")
                return []

            query_vector = None

            # 基于文本查询的搜索
            if has_query_text:
                # 获取查询文本的向量表示
                query_vector = await self.get_embedding(query_text)

                if not query_vector and not has_filter:
                    logger.warning("Empty query vector and no filter condition, returning empty results")
                    return []

            # 如果没有有效的查询向量但有过滤条件，创建一个零向量
            if (not query_vector or len(query_vector) == 0) and has_filter:
                # 为过滤器搜索创建零向量（不会影响结果排序，但允许搜索执行）
                vector_dim = self.embedding_dimension  # 使用模型的维度
                query_vector = [0.0] * vector_dim
                logger.info(f"Created zero vector with dimension {vector_dim} for filter-only search")

            # 搜索向量数据库
            logger.info(f"Executing search with vector of length {len(query_vector) if query_vector else 0} and filter: {filter_condition is not None}")
            results = await self.vector_database_client.search(
                collection_name=collection_name,
                query_vector=query_vector,
                limit=limit,
                filter_condition=filter_condition
            )

            logger.info(f"Found {len(results)} results for query in collection {collection_name}")
            return results
        except Exception as e:
            # 打印异常堆栈信息
            import traceback
            traceback.print_exc()
            logger.error(f"Search error in collection {collection_name}: {e!s}", exc_info=True)
            return []

    async def get_points(self, collection_name: str, ids: List[Union[str, int]]) -> List[Dict]:
        """
        获取指定 ID 的点

        Args:
            collection_name: 集合名称
            ids: 点 ID 列表

        Returns:
            List[Dict]: 点列表
        """
        return await self.vector_database_client.get_points(collection_name, ids)

    async def delete_points(self, collection_name: str, ids: List[Union[str, int]]) -> bool:
        """
        删除指定 ID 的点

        Args:
            collection_name: 集合名称
            ids: 点 ID 列表

        Returns:
            bool: 操作是否成功
        """
        logger.info(f"Deleting {len(ids)} points from collection {collection_name}")
        return await self.vector_database_client.delete_points(collection_name, ids)

    async def get_metadata(self, collection_name: str, file_id: str) -> Optional[Dict]:
        """
        获取文件元数据

        Args:
            collection_name: 集合名称
            file_id: 文件 ID

        Returns:
            Optional[Dict]: 文件元数据，如果未找到则返回 None
        """
        try:
            results = await self.get_points(collection_name, [file_id])
            if results and len(results) > 0:
                return results[0]["payload"].get("metadata", {})
            else:
                logger.warning(f"File ID {file_id} not found in collection {collection_name}")
                return None
        except Exception as e:
            logger.error(f"Error getting metadata: {e!s}")
            return None
