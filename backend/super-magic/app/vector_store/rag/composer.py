from string import Template
from typing import Any, Dict, List, Optional

from ..prompt import Prompt, PromptType, TemplatePrompt
from .analyzer import ContextType, TaskType
from .retrieval import RetrievalResult


class PromptCompositionError(Exception):
    """Prompt 组合错误"""

    pass


class PromptComposer:
    """Prompt 组合服务"""

    def __init__(
        self,
        max_system_prompts: int = 1,
        max_context_prompts: int = 2,
        max_task_prompts: int = 1,
        max_template_prompts: int = 1,
        max_total_tokens: int = 4000,
    ):
        """初始化 Prompt 组合服务

        Args:
            max_system_prompts: 最多使用的系统级 Prompt 数量
            max_context_prompts: 最多使用的上下文 Prompt 数量
            max_task_prompts: 最多使用的任务 Prompt 数量
            max_template_prompts: 最多使用的模板 Prompt 数量
            max_total_tokens: 组合后的最大 token 数量
        """
        self.max_system_prompts = max_system_prompts
        self.max_context_prompts = max_context_prompts
        self.max_task_prompts = max_task_prompts
        self.max_template_prompts = max_template_prompts
        self.max_total_tokens = max_total_tokens

    def _group_prompts_by_type(self, prompts: List[RetrievalResult]) -> Dict[PromptType, List[RetrievalResult]]:
        """按类型分组 Prompt

        Args:
            prompts: 检索结果列表

        Returns:
            按 Prompt 类型分组的字典
        """
        grouped = {prompt_type: [] for prompt_type in PromptType}

        for result in prompts:
            prompt = result.prompt
            grouped[prompt.type].append(result)

        # 按相关性排序
        for prompt_type in grouped:
            grouped[prompt_type].sort(key=lambda x: x.score, reverse=True)

        return grouped

    def _estimate_token_count(self, text: str) -> int:
        """估算文本的 token 数量

        Args:
            text: 输入文本

        Returns:
            估算的 token 数量
        """
        # 简单估算: 每 4 个字符约为 1 个 token
        return len(text) // 4 + 1

    def _apply_template(self, template_prompt: Prompt, variables: Dict[str, Any]) -> str:
        """应用模板

        Args:
            template_prompt: 模板 Prompt
            variables: 变量字典

        Returns:
            处理后的文本
        """
        try:
            # 首先尝试使用 Python Template
            template = Template(template_prompt.content)
            return template.safe_substitute(variables)
        except Exception:
            # 如果失败，使用简单的替换
            content = template_prompt.content
            for key, value in variables.items():
                content = content.replace(f"${{{key}}}", str(value))
            return content

    def compose(
        self,
        prompts: List[RetrievalResult],
        query: str,
        context: Optional[str] = None,
        task_types: Optional[Dict[TaskType, float]] = None,
        context_types: Optional[Dict[ContextType, float]] = None,
        additional_variables: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """组合检索的 Prompt 生成最终 Prompt

        Args:
            prompts: 检索结果列表
            query: 用户查询
            context: 可选的上下文
            task_types: 任务类型及其权重
            context_types: 上下文类型及其权重
            additional_variables: 额外的变量

        Returns:
            包含组合结果的字典
        """
        try:
            # 按类型分组
            grouped_prompts = self._group_prompts_by_type(prompts)

            # 限制每种类型的数量
            system_prompts = grouped_prompts[PromptType.SYSTEM][: self.max_system_prompts]
            context_prompts = grouped_prompts[PromptType.CONTEXT][: self.max_context_prompts]
            task_prompts = grouped_prompts[PromptType.TASK][: self.max_task_prompts]
            template_prompts = grouped_prompts[PromptType.TEMPLATE][: self.max_template_prompts]

            # 准备变量
            variables = {
                "query": query,
                "context": context or "",
                "task_types": ", ".join([t.value for t in (task_types or {})]),
                "context_types": ", ".join([c.value for c in (context_types or {})]),
            }

            # 添加额外变量
            if additional_variables:
                variables.update(additional_variables)

            # 构建最终 Prompt
            parts = []

            # 添加系统 Prompt
            for result in system_prompts:
                prompt = result.prompt
                parts.append(f"# 系统指令\n{prompt.content}")

            # 添加上下文 Prompt
            if context_prompts:
                parts.append("# 上下文信息")
                for result in context_prompts:
                    prompt = result.prompt
                    if isinstance(prompt, TemplatePrompt):
                        content = self._apply_template(prompt, variables)
                    else:
                        content = prompt.content
                    parts.append(content)

            # 添加任务 Prompt
            if task_prompts:
                parts.append("# 任务指令")
                for result in task_prompts:
                    prompt = result.prompt
                    if isinstance(prompt, TemplatePrompt):
                        content = self._apply_template(prompt, variables)
                    else:
                        content = prompt.content
                    parts.append(content)

            # 应用模板 Prompt（如果有）
            if template_prompts:
                # 使用评分最高的模板
                template_prompt = template_prompts[0].prompt

                if isinstance(template_prompt, TemplatePrompt):
                    # 如果模板 Prompt 中包含了完整结构，则替换整个 Prompt
                    final_content = self._apply_template(
                        template_prompt,
                        {
                            **variables,
                            "system_prompts": "\n".join([p.prompt.content for p in system_prompts]),
                            "context_prompts": "\n".join([p.prompt.content for p in context_prompts]),
                            "task_prompts": "\n".join([p.prompt.content for p in task_prompts]),
                        },
                    )
                    parts = [final_content]

            # 组合所有部分
            combined_content = "\n\n".join(parts)

            # 检查 token 数量
            estimated_tokens = self._estimate_token_count(combined_content)
            if estimated_tokens > self.max_total_tokens:
                # 如果超出限制，进行简单截断
                combined_content = combined_content[: self.max_total_tokens * 4]
                estimated_tokens = self._estimate_token_count(combined_content)

            # 返回结果
            return {
                "content": combined_content,
                "estimated_tokens": estimated_tokens,
                "used_prompts": {
                    "system": [r.prompt.id for r in system_prompts],
                    "context": [r.prompt.id for r in context_prompts],
                    "task": [r.prompt.id for r in task_prompts],
                    "template": [r.prompt.id for r in template_prompts],
                },
                "variables": variables,
            }
        except Exception as e:
            raise PromptCompositionError(f"Failed to compose prompts: {e!s}") from e
