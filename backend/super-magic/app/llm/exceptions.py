"""
LLM 模块的异常定义
"""

from datetime import datetime
from typing import Dict, Optional, Any

class CostLimitExceededException(BaseException):
    """费用超出限制异常

    在LLM使用费用超出预设限制时抛出此异常。
    异常包含当前费用、费用限制和货币类型等信息，可用于向用户展示费用超限警告。
    """

    # 错误代码
    ERROR_CODE = "COST_LIMIT_EXCEEDED"

    # 货币符号映射
    CURRENCY_SYMBOLS = {
        "CNY": "¥",
        "USD": "$",
        "EUR": "€",
        "GBP": "£",
        "JPY": "¥"
    }

    def __init__(self,
                current_cost: float,
                total_cost_limit: float,
                currency: str = "CNY",
                sandbox_id: str = "default_sandbox",
                models_usage: Optional[Dict[str, Any]] = None):
        """初始化费用超限异常

        Args:
            current_cost: 当前累计费用
            cost_limit: 设定的费用上限
            currency: 货币类型，默认为人民币(CNY)
            sandbox_id: 沙箱ID
            models_usage: 各模型的使用情况，可用于详细展示
        """
        self.message = ""
        self.error_code = self.ERROR_CODE
        self.timestamp = datetime.now()

        self.current_cost = current_cost
        self.total_cost_limit = total_cost_limit
        self.currency = currency
        self.sandbox_id = sandbox_id
        self.models_usage = models_usage or {}

        # 获取货币符号
        currency_symbol = self.CURRENCY_SYMBOLS.get(currency, "$")

        # 构造错误消息
        self.message = (
            f"已达到设定的费用限制 ({currency_symbol}{total_cost_limit:.2f} {currency})，"
            f"当前费用: {currency_symbol}{current_cost:.2f}。"
            f"请联系管理员提高限额或等待下个计费周期。"
        )

        # 调用父类初始化
        super().__init__(self.message)

    def get_user_message(self) -> str:
        """获取适合向用户展示的消息

        Returns:
            str: 格式化后的用户友好消息
        """
        currency_symbol = self.CURRENCY_SYMBOLS.get(self.currency, "$")
        return (
            f"⚠️ 费用超限提醒 ⚠️\n\n"
            f"您的API使用费用已达到系统设置的限额：\n"
            f"- 当前费用：{currency_symbol}{self.current_cost:.2f} {self.currency}\n"
            f"- 费用限额：{currency_symbol}{self.total_cost_limit:.2f} {self.currency}\n\n"
            f"为保护您的账户安全，系统已暂停API调用服务。\n"
            f"如需继续使用，请联系管理员提高限额或等待下个计费周期。"
        )
