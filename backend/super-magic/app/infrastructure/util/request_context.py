from dataclasses import dataclass
from typing import Optional


@dataclass
class RequestContext:
    """请求上下文"""

    trace_id: Optional[str] = None
    request_id: Optional[str] = None
    organization_code: Optional[str] = None  # 组织代码
