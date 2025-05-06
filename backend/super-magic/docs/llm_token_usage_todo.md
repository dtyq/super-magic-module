# LLM Token 用量统计与成本计算实现方案

## 需求概述

为了监控和优化项目中的 LLM 调用成本，需要实现一个完整的 Token 用量统计和成本计算功能。该功能将收集每次 LLM 调用的 Token 用量信息，按模型类型进行统计，并根据各模型的价格计算总体成本。

## 设计思路

1. 创建 `TokenUsageTracker` 类，专门负责记录和统计 Token 用量
2. 在 `LLMFactory` 中捕获每次调用结果的 `usage` 信息
3. 建立模型价格配置系统，存储不同模型的价格信息
4. 设计分析报告组件，提供 Agent 运行完成后的成本统计报告
5. 考虑使用装饰器模式注入统计逻辑，减少侵入性

## 技术实现方案

### 1. Token 用量统计模块

创建 `app/llm/token_usage/tracker.py`，实现 Token 使用情况的跟踪和分析：

```python
class TokenUsageTracker:
    """跟踪和分析 LLM 调用的 Token 使用情况"""
    
    def __init__(self):
        self.reset()
    
    def reset(self):
        """重置所有统计数据"""
        self.model_usage = {}  # 按模型名称存储用量
        self.total_input_tokens = 0
        self.total_output_tokens = 0
        self.total_tokens = 0
        self.call_count = 0
    
    def add_usage(self, model_name: str, input_tokens: int, output_tokens: int):
        """添加一次调用的用量数据"""
        if model_name not in self.model_usage:
            self.model_usage[model_name] = {
                "input_tokens": 0,
                "output_tokens": 0,
                "total_tokens": 0,
                "call_count": 0
            }
        
        self.model_usage[model_name]["input_tokens"] += input_tokens
        self.model_usage[model_name]["output_tokens"] += output_tokens
        self.model_usage[model_name]["total_tokens"] += (input_tokens + output_tokens)
        self.model_usage[model_name]["call_count"] += 1
        
        self.total_input_tokens += input_tokens
        self.total_output_tokens += output_tokens
        self.total_tokens += (input_tokens + output_tokens)
        self.call_count += 1
    
    def get_model_usage(self, model_name: str = None):
        """获取指定模型或所有模型的用量统计"""
        if model_name:
            return self.model_usage.get(model_name, {})
        return self.model_usage
    
    def get_summary(self):
        """获取所有用量的汇总统计"""
        return {
            "total_input_tokens": self.total_input_tokens,
            "total_output_tokens": self.total_output_tokens,
            "total_tokens": self.total_tokens,
            "call_count": self.call_count,
            "models": self.model_usage
        }
```

### 2. 模型价格配置

创建 `app/llm/token_usage/pricing.py`，提供模型价格配置和成本计算：

```python
from typing import Dict, Optional

class ModelPricing:
    """LLM模型价格配置和成本计算"""
    
    # 默认的价格配置（USD/1K tokens）
    DEFAULT_PRICING = {
        "gpt-4": {"input": 0.03, "output": 0.06},
        "gpt-4-32k": {"input": 0.06, "output": 0.12},
        "gpt-4-turbo": {"input": 0.01, "output": 0.03},
        "gpt-3.5-turbo": {"input": 0.0015, "output": 0.002},
        "text-embedding-3-small": {"input": 0.00002, "output": 0.0},
        "text-embedding-3-large": {"input": 0.00013, "output": 0.0},
        # 添加其他模型的价格
    }
    
    def __init__(self, custom_pricing: Optional[Dict] = None):
        """初始化模型价格配置
        
        Args:
            custom_pricing: 自定义价格配置，会覆盖默认配置
        """
        self.pricing = self.DEFAULT_PRICING.copy()
        if custom_pricing:
            self.pricing.update(custom_pricing)
    
    def get_price(self, model_name: str):
        """获取指定模型的价格配置
        
        Args:
            model_name: 模型名称
            
        Returns:
            dict: 包含input和output价格的字典
        """
        # 尝试精确匹配
        if model_name in self.pricing:
            return self.pricing[model_name]
        
        # 尝试模糊匹配（模型名称前缀）
        for price_model in self.pricing:
            if model_name.startswith(price_model):
                return self.pricing[price_model]
        
        # 默认价格（可调整为合理的默认值）
        return {"input": 0.01, "output": 0.02}
    
    def calculate_cost(self, model_name: str, input_tokens: int, output_tokens: int):
        """计算成本
        
        Args:
            model_name: 模型名称
            input_tokens: 输入token数量
            output_tokens: 输出token数量
            
        Returns:
            float: 成本（美元）
        """
        price = self.get_price(model_name)
        input_cost = (input_tokens / 1000) * price["input"]
        output_cost = (output_tokens / 1000) * price["output"]
        return input_cost + output_cost
```

### 3. 成本统计报告生成

创建 `app/llm/token_usage/report.py`，负责生成统计报告：

