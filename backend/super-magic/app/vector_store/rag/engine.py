import time
from typing import Any, Dict, List, Optional

from ..prompt import Prompt, PromptStorage, PromptType, PromptVectorizer
from .analyzer import ContextAnalyzer
from .composer import PromptComposer
from .retrieval import (
    BaseRetrievalStrategy,
    SimilarityMetric,
    VectorSimilarityRetrieval,
)


class RAGEngineError(Exception):
    """RAG 引擎错误"""

    pass


class RAGEngine:
    """RAG (Retrieval-Augmented Generation) 引擎"""

    def __init__(
        self,
        prompt_storage: PromptStorage,
        prompt_vectorizer: PromptVectorizer,
        retrieval_strategy: Optional[BaseRetrievalStrategy] = None,
        context_analyzer: Optional[ContextAnalyzer] = None,
        prompt_composer: Optional[PromptComposer] = None,
        max_results: int = 10,
        enable_relevance_feedback: bool = True,
    ):
        """初始化 RAG 引擎

        Args:
            prompt_storage: Prompt 存储服务
            prompt_vectorizer: Prompt 向量化服务
            retrieval_strategy: 检索策略，如未提供则使用默认的向量相似度策略
            context_analyzer: 上下文分析器，如未提供则创建新实例
            prompt_composer: Prompt 组合服务，如未提供则创建新实例
            max_results: 最大检索结果数
            enable_relevance_feedback: 是否启用相关性反馈
        """
        self.prompt_storage = prompt_storage
        self.prompt_vectorizer = prompt_vectorizer

        # 如果未提供检索策略，则使用默认的向量相似度策略
        if retrieval_strategy is None:
            self.retrieval_strategy = VectorSimilarityRetrieval(
                prompt_storage=prompt_storage,
                prompt_vectorizer=prompt_vectorizer,
                similarity_metric=SimilarityMetric.COSINE,
                rerank=True,
            )
        else:
            self.retrieval_strategy = retrieval_strategy

        # 如果未提供上下文分析器，则创建新实例
        self.context_analyzer = context_analyzer or ContextAnalyzer()

        # 如果未提供 Prompt 组合服务，则创建新实例
        self.prompt_composer = prompt_composer or PromptComposer()

        self.max_results = max_results
        self.enable_relevance_feedback = enable_relevance_feedback

    async def initialize(self) -> None:
        """初始化 RAG 引擎"""
        try:
            # 初始化存储服务
            await self.prompt_storage.initialize()
        except Exception as e:
            raise RAGEngineError(f"Failed to initialize RAG engine: {e!s}") from e

    async def generate_prompt(
        self,
        query: str,
        context: Optional[str] = None,
        prompt_types: Optional[List[PromptType]] = None,
        additional_variables: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """生成动态 Prompt

        Args:
            query: 用户查询
            context: 可选的上下文
            prompt_types: 可选的 Prompt 类型过滤器
            additional_variables: 额外的模板变量

        Returns:
            包含生成的 Prompt 和元数据的字典
        """
        start_time = time.time()

        try:
            # 分析任务类型和上下文类型
            task_types = self.context_analyzer.analyze_task_type(query)
            context_types = self.context_analyzer.analyze_context_type(query, context)

            # 检索相关 Prompt
            results = await self.retrieval_strategy.retrieve(
                query=query, limit=self.max_results, prompt_types=prompt_types
            )

            if not results:
                return {
                    "content": query,  # 如果没有找到相关 Prompt，则使用原始查询
                    "estimated_tokens": len(query) // 4 + 1,
                    "used_prompts": {},
                    "analytics": {
                        "task_types": task_types,
                        "context_types": context_types,
                        "retrieval_time": time.time() - start_time,
                        "retrieval_results": 0,
                    },
                }

            # 如果启用相关性反馈，则调整检索结果的相关性
            if self.enable_relevance_feedback:
                results = self.context_analyzer.adjust_relevance(
                    results=results, task_types=task_types, context_types=context_types
                )

            # 组合 Prompt
            composed_result = self.prompt_composer.compose(
                prompts=results,
                query=query,
                context=context,
                task_types=task_types,
                context_types=context_types,
                additional_variables=additional_variables,
            )

            # 添加分析信息
            composed_result["analytics"] = {
                "task_types": {k.value: v for k, v in task_types.items()},
                "context_types": {k.value: v for k, v in context_types.items()},
                "retrieval_time": time.time() - start_time,
                "retrieval_results": len(results),
                "top_results": [
                    {"id": r.prompt.id, "name": r.prompt.name, "type": r.prompt.type.value, "score": r.score}
                    for r in results[:3]  # 只显示前 3 个结果
                ],
            }

            return composed_result
        except Exception as e:
            raise RAGEngineError(f"Failed to generate prompt: {e!s}") from e

    async def update_prompt_usage(self, prompt_ids: List[str], success: bool, latency: float) -> None:
        """更新 Prompt 的使用统计信息

        Args:
            prompt_ids: Prompt ID 列表
            success: 是否成功使用
            latency: 使用延迟（秒）
        """
        try:
            for prompt_id in prompt_ids:
                prompt = await self.prompt_storage.get(prompt_id)
                if prompt:
                    prompt.update_usage_stats(success, latency)
                    await self.prompt_storage.update(prompt)
        except Exception as e:
            # 记录错误但不中断流程
            print(f"Warning: Failed to update prompt usage: {e!s}")

    async def add_prompt(self, prompt: Prompt) -> str:
        """添加新的 Prompt

        Args:
            prompt: Prompt 对象

        Returns:
            新增 Prompt 的 ID
        """
        try:
            # 向量化并保存
            ids = await self.prompt_storage.save(prompt)
            if not ids:
                raise RAGEngineError("Failed to add prompt: No ID returned")
            return ids[0]
        except Exception as e:
            raise RAGEngineError(f"Failed to add prompt: {e!s}") from e

    async def delete_prompt(self, prompt_id: str) -> bool:
        """删除 Prompt

        Args:
            prompt_id: Prompt ID

        Returns:
            是否成功删除
        """
        try:
            deleted_ids = await self.prompt_storage.delete(prompt_id)
            return prompt_id in deleted_ids
        except Exception as e:
            raise RAGEngineError(f"Failed to delete prompt: {e!s}") from e

    async def list_prompts(self, prompt_type: Optional[PromptType] = None, limit: int = 100) -> List[Dict[str, Any]]:
        """列出 Prompt

        Args:
            prompt_type: 可选的 Prompt 类型过滤器
            limit: 最大返回数量

        Returns:
            Prompt 信息列表
        """
        try:
            prompts = await self.prompt_storage.list_by_type(prompt_type=prompt_type, limit=limit)

            return [
                {
                    "id": p.id,
                    "name": p.name,
                    "description": p.description,
                    "type": p.type.value,
                    "status": p.status.value,
                    "created_at": p.created_at.isoformat(),
                    "updated_at": p.updated_at.isoformat(),
                    "metadata": {
                        "usage_count": p.metadata.usage_count,
                        "success_rate": p.metadata.success_rate,
                        "tags": p.metadata.tags,
                        "category": p.metadata.category,
                    },
                }
                for p in prompts
            ]
        except Exception as e:
            raise RAGEngineError(f"Failed to list prompts: {e!s}") from e
