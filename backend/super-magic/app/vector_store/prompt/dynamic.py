"""动态 Prompt 管理器，集成场景识别和 Prompt 组装功能"""

from typing import Any, Dict, Optional, Tuple

from app.core.config_manager import config
from app.logger import get_logger
from app.vector_store import get_vector_store, init_vector_store
from app.vector_store.prompt.assembler import PromptAssembler, PromptAssemblyStrategy
from app.vector_store.prompt.models import ScenarioType
from app.vector_store.prompt.scenario import AzureScenarioIdentifier
from app.vector_store.prompt.storage import PromptStorage
from app.vector_store.prompt.vectorizer import AzureOpenAIVectorizer, PromptVectorizer

logger = get_logger(__name__)


class DynamicPromptManager:
    """动态 Prompt 管理器，根据用户请求动态生成 Prompt"""

    def __init__(self):
        """初始化动态 Prompt 管理器"""
        self.scenario_identifier = None
        self.prompt_assembler = None
        self._initialized = False

    async def initialize(self) -> None:
        """初始化管理器"""
        if self._initialized:
            return

        try:
            # 初始化向量存储
            await init_vector_store()
            vector_store = get_vector_store()

            # 初始化向量化器
            vectorizer = AzureOpenAIVectorizer(
                api_key=config.get("azure_embedding.api_key"),
                api_base=config.get("azure_embedding.endpoint"),
                model=config.get("azure_embedding.model"),
                deployment=config.get("azure_embedding.deployment"),
            )
            prompt_vectorizer = PromptVectorizer(vectorizer)

            # 初始化Prompt存储
            collection_name = f"{config.get('qdrant.collection_prefix')}scenario-prompts"
            self.prompt_storage = PromptStorage(
                vector_store=vector_store,
                vectorizer=prompt_vectorizer,
                collection_name=collection_name,
            )
            await self.prompt_storage.initialize()

            # 初始化场景识别器
            self.scenario_identifier = AzureScenarioIdentifier(
                api_key=config.get("azure_embedding.api_key"),
                endpoint=config.get("azure_embedding.endpoint"),
                deployment=config.get("azure_embedding.deployment"),
                default_scenario=ScenarioType.CODE_REPOSITORY,  # 默认场景为代码库
            )

            # 初始化Prompt组装器
            self.prompt_assembler = PromptAssembler(
                prompt_storage=self.prompt_storage,
                default_strategy=PromptAssemblyStrategy.CONCATENATION,
            )

            self._initialized = True
            logger.info("Dynamic prompt manager initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize dynamic prompt manager: {e}")
            raise

    async def process_request(
        self,
        user_request: str,
        context: Optional[Dict[str, Any]] = None,
        strategy: Optional[PromptAssemblyStrategy] = None,
        force_scenario: Optional[ScenarioType] = None,
    ) -> Tuple[str, ScenarioType, float]:
        """处理用户请求，生成动态 Prompt

        Args:
            user_request: 用户请求文本
            context: 上下文信息，用于模板填充
            strategy: 组装策略
            force_scenario: 强制使用的场景类型，如果提供则跳过场景识别

        Returns:
            元组(生成的Prompt, 识别的场景类型, 场景置信度)
        """
        await self.initialize()

        try:
            # 场景识别
            if force_scenario:
                scenario_type = force_scenario
                confidence = 1.0
                logger.info(f"Using forced scenario: {scenario_type.value}")
            else:
                scenario_type, confidence, _ = await self.scenario_identifier.identify_scenario(user_request)
                logger.info(f"Identified scenario: {scenario_type.value} with confidence {confidence}")

            # 组装 Prompt
            final_prompt = await self.prompt_assembler.assemble_prompt(
                user_request=user_request,
                scenario_type=scenario_type,
                strategy=strategy,
                context=context,
            )

            return final_prompt, scenario_type, confidence

        except Exception as e:
            logger.error(f"Error in processing request: {e}")
            # 返回基本 Prompt
            return f"用户请求: {user_request}\n\n请根据用户请求提供帮助。", ScenarioType.CODE_REPOSITORY, 0.0


# 单例实例
_dynamic_prompt_manager = None


def get_dynamic_prompt_manager() -> DynamicPromptManager:
    """获取动态 Prompt 管理器的单例实例"""
    global _dynamic_prompt_manager
    if _dynamic_prompt_manager is None:
        _dynamic_prompt_manager = DynamicPromptManager()
    return _dynamic_prompt_manager
