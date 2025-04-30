"""
知乎工具模块 - 基于HTTP Client实现的直接接口请求

此模块不再依赖TikHub API，而是使用aiohttp直接请求知乎相关接口。
提供对知乎平台文章数据的访问能力，接口返回格式保持与原tikhub实现兼容。
支持文章内容的HTML转Markdown功能和本地缓存。

支持的功能:
- 获取知乎文章详情 (fetch_zhihu_article_detail)

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
from app.tools.core import BaseTool, BaseToolParams, tool
from app.tools.zhihu.base_zhihu import BaseZhihu

logger = get_logger(__name__)


class FetchZhihuArticleDetailParams(BaseToolParams):
    """知乎文章详情参数"""
    article_id: str = Field(
        ...,
        description="知乎文章ID，用于获取特定文章信息"
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
class FetchZhihuArticleDetail(BaseZhihu[FetchZhihuArticleDetailParams]):
    """知乎工具，基于HTTP直接请求，提供知乎文章数据获取功能"""

    # 设置参数类
    params_class = FetchZhihuArticleDetailParams

    # 设置工具元数据
    name = "fetch_zhihu_article_detail"
    description = "用于获取知乎文章详细数据"

    # 知乎文章详情API端点
    _api_endpoint = "/api/v1/zhihu/web/fetch_column_article_detail"

    # 缓存目录
    _cache_dir = Path(".cache/zhihu/articles")

    def __init__(self, **data):
        super().__init__(**data)
        # 初始化参数
        self.base_url = "https://api.tikhub.io"
        self.api_key = None
        # 初始化时不设置字段值，懒加载
        self._html2text_converter = None

    @property
    def html2text_converter(self) -> html2text.HTML2Text:
        """获取HTML到Markdown的转换器"""
        if self._html2text_converter is None:
            # 初始化html2text实例
            self._html2text_converter = html2text.HTML2Text()
            # 配置转换选项
            self._html2text_converter.ignore_links = False
            self._html2text_converter.ignore_images = False
            self._html2text_converter.escape_snob = False
            self._html2text_converter.ignore_emphasis = False
            self._html2text_converter.body_width = 0  # 不自动换行
            self._html2text_converter.unicode_snob = True  # 使用Unicode字符
            self._html2text_converter.single_line_break = True  # 单行换行处理
            self._html2text_converter.inline_links = True  # 使用内联链接
            self._html2text_converter.protect_links = True  # 保护链接
            self._html2text_converter.images_to_alt = False  # 使用图片的alt文本
            self._html2text_converter.default_image_alt = "图片"  # 默认图片alt文本
        return self._html2text_converter

    def _get_cache_file_path(self, article_id: str) -> Path:
        """
        获取文章缓存文件路径

        Args:
            article_id: 知乎文章ID

        Returns:
            Path: 缓存文件路径
        """
        return self._cache_dir / f"{article_id}.json"

    def _ensure_cache_dir_exists(self) -> None:
        """
        确保缓存目录存在
        """
        self._cache_dir.mkdir(parents=True, exist_ok=True)

    def _read_from_cache(self, article_id: str, ignore_ttl: bool = False) -> Tuple[Optional[Dict[str, Any]], bool]:
        """
        从缓存中读取文章数据

        Args:
            article_id: 知乎文章ID
            ignore_ttl: 是否忽略TTL检查，为True时即使缓存过期也会返回

        Returns:
            Tuple[Optional[Dict[str, Any]], bool]: (缓存数据, 是否命中缓存)
        """
        # 确保缓存目录存在
        self._ensure_cache_dir_exists()

        cache_file = self._get_cache_file_path(article_id)

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

    def _write_to_cache(self, article_id: str, data: Dict[str, Any]) -> bool:
        """
        将文章数据写入缓存

        Args:
            article_id: 知乎文章ID
            data: 文章数据

        Returns:
            bool: 写入是否成功
        """
        cache_file = self._get_cache_file_path(article_id)

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


    def _convert_html_to_markdown(self, html_content: str) -> str:
        """
        将HTML内容转换为Markdown格式

        Args:
            html_content: HTML内容

        Returns:
            str: Markdown格式的内容
        """
        if not html_content:
            return ""

        try:
            # 预处理HTML
            processed_html = html_content

            # 确保图片路径正确处理
            # 替换知乎CDN图片链接为直接链接
            def replace_img(match):
                img_tag = match.group(0)
                src = match.group(1)

                # 如果src为空，则尝试从data-original/data-actualsrc/data-src获取
                if not src or src.startswith("data:"):
                    data_original = re.search(r'data-original=[\'"]([^\'"]+)[\'"]', img_tag)
                    data_actual_src = re.search(r'data-actualsrc=[\'"]([^\'"]+)[\'"]', img_tag)
                    data_src = re.search(r'data-src=[\'"]([^\'"]+)[\'"]', img_tag)

                    if data_original:
                        src = data_original.group(1)
                    elif data_actual_src:
                        src = data_actual_src.group(1)
                    elif data_src:
                        src = data_src.group(1)

                # 若src以https:开头，则保持原样；否则检查//开头补充https:
                if src and src.startswith("//"):
                    src = f"https:{src}"

                # 获取alt文本
                alt_match = re.search(r'alt=[\'"]([^\'"]*)[\'"]', img_tag)
                alt_text = alt_match.group(1) if alt_match else "图片"

                # 构建新的img标签，确保有正确的src和alt
                new_img = f'<img src="{src}" alt="{alt_text}" />'
                return new_img

            # 替换img标签
            processed_html = re.sub(r'<img[^>]+src=[\'"]([^\'"]*)[\'"][^>]*>', replace_img, processed_html)

            # 添加其他需要的预处理步骤...

            # 使用html2text转换为markdown
            markdown_content = self.html2text_converter.handle(processed_html)

            # 后处理markdown内容
            # 1. 修复连续的换行
            markdown_content = re.sub(r'\n{3,}', '\n\n', markdown_content)

            # 2. 修复特殊字符
            markdown_content = markdown_content.replace('&amp;', '&')
            markdown_content = markdown_content.replace('&lt;', '<')
            markdown_content = markdown_content.replace('&gt;', '>')
            markdown_content = markdown_content.replace('&quot;', '"')
            markdown_content = markdown_content.replace('&nbsp;', ' ')

            # 3. 修复图片链接
            markdown_content = re.sub(r'!\[\]\((https?:[^)]+)\)', r'![图片](\1)', markdown_content)

            # 4. 其他清理
            # 移除空链接
            markdown_content = re.sub(r'\[\]\(\)', '', markdown_content)

            return markdown_content
        except Exception as e:
            logger.error(f"HTML转MD失败: {e!s}")
            # 如果转换失败，返回原始HTML
            return html_content

    def _convert_to_markdown(self, article_data: Dict[str, Any]) -> str:
        """
        将知乎文章数据转换为Markdown格式

        Args:
            article_data: 知乎文章数据

        Returns:
            str: Markdown格式的文章内容
        """
        try:
            # 提取文章元数据
            title = article_data.get("title", "")
            author = article_data.get("author", {}).get("name", "")
            avatar = article_data.get("author", {}).get("avatar_url", "")
            pub_time = article_data.get("created", "")
            update_time = article_data.get("updated", "")
            content = article_data.get("content", "")
            url = article_data.get("url", "")
            article_id = article_data.get("id", "")
            excerpt = article_data.get("excerpt", "")
            image = article_data.get("image_url", "")
            image_source = article_data.get("image_source", "")

            # 格式化日期时间，从时间戳转换为 YYYY-MM-DD HH:MM:SS
            formatted_pub_time = datetime.fromtimestamp(pub_time).strftime("%Y-%m-%d %H:%M:%S")
            formatted_update_time = datetime.fromtimestamp(update_time).strftime("%Y-%m-%d %H:%M:%S")

            # 将HTML内容转换为Markdown
            markdown_content = self._convert_html_to_markdown(content)

            # 构建完整的Markdown文档
            markdown_doc = []

            # 添加标题
            markdown_doc.append(f"# {title}\n")

            # 添加元数据
            meta_info = []
            if author:
                meta_info.append(f"作者: {author}")
            if formatted_pub_time:
                meta_info.append(f"发布时间: {formatted_pub_time}")
            if formatted_update_time and formatted_update_time != formatted_pub_time:
                meta_info.append(f"更新时间: {formatted_update_time}")
            if url:
                meta_info.append(f"原文链接: {url}")

            if meta_info:
                markdown_doc.append("> " + " | ".join(meta_info) + "\n")

            # 添加摘要(如果有)
            if excerpt:
                markdown_doc.append(f"**摘要**: {excerpt}\n")

            # 添加封面图(如果有)
            if image:
                source_text = f"（图片来源: {image_source}）" if image_source else ""
                markdown_doc.append(f"![封面图]({image}) {source_text}\n")

            # 添加正文内容
            markdown_doc.append(markdown_content)

            # 组合成完整的Markdown
            return "\n".join(markdown_doc)
        except Exception as e:
            logger.error(f"转换为Markdown失败: {e!s}")
            # 如果转换失败，返回简单的错误信息
            return f"无法将文章转换为Markdown格式: {e!s}"

    async def execute(
        self,
        tool_context: ToolContext,
        params: FetchZhihuArticleDetailParams
    ) -> WebpageToolResult:
        """
        执行工具并获取知乎文章详情

        Args:
            tool_context: 工具上下文
            params: 工具参数对象，包含article_id、format和use_cache等参数

        Returns:
            WebpageToolResult: 包含知乎文章数据的结果对象
        """
        article_id = params.article_id
        format_type = params.format
        use_cache = params.use_cache

        try:
            # 验证参数
            if not article_id:
                return WebpageToolResult(error="知乎文章ID不能为空")

            # 尝试从缓存获取
            cached_data = None
            if use_cache:
                cached_data, is_cache_hit = self._read_from_cache(article_id)
                if is_cache_hit and cached_data:
                    logger.info(f"使用缓存数据: {article_id}")
                    article_data = cached_data
                else:
                    logger.info(f"缓存未命中或已过期: {article_id}")
                    article_data = None
            else:
                logger.info(f"跳过缓存，直接请求: {article_id}")
                article_data = None

            # 如果缓存未命中，则发起网络请求
            if article_data is None:
                # 准备请求参数
                request_params = {"article_id": article_id}

                url_with_query_params = f"{self._api_endpoint}?{urlencode(request_params)}"
                logger.info(f"请求知乎文章页面: {url_with_query_params}")

                response = await self._make_request(url_with_query_params)
                title = response.get("title")
                author_name = response.get("author", {}).get("name", "")
                publish_time = response.get("created", "")
                content = response.get("content", "")
                

                article_url = f"https://zhuanlan.zhihu.com/p/{article_id}"
                # 构建文章数据结构
                article_data = {
                    "id": article_id,
                    "title": title,
                    "author": {"name": author_name, "avatar_url": ""},
                    "created": publish_time,
                    "updated": publish_time,
                    "content": content,
                    "url": article_url,
                    "excerpt": "",
                    "image_url": ""
                }

                # 将获取的数据写入缓存
                if article_data:
                    self._write_to_cache(article_id, article_data)

            # 按照指定格式返回结果
            if format_type == "markdown":
                # 将文章转换为Markdown格式
                markdown_content = self._convert_to_markdown(article_data)
                
                # 构建WebpageToolResult，包含HTML和Markdown内容
                result = WebpageToolResult(
                    content=markdown_content,
                    webpage_content={
                        "title": article_data.get("title", ""),
                        "url": article_data.get("url", ""),
                        "html_content": article_data.get("content", ""),
                        "markdown_content": markdown_content,
                    }
                )
            else:  # json
                # 格式化JSON输出
                output = json.dumps(article_data, ensure_ascii=False, indent=2)

                # 构建WebpageToolResult
                result = WebpageToolResult(
                    content=output,
                    webpage_content={
                        "title": article_data.get("title", ""),
                        "url": article_data.get("url", ""),
                        "html_content": article_data.get("content", ""),
                        "json_content": article_data,
                    }
                )

            return result

        except Exception as e:
            logger.exception(f"获取知乎文章详情失败: {e!s}")
            return WebpageToolResult(error=f"获取知乎文章详情失败: {e!s}")

    async def get_after_tool_call_friendly_action_and_remark(self, tool_name: str, tool_context: ToolContext, result: WebpageToolResult, execution_time: float, arguments: Dict[str, Any] = None) -> Dict:
        """获取工具调用后的友好动作和备注"""
        # remark 先获取文章的标题，没有就获取 url ，再没有 remark 就为空
        remark = result.title or result.url or ""
        return {
            "action": "阅读知乎文章",
            "remark": remark
        }
