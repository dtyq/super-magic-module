from abc import ABC
from typing import Any, Dict, Optional

from app.infrastructure.proxy.brd.token_service.token_service_proxy import TokenServiceProxy


class AbstractProxyService(ABC):
    """抽象代理服务基类"""

    def __init__(self, token_proxy_service: TokenServiceProxy) -> None:
        """初始化抽象代理服务

        Args:
            token_proxy_service: Token服务代理
        """
        self._token_proxy_service = token_proxy_service

    def get_host(self, service_name: str) -> str:
        """获取服务主机地址

        Args:
            service_name: 服务名称

        Returns:
            str: 服务主机地址
        """
        # TODO: 从配置中获取服务主机地址
        return f"http://{service_name}"

    def get_common_config(self) -> Dict[str, Any]:
        """获取通用配置

        Returns:
            Dict[str, Any]: 通用配置
        """
        return {
            "timeout": 30,
            "verify": False,
        }

    def get_common_headers(self, request_context: Any, organization_code: Optional[str] = None) -> Dict[str, str]:
        """获取通用请求头

        Args:
            request_context: 请求上下文
            organization_code: 组织代码

        Returns:
            Dict[str, str]: 通用请求头
        """
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        if organization_code:
            headers["X-Organization-Code"] = organization_code

        # TODO: 添加认证信息等其他通用头部

        return headers
