"""
Magic Space 模块数据模型
"""

from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field, model_validator


class SiteOwner(BaseModel):
    """站点所有者信息"""
    name: Optional[str] = None
    email: Optional[str] = None


class SiteBase(BaseModel):
    """站点基本信息"""
    id: str
    name: str
    description: Optional[str] = None
    access: str  # public/private/password
    createdAt: datetime
    updatedAt: datetime
    url: str


class Site(SiteBase):
    """完整站点信息"""
    owner: Optional[SiteOwner] = None


class PaginationInfo(BaseModel):
    """分页信息"""
    total: int
    page: int
    limit: int
    pages: int


class AccessLogPagination(BaseModel):
    """访问日志分页信息"""
    offset: int
    limit: int
    hasMore: bool


class AccessLog(BaseModel):
    """访问日志条目"""
    id: str
    timestamp: datetime
    ip: str
    path: str
    userAgent: Optional[str] = None
    referer: Optional[str] = None


class ErrorPage(BaseModel):
    """错误页面配置"""
    code_404: Optional[str] = Field(None, alias="404")
    code_500: Optional[str] = Field(None, alias="500")

    model_config = {"populate_by_name": True}


class HeaderValue(BaseModel):
    """HTTP头值配置"""
    value: str


class SiteConfig(BaseModel):
    """站点配置"""
    errorPages: Optional[Dict[str, str]] = None
    defaultContentType: Optional[str] = None
    headers: Optional[Dict[str, Dict[str, str]]] = None


class SiteStats(BaseModel):
    """站点统计信息"""
    size: int
    fileCount: int
    visits: int
    lastAccessed: Optional[datetime] = None


class DeploymentStatus(BaseModel):
    """部署状态"""
    status: str  # pending, success, failed
    message: Optional[str] = None
    startedAt: datetime
    completedAt: Optional[datetime] = None
    progress: Optional[int] = None  # 0-100


class SiteCreateRequest(BaseModel):
    """站点创建请求"""
    name: str
    description: Optional[str] = None
    access: str = "public"  # public/private/password
    password: Optional[str] = None
    owner: Optional[SiteOwner] = None

    @model_validator(mode='after')
    def validate_password(self):
        """验证密码设置"""
        if self.access == "password" and not self.password:
            raise ValueError("当访问权限设置为password时必须提供密码")
        return self


class SiteUpdateRequest(BaseModel):
    """站点更新请求"""
    name: Optional[str] = None
    description: Optional[str] = None
    access: Optional[str] = None  # public/private/password
    password: Optional[str] = None
    owner: Optional[SiteOwner] = None

    @model_validator(mode='after')
    def validate_password(self):
        """验证密码设置"""
        if self.access == "password" and not self.password:
            raise ValueError("当访问权限设置为password时必须提供密码")
        return self


class BaseResponse(BaseModel):
    """基础响应"""
    success: bool = True
    data: Dict[str, Any] = {}


class ErrorResponse(BaseModel):
    """错误响应"""
    success: bool = False
    error: str


class SiteResponse(BaseResponse):
    """站点响应"""
    data: Dict[str, Any] = {
        "site": {}
    }


class SiteListResponse(BaseResponse):
    """站点列表响应"""
    data: Dict[str, Any] = {
        "sites": [],
        "pagination": {}
    }


class SiteConfigResponse(BaseResponse):
    """站点配置响应"""
    data: Dict[str, Any] = {
        "config": {}
    }


class SiteStatsResponse(BaseResponse):
    """站点统计响应"""
    data: Dict[str, Any] = {
        "stats": {}
    }


class AccessLogsResponse(BaseResponse):
    """访问日志响应"""
    data: Dict[str, Any] = {
        "logs": [],
        "pagination": {}
    }


class SiteCreateOptions(BaseModel):
    """站点创建选项"""
    description: Optional[str] = None
    access: str = "public"  # public/private/password
    password: Optional[str] = None
    owner: Optional[SiteOwner] = None
