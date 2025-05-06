"""向量存储 Prompt 模块"""

from .assembler import PromptAssembler, PromptAssemblyError, PromptAssemblyStrategy
from .dynamic import DynamicPromptManager, get_dynamic_prompt_manager
from .models import (
    ContextPrompt,
    Prompt,
    PromptMetadata,
    PromptStatus,
    PromptType,
    ScenarioPrompt,
    ScenarioType,
    SystemPrompt,
    TaskPrompt,
    TemplatePrompt,
)
from .scenario import AzureScenarioIdentifier, ScenarioIdentificationError, ScenarioIdentifier
from .storage import PromptStorage, PromptStorageError
from .vectorizer import AzureOpenAIVectorizer, BaseVectorizer, OpenAIVectorizer, PromptVectorizer, VectorizationError

__all__ = [
    # 模型
    "Prompt",
    "PromptType",
    "PromptStatus",
    "PromptMetadata",
    "TaskPrompt",
    "ContextPrompt",
    "TemplatePrompt",
    "SystemPrompt",
    "ScenarioType",
    "ScenarioPrompt",
    # 存储
    "PromptStorage",
    "PromptStorageError",
    # 向量化
    "PromptVectorizer",
    "BaseVectorizer",
    "OpenAIVectorizer",
    "AzureOpenAIVectorizer",
    "VectorizationError",
    # 场景识别
    "ScenarioIdentifier",
    "AzureScenarioIdentifier",
    "ScenarioIdentificationError",
    # Prompt 组装
    "PromptAssembler",
    "PromptAssemblyStrategy",
    "PromptAssemblyError",
    # 动态 Prompt
    "DynamicPromptManager",
    "get_dynamic_prompt_manager",
]
