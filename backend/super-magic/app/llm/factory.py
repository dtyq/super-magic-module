"""
LLM Factory module for creating different LLM clients.

This module provides a factory pattern for creating different LLM clients
based on the model ID provided.
"""

import os
import logging
import re
import uuid
from typing import Any, Dict, List, Optional
from datetime import datetime

from openai import AsyncOpenAI
from openai.types.chat import ChatCompletion
from pydantic import BaseModel

from app.core.config_manager import config
from app.core.context.agent_context import AgentContext
from app.llm.token_usage.tracker import TokenUsageTracker
from app.llm.token_usage.pricing import ModelPricing
from app.llm.token_usage.cost_limit import CostLimitService
from app.llm.token_usage.report import TokenUsageReport
from app.logger import get_logger

logger = get_logger(__name__)

DEFAULT_TIMEOUT = int(config.get("llm.api_timeout", 600))
MAX_RETRIES = int(config.get("llm.api_max_retries", 3))


class LLMClientConfig(BaseModel):
    """Configuration for LLM clients."""

    model_id: str
    api_key: str
    api_base_url: Optional[str] = None
    name: str
    provider: str
    temperature: float = 0.7
    max_tokens: int = 4 * 1024
    context_length: int = 8 * 1024
    top_p: float = 1.0
    stop: Optional[List[str]] = None
    extra_params: Dict[str, Any] = {}
    supports_tool_use: bool = True
    type: str = "llm"

