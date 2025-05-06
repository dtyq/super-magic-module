import hashlib
import json
import time
from typing import Any, Dict

import httpx
import redis

from app.core.config_manager import config


class TokenServiceProxy:
    """Token服务代理"""

    def __init__(self) -> None:
        """初始化Token服务代理"""
        self.base_url = config.get("token_service.address", default="")
        redis_uri = config.get("token_service.redis_uri")

        self.app_id = config.get("token_service.app_id", default="")
        self.app_secret = config.get("token_service.app_secret", default="")

        if not self.base_url:
            raise RuntimeError("TOKEN_SERVICE_ADDRESS环境变量未设置")

        if not redis_uri:
            raise RuntimeError("REDIS_URI环境变量未设置")
        else:
            self.redis = redis.from_url(redis_uri)

    def get_token_from_cache(self, organization_code: str) -> Dict[str, Any]:
        """从缓存中获取Token，如果缓存不存在则从服务获取并缓存

        Args:
            organization_code: 组织code，必传参数

        Returns:
            包含token的字典对象

        Raises:
            RuntimeError: 当获取token失败或未提供organization_code时抛出异常
        """
        if not organization_code:
            raise RuntimeError("未提供organization_code")

        redis_key = self._get_token_redis_key(organization_code)

        if self.redis:
            cached_token = self.redis.get(redis_key)
            if cached_token:
                return json.loads(cached_token)

        token_info = self._get_token(organization_code)

        if not token_info or "expiration_time" not in token_info or token_info["expiration_time"] <= 0:
            raise RuntimeError("获取token失败")

        self.redis.set(redis_key, json.dumps(token_info), ex=token_info["expiration_time"])
        return token_info

    def get_token_string_from_cache(self, organization_code: str) -> str:
        """从缓存中获取Token字符串

        Args:
            organization_code: 组织代码，必传参数

        Returns:
            Token字符串

        Raises:
            RuntimeError: 当未提供organization_code时抛出异常
        """
        if not organization_code:
            raise RuntimeError("未提供organization_code")

        token_info = self.get_token_from_cache(organization_code)
        return token_info["token"]

    def _generate_sign(
        self,
        app_id: str,
        app_secret: str,
        timestamp: int,
        nonce: str,
        organization_code: str,
    ) -> str:
        """生成签名

        Args:
            app_id: 应用ID
            app_secret: 应用密钥
            timestamp: 时间戳
            nonce: 随机字符串
            organization_code: 组织代码

        Returns:
            签名字符串
        """
        sign_str = f"{app_id}{app_secret}{timestamp}{nonce}{organization_code}"
        return hashlib.md5(sign_str.encode()).hexdigest()

    def _get_token(self, organization_code: str) -> Dict[str, Any]:
        """从Token服务获取Token

        Args:
            organization_code: 组织代码，必传参数

        Returns:
            包含token的字典对象

        Raises:
            RuntimeError: 当获取token失败或未提供organization_code时抛出异常
        """
        if not organization_code:
            raise RuntimeError("未提供organization_code")

        if not self.app_id or not self.app_secret:
            raise RuntimeError("APP_ID或APP_SECRET未设置")

        timestamp = int(time.time())
        nonce = "".join([str(i) for i in range(6)])  # 简化的随机字符串生成
        sign = self._generate_sign(self.app_id, self.app_secret, timestamp, nonce, organization_code)

        headers = {"organization-code": organization_code}
        url = f"{self.base_url}/token"

        with httpx.Client(timeout=10.0, verify=False) as client:
            response = client.get(
                url,
                params={"app_id": self.app_id, "timestamp": str(timestamp), "nonce": nonce, "sign": sign},
                headers=headers,
            )

            response.raise_for_status()
            result = response.json()

            if result.get("code") == 1000:
                return result.get("data", {})
            else:
                raise RuntimeError(f"Token服务返回错误: {result.get('code')} - {result.get('message')}")

    def _get_token_redis_key(self, organization_code: str) -> str:
        """生成Token的Redis键名

        Args:
            organization_code: 组织code

        Returns:
            Redis键名
        """
        return f"brd:token:o:{organization_code}"
