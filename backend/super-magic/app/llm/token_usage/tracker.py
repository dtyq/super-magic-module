"""
Token使用跟踪模块

提供LLM请求Token使用情况的跟踪功能
"""

import threading
import logging
from typing import Any, Dict, Optional
from datetime import datetime
import os

from app.llm.token_usage.report import TokenUsageReport

logger = logging.getLogger(__name__)

class TokenUsageTracker:
    """Token用量跟踪器
    
    跟踪LLM请求的token用量，支持多线程安全的累计统计
    负责从LLM响应中提取token使用信息
    设计简化：移除了抽象类，直接实现具体功能
    """

    def __init__(self):
        """初始化Token用量跟踪器"""
        # 使用字典记录每个模型的token使用情况: {model_name: {input: count, output: count, cached: count, ...}}
        self._usage = {}
        # 使用锁确保线程安全
        self._lock = threading.Lock()
        # 报告管理器
        self._report_manager: TokenUsageReport = None

    def add_usage(self, model_name: str, input_tokens: int, output_tokens: int, 
                 cached_tokens: int = 0, cache_write_tokens: int = 0, cache_hit_tokens: int = 0) -> None:
        """添加token使用记录
        
        Args:
            model_name: 模型名称
            input_tokens: 输入token数量
            output_tokens: 输出token数量
            cached_tokens: 缓存命中token数量(用于DeepSeek/Qwen)，默认为0
            cache_write_tokens: 缓存写入token数量(用于Claude)，默认为0
            cache_hit_tokens: 缓存命中token数量(用于Claude)，默认为0
        """
        with self._lock:
            if model_name not in self._usage:
                self._usage[model_name] = {"input": 0, "output": 0}

            # 累加基本使用量
            self._usage[model_name]["input"] += input_tokens
            self._usage[model_name]["output"] += output_tokens

            # 记录缓存相关使用量
            if cached_tokens > 0:
                if "cached" not in self._usage[model_name]:
                    self._usage[model_name]["cached"] = 0
                self._usage[model_name]["cached"] += cached_tokens

            if cache_write_tokens > 0:
                if "cache_write" not in self._usage[model_name]:
                    self._usage[model_name]["cache_write"] = 0
                self._usage[model_name]["cache_write"] += cache_write_tokens

            if cache_hit_tokens > 0:
                if "cache_hit" not in self._usage[model_name]:
                    self._usage[model_name]["cache_hit"] = 0
                self._usage[model_name]["cache_hit"] += cache_hit_tokens

    def extract_token_usage_data(self, response_usage) -> Dict[str, Any]:
        """从LLM响应对象中仅提取token使用数据，不更新跟踪器
        
        与extract_usage_from_response不同，此方法不会添加使用记录，
        只提取数据便于其他模块使用。
        
        Args:
            response_usage: LLM响应对象的usage属性
            
        Returns:
            Dict: 提取的token使用数据，格式如：
                {
                    "extracted": True/False,
                    "input_tokens": 123,
                    "output_tokens": 456,
                    "cached_tokens": 0,
                    "cache_write_tokens": 0,
                    "cache_hit_tokens": 0
                }
        """
        if not hasattr(response_usage, 'prompt_tokens') or not response_usage.prompt_tokens:
            logger.warning("无法从响应中提取token使用情况")
            return {"extracted": False}
            
        # 提取基本token信息
        input_tokens = getattr(response_usage, 'prompt_tokens', 0)
        output_tokens = getattr(response_usage, 'completion_tokens', 0)
        total_tokens = getattr(response_usage, 'total_tokens', input_tokens + output_tokens)

        # 检查是否有缓存相关信息
        cached_tokens = 0
        cache_write_tokens = 0
        cache_hit_tokens = 0

        # 处理不同模型的缓存token格式
        if hasattr(response_usage, 'prompt_tokens_details'):
            prompt_details = response_usage.prompt_tokens_details

            # Qwen/DeepSeek格式
            if hasattr(prompt_details, 'cached_tokens'):
                cached_tokens = getattr(prompt_details, 'cached_tokens', 0)

            # Claude格式
            if hasattr(prompt_details, 'cache_write_input_tokens'):
                cache_write_tokens = getattr(prompt_details, 'cache_write_input_tokens', 0)
            if hasattr(prompt_details, 'cache_read_input_tokens'):
                cache_hit_tokens = getattr(prompt_details, 'cache_read_input_tokens', 0)
        
        # 返回提取的数据，但不更新跟踪器
        result = {
            "extracted": True,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "total_tokens": total_tokens,
        }
        
        # 只添加有值的缓存字段
        if cached_tokens > 0:
            result["cached_tokens"] = cached_tokens
        if cache_write_tokens > 0:
            result["cache_write_tokens"] = cache_write_tokens
        if cache_hit_tokens > 0:
            result["cache_hit_tokens"] = cache_hit_tokens
            
        return result

    def extract_usage_from_response(self, response_usage, model_id: str) -> Dict[str, Any]:
        """从LLM响应对象中提取token使用情况
        
        与extract_token_usage_data的区别是，此方法会添加model_id到返回结果中，
        但不会记录使用情况到跟踪器中。
        
        Args:
            response_usage: LLM响应对象的usage属性
            model_id: 模型ID
            
        Returns:
            Dict: 提取的token使用情况，包含model_id
        """
        # 使用通用方法提取token数据
        usage_data = self.extract_token_usage_data(response_usage)
        
        if not usage_data["extracted"]:
            logger.warning(f"无法从响应中提取token使用情况，模型ID: {model_id}")
            return {"extracted": False}
        
        # 结果中添加model_id字段
        usage_data["model_id"] = model_id
        
        return usage_data
        
    def record_llm_usage(self, response_usage, model_id: str, user_id: Optional[str] = None, model_name: Optional[str] = None) -> Dict[str, Any]:
        """记录LLM使用情况，并生成报告（如果有报告管理器）
        
        这是外部代码应该调用的主要方法，完成提取、记录和报告的全部流程
        
        Args:
            response_usage: LLM响应对象的usage属性
            model_id: 模型ID
            user_id: 用户ID，可选
            model_name: 模型名称，可选
            
        Returns:
            Dict: 记录结果
            
        Notes:
            每次调用都会将token使用情况累加到跟踪器中，累计数据会在
            report_manager的update_and_save_usage方法中被重置，
            以避免重复计算和重复累加到JSON文件。
        """
        # 从响应中提取token使用情况
        usage_data = self.extract_usage_from_response(response_usage, model_id)
        
        if not usage_data["extracted"]:
            return {"recorded": False}
            
        # 添加使用记录到跟踪器
        self.add_usage(
            model_id,
            usage_data["input_tokens"],
            usage_data["output_tokens"],
            cached_tokens=usage_data.get("cached_tokens", 0),
            cache_write_tokens=usage_data.get("cache_write_tokens", 0),
            cache_hit_tokens=usage_data.get("cache_hit_tokens", 0)
        )
        
        # 如果有报告管理器，则生成报告
        if self._report_manager:
            # 准备缓存tokens参数
            cache_tokens_param = None
            if usage_data.get("cached_tokens", 0) > 0:
                cache_tokens_param = {"hit": usage_data["cached_tokens"]}
            elif usage_data.get("cache_write_tokens", 0) > 0 or usage_data.get("cache_hit_tokens", 0) > 0:
                cache_tokens_param = {"write": usage_data.get("cache_write_tokens", 0), "hit": usage_data.get("cache_hit_tokens", 0)}
            
            # 更新并保存报告
            self._report_manager.update_and_save_usage(
                model_id,
                usage_data["input_tokens"],
                usage_data["output_tokens"],
                cached_tokens=cache_tokens_param
            )
        
        logger.info(f"Token 使用情况: {usage_data}")

        # 返回处理结果
        return {
            "recorded": True,
            "model_id": model_id,
            "model_name": model_name,
            **usage_data
        }

    def set_report_manager(self, report_manager: TokenUsageReport) -> None:
        """设置报告管理器
        
        Args:
            report_manager: TokenUsageReport 实例
        """
        self._report_manager = report_manager

    def get_usage_data(self) -> Dict[str, Dict[str, int]]:
        """获取所有使用数据
        
        Returns:
            Dict: 所有模型的使用数据，格式为 {model_name: {input: count, output: count, ...}}
        """
        with self._lock:
            # 返回副本避免外部修改
            return {k: v.copy() for k, v in self._usage.items()}

    def reset(self) -> None:
        """重置所有使用统计"""
        with self._lock:
            self._usage.clear()
            logger.info("TokenUsageTracker已重置")

    def extract_chat_history_usage_data(self, chat_response) -> Dict[str, Any]:
        """从LLM响应对象中提取处理好的token使用数据，用于chat_history
        
        为agent.py提供的便捷方法，从LLM响应中提取token使用数据但不记录到使用统计中
        
        Args:
            chat_response: 完整的LLM响应对象
            
        Returns:
            Dict: 处理好可直接用于chat_history的token使用数据，没有提取到则返回空字典
        """
        try:
            # 检查是否有usage属性
            if not hasattr(chat_response, 'usage') or not chat_response.usage:
                return {}
            
            # 使用模型ID "chat_history_usage"只是为了提供一个标识符
            # 由于我们不记录usage，这个ID不会被实际使用
            usage_data = self.extract_usage_from_response(chat_response.usage, "chat_history_usage")
            
            # 检查是否成功提取
            if not usage_data.get("extracted", False):
                return {}
                
            # 移除extracted标志和model_id，只保留实际数据
            usage_data.pop("extracted", None)
            usage_data.pop("model_id", None)
            
            # 返回处理好的数据
            return usage_data
            
        except Exception as e:
            # 所有异常情况都安全处理，返回空字典
            logger.warning(f"提取chat_history的token使用数据时出错: {e}")
            return {}

    def get_formatted_report(self) -> str:
        """获取格式化的报告（一步到位）
        
        简化设计：整合多步操作为一个调用，提供更简洁的接口
        无需关心内部实现细节，一步获取格式化的完整报告
        
        Returns:
            str: 格式化的报告字符串
        """
        try:
            # 检查是否有报告管理器
            if not self._report_manager:
                return "当前没有Token使用数据（未设置报告管理器）"
                
            # 直接获取报告并格式化
            report_data = self._report_manager.get_cost_report()
            
            if not report_data or not report_data.get("models"):
                return "当前没有Token使用数据"
                
            # 格式化报告
            formatted_report = self._report_manager.format_report(report_data)
            if not formatted_report:
                return "无法格式化Token使用报告数据"
                
            return formatted_report
        except Exception as e:
            logger.error(f"获取格式化报告时出错: {e!s}", exc_info=True)
            return f"生成报告时发生错误: {e!s}" 