from typing import Any, Dict, List, Optional, Union

from app.logger import get_logger

from ..base import BaseVectorStore, VectorDocument
from .models import ContextPrompt, Prompt, PromptStatus, PromptType, SystemPrompt, TaskPrompt, TemplatePrompt
from .vectorizer import PromptVectorizer

# 获取日志记录器
logger = get_logger(__name__)


class PromptStorageError(Exception):
    """Prompt 存储错误"""

    pass


class PromptStorage:
    """Prompt 存储服务"""

    def __init__(
        self,
        vector_store: BaseVectorStore,
        vectorizer: PromptVectorizer,
        collection_name: str = "prompts",
        vector_size: int = 1536,  # OpenAI text-embedding-3-small 的向量维度
    ):
        """初始化 Prompt 存储服务

        Args:
            vector_store: 向量数据库实例
            vectorizer: Prompt 向量化服务实例
            collection_name: 集合名称
            vector_size: 向量维度
        """
        self.vector_store = vector_store
        self.vectorizer = vectorizer
        self.collection_name = collection_name
        self.vector_size = vector_size

    async def initialize(self) -> None:
        """初始化存储服务"""
        try:
            # 尝试列出集合
            try:
                collections = await self.vector_store.list_collections()
                if self.collection_name not in collections:
                    # 如果集合不存在，创建它
                    try:
                        await self.vector_store.create_collection(
                            collection_name=self.collection_name, vector_size=self.vector_size
                        )
                    except Exception as create_err:
                        # 检查是否是因为集合已存在而失败
                        if "already exists" in str(create_err).lower():
                            # 集合已存在，忽略错误
                            pass
                        else:
                            # 其他错误，重新抛出
                            raise
            except Exception as list_err:
                # 如果列出集合失败，尝试直接创建
                try:
                    await self.vector_store.create_collection(
                        collection_name=self.collection_name, vector_size=self.vector_size
                    )
                except Exception as create_err:
                    # 检查是否是因为集合已存在而失败
                    if "already exists" in str(create_err).lower():
                        # 集合已存在，忽略错误
                        pass
                    else:
                        # 其他错误，重新抛出
                        raise
        except Exception as e:
            raise PromptStorageError(f"Failed to initialize prompt storage: {e!s}") from e

    def _prompt_to_vector_doc(self, prompt: Prompt) -> VectorDocument:
        """将 Prompt 转换为向量文档"""
        return VectorDocument(
            id=prompt.id,
            vector=prompt.vector,
            content=prompt.content,
            metadata={
                "name": prompt.name,
                "description": prompt.description,
                "type": prompt.type.value,
                "status": prompt.status.value,
                "metadata": prompt.metadata.model_dump(),
                "model_data": prompt.model_dump(
                    exclude={"id", "vector", "content", "vector_updated_at", "created_at", "updated_at"}
                ),
            },
            created_at=prompt.created_at,
            updated_at=prompt.updated_at,
        )

    def _vector_doc_to_prompt(self, doc: VectorDocument) -> Prompt:
        """将向量文档转换为 Prompt"""
        # 获取基本数据
        prompt_data = {
            "id": doc.id,
            "vector": doc.vector,
            "content": doc.content,
            "created_at": doc.created_at,
            "updated_at": doc.updated_at,
            "name": doc.metadata["name"],
            "description": doc.metadata["description"],
            "type": doc.metadata["type"],
            "status": doc.metadata["status"],
        }

        # 添加元数据
        prompt_data.update(doc.metadata["metadata"])

        # 添加模型特定数据
        prompt_data.update(doc.metadata["model_data"])

        # 根据类型创建具体的 Prompt 实例
        prompt_type = PromptType(doc.metadata["type"])
        prompt_cls = {
            PromptType.SYSTEM: SystemPrompt,
            PromptType.TASK: TaskPrompt,
            PromptType.CONTEXT: ContextPrompt,
            PromptType.TEMPLATE: TemplatePrompt,
        }.get(prompt_type, Prompt)

        return prompt_cls(**prompt_data)

    async def save(self, prompt: Union[Prompt, List[Prompt]]) -> List[str]:
        """保存 Prompt

        Args:
            prompt: 单个 Prompt 或 Prompt 列表

        Returns:
            保存的 Prompt ID 列表
        """
        try:
            if isinstance(prompt, Prompt):
                prompt = [prompt]

            # 向量化
            prompts = await self.vectorizer.vectorize_prompt(prompt)

            # 转换为向量文档
            docs = [self._prompt_to_vector_doc(p) for p in prompts]

            # 保存到向量数据库
            return await self.vector_store.insert(self.collection_name, docs)
        except Exception as e:
            raise PromptStorageError(f"Failed to save prompts: {e!s}") from e

    async def get(self, prompt_id: str) -> Optional[Prompt]:
        """获取指定 Prompt

        Args:
            prompt_id: Prompt ID

        Returns:
            Prompt 实例，如果不存在则返回 None
        """
        try:
            doc = await self.vector_store.get(self.collection_name, prompt_id)
            if doc is None:
                return None
            return self._vector_doc_to_prompt(doc)
        except Exception as e:
            raise PromptStorageError(f"Failed to get prompt: {e!s}") from e

    async def search(
        self, query_text: str, limit: int = 10, filter_params: Optional[Dict[str, Any]] = None
    ) -> List[Prompt]:
        """搜索相似的 Prompt

        Args:
            query_text: 查询文本
            limit: 返回结果数量
            filter_params: 过滤参数

        Returns:
            相似的 Prompt 列表
        """
        try:
            # 尝试向量化查询文本
            try:
                query_vector = await self.vectorizer.vectorize(query_text)
            except Exception as e:
                # 向量化失败，使用零向量代替
                logger.warning(f"向量化失败，使用零向量代替: {e}")
                query_vector = [0.0] * self.vector_size

            # 搜索向量数据库
            try:
                results = await self.vector_store.search(
                    collection_name=self.collection_name, query_vector=query_vector, limit=limit, **filter_params or {}
                )

                # 转换结果
                return [self._vector_doc_to_prompt(result.document) for result in results]
            except Exception as search_err:
                # 如果搜索失败但提供了过滤参数，尝试只使用过滤参数进行简单搜索
                logger.warning(f"向量搜索失败，尝试使用过滤参数进行简单搜索: {search_err}")
                if filter_params:
                    from ..base import SearchResult

                    # 使用简单搜索（不依赖向量相似度）
                    filter_condition = filter_params.get("filter", {})
                    docs = await self.vector_store.list_documents(
                        collection_name=self.collection_name, filter_condition=filter_condition, limit=limit
                    )

                    # 模拟搜索结果
                    results = [SearchResult(document=doc, score=1.0) for doc in docs]
                    return [self._vector_doc_to_prompt(result.document) for result in results]
                else:
                    # 没有过滤参数，无法进行简单搜索
                    raise
        except Exception as e:
            raise PromptStorageError(f"Failed to search prompts: {e!s}") from e

    async def update(self, prompt: Prompt) -> bool:
        """更新 Prompt

        Args:
            prompt: Prompt 实例

        Returns:
            更新是否成功
        """
        try:
            # 向量化
            prompt = await self.vectorizer.vectorize_prompt(prompt)

            # 转换为向量文档
            doc = self._prompt_to_vector_doc(prompt)

            # 更新到向量数据库
            return await self.vector_store.update(self.collection_name, doc)
        except Exception as e:
            raise PromptStorageError(f"Failed to update prompt: {e!s}") from e

    async def delete(self, prompt_id: Union[str, List[str]]) -> List[str]:
        """删除 Prompt

        Args:
            prompt_id: 单个 Prompt ID 或 ID 列表

        Returns:
            成功删除的 Prompt ID 列表
        """
        try:
            return await self.vector_store.delete(self.collection_name, prompt_id)
        except Exception as e:
            raise PromptStorageError(f"Failed to delete prompts: {e!s}") from e

    async def list_by_type(
        self, prompt_type: Optional[PromptType] = None, status: Optional[PromptStatus] = None, limit: int = 100
    ) -> List[Prompt]:
        """按类型列出 Prompt

        Args:
            prompt_type: Prompt 类型
            status: Prompt 状态
            limit: 返回结果数量

        Returns:
            符合条件的 Prompt 列表
        """
        try:
            filter_params = {}
            if prompt_type:
                filter_params["type"] = prompt_type.value
            if status:
                filter_params["status"] = status.value

            # TODO: 实现基于过滤条件的查询
            # 当前简单实现，后续需要支持更复杂的过滤和分页
            results = await self.vector_store.search(
                collection_name=self.collection_name,
                query_vector=[0.0] * self.vector_size,  # 占位向量
                limit=limit,
                **filter_params,
            )

            return [self._vector_doc_to_prompt(result.document) for result in results]
        except Exception as e:
            raise PromptStorageError(f"Failed to list prompts: {e!s}") from e
