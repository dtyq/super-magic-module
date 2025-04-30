"""
小红书工具模块 - 基于HTTP Client实现的直接接口请求

此模块不再依赖TikHub API，而是使用aiohttp直接请求小红书相关接口。
提供对小红书平台文章数据的访问能力，接口返回格式保持与原tikhub实现兼容。
支持文章内容的HTML转Markdown功能和本地缓存。

支持的功能:
- 获取小红书文章详情 (fetch_rednote_note)

最后更新: 2024-06-14
"""

from datetime import datetime
import json
import re
import time
import traceback
from pathlib import Path
from typing import Any, Dict, Optional, Tuple
from urllib.parse import urlencode

import aiohttp
import html2text
from pydantic import Field

from app.core.config_manager import config
from app.core.context.tool_context import ToolContext
from app.core.entity.tool.tool_result import ToolResult, WebpageToolResult
from app.logger import get_logger
from app.tools.core import BaseToolParams, tool
from app.tools.rednote.base_rednote import BaseRednote

logger = get_logger(__name__)


class FetchRednoteNoteParams(BaseToolParams):
    """小红书文章详情参数"""
    note_id: str = Field(
        ...,
        description="小红书文章ID，用于获取特定文章信息"
    )
    format: str = Field(
        "markdown",
        description="返回格式，支持json或markdown"
    )
    use_cache: bool = Field(
        True,
        description="是否使用缓存，默认为True"
    )