class LLMFactory:
    """Factory for creating LLM clients."""

    _clients = {}
    _configs = {}

    # 初始化token使用跟踪器和相关服务
    token_tracker = TokenUsageTracker()

    # 初始化价格配置
    pricing = ModelPricing()
    sandbox_id = os.environ.get("SANDBOX_ID", "default")

    """初始化成本限制服务"""
    cost_limit_currency = os.environ.get("LLM_COST_LIMIT_CURRENCY", "CNY")
    single_task_cost_limit = float(os.environ.get("LLM_SINGLE_TASK_COST_LIMIT", 300.0)) or None

    total_cost_limit = CostLimitService.calculate_cost_limit(
        base_cost_limit=single_task_cost_limit,
        sandbox_id=sandbox_id,
        token_tracker=token_tracker,
        pricing=pricing
    )

    cost_limit_service = CostLimitService.create_instance(
        token_tracker=token_tracker,
        pricing=pricing,
        sandbox_id=sandbox_id,
        total_cost_limit=total_cost_limit,
        currency=cost_limit_currency,
        single_task_cost_limit=single_task_cost_limit
    )

    # 注意：TokenUsageReport.get_instance会自动设置token_tracker的report_manager
    _ = TokenUsageReport.get_instance(
        sandbox_id=sandbox_id,
        token_tracker=token_tracker,
        pricing=pricing
    )

    logger.info(f"token费用总限制: {total_cost_limit} {cost_limit_currency}")
    logger.info(f"单次任务token费用限制: {single_task_cost_limit} {cost_limit_currency}")

    @classmethod
    def register_config(cls, llm_config: LLMClientConfig) -> None:
        """Register a configuration for a model ID.

        Args:
            config: The configuration to register.
        """
        cls._configs[llm_config.model_id] = llm_config

    @classmethod
    def get(cls, model_id: str) -> Any:
        """Get a client for the given model ID.

        Args:
            model_id: The model ID to get a client for.

        Returns:
            The client for the given model ID.

        Raises:
            ValueError: If the model ID is not supported.
        """
        if model_id in cls._clients:
            return cls._clients[model_id]

        if model_id not in cls._configs:
            # 从配置文件中读取模型配置
            model_config = config.get("models", {}).get(model_id)
            if not model_config:
                raise ValueError(f"Unsupported model ID: {model_id}")
            # 过滤 type 不是 llm 的配置
            if model_config.get("type") != "llm":
                raise ValueError(f"Model {model_id} is not a LLM model")

            llm_config = LLMClientConfig(
                model_id=model_id,
                api_key=model_config["api_key"],
                api_base_url=model_config["api_base_url"],
                name=str(model_config["name"]),
                provider=model_config["provider"],
                supports_tool_use=model_config.get("supports_tool_use", False),
                max_tokens=model_config.get("max_tokens", 4 * 1024),
                context_length=model_config.get("context_length", 8 * 1024),
                temperature=model_config.get("temperature", 0.7),
                top_p=model_config.get("top_p", 1.0),
            )
            cls._configs[model_id] = llm_config

        llm_config = cls._configs[model_id]
        available_providers = ["openai"]
        if llm_config.provider not in available_providers:
            raise ValueError(f"Unsupported provider: {llm_config.provider}")

        if llm_config.provider == "openai":
            client = cls._create_openai_client(llm_config)
            cls._clients[model_id] = client
            return client

    @classmethod
    async def call_with_tool_support(
        cls,
        model_id: str,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        stop: Optional[List[str]] = None,
        agent_context: Optional[AgentContext] = None
    ) -> ChatCompletion:
        """使用工具支持调用 LLM。

        根据模型配置使用工具调用。
        对于支持工具调用的模型，直接使用 OpenAI API 的工具调用功能。

        Args:
            model_id: 要使用的模型ID。
            messages: 聊天消息历史。
            tools: 可用工具的列表，可选。
            stop: 终止序列列表，可选。
            agent_context: 代理上下文，可选。

        Returns:
            LLM响应。

        Raises:
            ValueError: 如果模型ID不支持。
        """
        user_id = None
        if agent_context:
            metadata = agent_context.get_init_client_message_metadata()
            user_id = metadata.get("user_id")

        cls.cost_limit_service.check_total_cost_limit(user_id=user_id)

        client = cls.get(model_id)
        if not client:
            raise ValueError(f"无法获取模型ID为 {model_id} 的客户端")

        # 获取模型配置
        llm_config = cls._configs.get(model_id)
        if not llm_config:
            raise ValueError(f"找不到模型ID为 {model_id} 的配置")

        # 使用原生工具调用
        # 构建请求参数
        request_params = {
            "model": llm_config.name,
            "messages": messages,
            "temperature": llm_config.temperature,
            #"max_tokens": llm_config.max_tokens,  # 先去掉这个传参，暂时还搞不太明白怎么算
            "top_p": llm_config.top_p,
        }

        # 添加终止序列（如果提供）
        if stop:
            request_params["stop"] = stop

        # 添加工具（如果提供且模型支持工具使用）
        if tools and llm_config.supports_tool_use:
            request_params["tools"] = tools
            # 添加tool_choice参数，设置为"auto"以允许LLM返回多个工具调用
            request_params["tool_choice"] = "auto"

        # 添加额外参数
        for key, value in llm_config.extra_params.items():
            request_params[key] = value

        # 发送请求并获取响应
        # logger.debug(f"发送聊天完成请求到 {llm_config.name}: {request_params}")
        try:
            response = await client.chat.completions.create(**request_params)

            # 使用TokenUsageTracker记录token使用情况
            cls.token_tracker.record_llm_usage(
                response.usage,
                model_id,
                user_id,
                model_name=llm_config.name
            )

            return response
        except Exception as e:
            logger.critical(f"调用 LLM {model_id} 时出错: {repr(e)}", exc_info=True)
            raise

    @classmethod
    def get_embedding_client(cls, model_id: str) -> Any:
        """Get an embedding client for the given model ID.

        Args:
            model_id: The model ID to get an embedding client for.

        Returns:
            The embedding client for the given model ID.
        """
        if model_id in cls._clients:
            return cls._clients[model_id]

        if model_id not in cls._configs:
            # 从配置文件中读取模型配置
            model_config = config.get("models", {}).get(model_id)
            if not model_config:
                raise ValueError(f"Unsupported model ID: {model_id}")
            # 过滤 type 不是 embedding 的配置
            if model_config.get("type") != "embedding":
                raise ValueError(f"Model {model_id} is not an Embedding model")

            llm_config = LLMClientConfig(
                model_id=model_id,
                api_key=model_config["api_key"],
                api_base_url=model_config["api_base_url"],
                name=str(model_config["name"]),
                provider=model_config["provider"],
                type=model_config["type"],
                max_tokens=model_config.get("max_tokens", 4 * 1024),
                context_length=model_config.get("context_length", 8 * 1024),
                temperature=model_config.get("temperature", 0.7),
                top_p=model_config.get("top_p", 1.0),
            )
            logger.info(f"创建embedding客户端 - llm_config: {llm_config}")
            cls._configs[model_id] = llm_config

        llm_config = cls._configs[model_id]
        available_providers = ["openai"]
        if llm_config.provider not in available_providers:
            raise ValueError(f"Unsupported provider: {llm_config.provider}")

        if llm_config.provider == "openai":
            client = cls._create_openai_client(llm_config)
            cls._clients[model_id] = client
            return client

    @classmethod
    def get_model_config(cls, model_id: str) -> Dict[str, Any]:
        """Get the model config for the given model ID.

        Args:
            model_id: The model ID to get the config for.

        Returns:
            The model config for the given model ID.
        """
        return cls._configs[model_id]

    @classmethod
    def is_supports_tool_use(cls, model_id: str) -> bool:
        """Check if the model supports tool use.

        Args:
            model_id: The model ID to check.

        Returns:
            True if the model supports tool use, False otherwise.
        """
        return cls._configs[model_id].supports_tool_use

    @classmethod
    def _create_openai_client(cls, llm_config: LLMClientConfig) -> Any:
        """Create an OpenAI client.

        Args:
            model_id: The model ID to create a client for.

        Returns:
            An AsyncOpenAI client.
        """
        magic_authorization = config.get("sandbox.magic_authorization")
        default_headers = {}
        if magic_authorization:
            default_headers["Magic-Authorization"] = magic_authorization

        if llm_config.api_base_url and re.search(r'letsmagic\.', llm_config.api_base_url):
            # 生成随机值作为header值
            random_value = str(uuid.uuid4())
            # 为 letsmagic 域名添加防火墙绕过 header，这是一个内部机制，请勿外泄
            default_headers["X-KBYS-YRNTYRBGT"] = random_value

        return AsyncOpenAI(
            api_key=llm_config.api_key,
            base_url=llm_config.api_base_url,
            timeout=DEFAULT_TIMEOUT,
            max_retries=MAX_RETRIES,
            default_headers=default_headers
        )

    @classmethod
    def get_embedding_dimension(cls, model_id: str) -> int:
        """Get the embedding dimension for the given model ID.

        Args:
            model_id: The model ID to get the embedding dimension for.

        Returns:
            The embedding dimension for the given model ID.
        """
        if model_id not in cls._configs:
            # 从配置文件中读取模型配置
            model_config = config.get("models", {}).get(model_id)
            if not model_config:
                raise ValueError(f"Unsupported model ID: {model_id}")

            llm_config = LLMClientConfig(
                model_id=model_id,
                api_key=model_config["api_key"],
                api_base_url=model_config["api_base_url"],
                name=str(model_config["name"]),
                provider=model_config["provider"],
                type=model_config["type"],
            )
            cls._configs[model_id] = llm_config

        llm_config = cls._configs[model_id]
        model_name = llm_config.name.lower()

        # 根据模型名称返回对应的向量维度
        if "text-embedding-3-large" in model_name:
            return 3072
        elif "text-embedding-3-small" in model_name:
            return 1536
        elif "text-embedding-ada-002" in model_name:
            return 1536
        else:
            # 默认维度为1536
            return 1536
