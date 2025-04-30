"""
Type definitions for storage SDK.
"""

from abc import abstractmethod
from enum import Enum
from typing import Any, BinaryIO, Callable, Dict, Literal, Optional, Protocol, Union

from pydantic import BaseModel, ConfigDict, Field


class PlatformType(str, Enum):
    """Storage platform types."""

    tos = "tos"
    aliyun = "aliyun"  # 阿里云 OSS


class BaseStorageCredentials(BaseModel):
    """Base storage credentials model."""

    platform: PlatformType = Field(..., description="Storage platform type")

    model_config = ConfigDict(populate_by_name=True)

    @abstractmethod
    def get_dir(self) -> str:
        """上传目录路径"""
        pass


class TemporaryCredentialData(BaseModel):
    """STS临时凭证中的credentials字段结构"""
    AccessKeyId: str = Field(..., description="临时访问密钥ID")
    SecretAccessKey: str = Field(..., description="临时访问密钥")
    SessionToken: str = Field(..., description="安全令牌")
    ExpiredTime: str = Field(..., description="过期时间")
    CurrentTime: str = Field(..., description="当前时间")

    model_config = ConfigDict(populate_by_name=True)


class TemporaryCredentials(BaseModel):
    """STS临时凭证结构"""
    host: str = Field(..., description="存储服务主机URL")
    region: str = Field(..., description="TOS区域")
    endpoint: str = Field(..., description="TOS终端节点URL")
    credentials: TemporaryCredentialData = Field(..., description="STS凭证详情")
    bucket: str = Field(..., description="TOS存储桶名称")
    dir: str = Field(..., description="上传目录路径")
    expires: int = Field(..., description="过期时间(秒)")
    callback: str = Field("", description="回调URL")

    model_config = ConfigDict(populate_by_name=True)


class VolcEngineCredentials(BaseStorageCredentials):
    """VolcEngine TOS credentials model with STS support."""

    platform: Literal[PlatformType.tos] = Field(PlatformType.tos, description="存储平台类型")
    temporary_credential: TemporaryCredentials = Field(..., description="STS临时凭证")
    expire: Optional[int] = Field(None, description="过期时间戳")
    expires: Optional[int] = Field(None, description="过期时间戳别名")

    def get_dir(self) -> str:
        """上传目录路径"""
        return self.temporary_credential.dir


# Type aliases
FileContent = Union[str, bytes, BinaryIO]
ProgressCallback = Callable[[float], None]
Headers = Dict[str, str]
Options = Dict[str, Any]


class StorageResponse(BaseModel):
    """Standard storage operation response."""

    key: str = Field(..., description="Full path/key of the file")
    platform: PlatformType = Field(..., description="Storage platform identifier")
    headers: Headers = Field(..., description="Response headers from the server")
    url: Optional[str] = Field(None, description="Public URL of the file if available")


class StorageUploader(Protocol):
    """Protocol for storage upload operations."""

    def upload(
        self, file: FileContent, key: str, credentials: BaseStorageCredentials, options: Optional[Options] = None
    ) -> StorageResponse:
        """Upload file to storage platform."""
        ...
