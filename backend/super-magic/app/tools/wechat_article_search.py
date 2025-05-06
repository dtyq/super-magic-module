import asyncio  # 导入 asyncio 用于异步睡眠
import json
import random  # 导入 random 用于生成随机延迟
import re
from typing import Any, Dict, List, Optional
from urllib.parse import quote, urljoin, urlparse

import aiohttp
from bs4 import BeautifulSoup
from pydantic import Field

from app.core.context.tool_context import ToolContext
from app.core.entity.tool.tool_result import ToolResult
from app.tools.core import BaseTool, BaseToolParams, tool


class WechatArticleSearchParams(BaseToolParams):
    """微信文章搜索参数"""
    query: str = Field(
        ...,
        description="搜索关键词"
    )
    page: int = Field(
        1,
        description="页码，从1开始"
    )
    start_index: int = Field(
        0,
        description="结果起始索引，从0开始"
    )
    count: Optional[int] = Field(
        3,
        description="获取结果的数量，默认返回所有结果"
    )


@tool()
class WechatArticleSearch(BaseTool[WechatArticleSearchParams]):
    """搜索微信公众号文章，获取真实的文章链接和详细信息，涉及微信公众号相关的需求请务必先尝试使用此工具，遇到问题时才再使用其它搜索工具检索。"""

    # 设置参数类
    params_class = WechatArticleSearchParams

    # 设置工具元数据
    name = "wechat_article_search"
    description = """
    搜索微信文章获取详细信息，包括标题、真实的微信文章链接、摘要、发布者和时间等。
    会自动处理中间跳转，获取最终的文章URL。
    """

    def __init__(self, **data):
        """初始化搜狗微信搜索工具，创建持久化会话"""
        super().__init__(**data)
        self._session = None
        self._base_url = "https://weixin.sogou.com"
        # 定义请求中使用的通用头部
        self._headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'zh-CN,zh;q=0.9',
            'Connection': 'keep-alive',
            'DNT': '1',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"',
        }

    async def _ensure_session(self):
        """确保 aiohttp 会话已初始化。"""
        if self._session is None or self._session.closed:
             # 将头部传递给会话，以便在需要时设置初始 cookie
             # 注意：CookieJar 默认启用
            self._session = aiohttp.ClientSession(headers=self._headers)

    def _get_search_url(self, query: str, page: int = 1) -> str:
        """构建搜索URL"""
        encoded_query = quote(query)
        url = f"{self._base_url}/weixin?type=2&s_from=input&query={encoded_query}"
        if page > 1:
            url += f"&page={page}"
        return url

    def _clean_text(self, text: str) -> str:
        """清理文本，移除HTML标签和注释标记"""
        if not text:
            return ""
        text = re.sub(r'<em[^>]*>|</em>|<!--red_beg-->|<!--red_end-->', '', text)
        text = re.sub(r'<!--.*?-->', '', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    def _normalize_url(self, url: str) -> str:
        """规范化URL，添加域名前缀"""
        if not url:
            return ""
        parsed_url = urlparse(url)
        if not parsed_url.netloc:
            return urljoin(self._base_url, url)
        return url

    def _extract_search_results(self, html_content: str) -> List[Dict[str, str]]:
        """从HTML内容中提取初步搜索结果（包含Sogou中间链接）"""
        if not html_content:
            return []

        results = []
        soup = BeautifulSoup(html_content, 'html.parser')
        article_items = soup.select('ul.news-list > li')

        for item in article_items:
            article_data = {}
            txt_box = item.find('div', class_='txt-box')
            if not txt_box:
                continue

            title_link = txt_box.find('h3').find('a') if txt_box.find('h3') else None
            if title_link:
                article_data['title'] = self._clean_text(title_link.get_text())
                # 首先存储初始的 sogou URL
                article_data['sogou_url'] = self._normalize_url(title_link.get('href', ''))
                # 初始化 real_url
                article_data['url'] = None
            else:
                continue # 如果没有找到标题/链接则跳过

            summary_elem = txt_box.find('p', class_='txt-info')
            article_data['summary'] = self._clean_text(summary_elem.get_text()) if summary_elem else ""

            sp_div = txt_box.find('div', class_='s-p')
            if sp_div:
                publisher_elem = sp_div.find('span', class_='all-time-y2')
                article_data['publisher'] = self._clean_text(publisher_elem.get_text()) if publisher_elem else ""
                time_elem = sp_div.find('span', class_='s2')
                article_data['time'] = self._clean_text(time_elem.get_text()) if time_elem else ""
            else:
                 article_data['publisher'] = ""
                 article_data['time'] = ""

            if article_data.get('title') and article_data.get('sogou_url'):
                results.append(article_data)

        return results

    def _extract_real_url_from_js(self, html_content: str) -> Optional[str]:
        """从包含JS跳转的HTML中提取真实的微信URL"""
        # 用于查找构建 URL 的 JavaScript 代码片段的正则表达式
        # 它在 <script> 标签内查找 url += '...' 模式
        script_match = re.search(r'<script>.*?var url = \'\';(.*?)url\.replace\("@", ""\);.*?window\.location\.replace\(url\).*?</script>', html_content, re.DOTALL | re.IGNORECASE)

        if not script_match:
            return None

        js_code_fragment = script_match.group(1)
        # 查找所有添加到 url 变量的部分
        url_parts = re.findall(r"url\s*\+=\s*'(.*?)';", js_code_fragment)

        if not url_parts:
            return None

        # 连接各部分以形成真实的 URL
        real_url = "".join(url_parts)

        # 基础验证，判断是否看起来像微信 URL
        if real_url.startswith("https://mp.weixin.qq.com"):
            return real_url
        else:
            # 记录或处理重构的 URL 不符合预期的情况
            print(f"警告: 提取的 URL 看起来不像微信 URL: {real_url}")
            return None

    async def _fetch_real_url(self, sogou_url: str) -> Optional[str]:
        """获取中间 Sogou 页面并提取真实 URL。"""
        if not sogou_url:
            return None

        await self._ensure_session()
        try:
            # 使用适当的随机延迟
            await asyncio.sleep(random.uniform(3, 5))

            # 发出请求
            async with self._session.get(sogou_url) as response:
                html_content = await response.text()
                real_url = self._extract_real_url_from_js(html_content)
                return real_url
        except Exception as e:
            print(f"获取真实URL时出错: {e}")
            return None

    async def execute(self, tool_context: ToolContext, params: WechatArticleSearchParams) -> ToolResult:
        """
        执行搜索并获取结果

        Args:
            tool_context: 工具上下文
            params: 搜索参数对象，包含查询词、页码和结果筛选选项

        Returns:
            ToolResult: 工具执行结果，包含搜索到的微信文章
        """
        try:
            # 确保有活跃会话
            await self._ensure_session()

            # 构建并请求搜索URL
            search_url = self._get_search_url(params.query, params.page)

            # 获取搜索结果页面
            async with self._session.get(search_url) as response:
                if response.status != 200:
                    return ToolResult(
                        error=f"搜索请求失败，HTTP状态码: {response.status}"
                    )

                # 获取响应体
                html_content = await response.text()

            # 从响应中提取搜索结果条目
            results = self._extract_search_results(html_content)

            # 应用起始索引和计数过滤
            start = params.start_index
            end = None if params.count is None else start + params.count
            filtered_results = results[start:end]

            # 获取每个结果的真实URL
            for result in filtered_results:
                sogou_url = result.get('sogou_url')
                if sogou_url:
                    real_url = await self._fetch_real_url(sogou_url)
                    result['url'] = real_url or sogou_url  # 如果无法获取真实URL，则使用原始URL
                    # 移除中间 URL 以避免混淆
                    result.pop('sogou_url', None)

            # 构建结果输出
            output = f"搜索微信文章: {params.query}\n\n找到 {len(filtered_results)} 篇相关文章:\n\n"

            # 格式化每个结果
            for idx, result in enumerate(filtered_results, start=1):
                title = result.get('title', 'No Title')
                url = result.get('url', 'No URL')
                summary = result.get('summary', '')
                publisher = result.get('publisher', '')
                time = result.get('time', '')

                output += f"{idx}. {title}\n"
                output += f"   链接: {url}\n"
                if summary:
                    output += f"   摘要: {summary}\n"
                if publisher or time:
                    pub_info = []
                    if publisher:
                        pub_info.append(f"发布者: {publisher}")
                    if time:
                        pub_info.append(f"时间: {time}")
                    output += f"   {' | '.join(pub_info)}\n"
                output += "\n"

            # 如果没有结果，添加提示
            if not filtered_results:
                output += "未找到匹配的微信文章。您可以尝试更改搜索词或检查拼写。\n"

            # 返回搜索结果
            return ToolResult(
                content=output,
                system=json.dumps({
                    "query": params.query,
                    "page": params.page,
                    "results": filtered_results,
                    "total_results": len(results),
                    "filtered_results": len(filtered_results)
                }, ensure_ascii=False)
            )

        except Exception as e:
            return ToolResult(
                error=f"搜索微信文章时出错: {e!s}"
            )
        finally:
            # 尝试清理资源
            await self.cleanup()

    async def cleanup(self):
        """清理资源，关闭会话"""
        if self._session and not self._session.closed:
            await self._session.close()
            self._session = None

    async def get_after_tool_call_friendly_action_and_remark(self, tool_name: str, tool_context: ToolContext, result: ToolResult, execution_time: float, arguments: Dict[str, Any] = None) -> Dict:
        """
        获取工具调用后的友好动作和备注
        """
        query = arguments.get("query", "未知查询") if arguments else "未知查询"
        return {
            "action": "搜索微信文章",
            "remark": query
        }
