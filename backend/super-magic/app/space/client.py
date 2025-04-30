"""
Magic Space API 客户端
"""

import logging
from typing import Any, BinaryIO, Dict, Optional, Union

import aiohttp

from app.space.exceptions import ApiError

logger = logging.getLogger(__name__)


class MagicSpaceClient:
    """Magic Space API 客户端"""

    def __init__(self, api_key: str, base_url: str = "https://www.letsmagic.space"):
        """
        初始化Magic Space API客户端
        
        Args:
            api_key: Magic Space API密钥
            base_url: API基础URL，默认为https://www.letsmagic.space
        """
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")  # 移除尾部的斜杠
        self.api_base_url = f"{self.base_url}/api/v1"
        self.headers = {
            "api-token": self.api_key,
            "accept": "application/json"
        }

    async def _request(
        self, 
        method: str, 
        endpoint: str, 
        params: Optional[Dict[str, Any]] = None,
        data: Any = None,
        json_data: Any = None,
        content_type: Optional[str] = None,
        additional_headers: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        发送API请求
        
        Args:
            method: HTTP方法
            endpoint: API端点路径
            params: 查询参数
            data: 请求体数据(二进制数据)
            json_data: JSON请求体数据
            content_type: 内容类型
            additional_headers: 额外的请求头
            
        Returns:
            Dict[str, Any]: API响应
            
        Raises:
            ApiError: API请求失败时抛出
        """
        url = f"{self.api_base_url}/{endpoint.lstrip('/')}"

        headers = self.headers.copy()
        if content_type:
            headers["content-type"] = content_type
        if additional_headers:
            headers.update(additional_headers)

        try:
            async with aiohttp.ClientSession() as session:
                logger.debug(f"发送请求: {method} {url}")

                async with session.request(
                    method=method,
                    url=url,
                    params=params,
                    data=data,
                    json=json_data,
                    headers=headers,
                    raise_for_status=False
                ) as response:
                    status_code = response.status

                    try:
                        response_data = await response.json()
                    except:
                        # 如果不是JSON响应，尝试获取文本
                        response_text = await response.text()
                        response_data = {"success": False, "error": response_text}

                    logger.debug(f"响应状态码: {status_code}")

                    if 200 <= status_code < 300:
                        return response_data
                    else:
                        error_message = "API请求失败"
                        if isinstance(response_data, dict) and "error" in response_data:
                            error_message = response_data["error"]

                        logger.error(f"API错误 [{status_code}]: {error_message}")
                        raise ApiError(error_message, status_code, response_data)

        except aiohttp.ClientError as e:
            logger.error(f"HTTP客户端错误: {e}")
            raise ApiError(f"HTTP请求失败: {e!s}")

    async def create_site(
        self, 
        site_name: str, 
        zip_data: Union[bytes, BinaryIO], 
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        创建站点
        
        Args:
            site_name: 站点名称
            zip_data: ZIP文件内容(bytes或文件对象)
            options: 站点选项
            
        Returns:
            Dict[str, Any]: API响应
        """
        options = options or {}

        # 构建查询参数
        params = {
            "name": site_name,
            "description": options.get("description"),
            "access": options.get("access", "public"),
        }

        # 如果访问方式是password，添加密码
        if params["access"] == "password" and "password" in options:
            params["password"] = options["password"]

        # 处理所有者信息
        if options.get("owner"):
            owner = options["owner"]
            if "name" in owner:
                params["owner.name"] = owner["name"]
            if "email" in owner:
                params["owner.email"] = owner["email"]

        return await self._request(
            method="POST",
            endpoint="sites",
            params=params,
            data=zip_data,
            content_type="application/zip"
        )

    async def get_site(self, site_id: str) -> Dict[str, Any]:
        """
        获取站点详情
        
        Args:
            site_id: 站点ID
            
        Returns:
            Dict[str, Any]: API响应
        """
        return await self._request(
            method="GET",
            endpoint=f"sites/{site_id}"
        )

    async def list_sites(
        self, 
        page: int = 1, 
        limit: int = 20
    ) -> Dict[str, Any]:
        """
        获取站点列表
        
        Args:
            page: 页码，默认为1
            limit: 每页数量，默认为20
            
        Returns:
            Dict[str, Any]: API响应
        """
        params = {
            "page": page,
            "limit": limit
        }

        return await self._request(
            method="GET",
            endpoint="sites",
            params=params
        )

    async def delete_site(self, site_id: str) -> Dict[str, Any]:
        """
        删除站点
        
        Args:
            site_id: 站点ID
            
        Returns:
            Dict[str, Any]: API响应
        """
        return await self._request(
            method="DELETE",
            endpoint=f"sites/{site_id}",
        )

    async def update_site(
        self, 
        site_id: str, 
        update_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        更新站点信息
        
        Args:
            site_id: 站点ID
            update_data: 要更新的数据
            
        Returns:
            Dict[str, Any]: API响应
        """
        return await self._request(
            method="PUT",
            endpoint=f"sites/{site_id}",
            json_data=update_data,
            content_type="application/json"
        )

    async def update_site_content(
        self, 
        site_id: str, 
        zip_data: Union[bytes, BinaryIO]
    ) -> Dict[str, Any]:
        """
        更新站点内容
        
        Args:
            site_id: 站点ID
            zip_data: ZIP文件内容
            
        Returns:
            Dict[str, Any]: API响应
        """
        return await self._request(
            method="PUT",
            endpoint=f"sites/{site_id}",
            data=zip_data,
            content_type="application/zip"
        )

    async def get_site_config(self, site_id: str) -> Dict[str, Any]:
        """
        获取站点配置
        
        Args:
            site_id: 站点ID
            
        Returns:
            Dict[str, Any]: API响应
        """
        return await self._request(
            method="GET",
            endpoint=f"sites/{site_id}/config"
        )

    async def update_site_config(
        self, 
        site_id: str, 
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        更新站点配置
        
        Args:
            site_id: 站点ID
            config: 站点配置
            
        Returns:
            Dict[str, Any]: API响应
        """
        return await self._request(
            method="PUT",
            endpoint=f"sites/{site_id}/config",
            json_data=config,
            content_type="application/json"
        )

    async def get_site_stats(self, site_id: str) -> Dict[str, Any]:
        """
        获取站点统计信息
        
        Args:
            site_id: 站点ID
            
        Returns:
            Dict[str, Any]: API响应
        """
        return await self._request(
            method="GET",
            endpoint=f"sites/{site_id}/stats"
        )

    async def get_access_logs(
        self, 
        site_id: str, 
        offset: int = 0, 
        limit: int = 20
    ) -> Dict[str, Any]:
        """
        获取站点访问日志
        
        Args:
            site_id: 站点ID
            offset: 偏移量，默认为0
            limit: 返回数量，默认为20
            
        Returns:
            Dict[str, Any]: API响应
        """
        params = {
            "offset": offset,
            "limit": limit
        }

        return await self._request(
            method="GET",
            endpoint=f"sites/{site_id}/access-logs",
            params=params
        ) 
