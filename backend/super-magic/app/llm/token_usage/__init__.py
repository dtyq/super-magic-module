"""
Token使用统计和成本计算模块

处理LLM API调用的token使用统计、成本计算和报告生成
设计已简化：移除了抽象类，直接使用具体实现
"""

__version__ = "1.0.0"

# 导入具体实现
from app.llm.token_usage.tracker import TokenUsageTracker
from app.llm.token_usage.pricing import ModelPricing

# TokenUsageReport 在需要的时候动态导入
# 以避免循环导入问题
