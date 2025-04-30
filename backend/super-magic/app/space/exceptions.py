"""
Magic Space 异常定义模块

定义应用中可能出现的各种异常
"""

from typing import Any, Dict, List, Optional


class MagicSpaceError(Exception):
    """魔法空间基础异常类"""

    def __init__(self, message: str, cause: Optional[Exception] = None):
        super().__init__(message)
        self.message = message
        self.cause = cause


class ConfigurationError(MagicSpaceError):
    """配置相关错误"""

    def __init__(self, message: str, problems: Optional[List[str]] = None, cause: Optional[Exception] = None):
        super().__init__(message, cause)
        self.problems = problems or []

    def __str__(self) -> str:
        if not self.problems:
            return self.message

        formatted_problems = "\n - " + "\n - ".join(self.problems)
        return f"{self.message}:{formatted_problems}"


class ValidationError(MagicSpaceError):
    """数据验证错误"""

    def __init__(self, message: str, field: Optional[str] = None, value: Any = None, cause: Optional[Exception] = None):
        super().__init__(message, cause)
        self.field = field
        self.value = value

    def __str__(self) -> str:
        if self.field is None:
            return self.message

        return f"{self.message} (字段: {self.field}, 值: {self.value})"


class ResourceError(MagicSpaceError):
    """资源访问错误"""

    def __init__(self, 
                 message: str, 
                 resource_type: Optional[str] = None, 
                 resource_id: Optional[str] = None,
                 cause: Optional[Exception] = None):
        super().__init__(message, cause)
        self.resource_type = resource_type
        self.resource_id = resource_id

    def __str__(self) -> str:
        if not self.resource_type and not self.resource_id:
            return self.message

        resource_info = []
        if self.resource_type:
            resource_info.append(f"类型: {self.resource_type}")
        if self.resource_id:
            resource_info.append(f"ID: {self.resource_id}")

        return f"{self.message} ({', '.join(resource_info)})"


class StorageError(MagicSpaceError):
    """存储相关错误"""

    def __init__(self, 
                 message: str, 
                 path: Optional[str] = None,
                 operation: Optional[str] = None,
                 cause: Optional[Exception] = None):
        super().__init__(message, cause)
        self.path = path
        self.operation = operation

    def __str__(self) -> str:
        extra_info = []
        if self.operation:
            extra_info.append(f"操作: {self.operation}")
        if self.path:
            extra_info.append(f"路径: {self.path}")

        if not extra_info:
            return self.message

        return f"{self.message} ({', '.join(extra_info)})"


class SecurityError(MagicSpaceError):
    """安全相关错误"""

    def __init__(self, 
                 message: str, 
                 user_id: Optional[str] = None,
                 action: Optional[str] = None,
                 cause: Optional[Exception] = None):
        super().__init__(message, cause)
        self.user_id = user_id
        self.action = action

    def __str__(self) -> str:
        extra_info = []
        if self.user_id:
            extra_info.append(f"用户: {self.user_id}")
        if self.action:
            extra_info.append(f"操作: {self.action}")

        if not extra_info:
            return self.message

        return f"{self.message} ({', '.join(extra_info)})"


class ApiError(MagicSpaceError):
    """API 请求相关错误"""

    def __init__(self, 
                 message: str, 
                 status_code: Optional[int] = None,
                 response: Optional[Dict[str, Any]] = None,
                 cause: Optional[Exception] = None):
        super().__init__(message, cause)
        self.status_code = status_code
        self.response = response

    def __str__(self) -> str:
        if self.status_code is None:
            return self.message

        return f"{self.message} (状态码: {self.status_code})"


class ZipCreationError(StorageError):
    """ZIP 文件操作相关错误"""

    def __init__(self, 
                 message: str, 
                 path: Optional[str] = None,
                 failed_files: Optional[List[str]] = None,
                 cause: Optional[Exception] = None):
        super().__init__(message, path, "ZIP创建", cause)
        self.failed_files = failed_files or []

    def __str__(self) -> str:
        message = super().__str__()

        if not self.failed_files:
            return message

        failed_files_str = ", ".join(self.failed_files[:5])
        if len(self.failed_files) > 5:
            failed_files_str += f" 等 {len(self.failed_files)} 个文件"

        return f"{message} (失败文件: {failed_files_str})" 
