"""文件名处理工具

提供安全文件名生成和处理相关功能
"""

import datetime
import re


def get_safe_filename(name: str) -> str:
    """
    生成安全的文件名，处理各操作系统不支持的字符
    使用短格式时间戳作为后缀，使文件名可以根据时间顺序排序

    Args:
        name: 原始文本内容

    Returns:
        str: 处理后的安全文件名
    """
    if not name:
        # 为空内容生成带时间戳的文件名
        now = datetime.datetime.now()
        # 使用年份后两位+月日时分秒+毫秒前两位，共12位
        timestamp = f"{now.year % 100:02d}{now.month:02d}{now.day:02d}{now.hour:02d}{now.minute:02d}{now.second:02d}{now.microsecond // 10000:02d}"
        return f"webpage_{timestamp}"

    # 1. 清除常见不支持的字符 (Windows: \ / : * ? " < > |) (Unix: /)
    # 替换为下划线
    safe_name = re.sub(r'[\\/:*?"<>|]', '_', name)

    # 2. 替换连续的空白字符为单个下划线
    safe_name = re.sub(r'\s+', '_', safe_name)

    # 3. 删除控制字符和其他不可打印字符
    safe_name = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', safe_name)

    # 4. 删除可能导致问题的前导和尾随字符
    safe_name = safe_name.strip('._-')

    # 5. 确保不是空字符串
    if not safe_name:
        now = datetime.datetime.now()
        # 使用年份后两位+月日时分秒+毫秒前两位，共12位
        timestamp = f"{now.year % 100:02d}{now.month:02d}{now.day:02d}{now.hour:02d}{now.minute:02d}{now.second:02d}{now.microsecond // 10000:02d}"
        return f"webpage_{timestamp}"

    # 6. 避免Windows保留文件名 (CON, PRN, AUX, NUL, COM1-9, LPT1-9)
    reserved_names = ['CON', 'PRN', 'AUX', 'NUL'] + [f'COM{i}' for i in range(1, 10)] + [f'LPT{i}' for i in range(1, 10)]
    if safe_name.upper() in reserved_names:
        safe_name = f"{safe_name}_file"

    # 7. 限制文件名长度，避免路径过长问题
    safe_name = safe_name[:32]

    # 8. 添加短格式时间戳，使文件名按时间顺序排序
    now = datetime.datetime.now()
    # 使用年份后两位+月日时分秒+毫秒前两位，共12位
    timestamp = f"{now.year % 100:02d}{now.month:02d}{now.day:02d}{now.hour:02d}{now.minute:02d}{now.second:02d}{now.microsecond // 10000:02d}"
    safe_name = f"{safe_name}_{timestamp}"

    return safe_name
