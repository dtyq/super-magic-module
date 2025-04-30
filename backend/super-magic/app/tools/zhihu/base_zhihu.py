"""
知乎工具基类模块

此模块提供知乎相关工具的基础功能和共享方法，包括HTTP请求处理、
缓存管理、错误处理等通用功能，供其他知乎工具类继承使用。

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
from app.tools.core import BaseTool, BaseToolParams

# 定义参数类型变量
T = TypeVar('T', bound=BaseToolParams)

logger = get_logger(__name__)


class BaseZhihu(BaseTool[T], Generic[T]):
    """知乎工具基类，提供共享的基础功能"""

    # 缓存基础目录
    _base_cache_dir = Path("cache/zhihu")

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

        logger.debug(f"发送请求: {url}, 参数: {params}")

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params, headers=self.headers) as response:
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
                            logger.error(f"知乎API调用失败: {result}")
                            error_msg = result.get("message", "未知错误")
                            raise Exception(f"知乎API调用失败: {error_msg}")
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

    def _convert_html_to_markdown(self, html: str) -> str:
        """将HTML转换为Markdown格式"""
        try:
            # 如果HTML为空，直接返回空字符串
            if not html:
                return ""
            
            # 使用BeautifulSoup解析HTML
            soup = BeautifulSoup(html, 'html.parser')
            
            # 提取文本内容
            content = ""
            
            # 处理段落
            for p in soup.find_all('p'):
                # 获取段落文本
                text = p.get_text().strip()
                if text:
                    content += f"{text}\n\n"
            
            # 处理标题
            for i in range(1, 7):
                for h in soup.find_all(f'h{i}'):
                    text = h.get_text().strip()
                    if text:
                        # 根据标题级别添加#号
                        content += f"{'#' * i} {text}\n\n"
            
            # 处理图片
            for img in soup.find_all('img'):
                src = img.get('src', '')
                alt = img.get('alt', '图片')
                if src:
                    content += f"![{alt}]({src})\n\n"
            
            # 处理链接
            for a in soup.find_all('a'):
                href = a.get('href', '')
                text = a.get_text().strip()
                if href and text:
                    content += f"[{text}]({href})\n\n"
            
            # 处理列表
            for ul in soup.find_all('ul'):
                for li in ul.find_all('li'):
                    text = li.get_text().strip()
                    if text:
                        content += f"- {text}\n"
                content += "\n"
            
            for ol in soup.find_all('ol'):
                for i, li in enumerate(ol.find_all('li')):
                    text = li.get_text().strip()
                    if text:
                        content += f"{i+1}. {text}\n"
                content += "\n"
            
            # 处理引用
            for blockquote in soup.find_all('blockquote'):
                text = blockquote.get_text().strip()
                if text:
                    # 为引用的每一行添加>前缀
                    quoted_text = "\n".join([f"> {line}" for line in text.split("\n")])
                    content += f"{quoted_text}\n\n"
            
            # 处理代码块
            for pre in soup.find_all('pre'):
                code = pre.get_text().strip()
                if code:
                    content += f"```\n{code}\n```\n\n"
            
            # 处理行内代码
            for code in soup.find_all('code'):
                if code.parent.name != 'pre':  # 避免重复处理代码块中的code标签
                    text = code.get_text().strip()
                    if text:
                        content += f"`{text}`"

            # 处理 em
            for em in soup.find_all('em'):
                text = em.get_text().strip()
                if text:
                    content += f"*{text}*"

            # 处理 strong
            for strong in soup.find_all('strong'):
                text = strong.get_text().strip()
                if text:
                    content += f"**{text}**"
            
            # 清理多余的空行
            content = re.sub(r'\n{3,}', '\n\n', content)
            
            return content.strip()
        except Exception as e:
            logger.error(f"HTML转Markdown失败: {e!s}")
            return html  # 如果转换失败，返回原始HTML