@tool()
class FetchRednoteNote(BaseRednote[FetchRednoteNoteParams]):
    """小红书工具，基于HTTP直接请求，提供小红书文章数据获取功能"""

    # 设置参数类
    params_class = FetchRednoteNoteParams

    # 设置工具元数据
    name = "fetch_rednote_note"
    description = "用于获取小红书文章详细数据"

    # 小红书文章详情API端点
    _api_endpoint = "/api/v1/xiaohongshu/web_v2/fetch_feed_notes"

    # 缓存目录
    _cache_dir = Path(".cache/rednote/notes")

    def __init__(self, **data):
        super().__init__(**data)
        # 初始化参数
        self.base_url = "https://api.tikhub.io"
        self.api_key = None

    def _get_cache_file_path(self, note_id: str) -> Path:
        """
        获取文章缓存文件路径

        Args:
            note_id: 小红书文章ID

        Returns:
            Path: 缓存文件路径
        """
        return self._cache_dir / f"{note_id}.json"

    def _ensure_cache_dir_exists(self) -> None:
        """
        确保缓存目录存在
        """
        self._cache_dir.mkdir(parents=True, exist_ok=True)

    def _read_from_cache(self, note_id: str, ignore_ttl: bool = False) -> Tuple[Optional[Dict[str, Any]], bool]:
        """
        从缓存中读取文章数据

        Args:
            note_id: 小红书文章ID
            ignore_ttl: 是否忽略TTL检查，为True时即使缓存过期也会返回

        Returns:
            Tuple[Optional[Dict[str, Any]], bool]: (缓存数据, 是否命中缓存)
        """
        # 确保缓存目录存在
        self._ensure_cache_dir_exists()

        cache_file = self._get_cache_file_path(note_id)

        if not cache_file.exists():
            return None, False

        try:
            # 检查缓存文件的修改时间，如果超过7天则认为缓存失效
            if not ignore_ttl:
                cache_mtime = cache_file.stat().st_mtime
                current_time = time.time()
                cache_age = current_time - cache_mtime

                # 缓存有效期：7天
                cache_ttl = 7 * 24 * 60 * 60

                if cache_age > cache_ttl:
                    logger.info(f"缓存文件 {cache_file} 已过期 ({cache_age/86400:.1f}天)")
                    return None, False

            # 读取缓存文件
            with cache_file.open("r", encoding="utf-8") as f:
                cache_data = json.load(f)

            logger.info(f"从缓存文件 {cache_file} 读取数据成功")
            return cache_data, True

        except Exception as e:
            logger.warning(f"读取缓存文件 {cache_file} 失败: {e!s}")
            return None, False

    def _write_to_cache(self, note_id: str, data: Dict[str, Any]) -> bool:
        """
        将文章数据写入缓存

        Args:
            note_id: 小红书文章ID
            data: 文章数据

        Returns:
            bool: 写入是否成功
        """
        cache_file = self._get_cache_file_path(note_id)

        try:
            # 确保缓存目录存在
            self._ensure_cache_dir_exists()

            # 写入缓存文件
            with cache_file.open("w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

            logger.info(f"已成功将数据写入缓存文件 {cache_file}")
            return True

        except Exception as e:
            logger.warning(f"写入缓存文件 {cache_file} 失败: {e!s}")
            return False

    def _convert_to_markdown(self, note_data: Dict[str, Any]) -> str:
        """
        将小红书文章数据转换为Markdown格式

        Args:
            note_data: 小红书文章数据

        Returns:
            str: Markdown格式的文章内容
        """
        try:
            content = ''
            note_list = note_data.get('note_list', [])
            note = note_list[0]

            content += f"ID：{note.get('id', '')}\n"
            # 链接，从 mini_program_info 中获取 webpage_url 字段
            content += f"链接：{note.get('mini_program_info', {}).get('webpage_url', '')}\n"
            content += f"标题：{note.get('title', '')}\n"
            content += f"内容：\n```\n{note.get('desc', '')}\n```\n"
            content += f"图片列表\n"
            images_str = ""
            for image in note.get('images_list', []):
                images_str += f"![图片]({image.get('url', '')})\n"
            content += f"{images_str}\n"
            tags_str = ""
            for tag in note.get('hash_tag', []):
                tags_str += f"#{tag.get('name', '')} "
            content += f"话题：{tags_str}\n"
            # 用户
            user = note.get('user', {})
            content += f"用户：{user.get('name', '')}\n"
            content += f"用户ID：{user.get('id', '')}\n"
            content += f"用户昵称：{user.get('nickname', '')}\n"
            # 点赞数
            content += f"点赞数：{note.get('liked_count', '')}\n"
            # 收藏数
            content += f"收藏数：{note.get('collected_count', '')}\n"
            # 评论数
            content += f"评论数：{note.get('comments_count', '')}\n"
            # 分享数
            content += f"分享数：{note.get('shared_count', '')}\n"
            # 发布时间，格式化
            publish_time = note.get('time', '') 
            if publish_time:
                publish_time = datetime.fromtimestamp(publish_time).strftime("%Y-%m-%d %H:%M:%S")
            content += f"发布时间：{publish_time}\n"
            # 更新时间，格式化
            update_time = note.get('last_update_time', '')
            if update_time:
                update_time = datetime.fromtimestamp(update_time).strftime("%Y-%m-%d %H:%M:%S")
            content += f"更新时间：{update_time}\n"
            
            return content
        except Exception as e:
            logger.error(f"转换为Markdown失败: {e!s}")
            # 如果转换失败，返回简单的错误信息
            return f"无法将文章转换为Markdown格式: {e!s}"

    async def execute(
        self,
        tool_context: ToolContext,
        params: FetchRednoteNoteParams
    ) -> WebpageToolResult:
        """
        执行工具并获取小红书文章详情

        Args:
            tool_context: 工具上下文
            params: 工具参数对象，包含note_id、format和use_cache等参数

        Returns:
            WebpageToolResult: 包含小红书文章数据的结果对象
        """
        note_id = params.note_id
        format_type = params.format
        use_cache = params.use_cache

        try:
            # 验证参数
            if not note_id:
                return WebpageToolResult(error="小红书文章ID不能为空")

            # 尝试从缓存获取
            cached_data = None
            if use_cache:
                cached_data, is_cache_hit = self._read_from_cache(note_id)
                if is_cache_hit and cached_data:
                    logger.info(f"使用缓存数据: {note_id}")
                    note_data = cached_data
                else:
                    logger.info(f"缓存未命中或已过期: {note_id}")
                    note_data = None
            else:
                logger.info(f"跳过缓存，直接请求: {note_id}")
                note_data = None

            # 如果缓存未命中，则发起网络请求
            if note_data is None:
                # 准备请求参数
                request_params = {"note_id": note_id}

                url_with_query_params = f"{self._api_endpoint}?{urlencode(request_params)}"
                logger.info(f"请求小红书文章页面: {url_with_query_params}")

                note_data = await self._make_request(url_with_query_params)


                # 将获取的数据写入缓存
                if note_data:
                    self._write_to_cache(note_id, note_data)

            note = note_data.get("note_list", [])[0]
            # 按照指定格式返回结果
            if format_type == "markdown":
                # 将文章转换为Markdown格式
                markdown_content = self._convert_to_markdown(note_data)

                # 构建WebpageToolResult，包含HTML和Markdown内容
                result = WebpageToolResult(
                    content=markdown_content,
                    webpage_content={
                        "title": note.get("title", ""),
                        "url": note.get("mini_program_info", {}).get("webpage_url", ""),
                        "html_content": note.get("desc", ""),
                        "markdown_content": markdown_content,
                    }
                )
            else:  # json
                # 格式化JSON输出
                output = json.dumps(note, ensure_ascii=False, indent=2)

                # 构建WebpageToolResult
                result = WebpageToolResult(
                    content=output,
                    webpage_content={
                        "title": note.get("title", ""),
                        "url": note.get("mini_program_info", {}).get("webpage_url", ""),
                        "html_content": note.get("desc", ""),
                        "json_content": note_data,
                    }
                )

            return result

        except Exception as e:
            logger.exception(f"获取小红书文章详情失败: {e!s}")
            return WebpageToolResult(error=f"获取小红书文章详情失败: {e!s}")

    async def get_after_tool_call_friendly_action_and_remark(self, tool_name: str, tool_context: ToolContext, result: WebpageToolResult, execution_time: float, arguments: Dict[str, Any] = None) -> Dict:
        """获取工具调用后的友好动作和备注"""
        # remark 先获取文章的标题，没有就获取 url ，再没有 remark 就为空
        remark = result.title or result.url or ""
        return {
            "action": "阅读小红书文章",
            "remark": remark
        }
