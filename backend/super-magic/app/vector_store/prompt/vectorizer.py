from abc import ABC, abstractmethod
from datetime import datetime
from typing import List, Optional, Union

from openai import AsyncOpenAI
from tenacity import retry, stop_after_attempt, wait_exponential

from ..base.exceptions import VectorStoreError
from .models import Prompt


class VectorizationError(VectorStoreError):
    """向量化错误"""

    pass


class BaseVectorizer(ABC):
    """向量化基类"""

    @abstractmethod
    async def vectorize(self, text: str) -> List[float]:
        """将文本转换为向量

        Args:
            text: 输入文本

        Returns:
            文本向量
        """
        pass

    @abstractmethod
    async def batch_vectorize(self, texts: List[str]) -> List[List[float]]:
        """批量将文本转换为向量

        Args:
            texts: 输入文本列表

        Returns:
            文本向量列表
        """
        pass


class OpenAIVectorizer(BaseVectorizer):
    """使用 OpenAI API 进行向量化"""

    def __init__(
        self,
        api_key: str,
        model: str = "text-embedding-3-small",
        api_base: Optional[str] = None,
        batch_size: int = 100,
        **kwargs,
    ):
        """初始化 OpenAI 向量化器

        Args:
            api_key: OpenAI API 密钥
            model: 模型名称
            api_base: API 基础 URL
            batch_size: 批处理大小
            **kwargs: 其他参数
        """
        self.model = model
        self.batch_size = batch_size
        self.client = AsyncOpenAI(api_key=api_key, base_url=api_base, **kwargs)

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    async def vectorize(self, text: str) -> List[float]:
        """将文本转换为向量"""
        try:
            response = await self.client.embeddings.create(model=self.model, input=text)
            return response.data[0].embedding
        except Exception as e:
            raise VectorizationError(f"Failed to vectorize text: {e!s}") from e

    async def batch_vectorize(self, texts: List[str]) -> List[List[float]]:
        """批量将文本转换为向量"""
        results = []
        for i in range(0, len(texts), self.batch_size):
            batch = texts[i : i + self.batch_size]
            try:
                response = await self.client.embeddings.create(model=self.model, input=batch)
                results.extend([data.embedding for data in response.data])
            except Exception as e:
                raise VectorizationError(f"Failed to batch vectorize texts: {e!s}") from e
        return results


class AzureOpenAIVectorizer(BaseVectorizer):
    """使用 Azure OpenAI API 进行向量化"""

    def __init__(
        self,
        api_key: str,
        deployment: str,
        api_base: str,
        model: str = "text-embedding-3-large",
        batch_size: int = 50,
        **kwargs,
    ):
        """初始化 Azure OpenAI 向量化器

        Args:
            api_key: Azure OpenAI API 密钥
            deployment: 部署名称
            api_base: API 端点 URL
            model: 模型名称（用于记录）
            batch_size: 批处理大小
            **kwargs: 其他参数
        """
        self.model = model  # 用于记录
        self.deployment = deployment  # 在 Azure 中用作 model 参数
        self.batch_size = batch_size
        self.client = AsyncOpenAI(api_key=api_key, base_url=api_base, **kwargs)

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    async def vectorize(self, text: str) -> List[float]:
        """将文本转换为向量"""
        try:
            response = await self.client.embeddings.create(
                model=self.deployment,  # 注意：在 Azure 中使用部署名称
                input=text,
            )
            return response.data[0].embedding
        except Exception as e:
            raise VectorizationError(f"Failed to vectorize text using Azure OpenAI: {e!s}") from e

    async def batch_vectorize(self, texts: List[str]) -> List[List[float]]:
        """批量将文本转换为向量"""
        results = []
        for i in range(0, len(texts), self.batch_size):
            batch = texts[i : i + self.batch_size]
            try:
                response = await self.client.embeddings.create(
                    model=self.deployment,  # 注意：在 Azure 中使用部署名称
                    input=batch,
                )
                results.extend([data.embedding for data in response.data])
            except Exception as e:
                raise VectorizationError(f"Failed to batch vectorize texts using Azure OpenAI: {e!s}") from e
        return results


class PromptVectorizer:
    """Prompt 向量化服务"""

    def __init__(self, vectorizer: BaseVectorizer):
        """初始化 Prompt 向量化服务

        Args:
            vectorizer: 向量化器实例
        """
        self.vectorizer = vectorizer

    def _prepare_text(self, prompt: Prompt) -> str:
        """准备用于向量化的文本

        Args:
            prompt: Prompt 实例

        Returns:
            处理后的文本
        """
        # 组合关键信息用于向量化
        text_parts = [
            f"Name: {prompt.name}",
            f"Description: {prompt.description}",
            f"Type: {prompt.type.value}",
            f"Content: {prompt.content}",
        ]

        # 添加标签和分类
        if prompt.metadata.tags:
            text_parts.append(f"Tags: {', '.join(prompt.metadata.tags)}")
        if prompt.metadata.category:
            text_parts.append(f"Categories: {', '.join(prompt.metadata.category)}")

        return "\n".join(text_parts)

    async def vectorize_prompt(self, prompt: Union[Prompt, List[Prompt]]) -> Union[Prompt, List[Prompt]]:
        """向量化 Prompt

        Args:
            prompt: 单个 Prompt 或 Prompt 列表

        Returns:
            更新后的 Prompt 或 Prompt 列表
        """
        if isinstance(prompt, list):
            texts = [self._prepare_text(p) for p in prompt]
            vectors = await self.vectorizer.batch_vectorize(texts)
            for p, vector in zip(prompt, vectors):
                p.vector = vector
                p.vector_updated_at = datetime.now()
            return prompt
        else:
            text = self._prepare_text(prompt)
            prompt.vector = await self.vectorizer.vectorize(text)
            prompt.vector_updated_at = datetime.now()
            return prompt

    async def vectorize(self, text: str) -> List[float]:
        """直接向量化文本

        Args:
            text: 输入文本

        Returns:
            文本向量
        """
        return await self.vectorizer.vectorize(text)
