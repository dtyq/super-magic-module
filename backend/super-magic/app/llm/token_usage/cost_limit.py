"""
费用限制服务模块

负责管理和检查LLM使用的费用限制
设计已简化：移除了对抽象类的依赖，直接使用具体实现
"""

from typing import Dict, Any, Optional, Tuple

# 使用前向引用避免循环导入
from typing import TYPE_CHECKING

from app.llm.token_usage.report import TokenUsageReport
if TYPE_CHECKING:
    from app.llm.token_usage.tracker import TokenUsageTracker

from app.llm.token_usage.pricing import ModelPricing
from app.llm.token_usage.whitelist import is_user_in_whitelist
from app.llm.exceptions import CostLimitExceededException
from app.logger import get_logger

logger = get_logger(__name__)

class CostLimitService:
    """费用限制服务

    负责设置和检查LLM使用的费用限制
    """

    # 全局单例实例
    _instance = None

    @staticmethod
    def calculate_cost_limit(base_cost_limit: float, sandbox_id: str, token_tracker=None, pricing=None) -> float:
        """计算成本限制

        根据基础成本限制和当前使用情况计算调整后的总成本限制
        如果能获取到当前cost报告并且cost大于0，则取最接近cost的(整数倍 * base_cost_limit)作为限额

        Args:
            base_cost_limit: 基础成本限制值
            sandbox_id: 沙箱ID
            token_tracker: token使用跟踪器，可选
            pricing: 模型价格配置，可选

        Returns:
            float: 计算后的成本限制值
        """
        total_cost_limit = base_cost_limit

        report_instance = TokenUsageReport.get_instance(
            sandbox_id=sandbox_id,
            token_tracker=token_tracker,
            pricing=pricing
        )

        cost_report = report_instance.get_cost_report()

        current_cost = cost_report.get("total", {}).get("cost", 0)

        if current_cost > 0:
            multiplier = (int(current_cost / base_cost_limit) + 1)
            total_cost_limit = multiplier * base_cost_limit

        return total_cost_limit

    @classmethod
    def get_instance(cls) -> 'CostLimitService':
        return cls._instance

    @classmethod
    def create_instance(cls, token_tracker: 'TokenUsageTracker', pricing: ModelPricing,
                     sandbox_id: str, total_cost_limit: Optional[float] = None,
                     currency: str = "CNY", single_task_cost_limit: Optional[float] = None) -> 'CostLimitService':
        """获取单例实例

        Args:
            token_tracker: token使用跟踪器
            pricing: 模型价格配置
            sandbox_id: 沙箱ID
            cost_limit: 可选的费用上限，如果提供则设置限制
            currency: 货币类型，默认为人民币
            single_task_cost_limit: 可选的单次任务费用上限

        Returns:
            CostLimitService: 单例实例

        Raises:
            ValueError: 如果未提供token_tracker或pricing，或sandbox_id无效
        """
        if cls._instance is None:
            cls._instance = cls(token_tracker, pricing, sandbox_id, total_cost_limit, currency, single_task_cost_limit)

        return cls._instance

    def __init__(self, token_tracker: 'TokenUsageTracker', pricing: ModelPricing,
                 sandbox_id: str, cost_limit: Optional[float] = None,
                 currency: str = "CNY", single_task_cost_limit: Optional[float] = None):
        """初始化费用限制服务

        Args:
            token_tracker: token使用跟踪器
            pricing: 模型价格配置
            sandbox_id: 沙箱ID
            cost_limit: 可选的费用上限，如果提供则立即设置限制
            currency: 货币类型，默认为人民币
            single_task_cost_limit: 可选的单次任务费用上限，如果提供则立即设置限制
        """
        self.total_cost_limit = cost_limit
        self.cost_limit_currency = currency
        self.single_task_cost_limit = single_task_cost_limit  # 单次任务的费用上限

        self.token_tracker = token_tracker
        self.pricing = pricing
        self.sandbox_id = sandbox_id

        if cost_limit is not None:
            logger.info(f"已设置费用限制: {cost_limit} {currency}")

        if single_task_cost_limit is not None:
            logger.info(f"已设置单次任务费用限制: {single_task_cost_limit} {currency}")

    def set_total_cost_limit(self, limit: float, currency: str = "CNY") -> None:
        """设置费用限制

        Args:
            limit: 费用上限
            currency: 货币类型，默认为人民币
        """
        self.total_cost_limit = limit
        self.cost_limit_currency = currency
        logger.info(f"已设置费用限制: {limit} {currency}")

    def set_single_task_cost_limit(self, limit: float) -> None:
        """设置单次任务费用限制

        Args:
            limit: 单次任务费用上限
        """
        self.single_task_cost_limit = limit
        logger.info(f"已设置单次任务费用限制: {limit} {self.cost_limit_currency}")

    def is_user_in_whitelist(self, user_id: Optional[str]) -> bool:
        """检查用户是否在白名单中

        Args:
            user_id: 用户ID

        Returns:
            bool: 用户是否在白名单中
        """
        return is_user_in_whitelist(user_id)

    def is_total_cost_limit_reached(self) -> Tuple[bool, float]:
        """检查当前成本是否已达到限制

        Returns:
            Tuple[bool, float]: 是否达到费用限制，当前成本
        """
        if self.total_cost_limit is None:
            return False, 0

        from app.llm.token_usage.report import TokenUsageReport

        report_generator = TokenUsageReport.get_instance(self.sandbox_id, self.token_tracker, self.pricing)
        cost_report = report_generator.get_cost_report()

        current_cost = cost_report["total"]["cost"]
        currency_code = cost_report["currency"]["code"]

        if currency_code != self.cost_limit_currency:
            current_cost = self.pricing.convert_currency(current_cost, currency_code, self.cost_limit_currency)

        return current_cost >= self.total_cost_limit, current_cost

    def increase_cost_limit(self) -> None:
        """增加费用限制

        增加指定金额的费用限制
        只有在当前成本已达到限制时才允许增加（即当前成本 >= cost_limit）

        Args:
            amount: 增加的金额

        Returns:
            None
        """
        # 检查是否已达到限制，只有达到限制才允许增加
        is_reached, current_cost = self.is_total_cost_limit_reached()
        if not is_reached:
            return

        new_limit_value = self.total_cost_limit + self.single_task_cost_limit

        old_limit = self.total_cost_limit
        self.set_total_cost_limit(new_limit_value, self.cost_limit_currency)
        logger.info(f"已增加费用限制: {old_limit} -> {new_limit_value} {self.cost_limit_currency}")

    def check_total_cost_limit(self, user_id: Optional[str] = None) -> None:
        """检查是否超过费用限制，超过则抛出异常

        Args:
            user_id: 用户ID，用于白名单检查

        Returns:
            None

        Raises:
            CostLimitExceededException: 当费用超出限制时抛出
        """
        if self.total_cost_limit is None or self.is_user_in_whitelist(user_id):
            return

        is_reached, current_cost = self.is_total_cost_limit_reached()
        if is_reached:
            raise CostLimitExceededException(
                current_cost=current_cost,
                total_cost_limit=self.total_cost_limit,
                currency=self.cost_limit_currency,
                sandbox_id=self.sandbox_id,
            )
