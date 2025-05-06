"""
费用限制白名单模块

管理费用限制白名单用户列表
"""

from typing import Optional

# 不限制用量的用户ID列表
WHITELIST_USERS = [
    "usi_596b66a8b2aa0502a4a9e84f6635373a",
    "usi_4c21e70a6d171a3bc4ddf66e3abddc3b" # CC
]

def is_user_in_whitelist(user_id: Optional[str]) -> bool:
    """检查用户是否在白名单中

    Args:
        user_id: 用户ID

    Returns:
        bool: 用户是否在白名单中
    """
    if not user_id:
        return False
    return user_id in WHITELIST_USERS
