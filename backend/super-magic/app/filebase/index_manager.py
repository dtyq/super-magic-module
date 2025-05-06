import os
from typing import Any, Dict, List, Optional, Tuple

from app.filebase.filebase_config import FilebaseConfig
from app.filebase.parsers.parser_factory import ParserFactory
from app.filebase.vector.file_chunk import FileChunk
from app.filebase.vector.vector_store import VectorStore
from app.logger import get_logger

logger = get_logger(__name__)

class IndexManager:
    def __init__(self, vector_store: VectorStore, filebase_config: FilebaseConfig):
        self.vector_store = vector_store
        self.filebase_config = filebase_config

    async def create_sandbox_collection(self, sandbox_id: str):
        """
        创建沙盒集合
        
        Args:
            sandbox_id: 沙盒ID
        """
        collection_name = self.build_collection_name(sandbox_id)
        await self.vector_store.create_collection(collection_name)
        logger.info(f"创建沙盒集合: {collection_name}")

    async def is_sandbox_collection_exists(self, sandbox_id: str) -> bool:
        """
        检查沙盒集合是否存在
        
        Args:
            sandbox_id: 沙盒ID
            
        Returns:
            bool: 集合是否存在
        """
        collection_name = self.build_collection_name(sandbox_id)
        return await self.vector_store.collection_exists(collection_name)

    def build_collection_name(self, sandbox_id: str) -> str:
        """
        构建集合名称
        
        Args:
            sandbox_id: 沙盒ID
            
        Returns:
            str: 集合名称
        """
        return f"{self.filebase_config.collection_prefix}-SANDBOX-{sandbox_id}"

    async def index_file(self, file_path: str, metadata: Dict[str, Any]) -> Optional[str]:
        """
        索引文件
        
        Args:
            file_path: 文件路径
            metadata: 附加元数据
            
        Returns:
            Optional[str]: 文件ID，如果失败则返回None
        """
        logger.info(f"索引文件: {file_path}")

        if not os.path.exists(file_path):
            logger.error(f"文件不存在: {file_path}")
            return None

        # 获取文件ID
        file_id = self.get_file_id(file_path)
        file_name = os.path.basename(file_path)
        collection_name = self.build_collection_name(metadata.get('sandbox_id', ''))

        # 确保集合存在
        if not await self.vector_store.collection_exists(collection_name):
            logger.info(f"集合 {collection_name} 不存在，正在创建...")
            await self.vector_store.create_collection(collection_name)

        # 获取适合的解析器
        parser = ParserFactory.get_parser_for_file(file_path, self.vector_store)
        if not parser:
            logger.warning(f"找不到适合的解析器处理文件: {file_path}")
            return None

        try:
            # 解析文件内容
            logger.info(f"使用 {parser.__class__.__name__} 解析文件: {file_path}")
            # 将基本元数据合并到解析器的元数据中
            base_metadata = {
                "file_id": file_id,
                "file_name": file_name,
                "sandbox_id": metadata.get('sandbox_id', '')
            }

            # 处理文件路径，只保留 .workspace 后的部分
            workspace_path = file_path
            workspace_index = file_path.find('.workspace')
            if workspace_index != -1:
                # 找到 .workspace 后的路径，不包含 .workspace
                workspace_path = file_path[workspace_index + len('.workspace'):]
                logger.debug(f"文件路径处理: {file_path} -> {workspace_path}")

            # 设置处理后的路径到基本元数据
            base_metadata["file_path"] = workspace_path

            # 如果元数据中也存在文件路径，确保也使用精简后的路径
            if metadata and 'file_path' in metadata:
                metadata_file_path = metadata['file_path']
                # 检查元数据中的路径是否需要处理
                if '.workspace' in metadata_file_path:
                    workspace_idx = metadata_file_path.find('.workspace')
                    metadata_file_path = metadata_file_path[workspace_idx + len('.workspace'):]
                    # 检查并移除路径开头的斜杠
                    if metadata_file_path.startswith('/'):
                        metadata_file_path = metadata_file_path[1:]
                    if metadata_file_path.startswith('./'):
                        metadata_file_path = metadata_file_path[2:]
                    metadata['file_path'] = metadata_file_path
                    logger.debug(f"元数据文件路径处理: {metadata_file_path} -> {metadata['file_path']}")

            # 合并用户提供的元数据
            if metadata:
                base_metadata.update(metadata)

            # 解析文件获取新的 chunks
            parse_result = parser.parse(file_path, base_metadata)
            new_chunks = parse_result.get('chunks', [])

            # 检查分块是否为空
            if not new_chunks:
                logger.warning(f"文件内容为空或解析器未返回分块: {file_path}")
                return None

            logger.info(f"解析器 {parser.__class__.__name__} 返回了 {len(new_chunks)} 个分块")

            # 检查文件是否已索引
            if await self.is_file_indexed(collection_name, file_id):
                # 获取现有 chunks
                existing_chunks = await self._get_file_chunks(collection_name, file_id)
                logger.info(f"文件 {file_path} 已有 {len(existing_chunks)} 个索引点")

                if existing_chunks:
                    # 比较新旧 chunks，只更新变化的部分
                    to_delete, to_add = self._diff_chunks(existing_chunks, new_chunks)

                    # 删除已变化的 chunks
                    if to_delete:
                        point_ids = [chunk.get("point_id") for chunk in to_delete if "point_id" in chunk]
                        if point_ids:
                            logger.info(f"删除 {len(point_ids)} 个变化的 chunk")
                            await self.vector_store.delete_points(collection_name, point_ids)

                    # 添加新的 chunks
                    if to_add:
                        logger.info(f"添加 {len(to_add)} 个新的或变化的 chunk")
                        result = await self.vector_store.add_chunks(collection_name=collection_name, chunks=to_add)
                        if result and len(result) > 0:
                            logger.info(f"成功索引文件变化部分 {file_path}，共 {len(to_add)} 个块")
                            return file_id
                        else:
                            logger.error(f"索引文件变化部分失败: {file_path}")
                            # 如果更新失败，回退到完全重建索引
                            logger.warning(f"尝试完全重建索引: {file_path}")
                    else:
                        logger.info(f"文件 {file_path} 没有变化，跳过更新")
                        return file_id
                else:
                    # 如果获取现有 chunks 失败，删除所有旧索引
                    logger.info(f"无法获取现有 chunks，删除所有旧索引: {file_path}")
                    await self.delete_file_by_id(collection_name, file_id)

            # 如果没有现有索引或尝试更新失败，创建完整索引
            result = await self.vector_store.add_chunks(
                collection_name=collection_name,
                chunks=new_chunks
            )

            if result and len(result) > 0:
                logger.info(f"成功索引文件 {file_path} 到集合 {collection_name}，共 {len(new_chunks)} 个块")
                return file_id
            else:
                logger.error(f"索引文件失败: {file_path}")
                return None

        except Exception as e:
            logger.error(f"索引文件时发生错误: {file_path}, 错误: {e!s}")
            return None

    async def delete_file(self, file_path: str, sandbox_id: Optional[str] = None):
        """
        删除文件索引
        
        Args:
            file_path: 文件路径
            sandbox_id: 沙盒ID，如果未提供则尝试使用实例的 sandbox_id
        """
        logger.info(f"删除文件索引: {file_path}")
        # 获取文件ID
        file_id = self.get_file_id(file_path)

        # 确定要使用的 sandbox_id
        effective_sandbox_id = sandbox_id
        if not effective_sandbox_id and hasattr(self, 'sandbox_id'):
            effective_sandbox_id = self.sandbox_id

        if not effective_sandbox_id:
            logger.warning("删除文件时未指定沙盒ID，无法删除索引")
            return

        # 构建集合名称并删除文件
        collection_name = self.build_collection_name(effective_sandbox_id)
        await self.delete_file_by_id(collection_name, file_id)

    async def delete_file_by_id(self, collection_name: str, file_id: str):
        """
        根据文件ID删除文件索引
        
        Args:
            collection_name: 集合名称
            file_id: 文件ID
        """
        if not await self.vector_store.collection_exists(collection_name):
            logger.warning(f"集合不存在，无法删除文件: {collection_name}, file_id: {file_id}")
            return

        try:
            # 构造过滤条件
            filter_condition = {
                "must": [
                    {
                        "key": "metadata.file_id",
                        "match": {
                            "value": file_id
                        }
                    }
                ]
            }
            logger.debug(f"使用过滤条件查询要删除的文件: {filter_condition}")

            # 查找包含该文件ID的所有点，不限制数量，确保找出所有点
            results = await self.vector_store.search(
                collection_name=collection_name,
                query_text="",  # 空查询，依赖过滤条件
                filter_condition=filter_condition,
                limit=1000  # 使用较大的限制，确保能找到所有点
            )

            if not results or len(results) == 0:
                logger.info(f"未找到文件 {file_id} 的索引点，无需删除")
                return

            # 获取所有点的ID
            point_ids = [result.get("id") for result in results if "id" in result]

            if point_ids:
                # 删除所有点
                logger.info(f"准备删除文件 {file_id} 的 {len(point_ids)} 个索引点")
                success = await self.vector_store.delete_points(collection_name, point_ids)
                if success:
                    logger.info(f"成功删除文件 {file_id} 的 {len(point_ids)} 个索引点")
                else:
                    logger.error(f"删除文件 {file_id} 的索引点失败")
            else:
                logger.warning(f"未找到文件 {file_id} 的有效索引点ID")

        except Exception as e:
            logger.error(f"删除文件 {file_id} 索引时发生错误: {e!s}", exc_info=True)

    async def is_file_indexed(self, collection_name: str, file_id: str) -> bool:
        """
        检查文件是否已被索引
        
        Args:
            collection_name: 集合名称
            file_id: 文件ID
            
        Returns:
            bool: 文件是否已被索引
        """
        # 检查集合是否存在
        if not await self.vector_store.collection_exists(collection_name):
            logger.warning(f"集合不存在，无法检查文件是否已索引: {collection_name}")
            return False

        try:
            # 查找包含该文件ID的点
            filter_condition = {
                "must": [
                    {
                        "key": "metadata.file_id",
                        "match": {
                            "value": file_id
                        }
                    }
                ]
            }
            logger.debug(f"使用过滤条件查询文件索引状态: {filter_condition}")

            # 使用较大的limit，确保检查逻辑更准确，特别是在文件点被部分删除的情况下
            results = await self.vector_store.search(
                collection_name=collection_name,
                query_text="",  # 空查询，依赖过滤条件
                filter_condition=filter_condition,
                limit=10  # 增加limit，提高检测准确性
            )

            is_indexed = len(results) > 0
            logger.info(f"文件 {file_id} 在集合 {collection_name} 中的索引状态: {is_indexed}，找到 {len(results)} 个点")
            return is_indexed
        except Exception as e:
            logger.error(f"检查文件 {file_id} 是否已索引时发生错误: {e!s}", exc_info=True)
            return False

    def get_file_id(self, file_path: str) -> str:
        """
        获取文件ID
        
        Args:
            file_path: 文件路径
            
        Returns:
            str: 文件ID
        """
        # 处理文件路径，只保留 .workspace 后的部分
        workspace_path = file_path
        workspace_index = file_path.find('.workspace')
        if workspace_index != -1:
            # 找到 .workspace 后的路径，不包含 .workspace
            workspace_path = file_path[workspace_index + len('.workspace'):]
            logger.debug(f"文件ID生成时路径处理: {file_path} -> {workspace_path}")

        # 使用处理后的文件路径生成哈希作为文件ID
        import hashlib
        return hashlib.md5(workspace_path.encode()).hexdigest()

    async def _get_file_chunks(self, collection_name: str, file_id: str) -> List[Dict[str, Any]]:
        """
        获取文件的所有 chunks
        
        Args:
            collection_name: 集合名称
            file_id: 文件ID
            
        Returns:
            List[Dict[str, Any]]: chunk列表，包含内容和点ID
        """
        try:
            # 查找包含该文件ID的所有点
            filter_condition = {
                "must": [
                    {
                        "key": "metadata.file_id",
                        "match": {
                            "value": file_id
                        }
                    }
                ]
            }

            # 获取所有点
            results = await self.vector_store.search(
                collection_name=collection_name,
                query_text="",  # 空查询，依赖过滤条件
                filter_condition=filter_condition,
                limit=1000  # 使用较大的限制，确保获取所有点
            )

            # 转换为包含必要信息的 chunk 列表
            chunks = []
            for result in results:
                if "id" in result and "payload" in result:
                    chunk = {
                        "point_id": result["id"],
                        "text": result["payload"].get("text", ""),
                        "metadata": result["payload"].get("metadata", {})
                    }
                    chunks.append(chunk)

            return chunks
        except Exception as e:
            logger.error(f"获取文件 chunk 时发生错误: {e!s}", exc_info=True)
            return []

    def _diff_chunks(self, existing_chunks: List[Dict[str, Any]], new_chunks: List[FileChunk]) -> Tuple[List[Dict[str, Any]], List[FileChunk]]:
        """
        比较现有 chunks 和新 chunks，找出需要删除和添加的部分
        
        Args:
            existing_chunks: 现有的 chunks
            new_chunks: 新的 chunks
            
        Returns:
            Tuple[List[Dict[str, Any]], List[FileChunk]]: 要删除的 chunks 和要添加的 chunks
        """
        # 创建现有 chunks 的文本到点ID的映射
        existing_map = {}
        for chunk in existing_chunks:
            # 使用文本内容作为键
            key = chunk.get("text", "")
            existing_map[key] = chunk

        # 找出要删除和要添加的 chunks
        to_delete = []
        to_add = []

        # 检查新的 chunks 中哪些已存在，哪些需要添加
        added_texts = set()
        for new_chunk in new_chunks:
            chunk_text = new_chunk.get_text()
            # 如果文本已经在处理过的文本中，跳过（避免重复处理）
            if chunk_text in added_texts:
                continue

            added_texts.add(chunk_text)

            # 如果文本已存在且内容相同，则不需要更改
            if chunk_text in existing_map:
                # 这个块已存在，不需要添加
                pass
            else:
                # 这个块需要添加
                to_add.append(new_chunk)

        # 检查现有 chunks 中哪些不再需要
        for chunk in existing_chunks:
            chunk_text = chunk.get("text", "")
            if chunk_text not in added_texts:
                # 这个块不在新的 chunks 中，需要删除
                to_delete.append(chunk)

        logger.info(f"差异比较结果: 现有 {len(existing_chunks)} 个块, 新的 {len(new_chunks)} 个块, "
                   f"需要删除 {len(to_delete)} 个块, 需要添加 {len(to_add)} 个块")

        return to_delete, to_add
