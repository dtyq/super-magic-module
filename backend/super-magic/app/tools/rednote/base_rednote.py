"""
小红书工具基类模块

此模块提供小红书相关工具的基础功能和共享方法，包括HTTP请求处理、
缓存管理、错误处理等通用功能，供其他小红书工具类继承使用。

最后更新: 2024-06-14
"""

import json
import re
import time
import traceback
from pathlib import Path
from typing import Any, Dict, Generic, Optional, TypeVar

import aiohttp
from bs4 import BeautifulSoup
import html2text

from app.core.config_manager import config
from app.logger import get_logger
from app.tools.core import BaseToolParams
from app.tools.core.base_tool import BaseTool

# 定义参数类型变量
T = TypeVar('T', bound=BaseToolParams)

logger = get_logger(__name__)


class BaseRednote(BaseTool[T], Generic[T]):
    """小红书工具基类，提供共享的基础功能"""

    # 缓存基础目录
    _base_cache_dir = Path(".cache/rednote")

    def __init__(self, **data):
        # 调用父类初始化方法
        super().__init__(**data)
        # 初始化参数
        self.base_url = "https://api.tikhub.io"
        self.api_key = None
        # 初始化时不设置字段值，懒加载
        self._html2text_converter = None

    @property
    def headers(self) -> Dict[str, str]:
        """获取请求头"""
        if self.api_key is None:
            self.api_key = config.get("tikhub.api_key")
            if not self.api_key:
                raise ValueError("未在配置文件中找到tikhub.api_key")

        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    async def _make_request(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """发送HTTP请求并获取响应"""
        url = f"{self.base_url}{endpoint}"

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=self.headers) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"请求失败，状态码: {response.status}, 响应: {error_text}")
                        raise Exception(f"请求失败，状态码: {response.status}")

                    result = await response.json()

                    # 检查响应状态
                    if isinstance(result, dict):
                        if result.get("code") == 200 or "data" in result:
                            return result.get("data", {})
                        else:
                            logger.error(f"小红书API调用失败: {result}")
                            error_msg = result.get("message", "未知错误")
                            raise Exception(f"小红书API调用失败: {error_msg}")
                    elif isinstance(result, list):
                        # 有些API可能直接返回列表
                        return result
                    else:
                        # 对于不是字典或列表的返回值，直接返回
                        return result
        except aiohttp.ClientError as e:
            logger.error(f"HTTP请求错误: {e!s}")
            raise
        except Exception as e:
            logger.error(f"请求异常: {e!s}")
            # 记录更详细的错误信息用于调试
            logger.debug(f"错误详情: {traceback.format_exc()}")
            raise