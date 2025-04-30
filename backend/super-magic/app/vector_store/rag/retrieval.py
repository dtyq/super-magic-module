from abc import ABC, abstractmethod
from enum import Enum
from typing import Any, Callable, Dict, List, Optional

import numpy as np

from ..prompt import Prompt, PromptStorage, PromptType, PromptVectorizer


class SimilarityMetric(str, Enum):
    """相似度度量方式"""

    COSINE = "cosine"  # 余弦相似度
    EUCLIDEAN = "euclidean"  # 欧几里得距离
    DOT = "dot"  # 点积
    JACCARD = "jaccard"  # Jaccard 相似度


class RetrievalResult:
    """检索结果"""

    def __init__(self, prompt: Prompt, score: float, metadata: Optional[Dict[str, Any]] = None):
        """初始化检索结果

        Args:
            prompt: 检索到的 Prompt
            score: 相似度分数
            metadata: 额外元数据
        """
        self.prompt = prompt
        self.score = score
        self.metadata = metadata or {}

    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            "id": self.prompt.id,
            "name": self.prompt.name,
            "type": self.prompt.type.value,
            "content": self.prompt.content,
            "score": self.score,
            "metadata": self.metadata,
        }


class BaseRetrievalStrategy(ABC):
    """检索策略基类"""

    @abstractmethod
    async def retrieve(self, query: str, limit: int = 5, **kwargs) -> List[RetrievalResult]:
        """检索相关 Prompt

        Args:
            query: 查询文本
            limit: 结果数量限制
            **kwargs: 额外参数

        Returns:
            检索结果列表
        """
        pass


class SimilarityCalculator:
    """相似度计算器"""

    @staticmethod
    def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
        """计算余弦相似度

        Args:
            vec1: 向量1
            vec2: 向量2

        Returns:
            相似度分数，范围 [-1, 1]，越大表示越相似
        """
        vec1_array = np.array(vec1)
        vec2_array = np.array(vec2)

        norm1 = np.linalg.norm(vec1_array)
        norm2 = np.linalg.norm(vec2_array)

        if norm1 == 0 or norm2 == 0:
            return 0.0

        return np.dot(vec1_array, vec2_array) / (norm1 * norm2)

    @staticmethod
    def euclidean_distance(vec1: List[float], vec2: List[float]) -> float:
        """计算欧几里得距离

        Args:
            vec1: 向量1
            vec2: 向量2

        Returns:
            距离分数，越小表示越相似，已归一化到 [0, 1]
        """
        vec1_array = np.array(vec1)
        vec2_array = np.array(vec2)

        distance = np.linalg.norm(vec1_array - vec2_array)

        # 归一化到 [0, 1] 区间，越接近0表示越相似
        # 使用平滑函数 1 / (1 + distance)
        return 1.0 / (1.0 + distance)

    @staticmethod
    def dot_product(vec1: List[float], vec2: List[float]) -> float:
        """计算点积相似度

        Args:
            vec1: 向量1
            vec2: 向量2

        Returns:
            相似度分数，越大表示越相似
        """
        vec1_array = np.array(vec1)
        vec2_array = np.array(vec2)

        # 标准化向量后计算点积
        norm1 = np.linalg.norm(vec1_array)
        norm2 = np.linalg.norm(vec2_array)

        if norm1 == 0 or norm2 == 0:
            return 0.0

        vec1_normalized = vec1_array / norm1
        vec2_normalized = vec2_array / norm2

        return float(np.dot(vec1_normalized, vec2_normalized))

    @staticmethod
    def get_similarity_function(metric: SimilarityMetric) -> Callable[[List[float], List[float]], float]:
        """获取相似度计算函数

        Args:
            metric: 相似度度量方式

        Returns:
            相似度计算函数
        """
        if metric == SimilarityMetric.COSINE:
            return SimilarityCalculator.cosine_similarity
        elif metric == SimilarityMetric.EUCLIDEAN:
            return SimilarityCalculator.euclidean_distance
        elif metric == SimilarityMetric.DOT:
            return SimilarityCalculator.dot_product
        else:
            # 默认使用余弦相似度
            return SimilarityCalculator.cosine_similarity


