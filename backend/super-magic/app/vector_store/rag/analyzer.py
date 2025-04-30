from enum import Enum
from typing import Dict, List, Optional

from ..prompt import ContextPrompt, TaskPrompt
from .retrieval import RetrievalResult


class TaskType(str, Enum):
    """任务类型枚举"""

    CODE_GENERATION = "code_generation"  # 代码生成
    CODE_EXPLANATION = "code_explanation"  # 代码解释
    CODE_REVIEW = "code_review"  # 代码审查
    BUG_FIX = "bug_fix"  # Bug修复
    DATA_ANALYSIS = "data_analysis"  # 数据分析
    TEXT_SUMMARY = "text_summary"  # 文本摘要
    TEXT_GENERATION = "text_generation"  # 文本生成
    QUESTION_ANSWERING = "question_answering"  # 问答
    GENERAL = "general"  # 通用类型


class ContextType(str, Enum):
    """上下文类型枚举"""

    CODE = "code"  # 代码上下文
    DOCUMENTATION = "documentation"  # 文档上下文
    ERROR_MESSAGE = "error_message"  # 错误信息
    USER_CONVERSATION = "user_conversation"  # 用户对话
    SYSTEM_STATE = "system_state"  # 系统状态
    DOMAIN_KNOWLEDGE = "domain_knowledge"  # 领域知识
    GENERAL = "general"  # 通用上下文


class ContextAnalyzer:
    """上下文分析器"""

    # 任务类型关键词
    TASK_TYPE_KEYWORDS = {
        TaskType.CODE_GENERATION: ["生成代码", "实现功能", "写一个函数", "创建类", "编写", "开发"],
        TaskType.CODE_EXPLANATION: ["解释代码", "这段代码", "代码如何工作", "代码什么意思", "注释"],
        TaskType.CODE_REVIEW: ["审查代码", "评审", "代码质量", "改进代码", "优化代码", "重构"],
        TaskType.BUG_FIX: ["修复", "debug", "bug", "错误", "异常", "问题", "崩溃", "失败"],
        TaskType.DATA_ANALYSIS: ["分析数据", "数据处理", "统计", "数据集", "可视化", "图表"],
        TaskType.TEXT_SUMMARY: ["总结", "摘要", "概括", "提炼", "归纳"],
        TaskType.TEXT_GENERATION: ["生成文本", "写一篇", "创作", "撰写", "文案"],
        TaskType.QUESTION_ANSWERING: ["问题", "回答", "解答", "什么是", "如何", "为什么"],
    }

    # 上下文类型关键词
    CONTEXT_TYPE_KEYWORDS = {
        ContextType.CODE: ["代码", "函数", "类", "方法", "变量", "API", "库", "模块"],
        ContextType.DOCUMENTATION: ["文档", "说明", "指南", "手册", "教程", "README"],
        ContextType.ERROR_MESSAGE: ["错误", "异常", "警告", "堆栈", "跟踪", "崩溃", "失败"],
        ContextType.USER_CONVERSATION: ["用户", "对话", "聊天", "交流", "回应", "询问"],
        ContextType.SYSTEM_STATE: ["状态", "配置", "设置", "环境", "系统", "平台", "版本"],
        ContextType.DOMAIN_KNOWLEDGE: ["领域", "专业", "知识", "概念", "理论", "定义", "术语"],
    }

    def analyze_task_type(self, query: str) -> Dict[TaskType, float]:
        """分析查询的任务类型

        Args:
            query: 用户查询

        Returns:
            任务类型及其置信度的字典
        """
        # 初始化结果
        scores = {task_type: 0.0 for task_type in TaskType}

        # 标准化查询文本
        query = query.lower()

        # 计算每种任务类型的匹配度
        for task_type, keywords in self.TASK_TYPE_KEYWORDS.items():
            # 计算关键词匹配次数
            match_count = sum(1 for keyword in keywords if keyword.lower() in query)
            # 计算匹配率
            if keywords:
                match_rate = match_count / len(keywords)
                # 设置初始分数
                scores[task_type] = min(match_rate * 2.0, 1.0)

        # 确保有至少一个任务类型
        if all(score == 0.0 for score in scores.values()):
            scores[TaskType.GENERAL] = 1.0

        # 归一化分数
        total = sum(scores.values())
        if total > 0:
            scores = {k: v / total for k, v in scores.items()}

        return scores

    def analyze_context_type(self, query: str, context: Optional[str] = None) -> Dict[ContextType, float]:
        """分析查询和上下文的类型

        Args:
            query: 用户查询
            context: 可选的上下文文本

        Returns:
            上下文类型及其置信度的字典
        """
        # 初始化结果
        scores = {context_type: 0.0 for context_type in ContextType}

        # 标准化文本
        text = (query + " " + (context or "")).lower()

        # 计算每种上下文类型的匹配度
        for context_type, keywords in self.CONTEXT_TYPE_KEYWORDS.items():
            # 计算关键词匹配次数
            match_count = sum(1 for keyword in keywords if keyword.lower() in text)
            # 计算匹配率
            if keywords:
                match_rate = match_count / len(keywords)
                # 设置初始分数
                scores[context_type] = min(match_rate * 2.0, 1.0)

        # 确保有至少一个上下文类型
        if all(score == 0.0 for score in scores.values()):
            scores[ContextType.GENERAL] = 1.0

        # 归一化分数
        total = sum(scores.values())
        if total > 0:
            scores = {k: v / total for k, v in scores.items()}

        return scores

    def adjust_relevance(
        self, results: List[RetrievalResult], task_types: Dict[TaskType, float], context_types: Dict[ContextType, float]
    ) -> List[RetrievalResult]:
        """根据任务类型和上下文类型调整检索结果的相关性

        Args:
            results: 检索结果列表
            task_types: 任务类型及其置信度
            context_types: 上下文类型及其置信度

        Returns:
            调整后的检索结果列表
        """
        # 复制结果列表，避免修改原始列表
        adjusted_results = results.copy()

        for result in adjusted_results:
            prompt = result.prompt
            score_multiplier = 1.0

            # 基于 Prompt 类型调整相关性
            if isinstance(prompt, TaskPrompt):
                # 如果是任务型 Prompt，根据任务类型匹配度调整相关性
                if prompt.task_type in task_types:
                    score_multiplier *= 1.0 + task_types[prompt.task_type]

            elif isinstance(prompt, ContextPrompt):
                # 如果是上下文型 Prompt，根据上下文类型匹配度调整相关性
                if hasattr(prompt, "context_type") and prompt.context_type in context_types:
                    score_multiplier *= 1.0 + context_types[prompt.context_type]

            # 根据 Prompt 的使用统计信息进一步调整相关性
            if prompt.metadata.usage_count > 0:
                # 考虑成功率
                score_multiplier *= 0.5 + 0.5 * prompt.metadata.success_rate

                # 根据使用频率适当提升相关性
                score_multiplier *= min(1.0 + (prompt.metadata.usage_count / 100.0), 1.5)

            # 应用调整
            result.score *= score_multiplier
            result.metadata["adjusted"] = True
            result.metadata["original_score"] = result.score / score_multiplier
            result.metadata["multiplier"] = score_multiplier

        # 重新排序
        adjusted_results.sort(key=lambda x: x.score, reverse=True)

        return adjusted_results
