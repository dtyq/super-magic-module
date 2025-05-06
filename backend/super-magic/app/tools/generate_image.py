"""
图片生成工具

此模块提供调用图片生成服务的能力，通过HTTP请求生成AI图片。

支持的功能:
- 生成AI图片 (generate_image)

最后更新: 2024-09-20
"""

import json
import os
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Union
from urllib.parse import urlparse
from collections import defaultdict

import aiohttp
from pydantic import Field
import asyncio

from app.core.config_manager import config
from app.core.context.tool_context import ToolContext
from app.core.entity.tool.tool_result import ImageToolResult, ToolResult
from app.logger import get_logger
from app.tools.core import BaseTool, BaseToolParams, tool

logger = get_logger(__name__)


class GenerateImageParams(BaseToolParams):
    """图片生成参数"""
    message: str = Field(
        ...,
        description="图片生成提示词，描述您想要的图片内容"
    )
    output_path: str = Field(
        "generated_images",
        description="图片保存目录，默认为 generated_images"
    )
    generated_file_name: str = Field(
        ...,
        description="生成图片的文件名（不含扩展名），用于保存到本地"
    )


@tool()
class GenerateImage(BaseTool[GenerateImageParams]):
    """图片生成工具，提供AI图片生成功能"""

    # 设置参数类
    params_class = GenerateImageParams

    # 设置工具元数据
    name = "generate_image"
    description = "AI图片生成工具，根据文本描述生成图片"
    
    # 记录每个对话生成的图片数量
    _generation_counts = defaultdict(int)
    
    # 单个对话生成图片的最大数量
    MAX_IMAGES_PER_CONVERSATION = 30

    def __init__(self, **data):
        super().__init__(**data)
    
    @property
    def api_url(self) -> str:
        """获取API URL"""
        api_url = config.get("image_generator.api_url")
        if not api_url:
            raise ValueError("未配置图片生成服务API URL")
        return api_url

    @property
    def api_key(self) -> str:
        """获取API密钥"""
        api_key = config.get("image_generator.api_key")
        if not api_key:
            raise ValueError("未配置图片生成服务API密钥")
        return api_key

    @property
    def headers(self) -> Dict[str, str]:
        """获取HTTP请求头"""
        return {
            "api-key": self.api_key,
            "Content-Type": "application/json"
        }

    async def _generate_image(self, message: str, conversation_id: str = "") -> List[str]:
        """
        调用API生成图片
        
        Args:
            message: 生成提示词
            conversation_id: 对话ID
            
        Returns:
            List[str]: 生成的图片URL列表
        """
        payload = {
            "message": message,
            "conversation_id": conversation_id
        }
        
        logger.info(f"请求图片生成服务: message={message}, conversation_id={conversation_id}")
        
        try:
            async with aiohttp.ClientSession() as session:
                logger.debug(f"开始调用图片生成API: {self.api_url}")
                async with session.post(
                    self.api_url,
                    headers=self.headers,
                    json=payload,
                    timeout=60  # 增加超时时间，图片生成可能需要更长时间
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"图片生成请求失败，状态码: {response.status}, 响应: {error_text}")
                        raise Exception(f"图片生成请求失败，状态码: {response.status}, 响应: {error_text[:200]}")
                    
                    result = await response.json()
                    logger.debug(f"图片生成API返回结果: {result}")
                    
                    if result.get("code") != 1000:
                        error_msg = result.get("message", "未知错误")
                        logger.error(f"图片生成API调用失败: {result}")
                        raise Exception(f"图片生成API调用失败: {error_msg}")
                    
                    # 解析返回结果
                    data = result.get("data", {})
                    messages = data.get("messages", [])
                    
                    if not messages:
                        logger.warning("图片生成成功但没有返回任何消息")
                        return []
                    
                    # 从消息中提取图片URL
                    last_message = messages[-1]
                    content = last_message.get("message", {}).get("content", "")
                    logger.debug(f"收到图片内容: {content}")
                    
                    # 内容可能是JSON字符串格式的URL列表
                    try:
                        image_urls = json.loads(content)
                        if isinstance(image_urls, list):
                            # 反转义URL
                            image_urls = [url.replace("\\", "") for url in image_urls]
                            logger.info(f"成功解析图片URLs: {image_urls}")
                            return image_urls
                    except json.JSONDecodeError as e:
                        logger.warning(f"无法解析图片URL内容为JSON: {content}, 错误: {e}")
                    
                    # 如果内容是字符串但不是有效的JSON，尝试直接作为单个URL返回
                    if isinstance(content, str) and content.startswith(('http://', 'https://')):
                        logger.info(f"使用内容作为单个URL: {content}")
                        return [content]
                    
                    # 如果内容不是URL格式，尝试在内容中查找URL
                    if isinstance(content, str):
                        # 尝试用正则表达式查找URL
                        import re
                        urls = re.findall(r'https?://[^\s"\']+', content)
                        if urls:
                            logger.info(f"从内容中提取URLs: {urls}")
                            return urls
                    
                    logger.warning(f"无法从内容中提取图片URL: {content}")
                    return []
                    
        except aiohttp.ClientError as e:
            logger.error(f"HTTP请求错误: {e}")
            raise Exception(f"图片生成请求网络错误: {e}")
        except json.JSONDecodeError as e:
            logger.error(f"解析响应JSON失败: {e}")
            raise Exception(f"解析图片生成响应失败: {e}")
        except Exception as e:
            logger.error(f"图片生成请求异常: {e}")
            raise

    def _get_conversation_id_from_context(self, tool_context: ToolContext) -> str:
        """
        从工具上下文中获取对话ID
        
        Args:
            tool_context: 工具上下文
            
        Returns:
            str: 对话ID
        """
        # 尝试从agent_context获取chat_client_message
        if hasattr(tool_context, 'agent_context') and tool_context.agent_context:
            chat_msg = tool_context.agent_context.get_chat_client_message()
            if chat_msg and hasattr(chat_msg, 'message_id'):
                return chat_msg.message_id
        
        # 如果无法获取，返回空字符串
        return ""
    
    async def _download_image(self, url: str, save_dir: str, custom_filename: str) -> str:
        """
        下载图片并保存到指定目录
        
        Args:
            url: 图片URL
            save_dir: 保存目录
            custom_filename: 自定义文件名（不含扩展名）
            
        Returns:
            str: 保存的图片路径
        """
        # 检查URL是否有效
        if not url or not url.startswith(('http://', 'https://')):
            raise ValueError(f"无效的URL格式: {url}")

        # URL可能包含转义字符，先处理一下
        url = url.replace('\\', '')
        
        # 去除引号
        url = url.strip('"\'')
        
        logger.debug(f"处理后的URL: {url}")
            
        # 确保保存目录存在
        save_path = Path(save_dir)
        save_path.mkdir(parents=True, exist_ok=True)
        
        # 始终使用jpg作为扩展名
        extension = ".jpg"
        
        # 使用自定义文件名
        filename = f"{custom_filename}{extension}"
        file_path = save_path / filename
        
        # 处理文件名冲突
        counter = 1
        while file_path.exists():
            # 如果文件已存在，添加数字后缀
            filename = f"{custom_filename}_{counter}{extension}"
            file_path = save_path / filename
            counter += 1
        
        try:
            async with aiohttp.ClientSession() as session:
                # 添加用户代理头，避免某些网站的限制
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
                
                # 添加超时和重试机制
                retry_count = 3
                current_try = 0
                last_error = None
                
                while current_try < retry_count:
                    try:
                        current_try += 1
                        logger.debug(f"尝试下载图片 (第{current_try}次): {url}")
                        
                        async with session.get(url, headers=headers, allow_redirects=True, timeout=30) as response:
                            if response.status != 200:
                                logger.error(f"图片下载失败，状态码: {response.status}，URL: {url}")
                                raise Exception(f"图片下载失败，状态码: {response.status}")
                            
                            # 检查Content-Type确保是图片
                            content_type = response.headers.get('Content-Type', '')
                            if not content_type.startswith('image/'):
                                logger.warning(f"响应不是图片类型，Content-Type: {content_type}，URL: {url}")
                                # 继续尝试，某些服务器可能未正确设置Content-Type
                            
                            image_data = await response.read()
                            
                            if not image_data:
                                raise Exception(f"下载的图片数据为空")
                            
                            # 保存图片
                            with open(file_path, "wb") as f:
                                f.write(image_data)
                            
                            logger.info(f"图片已保存到: {file_path}")
                            return str(file_path)
                    
                    except aiohttp.ClientError as e:
                        last_error = e
                        logger.warning(f"下载尝试 {current_try}/{retry_count} 失败: {e}，将重试...")
                        await asyncio.sleep(1)  # 等待一秒再重试
                
                # 所有重试都失败
                raise Exception(f"在{retry_count}次尝试后下载图片失败: {last_error}")
                    
        except aiohttp.ClientError as e:
            logger.error(f"图片下载失败（网络错误）: {e}，URL: {url}")
            raise Exception(f"图片下载失败（网络错误）: {e}")
        except Exception as e:
            logger.error(f"图片下载失败: {e}，URL: {url}")
            raise Exception(f"图片下载失败: {e}")
    
    async def execute(self, tool_context: ToolContext, params: GenerateImageParams) -> ImageToolResult:
        """
        执行图片生成
        
        Args:
            tool_context: 工具上下文
            params: 图片生成参数
            
        Returns:
            ImageToolResult: 包含生成图片信息的结果
        """
        # 从上下文中获取对话ID
        conversation_id = self._get_conversation_id_from_context(tool_context)
        logger.info(f"从上下文获取对话ID: {conversation_id}")
        
        # 检查是否超出单个对话的图片生成限制
        current_count = self._generation_counts[conversation_id]
        logger.info(f"当前对话已生成图片数: {current_count}")
        
        if current_count >= self.MAX_IMAGES_PER_CONVERSATION:
            error_message = f"已达单话题最大生成图片次数({self.MAX_IMAGES_PER_CONVERSATION})，请新建新话题继续生成图片"
            logger.warning(error_message)
            return ImageToolResult(
                error=error_message
            )
            
        try:
            # 调用API生成图片
            image_urls = await self._generate_image(params.message, conversation_id)
            logger.info(f"生成的图片URL: {image_urls}")
            if not image_urls:
                return ImageToolResult(
                    error="图片生成失败，未返回任何图片URL",
                )
            
            # 下载图片
            saved_images = []
            failed_downloads = 0
            for idx, url in enumerate(image_urls):
                try:
                    logger.info(f"开始下载第{idx+1}张图片: {url}")
                    
                    # 构建文件名
                    # 对于多张图片，添加索引后缀
                    if len(image_urls) > 1:
                        custom_filename = f"{params.generated_file_name}_{idx+1}"
                    else:
                        custom_filename = params.generated_file_name
                    
                    # 直接使用原始URL进行下载，不修改URL
                    saved_path = await self._download_image(url, params.output_path, custom_filename)
                    saved_images.append(saved_path)
                    logger.info(f"第{idx+1}张图片下载成功，保存路径: {saved_path}")
                except Exception as e:
                    failed_downloads += 1
                    logger.error(f"第{idx+1}张图片下载保存失败: {e}")
            
            # 如果所有图片都下载失败
            if failed_downloads == len(image_urls):
                return ImageToolResult(
                    error="所有图片都下载失败，请检查网络或图片URL",
                )
            
            # 更新生成计数
            # 只计算成功下载的图片数量
            successful_downloads = len(saved_images)
            self._generation_counts[conversation_id] += successful_downloads
            current_count = self._generation_counts[conversation_id]
            logger.info(f"更新后对话({conversation_id})已生成图片数: {current_count}")
            
            # 检查是否接近限制
            remaining = self.MAX_IMAGES_PER_CONVERSATION - current_count
            warning_message = ""
            if remaining <= 5:
                warning_message = f"\n⚠️ 注意：当前话题还可以生成{remaining}张图片，达到{self.MAX_IMAGES_PER_CONVERSATION}张限制后需要新建话题。"
            
            # 构建结果
            # 构建包含每张图片路径的内容
            content = f"成功生成了 {len(image_urls)} 张图片，并储存了 {len(saved_images)} 张到 {params.output_path} 目录"
            if saved_images:
                content += "\n图片路径："
                for i, path in enumerate(saved_images):
                    content += f"\n{i+1}. {path}"
                    
            # 添加警告信息
            if warning_message:
                content += warning_message
                
            result = ImageToolResult(
                images=image_urls,  # 使用新的images字段存储所有图片URL
                content=content
            )
            
            # 如果有保存的图片路径，添加到额外信息中
            if saved_images:
                result.extra_info = {
                    "saved_images": saved_images,
                    "conversation_id": conversation_id,
                    "remaining_generations": remaining
                }
            else:
                result.extra_info = {
                    "conversation_id": conversation_id,
                    "remaining_generations": remaining
                }
            
            return result
            
        except Exception as e:
            logger.error(f"图片生成失败: {e}")
            return ImageToolResult(
                error=f"图片生成失败: {e}",
            )
            
    async def get_after_tool_call_friendly_content(
        self, 
        tool_context: ToolContext, 
        result: ToolResult, 
        execution_time: float, 
        arguments: Dict[str, Any] = None
    ) -> str:
        """自定义工具执行后的友好输出内容"""
        if result.error:
            return f"图片生成失败：{result.error}"
        
        if isinstance(result, ImageToolResult) and result.images:
            image_count = len(result.images)
            saved_images = result.extra_info.get("saved_images", []) if result.extra_info else []
            
            # 获取剩余可生成次数
            remaining = result.extra_info.get("remaining_generations", 0) if result.extra_info else 0
            remaining_info = ""
            if remaining <= 5:
                remaining_info = f"（当前话题还可生成{remaining}张图片）"
            
            if saved_images:
                return f"已生成{image_count}张图片并保存到: {', '.join(saved_images)} {remaining_info}"
            return f"已生成{image_count}张图片 {remaining_info}"
        
        return "图片生成完成" 