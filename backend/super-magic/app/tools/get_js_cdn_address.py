import json
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import aiohttp
from pydantic import Field

from app.core.context.tool_context import ToolContext
from app.core.entity.tool.tool_result import ToolResult
from app.tools.core import BaseTool, BaseToolParams, tool


class GetJsCdnAddressParams(BaseToolParams):
    """获取JS CDN地址参数"""
    library_name: str = Field(
        ...,
        description="要查询的 JavaScript 库名称，如 react、vue、echarts 等"
    )


@tool()
class GetJsCdnAddress(BaseTool[GetJsCdnAddressParams]):
    """获取指定 JavaScript 库的 CDN 地址工具"""

    # 设置参数类
    params_class = GetJsCdnAddressParams

    # 设置工具元数据
    name = "get_js_cdn_address"
    description = "获取指定 JavaScript 库的 CDN 地址，从 BootCDN 获取"

    def __init__(self, **data):
        super().__init__(**data)
        # 设置缓存目录
        self._cache_dir = Path(".cache/bootcdn")
        self._cache_dir.mkdir(parents=True, exist_ok=True)
        # 缓存有效期（30分钟，单位：秒）
        self._cache_ttl = 30 * 60

    async def execute(self, tool_context: ToolContext, params: GetJsCdnAddressParams) -> ToolResult:
        """执行 JS CDN 工具

        Args:
            tool_context: 工具上下文
            params: 工具参数，包含 library_name

        Returns:
            ToolResult: 工具执行结果
        """
        start_time = time.time()

        library_name = params.library_name
        if not library_name:
            return ToolResult(
                error="未提供 JavaScript 库名称",
                execution_time=time.time() - start_time,
            )

        try:
            result = await self._fetch_cdn_info(library_name)
            return ToolResult(
                content=result,
                execution_time=time.time() - start_time,
            )
        except Exception as e:
            return ToolResult(
                error=f"获取 JavaScript 库 CDN 地址失败: {e!s}",
                execution_time=time.time() - start_time,
            )

    def _get_cache_file_path(self) -> Path:
        """获取缓存文件路径

        Returns:
            Path: 缓存文件路径
        """
        return self._cache_dir / "bootcdn_libraries.json"

    def _read_from_cache(self) -> Tuple[Optional[List[Dict]], bool]:
        """从缓存中读取 CDN 库列表数据

        Returns:
            Tuple[Optional[List[Dict]], bool]: (缓存数据, 是否命中缓存)
        """
        cache_file = self._get_cache_file_path()

        if not cache_file.exists():
            return None, False

        try:
            # 检查缓存文件的修改时间，如果超过缓存有效期则认为缓存失效
            cache_mtime = cache_file.stat().st_mtime
            current_time = time.time()
            cache_age = current_time - cache_mtime

            if cache_age > self._cache_ttl:
                return None, False

            # 读取缓存文件
            with cache_file.open("r", encoding="utf-8") as f:
                cached_data = json.load(f)

            results = cached_data.get("results", [])
            return results, True

        except Exception as e:
            return None, False

    def _write_to_cache(self, data: Dict[str, Any]) -> bool:
        """将 CDN 库列表数据写入缓存

        Args:
            data: 要缓存的数据

        Returns:
            bool: 缓存是否成功
        """
        cache_file = self._get_cache_file_path()

        try:
            # 确保缓存目录存在
            self._cache_dir.mkdir(parents=True, exist_ok=True)

            # 写入缓存文件
            with cache_file.open("w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

            return True

        except Exception as e:
            return False

    async def _fetch_cdn_info(self, library_name: str) -> str:
        """从 BootCDN 获取 JavaScript 库的 CDN 信息

        Args:
            library_name: JavaScript 库名称

        Returns:
            str: 包含 CDN 地址的信息文本
        """
        # 获取 CDN 库列表数据
        results = await self._get_cdn_libraries()

        # 处理搜索结果
        # 尝试精确匹配库名
        exact_matches = [lib for lib in results if lib.get("name") == library_name]
        if exact_matches:
            lib_info = exact_matches[0]
            return (
                f"找到 JavaScript 库 '{library_name}' 的 CDN:\n"
                f"名称: {lib_info.get('name')}\n"
                f"CDN 地址: {lib_info.get('latest')}"
            )

        # 如果没有精确匹配，尝试部分匹配
        partial_matches = self._find_partial_matches(results, library_name)

        if partial_matches:
            result_text = f"未找到精确匹配的 '{library_name}'，但找到了以下相关 JavaScript 库:\n\n"
            for lib in partial_matches:
                result_text += f"名称: {lib.get('name')}\nCDN 地址: {lib.get('latest')}\n\n"
            return result_text

        return f"未找到与 '{library_name}' 相关的 JavaScript 库 CDN 信息"

    async def _get_cdn_libraries(self) -> List[Dict]:
        """获取 CDN 库列表数据，优先从缓存读取，缓存不存在则从 API 获取

        Returns:
            List[Dict]: CDN 库列表数据
        """
        # 先尝试从缓存中获取数据
        cached_results, is_cache_hit = self._read_from_cache()

        if not is_cache_hit:
            # 缓存未命中，从 API 获取数据
            api_url = "https://api.bootcdn.cn/libraries?output=human"

            async with aiohttp.ClientSession() as session:
                async with session.get(api_url) as response:
                    if response.status != 200:
                        raise Exception(f"API 请求失败，状态码: {response.status}")

                    data = await response.text()
                    api_data = json.loads(data)
                    results = api_data.get("results", [])

                    # 将结果写入缓存
                    self._write_to_cache(api_data)
        else:
            # 使用缓存数据
            results = cached_results

        return results

    def _find_partial_matches(self, libraries: List[Dict], library_name: str, max_matches: int = 5) -> List[Dict]:
        """查找部分匹配指定库名的 JavaScript 库

        Args:
            libraries: 库列表
            library_name: 要查找的库名
            max_matches: 最大匹配数量

        Returns:
            List[Dict]: 匹配的库列表
        """
        # 转换为小写进行不区分大小写的匹配
        query = library_name.lower()
        matches = []

        for lib in libraries:
            lib_name = lib.get("name", "").lower()
            if query in lib_name:
                matches.append(lib)
                if len(matches) >= max_matches:
                    break

        return matches
