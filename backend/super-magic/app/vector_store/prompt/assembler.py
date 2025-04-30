"""Prompt 组装模块，根据用户请求和场景组装最终的 Prompt"""

import re
from enum import Enum
from typing import Any, Dict, List, Optional

from app.logger import get_logger
from app.vector_store.prompt.models import PromptType, ScenarioPrompt, ScenarioType
from app.vector_store.prompt.storage import PromptStorage

logger = get_logger(__name__)


class PromptAssemblyStrategy(str, Enum):
    """Prompt 组装策略枚举"""

    TEMPLATE_FILLING = "template_filling"  # 模板填充
    CONCATENATION = "concatenation"  # 拼接组合
    CONTEXT_FUSION = "context_fusion"  # 上下文融合


class PromptAssemblyError(Exception):
    """Prompt 组装错误"""

    pass


class PromptAssembler:
    """Prompt 组装器，根据用户请求和场景组装最终的 Prompt"""

    def __init__(
        self,
        prompt_storage: PromptStorage,
        default_strategy: PromptAssemblyStrategy = PromptAssemblyStrategy.CONCATENATION,
        max_prompt_length: int = 4000,
    ):
        """初始化 Prompt 组装器

        Args:
            prompt_storage: Prompt 存储服务实例
            default_strategy: 默认的组装策略
            max_prompt_length: 最大 Prompt 长度
        """
        self.prompt_storage = prompt_storage
        self.default_strategy = default_strategy
        self.max_prompt_length = max_prompt_length

    async def _retrieve_scenario_prompts(self, scenario_type: ScenarioType, limit: int = 5) -> List[ScenarioPrompt]:
        """检索场景相关的 Prompt

        Args:
            scenario_type: 场景类型
            limit: 返回结果数量限制

        Returns:
            场景相关的 Prompt 列表
        """
        # 构建过滤参数
        filter_params = {
            "filter": {
                "must": [
                    {"key": "type", "match": {"value": PromptType.SCENARIO.value}},
                    {"key": "metadata.model_data.scenario_type", "match": {"value": scenario_type.value}},
                ]
            }
        }

        try:
            # 执行查询
            prompts = await self.prompt_storage.search("", limit=limit, filter_params=filter_params)
            if prompts:
                return prompts
        except Exception as e:
            logger.error(f"Failed to retrieve scenario prompts: {e}")
            # 不抛出异常，而是继续使用默认提示词

        # 如果搜索失败或没有找到提示词，创建默认的场景提示词
        import uuid
        from datetime import datetime

        from app.vector_store.prompt.models import PromptMetadata, ScenarioPrompt

        default_prompts = []

        # 添加通用系统提示词
        default_prompts.append(
            ScenarioPrompt(
                id=str(uuid.uuid4()),
                name=f"Default {scenario_type.name} System Prompt",
                description="系统默认提示词",
                content="你是一个专业的智能助手，致力于提供准确、有用的回答。",
                type=PromptType.SCENARIO,
                purpose="system",
                scenario_type=scenario_type,
                metadata=PromptMetadata(
                    tags=["default", "system", scenario_type.value],
                    source="system",
                    version="1.0",
                ),
                created_at=datetime.now(),
                updated_at=datetime.now(),
                vector=[],  # 空向量
            )
        )

        # 根据场景类型添加特定提示词
        scene_content = "请根据用户的请求提供适当的帮助。"
        if scenario_type == ScenarioType.CODE_REPOSITORY:
            scene_content = "作为代码库助手，请帮助用户理解和操作代码库。提供清晰的解释和建议，帮助用户解决编程问题。"
        elif scenario_type == ScenarioType.DATA_ANALYSIS:
            scene_content = (
                "作为数据分析助手，请帮助用户理解和处理数据。提供清晰的解释和建议，帮助用户分析数据和得出结论。"
            )

        default_prompts.append(
            ScenarioPrompt(
                id=str(uuid.uuid4()),
                name=f"Default {scenario_type.name} Task Prompt",
                description="任务默认提示词",
                content=scene_content,
                type=PromptType.SCENARIO,
                purpose="task_description",
                scenario_type=scenario_type,
                metadata=PromptMetadata(
                    tags=["default", "task", scenario_type.value],
                    source="system",
                    version="1.0",
                ),
                created_at=datetime.now(),
                updated_at=datetime.now(),
                vector=[],  # 空向量
            )
        )

        return default_prompts

    def _template_filling(self, template: str, data: Dict[str, Any]) -> str:
        """模板填充策略

        Args:
            template: 模板字符串
            data: 填充数据

        Returns:
            填充后的字符串
        """
        # 使用正则表达式查找所有 {{variable}} 格式的变量
        pattern = r"\{\{([^}]+)\}\}"

        def replace_var(match):
            var_name = match.group(1).strip()
            if var_name not in data:
                logger.warning(f"Variable not found in data: {var_name}")
                return f"{{{{ {var_name} }}}}"  # 保留未找到的变量
            return str(data[var_name])

        return re.sub(pattern, replace_var, template)

    def _concatenation(self, prompts: List[ScenarioPrompt], user_request: str) -> str:
        """拼接组合策略

        Args:
            prompts: Prompt 列表
            user_request: 用户请求文本

        Returns:
            组装后的 Prompt
        """
        # 按照用途分组
        grouped_prompts = {}
        for prompt in prompts:
            if prompt.purpose not in grouped_prompts:
                grouped_prompts[prompt.purpose] = []
            grouped_prompts[prompt.purpose].append(prompt)

        # 组装 Prompt
        assembled = [f"用户请求: {user_request}\n"]

        # 添加系统说明
        if "system" in grouped_prompts:
            system_prompts = grouped_prompts["system"]
            assembled.append("# 系统说明")
            for p in system_prompts:
                assembled.append(f"{p.content}\n")

        # 添加任务描述
        if "task_description" in grouped_prompts:
            task_prompts = grouped_prompts["task_description"]
            assembled.append("# 任务描述")
            for p in task_prompts:
                assembled.append(f"{p.content}\n")

        # 添加约束条件
        if "constraints" in grouped_prompts:
            constraint_prompts = grouped_prompts["constraints"]
            assembled.append("# 约束条件")
            for p in constraint_prompts:
                assembled.append(f"{p.content}\n")

        # 添加示例
        if "examples" in grouped_prompts:
            example_prompts = grouped_prompts["examples"]
            assembled.append("# 示例")
            for p in example_prompts:
                assembled.append(f"{p.content}\n")

        # 添加其他类型的 Prompt
        for purpose, prompt_list in grouped_prompts.items():
            if purpose not in ["system", "task_description", "constraints", "examples"]:
                assembled.append(f"# {purpose}")
                for p in prompt_list:
                    assembled.append(f"{p.content}\n")

        # 添加结尾
        assembled.append("\n请根据以上信息，针对用户请求给出回答。")

        return "\n".join(assembled)

    async def assemble_prompt(
        self,
        user_request: str,
        scenario_type: ScenarioType,
        strategy: Optional[PromptAssemblyStrategy] = None,
        context: Optional[Dict[str, Any]] = None,
    ) -> str:
        """组装 Prompt

        Args:
            user_request: 用户请求文本
            scenario_type: 场景类型
            strategy: 组装策略，如果为 None 则使用默认策略
            context: 上下文数据，用于模板填充

        Returns:
            组装后的 Prompt
        """
        try:
            # 获取场景相关的 Prompt
            prompts = await self._retrieve_scenario_prompts(scenario_type)

            if not prompts:
                logger.warning(f"No prompts found for scenario: {scenario_type.value}")
                # 返回基本 Prompt
                return f"用户请求: {user_request}\n\n请根据用户请求提供帮助。"

            # 确定使用的策略
            strategy = strategy or self.default_strategy

            # 根据策略组装 Prompt
            if strategy == PromptAssemblyStrategy.TEMPLATE_FILLING:
                if not context:
                    context = {}

                # 找到模板 Prompt
                template_prompt = next((p for p in prompts if p.purpose == "template"), None)

                if not template_prompt:
                    logger.warning(f"No template prompt found for scenario: {scenario_type.value}")
                    # 如果没有找到模板，退回到拼接策略
                    return self._concatenation(prompts, user_request)

                # 将用户请求添加到上下文
                context["user_request"] = user_request

                # 使用模板填充策略
                return self._template_filling(template_prompt.content, context)

            elif strategy == PromptAssemblyStrategy.CONCATENATION:
                # 使用拼接组合策略
                return self._concatenation(prompts, user_request)

            elif strategy == PromptAssemblyStrategy.CONTEXT_FUSION:
                # 上下文融合策略尚未实现，退回到拼接策略
                logger.warning("Context fusion strategy not implemented, falling back to concatenation")
                return self._concatenation(prompts, user_request)

            else:
                logger.error(f"Unknown assembly strategy: {strategy}")
                # 使用默认的拼接策略
                return self._concatenation(prompts, user_request)

        except Exception as e:
            logger.error(f"Failed to assemble prompt: {e}")
            # 返回基本 Prompt
            return f"用户请求: {user_request}\n\n请根据用户请求提供帮助。"

    def _truncate_prompt(self, prompt: str) -> str:
        """截断 Prompt 到最大长度

        Args:
            prompt: 原始 Prompt

        Returns:
            截断后的 Prompt
        """
        if len(prompt) <= self.max_prompt_length:
            return prompt

        # 简单截断策略，保留前部和尾部
        head_size = int(self.max_prompt_length * 0.8)
        tail_size = self.max_prompt_length - head_size

        head = prompt[:head_size]
        tail = prompt[-tail_size:]

        return f"{head}\n\n... [内容已截断] ...\n\n{tail}"