```python
from app.llm.token_usage.tracker import TokenUsageTracker
from app.llm.token_usage.pricing import ModelPricing

class TokenUsageReport:
    """Token使用报告生成器"""
    
    def __init__(self, tracker: TokenUsageTracker, pricing: ModelPricing):
        """初始化报告生成器
        
        Args:
            tracker: Token用量跟踪器
            pricing: 模型价格配置
        """
        self.tracker = tracker
        self.pricing = pricing
    
    def generate_cost_report(self):
        """生成成本报告
        
        Returns:
            dict: 包含详细成本信息的报告
        """
        usage_summary = self.tracker.get_summary()
        model_usage = usage_summary["models"]
        
        # 计算每个模型的成本
        models_cost = {}
        total_cost = 0.0
        
        for model_name, usage in model_usage.items():
            input_tokens = usage["input_tokens"]
            output_tokens = usage["output_tokens"]
            
            cost = self.pricing.calculate_cost(model_name, input_tokens, output_tokens)
            models_cost[model_name] = {
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "total_tokens": usage["total_tokens"],
                "call_count": usage["call_count"],
                "cost_usd": cost
            }
            total_cost += cost
        
        # 生成完整报告
        return {
            "total_cost_usd": total_cost,
            "total_input_tokens": usage_summary["total_input_tokens"],
            "total_output_tokens": usage_summary["total_output_tokens"],
            "total_tokens": usage_summary["total_tokens"],
            "call_count": usage_summary["call_count"],
            "models_breakdown": models_cost
        }
    
    def format_report(self, report=None):
        """格式化报告为可读字符串
        
        Args:
            report: 可选的预生成报告，如果为None则自动生成
            
        Returns:
            str: 格式化的报告字符串
        """
        if report is None:
            report = self.generate_cost_report()
        
        lines = []
        lines.append("== LLM Token 使用与成本报告 ==")
        lines.append(f"总调用次数: {report['call_count']}")
        lines.append(f"总Token数: {report['total_tokens']:,} (输入: {report['total_input_tokens']:,}, 输出: {report['total_output_tokens']:,})")
        lines.append(f"总成本: ${report['total_cost_usd']:.6f} USD")
        lines.append("\n== 按模型明细 ==")
        
        for model, data in report["models_breakdown"].items():
            lines.append(f"\n模型: {model}")
            lines.append(f"  调用次数: {data['call_count']}")
            lines.append(f"  Token数: {data['total_tokens']:,} (输入: {data['input_tokens']:,}, 输出: {data['output_tokens']:,})")
            lines.append(f"  成本: ${data['cost_usd']:.6f} USD")
        
        return "\n".join(lines)
```

### 4. 改进 LLMFactory 以捕获 Token 用量

修改 `app/llm/factory.py` 中的 `call_with_tool_support` 方法，添加 Token 用量捕获逻辑：

```python
# 在 LLMFactory 类中添加 token_tracker 属性
from app.llm.token_usage.tracker import TokenUsageTracker

token_tracker = TokenUsageTracker()

# 修改 call_with_tool_support 方法，在获取响应后记录用量
response = await client.chat.completions.create(**request_params)

# 记录 token 用量
if hasattr(response, 'usage') and response.usage:
    model_name = llm_config.name
    input_tokens = response.usage.prompt_tokens
    output_tokens = response.usage.completion_tokens
    cls.token_tracker.add_usage(model_name, input_tokens, output_tokens)
```

### 5. 在 Agent 运行结束后生成报告

在 `app/magic/agent.py` 的 `_handle_agent_loop` 方法结束处添加成本报告生成和记录：

```python
# 任务完成后生成成本报告
from app.llm.token_usage.pricing import ModelPricing
from app.llm.token_usage.report import TokenUsageReport

pricing = ModelPricing()  # 使用默认价格配置
report_generator = TokenUsageReport(LLMFactory.token_tracker, pricing)
cost_report = report_generator.generate_cost_report()
formatted_report = report_generator.format_report(cost_report)

# 记录成本报告
logger.info(f"Agent 运行完成，Token 使用和成本统计:\n{formatted_report}")

# 可选：保存成本报告到文件
report_path = os.path.join(self.agent_context.log_dir, f"{self.agent_context.get_task_id()}_token_usage.json")
with open(report_path, "w", encoding="utf-8") as f:
    json.dump(cost_report, f, ensure_ascii=False, indent=2)
```

## 实现步骤

1. [x] 【任务】创建 app/llm/token_usage 目录和基础文件
2. [x] 【任务】实现 TokenUsageTracker 类
3. [x] 【任务】实现 ModelPricing 类
4. [x] 【任务】实现 TokenUsageReport 类
5. [x] 【任务】修改 LLMFactory 以捕获 Token 用量
6. [x] 【任务】修改 Agent 类以生成报告
7. [x] 【任务】添加相关单元测试

## 扩展思路

1. 提供 API 端点，用于查询特定 task_id 的 Token 用量和成本
2. 添加图表化显示功能，可视化各模型的 Token 使用情况
3. 实现成本预算控制，当接近预算上限时自动调整或警告
4. 添加按项目、用户等维度的成本统计和分析
5. 考虑支持不同货币和实时汇率转换 