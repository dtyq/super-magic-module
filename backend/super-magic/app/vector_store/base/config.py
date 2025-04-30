import os
from dataclasses import dataclass
from functools import lru_cache
from typing import Dict, Optional

from .exceptions import ConfigurationError


@dataclass
class VectorStoreConfig:
    """向量数据库配置基类"""

    host: str
    port: int
    database_type: str
    connection_timeout: int = 30
    operation_timeout: int = 30
    max_retries: int = 3
    retry_delay: int = 1
    pool_size: int = 10
    additional_params: Optional[Dict] = None

    def validate(self) -> None:
        """验证配置的有效性"""
        if not self.host:
            raise ConfigurationError("Host cannot be empty")
        if not isinstance(self.port, int) or self.port <= 0:
            raise ConfigurationError("Port must be a positive integer")
        if not self.database_type:
            raise ConfigurationError("Database type cannot be empty")


@dataclass
class QdrantConfig(VectorStoreConfig):
    """Qdrant 特定配置"""

    api_key: Optional[str] = None
    prefer_grpc: bool = False
    https: bool = True
    collection_prefix: str = "SUPERMAGIC-"

    @classmethod
    @lru_cache()
    def from_env(cls) -> "QdrantConfig":
        """从环境变量创建配置"""
        try:
            base_uri = os.getenv("QDRANT_BASE_URI", "")
            if not base_uri:
                raise ConfigurationError("QDRANT_BASE_URI environment variable is required")

            # 解析 URI
            from urllib.parse import urlparse

            parsed_uri = urlparse(base_uri)

            return cls(
                host=parsed_uri.hostname or "",
                port=parsed_uri.port or (6333 if parsed_uri.scheme == "http" else 6334),
                database_type="qdrant",
                api_key=os.getenv("QDRANT_API_KEY"),
                https=parsed_uri.scheme == "https",
                prefer_grpc=False,
                connection_timeout=int(os.getenv("QDRANT_CONNECTION_TIMEOUT", "30")),
                operation_timeout=int(os.getenv("QDRANT_OPERATION_TIMEOUT", "30")),
                max_retries=int(os.getenv("QDRANT_MAX_RETRIES", "3")),
                retry_delay=int(os.getenv("QDRANT_RETRY_DELAY", "1")),
                pool_size=int(os.getenv("QDRANT_POOL_SIZE", "10")),
                collection_prefix=os.getenv("QDRANT_COLLECTION_PREFIX", "SUPERMAGIC-"),
            )
        except Exception as e:
            raise ConfigurationError(f"Failed to load Qdrant configuration: {e!s}")

    def validate(self) -> None:
        """验证 Qdrant 特定配置"""
        super().validate()
        if not self.api_key:
            raise ConfigurationError("API key is required for Qdrant")
