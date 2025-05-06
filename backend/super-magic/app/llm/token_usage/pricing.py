"""
模型token价格配置模块
"""

from enum import Enum
from typing import Any, Dict, Optional, Tuple


class CurrencyType(Enum):
    """货币类型枚举"""
    USD = "USD"  # 美元
    RMB = "CNY"  # 人民币


class ModelPricing:
    """LLM模型价格配置和成本计算
    
    用于配置各模型的token价格，并基于使用情况计算成本
    """

    # 默认汇率 (USD -> RMB)
    DEFAULT_EXCHANGE_RATE = 7.2

    # 默认模型定价（每千token的价格）
    DEFAULT_PRICING = {
        # OpenAI 模型
        "gpt-4o": {
            "input_price": 0.0025,
            "output_price": 0.01,
            "cache_write_price": 0.00125,
            "currency": CurrencyType.USD.value
        },
        "gpt-4.1": {
            "input_price": 0.002,
            "output_price": 0.008,
            "cache_write_price": 0.0005,
            "currency": CurrencyType.USD.value
        },
        "gpt-4.1-mini": {
            "input_price": 0.0004,
            "output_price": 0.0016,
            "cache_write_price": 0.0001,
            "currency": CurrencyType.USD.value
        },
        "gpt-4.1-nano": {
            "input_price": 0.0001,
            "output_price": 0.0004,
            "cache_write_price": 0.000025,
            "currency": CurrencyType.USD.value
        },

        "o4-mini": {
            "input_price": 0.0001,
            "output_price": 0.0004,
            "cache_write_price": 0.000025,
            "currency": CurrencyType.USD.value
        },

        # Anthropic 模型
        "claude-3.5-sonnet": {
            "input_price": 0.003,
            "output_price": 0.015,
            "cache_write_price": 0.00375,
            "cache_hit_price": 0.0003,
            "currency": CurrencyType.USD.value,
        },
        "claude-3.7-sonnet": {
            "input_price": 0.003,
            "output_price": 0.015,
            "cache_write_price": 0.00375,
            "cache_hit_price": 0.0003,
            "currency": CurrencyType.USD.value,
        },
        "claude-3.7": {
            "input_price": 0.003,
            "output_price": 0.015,
            "cache_write_price": 0.00375,
            "cache_hit_price": 0.0003,
            "currency": CurrencyType.USD.value,
        },
        "claude-3.7-cache": {
            "input_price": 0.003,
            "output_price": 0.015,
            "cache_write_price": 0.00375,
            "cache_hit_price": 0.0003,
            "currency": CurrencyType.USD.value,
        },
        # DeepSeek 模型 (人民币计价，标准时段价格)
        "deepseek-chat": {
            "input_price": 0.002,  # 缓存未命中
            "output_price": 0.008,
            "cache_write_price": 0.0005,
            "currency": CurrencyType.RMB.value,
        },
        "deepseek-reasoner": {
            "input_price": 0.004,  # 缓存未命中
            "output_price": 0.016,
            "cache_write_price": 0.0008,
            "currency": CurrencyType.RMB.value,
        },

        # 通义千问系列
        "qwen-max": {
            "input_price": 0.0024,
            "output_price": 0.0096,
            "currency": CurrencyType.RMB.value,
        },
        "qwen-plus": {
            "input_price": 0.0008,
            "output_price": 0.002,
            "currency": CurrencyType.RMB.value,
        },
        "qwen-turbo": {
            "input_price": 0.0003,
            "output_price": 0.0006,
            "currency": CurrencyType.RMB.value,
        },
        "qwen-long": {
            "input_price": 0.0005,
            "output_price": 0.002,
            "currency": CurrencyType.RMB.value,
        },
        "qwq-plus": {
            "input_price": 0.0016,
            "output_price": 0.004,
            "currency": CurrencyType.RMB.value,
        },

        # Gemini 模型
        "gemini-2.5-pro-exp": {
            "input_price": 0.00125,
            "output_price": 0.01,
            "currency": CurrencyType.USD.value,
        },
        "gemini-2.5-pro": {
            "input_price": 0.00125,
            "output_price": 0.01,
            "currency": CurrencyType.USD.value,
        },
        "gemini-2.0-flash": {
            "input_price": 0.0001,
            "output_price": 0.0004,
            "currency": CurrencyType.USD.value,
        },

        # 默认后备定价
        "default": {
            "input_price": 0.001,
            "output_price": 0.002,
            "currency": CurrencyType.USD.value
        }
    }

    def __init__(self, custom_pricing: Optional[Dict[str, Dict[str, float]]] = None, 
                 exchange_rate: float = DEFAULT_EXCHANGE_RATE,
                 display_currency: str = CurrencyType.RMB.value):
        """初始化
        
        Args:
            custom_pricing: 自定义模型价格配置，会覆盖默认配置
            exchange_rate: 汇率，用于USD到RMB的转换，默认为7.2
            display_currency: 显示货币，用于报告显示，默认为人民币
        """
        self.pricing = self.DEFAULT_PRICING.copy()
        if custom_pricing:
            for model, price_info in custom_pricing.items():
                self.add_model_pricing(model, price_info)

        self.exchange_rate = exchange_rate
        self.display_currency = display_currency

    def add_model_pricing(self, model_name: str, price_info: Dict[str, Any]) -> None:
        """添加或更新模型价格配置
        
        Args:
            model_name: 模型名称
            price_info: 价格信息字典，包含input_price和output_price
        """
        self.pricing[model_name] = price_info

    def get_model_pricing(self, model_name: str) -> Dict[str, Any]:
        """获取模型的价格配置
        
        Args:
            model_name: 模型名称
            
        Returns:
            Dict: 包含价格信息的字典
        """
        # 尝试获取确切匹配的模型价格
        if model_name in self.pricing:
            return self.pricing[model_name]

        # 尝试前缀匹配
        for key in self.pricing:
            if model_name.startswith(key):
                return self.pricing[key]

        # 返回默认价格
        return self.pricing["default"]

    def get_currency_symbol(self, currency: Optional[str] = None) -> str:
        """获取货币符号
        
        Args:
            currency: 货币代码，默认为显示货币
            
        Returns:
            str: 货币符号
        """
        if currency is None:
            currency = self.display_currency

        if currency == CurrencyType.USD.value:
            return "$"
        elif currency == CurrencyType.RMB.value:
            return "¥"
        else:
            return currency

    def convert_currency(self, amount: float, from_currency: str, to_currency: str) -> float:
        """转换货币
        
        Args:
            amount: 金额
            from_currency: 原始货币
            to_currency: 目标货币
            
        Returns:
            float: 转换后的金额
        """
        if from_currency == to_currency:
            return amount

        if from_currency == CurrencyType.USD.value and to_currency == CurrencyType.RMB.value:
            return amount * self.exchange_rate
        elif from_currency == CurrencyType.RMB.value and to_currency == CurrencyType.USD.value:
            return amount / self.exchange_rate
        else:
            # 不支持的货币转换
            return amount

    def calculate_cost(self, model_name: str, input_tokens: int, output_tokens: int, 
                       cache_tokens: Optional[Dict[str, int]] = None) -> Tuple[float, str]:
        """计算token使用成本
        
        Args:
            model_name: 模型名称
            input_tokens: 输入token数量
            output_tokens: 输出token数量
            cache_tokens: 缓存token数量，可包含hit和write两个key
            
        Returns:
            Tuple[float, str]: (成本, 货币类型)
        """
        pricing = self.get_model_pricing(model_name)
        input_price = pricing.get("input_price", 0.0)
        output_price = pricing.get("output_price", 0.0)
        currency = pricing.get("currency", CurrencyType.USD.value)

        # 基础成本计算（按千token）
        cost = (input_tokens * input_price + output_tokens * output_price) / 1000

        # 如果有缓存token，计算缓存成本
        if cache_tokens:
            # 处理Claude模型的缓存计费
            if "cache_write_price" in pricing and "write" in cache_tokens:
                cache_write_tokens = cache_tokens.get("write", 0)
                cost += (cache_write_tokens * pricing["cache_write_price"]) / 1000

            if "cache_hit_price" in pricing and "hit" in cache_tokens:
                cache_hit_tokens = cache_tokens.get("hit", 0)
                cost += (cache_hit_tokens * pricing["cache_hit_price"]) / 1000

            # 处理DeepSeek/Qwen模型的缓存计费 (使用cache_hit_price直接处理)
            elif "cache_hit_price" in pricing and "hit" in cache_tokens:
                cache_hit_tokens = cache_tokens.get("hit", 0)
                cost += (cache_hit_tokens * pricing["cache_hit_price"]) / 1000

            # 兼容旧格式的cached字段
            elif "cache_hit_price" in pricing and "cached" in cache_tokens:
                cached_tokens = cache_tokens.get("cached", 0)
                cost += (cached_tokens * pricing["cache_hit_price"]) / 1000

        return cost, currency 
