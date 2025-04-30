"""
Token使用报告模块

负责将TokenUsageTracker中的数据生成报告
"""

import json
import os
from datetime import datetime
from typing import Any, Dict, List, Optional

from app.llm.token_usage.pricing import ModelPricing
from app.logger import get_logger
from app.paths import PathManager

# 为避免循环导入，使用字符串类型注解
from typing import TYPE_CHECKING, Union
if TYPE_CHECKING:
    from app.llm.token_usage.tracker import TokenUsageTracker

logger = get_logger(__name__)

class TokenUsageReport:
    """Token使用统计报告生成器

    负责将TokenUsageTracker中的数据生成各种格式的报告
    支持按照sandbox_id维度汇总token使用情况
    作为TokenUsageTracker的辅助类，提供报告生成和持久化功能
    设计简化：移除了抽象类依赖，直接使用具体实现
    """

    # 保存全局的报告实例，按sandbox_id索引
    _instances = {}

    @classmethod
    def get_instance(cls, sandbox_id: str = "default", token_tracker: Optional[Any] = None,
                     pricing: Optional[ModelPricing] = None,
                    report_dir: str = None) -> 'TokenUsageReport':
        """获取或创建指定sandbox_id的TokenUsageReport实例

        Args:
            sandbox_id: 沙箱ID
            token_tracker: token使用跟踪器
            pricing: 模型价格配置
            report_dir: 报告文件保存目录，默认为None表示使用默认目录

        Returns:
            TokenUsageReport: 对应sandbox_id的实例
        """
        if sandbox_id not in cls._instances:
            # 没有提供pricing时创建默认实例
            if pricing is None:
                from app.llm.token_usage.pricing import ModelPricing
                pricing = ModelPricing()

            # 创建实例
            cls._instances[sandbox_id] = cls(token_tracker, pricing, sandbox_id, report_dir)

            # 设置token_tracker的report_manager（如果提供了）
            if token_tracker:
                token_tracker.set_report_manager(cls._instances[sandbox_id])

        return cls._instances[sandbox_id]

    def __init__(self, token_tracker: Optional[Any], pricing: ModelPricing,
                sandbox_id: str = "default", report_dir: str = None):
        """初始化

        Args:
            token_tracker: token使用跟踪器
            pricing: 模型价格配置
            sandbox_id: 沙箱ID，用于区分不同的使用环境
            report_dir: 报告文件保存目录，默认为None表示使用默认目录
        """
        self.token_tracker = token_tracker
        self.pricing = pricing
        self.sandbox_id = sandbox_id
        self.report_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        # 使用 PathManager 获取聊天历史目录
        self.report_dir = PathManager.get_chat_history_dir()
        # 确保报告目录存在
        os.makedirs(self.report_dir, exist_ok=True)

    def get_report_file_path(self) -> str:
        """获取报告文件的路径

        Returns:
            str: 报告文件的完整路径
        """
        # 使用沙箱ID创建唯一的文件名
        file_name = f"{self.sandbox_id}_token_usage.json"
        return os.path.join(self.report_dir, file_name)

    def _get_or_create_report_data(self, file_path: str) -> Dict[str, Any]:
        """获取现有报告数据或创建新的报告数据结构

        尝试从文件加载现有数据，如果不存在则创建新结构
        Args:
            file_path: 报告文件路径
        Returns:
            Dict: 报告数据结构
        """
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        display_currency = self.pricing.display_currency
        currency_symbol = self.pricing.get_currency_symbol()

        # 尝试从文件加载现有数据
        try:
            if os.path.exists(file_path):
                with open(file_path, 'r', encoding='utf-8') as f:
                    return json.load(f)

        except Exception as e:
            logger.error(f"读取现有token使用报告失败: {e!s}")

        # 文件不存在或读取失败，创建新结构
        return {
            "timestamp": current_time,
            "models": [],
            "total": {
                "input_tokens": 0,
                "output_tokens": 0,
                "cached_tokens": 0,
                "total_tokens": 0,
                "cost": 0.0
            },
            "currency": {
                "code": display_currency,
                "symbol": currency_symbol
            }
        }

    def _process_model_usage(self, model_name: str, usage: Dict[str, int]) -> Dict[str, Any]:
        """处理单个模型的使用数据

        计算成本并构建模型报告

        Args:
            model_name: 模型名称
            usage: 使用数据字典

        Returns:
            Dict: 包含处理结果的字典，包括模型报告和累计值
        """
        # 获取基本token数量
        model_input = usage.get("input", 0)
        model_output = usage.get("output", 0)
        model_cached = usage.get("cached", 0)
        model_cache_write = usage.get("cache_write", 0)
        model_cache_hit = usage.get("cache_hit", 0)

        # 计算总token数
        model_total = model_input + model_output + model_cached + model_cache_write + model_cache_hit

        # 准备缓存参数
        cache_params = None
        if model_cached > 0:
                    cache_params = {"hit": model_cached}
        elif model_cache_write > 0 or model_cache_hit > 0:
                    cache_params = {"write": model_cache_write, "hit": model_cache_hit}

        # 计算成本并转换货币
        display_currency = self.pricing.display_currency
        cost, currency = self.pricing.calculate_cost(
            model_name, model_input, model_output, cache_tokens=cache_params
        )

        if currency != display_currency:
            cost = self.pricing.convert_currency(cost, currency, display_currency)

        # 创建模型报告
        model_data = {
            "model_name": model_name,
            "input_tokens": model_input,
            "output_tokens": model_output,
            "total_tokens": model_total,
            "cost": cost,
            "original_currency": currency
        }

        # 添加缓存相关数据
        if model_cached > 0:
            model_data["cached_tokens"] = model_cached
        if model_cache_write > 0:
            model_data["cache_write_tokens"] = model_cache_write
        if model_cache_hit > 0:
            model_data["cache_hit_tokens"] = model_cache_hit

        # 返回处理结果和累计值
        return {
            "model_data": model_data,
            "input_total": model_input,
            "output_total": model_output,
            "cached_total": model_cached,
            "total_tokens": model_total,
            "cost_total": cost
        }

    def _update_existing_model(self, model_data: Dict[str, Any], new_data: Dict[str, Any]) -> None:
        """更新现有模型数据

        将新的使用数据累加到现有模型数据中

        Args:
            model_data: 现有模型数据
            new_data: 新的模型数据
        """
        # 累加基本字段
        model_data["input_tokens"] += new_data["input_tokens"]
        model_data["output_tokens"] += new_data["output_tokens"]
        model_data["total_tokens"] += new_data["total_tokens"]
        model_data["cost"] += new_data["cost"]

        # 累加缓存字段
        for field in ["cached_tokens", "cache_write_tokens", "cache_hit_tokens"]:
            if field in new_data:
                if field in model_data:
                    model_data[field] += new_data[field]
                else:
                    model_data[field] = new_data[field]

    def _update_report_totals(self, report_data: Dict[str, Any], new_totals: Dict[str, Any]) -> None:
        """更新报告总计数据

        将新的总计数据累加到报告中

        Args:
            report_data: 报告数据
            new_totals: 新的总计数据
        """
        report_data["total"]["input_tokens"] += new_totals["input_total"]
        report_data["total"]["output_tokens"] += new_totals["output_total"]
        report_data["total"]["total_tokens"] += new_totals["total_tokens"]
        report_data["total"]["cost"] += new_totals["cost_total"]

        # 更新缓存总计
        if new_totals["cached_total"] > 0:
            if "cached_tokens" in report_data["total"]:
                report_data["total"]["cached_tokens"] += new_totals["cached_total"]
            else:
                report_data["total"]["cached_tokens"] = new_totals["cached_total"]

        # 更新时间戳
        report_data["timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    def _save_report_data(self, file_path: str, report_data: Dict[str, Any]) -> bool:
        """保存报告数据到文件

        Args:
            file_path: 文件路径
            report_data: 报告数据

        Returns:
            bool: 是否保存成功
        """

        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(report_data, f, ensure_ascii=False, indent=2)
            logger.info(f"保存token使用报告到文件成功: {file_path}")
            return True
        except Exception as e:
            logger.error(f"保存token使用报告到文件失败: {e!s}")
            return False

    def update_and_save_usage(self, model: str, input_tokens: int, output_tokens: int,
                             cached_tokens: Optional[Dict[str, int]] = None) -> None:
        """更新并保存当前token使用情况到JSON文件

        在每次LLM调用后调用此方法，实时更新JSON文件中的使用数据
        同时记录当前调用使用的tokens

        Args:
            model: 模型名称
            input_tokens: 输入token数量
            output_tokens: 输出token数量
            cached_tokens: 缓存token数量，格式为 {"write": write_tokens, "hit": hit_tokens}
        """
        # 检查是否有token_tracker
        if not self.token_tracker:
            logger.error(f"无法更新token使用情况，未设置token_tracker")
            return

        # 获取文件路径
        file_path = self.get_report_file_path()

        # 获取或创建报告数据
        report_data = self._get_or_create_report_data(file_path)

        # 创建模型索引用于快速查找
        existing_models = {model["model_name"]: model for model in report_data.get("models", [])}

        # 获取所有模型的使用情况并更新数据
        usage_data = self.token_tracker.get_usage_data()

        # 存储当前累计使用量
        total_stats = {
            "input_total": 0,
            "output_total": 0,
            "cached_total": 0,
            "total_tokens": 0,
            "cost_total": 0.0
        }

        # 处理每个模型的数据
        for model_name, usage in usage_data.items():
            # 处理模型使用数据
            result = self._process_model_usage(model_name, usage)

            # 更新累计值
            total_stats["input_total"] += result["input_total"]
            total_stats["output_total"] += result["output_total"]
            total_stats["cached_total"] += result["cached_total"]
            total_stats["total_tokens"] += result["total_tokens"]
            total_stats["cost_total"] += result["cost_total"]

            model_data = result["model_data"]

            # 更新或添加模型数据
            if model_name in existing_models:
                # 更新现有模型
                self._update_existing_model(existing_models[model_name], model_data)
            else:
                # 添加新模型
                report_data["models"].append(model_data)

        # 更新总计数据
        self._update_report_totals(report_data, total_stats)

        # 保存到文件
        self._save_report_data(file_path, report_data)
        
        # 重置累计使用量，避免下次再次累加
        self.token_tracker.reset()

    def format_report(self, report: Dict[str, Any]) -> str:
        """格式化报告为可读字符串

        Args:
            report: 报告对象，可以是get_cost_report或generate_report生成的报告

        Returns:
            str: 格式化后的报告字符串
        """
        # 检测报告类型 - 是整体cost报告还是单条usage报告
        if "models" in report:
            # 这是整体成本报告
            currency_symbol = report["currency"]["symbol"]

            formatted = "Token使用统计报告\n"
            formatted += "-" * 40 + "\n"

            # 添加每个模型的使用情况
            for model in report["models"]:
                formatted += f"模型: {model['model_name']}"

                formatted += f"  输入tokens: {model['input_tokens']}"
                formatted += f"  输出tokens: {model['output_tokens']}"

                # 添加缓存相关信息
                if "cached_tokens" in model:
                    formatted += f"  缓存命中tokens: {model['cached_tokens']}"
                if "cache_write_tokens" in model:
                    formatted += f"  缓存写入tokens: {model['cache_write_tokens']}"
                if "cache_hit_tokens" in model:
                    formatted += f"  缓存命中tokens: {model['cache_hit_tokens']}"

                formatted += f"  总tokens: {model['total_tokens']}"
                formatted += f"  估算成本: {currency_symbol}{model['cost']:.6f}\n"

            # 添加总计
            formatted += f"总输入tokens: {report['total']['input_tokens']}"
            formatted += f"  总输出tokens: {report['total']['output_tokens']}"
            if report['total']['cached_tokens'] > 0:
                formatted += f"  总缓存tokens: {report['total']['cached_tokens']}"
            formatted += f"  所有tokens总计: {report['total']['total_tokens']}"
            formatted += f"  总估算成本: {currency_symbol}{report['total']['cost']:.6f}"

            return formatted
        else:
            # 这是单条使用报告
            model = report["model"]
            usage = report["usage"]
            cost_info = report["cost"]

            currency_symbol = cost_info.get("currency_symbol", "$")

            lines = [
                f"模型: {model}",
                f"输入tokens: {usage['input_tokens']:,}",
                f"输出tokens: {usage['output_tokens']:,}",
                f"总tokens: {usage['total_tokens']:,}",
            ]

            # 添加缓存token信息（如果有）
            if "cached_tokens" in usage:
                cached = usage["cached_tokens"]
                if isinstance(cached, dict):
                    if "write" in cached:
                        lines.append(f"缓存写入tokens: {cached['write']:,}")
                    if "hit" in cached:
                        lines.append(f"缓存命中tokens: {cached['hit']:,}")
                else:
                    lines.append(f"缓存tokens: {cached:,}")

            # 添加成本信息
            lines.append(f"成本: {currency_symbol}{cost_info['amount']:.6f}")

            # 添加元数据（如果有）
            if "metadata" in report:
                lines.append("\n元数据:")
                for key, value in report["metadata"].items():
                    lines.append(f"  {key}: {value}")

            return "\n".join(lines)

    def get_cost_report(self) -> Dict[str, Any]:
        """获取token使用和成本报告
        
        从持久化文件中获取报告数据，不再重新生成

        Returns:
            Dict: 包含token使用和成本信息的字典
        """
        # 获取报告文件路径
        file_path = self.get_report_file_path()
        
        # 从文件中获取报告数据
        report_data = self._get_or_create_report_data(file_path)
        
        return report_data