class VectorSimilarityRetrieval(BaseRetrievalStrategy):
    """基于向量相似度的检索策略"""

    def __init__(
        self,
        prompt_storage: PromptStorage,
        prompt_vectorizer: PromptVectorizer,
        similarity_metric: SimilarityMetric = SimilarityMetric.COSINE,
        rerank: bool = False,
    ):
        """初始化向量相似度检索策略

        Args:
            prompt_storage: Prompt 存储服务
            prompt_vectorizer: Prompt 向量化服务
            similarity_metric: 相似度计算方式
            rerank: 是否对结果重新排序
        """
        self.prompt_storage = prompt_storage
        self.prompt_vectorizer = prompt_vectorizer
        self.similarity_metric = similarity_metric
        self.rerank = rerank
        self.similarity_func = SimilarityCalculator.get_similarity_function(similarity_metric)

    async def retrieve(
        self,
        query: str,
        limit: int = 5,
        prompt_types: Optional[List[PromptType]] = None,
        min_score: float = 0.0,
        **kwargs,
    ) -> List[RetrievalResult]:
        """检索相关 Prompt

        Args:
            query: 查询文本
            limit: 结果数量限制
            prompt_types: Prompt 类型过滤
            min_score: 最小相似度分数
            **kwargs: 额外参数

        Returns:
            检索结果列表
        """
        # 构建过滤参数
        filter_params = {}
        if prompt_types:
            filter_params["filter"] = {"type": [t.value for t in prompt_types]}

        # 使用向量存储进行检索
        prompts = await self.prompt_storage.search(
            query_text=query,
            limit=limit * 2,  # 多检索一些，便于后续过滤和重排序
            filter_params=filter_params,
        )

        if not prompts:
            return []

        # 如果设置了重新排序，则进行二次相似度计算
        if self.rerank:
            # 向量化查询
            query_vector = await self.prompt_vectorizer.vectorizer.vectorize(query)

            # 计算相似度
            results = []
            for prompt in prompts:
                if prompt.vector:
                    score = self.similarity_func(query_vector, prompt.vector)
                    if score >= min_score:
                        results.append(
                            RetrievalResult(
                                prompt=prompt, score=score, metadata={"metric": self.similarity_metric.value}
                            )
                        )

            # 按相似度排序
            results.sort(key=lambda x: x.score, reverse=True)

            # 限制结果数量
            return results[:limit]
        else:
            # 直接使用向量存储返回的结果
            return [
                RetrievalResult(
                    prompt=prompt,
                    score=1.0,  # 此处无法获取实际分数，暂时使用 1.0
                    metadata={"metric": "vector_db_native"},
                )
                for prompt in prompts[:limit]
            ]


class HybridRetrieval(BaseRetrievalStrategy):
    """混合检索策略"""

    def __init__(self, retrieval_strategies: List[BaseRetrievalStrategy], weights: Optional[List[float]] = None):
        """初始化混合检索策略

        Args:
            retrieval_strategies: 检索策略列表
            weights: 各策略权重，默认平均
        """
        self.retrieval_strategies = retrieval_strategies

        if weights and len(weights) == len(retrieval_strategies):
            # 归一化权重
            total = sum(weights)
            self.weights = [w / total for w in weights]
        else:
            # 默认平均权重
            weight = 1.0 / len(retrieval_strategies)
            self.weights = [weight] * len(retrieval_strategies)

    async def retrieve(self, query: str, limit: int = 5, **kwargs) -> List[RetrievalResult]:
        """使用混合策略检索

        Args:
            query: 查询文本
            limit: 结果数量限制
            **kwargs: 额外参数

        Returns:
            检索结果列表
        """
        all_results = []

        # 使用所有策略进行检索
        for i, strategy in enumerate(self.retrieval_strategies):
            strategy_results = await strategy.retrieve(query=query, limit=limit, **kwargs)

            # 调整分数，应用权重
            for result in strategy_results:
                result.score *= self.weights[i]
                result.metadata["strategy_index"] = i
                all_results.append(result)

        # 按照 Prompt ID 去重，保留分数最高的结果
        unique_results = {}
        for result in all_results:
            prompt_id = result.prompt.id
            if prompt_id not in unique_results or result.score > unique_results[prompt_id].score:
                unique_results[prompt_id] = result

        # 按分数排序
        final_results = list(unique_results.values())
        final_results.sort(key=lambda x: x.score, reverse=True)

        # 限制结果数量
        return final_results[:limit]
