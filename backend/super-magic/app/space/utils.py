"""
Magic Space 实用工具模块

提供文件验证、ZIP处理等通用功能
"""

import logging
import os
import re
import shutil
import tempfile
import zipfile
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from .exceptions import ZipCreationError

logger = logging.getLogger(__name__)

# 允许的HTML文件扩展名
ALLOWED_HTML_EXTENSIONS = {'.html', '.htm'}

# 允许的静态资源扩展名
ALLOWED_STATIC_EXTENSIONS = {
    # 样式
    '.css', '.scss', '.sass', '.less',
    # 脚本
    '.js', '.jsx', '.ts', '.tsx', '.mjs',
    # 图片
    '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.ico', '.bmp',
    # 字体
    '.woff', '.woff2', '.ttf', '.eot', '.otf',
    # 媒体
    '.mp3', '.mp4', '.wav', '.ogg', '.webm',
    # 数据
    '.json', '.xml', '.csv', '.toml', '.yaml', '.yml',
    # 其他
    '.pdf', '.txt', '.md'
}

# 必要的HTML文件
REQUIRED_HTML_FILES = {'index.html'}


def format_query_params(params: Dict[str, Any]) -> Dict[str, str]:
    """
    格式化 HTTP 查询参数，过滤掉空值并转换值为字符串

    Args:
        params: 查询参数字典

    Returns:
        Dict[str, str]: 格式化后的查询参数字典
    """
    # 过滤掉 None 值并将所有值转换为字符串
    return {k: str(v) for k, v in params.items() if v is not None}


def validate_html_project(directory_path: str) -> Tuple[bool, List[str]]:
    """
    验证 HTML 项目结构，确保其符合 Magic Space 的要求
    
    Args:
        directory_path: 项目目录路径
        
    Returns:
        Tuple[bool, List[str]]: (是否验证通过, 问题列表)
    """
    issues = validate_project_directory(directory_path)
    return len(issues) == 0, issues


def validate_project_directory(directory_path: str) -> List[str]:
    """
    验证项目目录是否符合要求
    
    Args:
        directory_path: 项目目录路径
        
    Returns:
        List[str]: 验证失败的问题列表，如果为空则表示验证通过
    """
    issues = []
    directory = Path(directory_path)

    # 检查目录是否存在
    if not directory.exists():
        issues.append(f"目录不存在: {directory_path}")
        return issues

    if not directory.is_dir():
        issues.append(f"路径不是目录: {directory_path}")
        return issues

    # 检查是否有必要的HTML文件
    html_files_found = set()
    for root, _, files in os.walk(directory_path):
        for file in files:
            file_path = os.path.join(root, file)
            extension = os.path.splitext(file)[1].lower()

            # 检查文件扩展名是否被允许
            if extension not in ALLOWED_HTML_EXTENSIONS and extension not in ALLOWED_STATIC_EXTENSIONS:
                issues.append(f"不支持的文件类型: {file_path}")

            # 记录找到的HTML文件
            if extension in ALLOWED_HTML_EXTENSIONS:
                relative_path = os.path.relpath(file_path, directory_path)
                html_files_found.add(relative_path)

    # 检查是否缺少必要的HTML文件
    missing_files = REQUIRED_HTML_FILES - html_files_found
    if missing_files:
        issues.append(f"缺少必要的HTML文件: {', '.join(missing_files)}")

    return issues


def create_zip_from_directory(
    directory_path: str, 
    output_path: Optional[str] = None,
    exclude_patterns: Optional[List[str]] = None
) -> str:
    """
    从目录创建ZIP文件
    
    Args:
        directory_path: 源目录路径
        output_path: 输出ZIP文件路径，如果为None则创建临时文件
        exclude_patterns: 排除的文件/目录模式列表
    
    Returns:
        str: 创建的ZIP文件路径
    
    Raises:
        ZipCreationError: 创建ZIP文件失败时抛出
    """
    try:
        # 验证源目录
        if not os.path.exists(directory_path):
            raise ZipCreationError(f"源目录不存在: {directory_path}")

        if not os.path.isdir(directory_path):
            raise ZipCreationError(f"源路径不是目录: {directory_path}")

        # 如果未指定输出路径，创建临时文件
        temp_file = None
        if output_path is None:
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.zip')
            output_path = temp_file.name
            temp_file.close()

        # 编译排除模式为正则表达式
        exclude_regexes = []
        if exclude_patterns:
            for pattern in exclude_patterns:
                # 将glob模式转换为正则表达式
                regex_pattern = pattern.replace(".", "\\.")
                regex_pattern = regex_pattern.replace("**/", ".*")
                regex_pattern = regex_pattern.replace("**", ".*")
                regex_pattern = regex_pattern.replace("*", "[^/]*")
                regex_pattern = f"^{regex_pattern}$"
                exclude_regexes.append(re.compile(regex_pattern))

        # 创建ZIP文件
        with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, _, files in os.walk(directory_path):
                for file in files:
                    file_path = os.path.join(root, file)
                    # 计算相对路径，确保ZIP内的路径结构正确
                    rel_path = os.path.relpath(file_path, directory_path)

                    # 检查是否应该排除该文件
                    should_exclude = False
                    if exclude_regexes:
                        for regex in exclude_regexes:
                            if regex.match(rel_path):
                                should_exclude = True
                                break

                    if not should_exclude:
                        zipf.write(file_path, rel_path)

        logger.info(f"成功创建ZIP文件: {output_path}")
        return output_path

    except Exception as e:
        # 如果创建了临时文件但发生错误，清理临时文件
        if temp_file and os.path.exists(temp_file.name):
            try:
                os.unlink(temp_file.name)
            except Exception as cleanup_error:
                logger.error(f"清理临时文件失败: {cleanup_error}")

        logger.error(f"创建ZIP文件失败: {e!s}")
        raise ZipCreationError(message="创建ZIP文件失败", cause=e)


def extract_zip_to_directory(
    zip_path: str,
    extract_path: Optional[str] = None
) -> str:
    """
    解压ZIP文件到目录
    
    Args:
        zip_path: ZIP文件路径
        extract_path: 解压目标路径，如果为None则创建临时目录
    
    Returns:
        str: 解压目录路径
    
    Raises:
        ZipCreationError: 解压ZIP文件失败时抛出
    """
    try:
        # 验证ZIP文件
        if not os.path.exists(zip_path):
            raise ZipCreationError(f"ZIP文件不存在: {zip_path}")

        if not zipfile.is_zipfile(zip_path):
            raise ZipCreationError(f"文件不是有效的ZIP格式: {zip_path}")

        # 如果未指定解压路径，创建临时目录
        temp_dir = None
        if extract_path is None:
            temp_dir = tempfile.mkdtemp(prefix="magic_space_")
            extract_path = temp_dir

        # 解压ZIP文件
        with zipfile.ZipFile(zip_path, 'r') as zipf:
            zipf.extractall(extract_path)

        logger.info(f"成功解压ZIP文件到: {extract_path}")
        return extract_path

    except Exception as e:
        # 如果创建了临时目录但发生错误，清理临时目录
        if temp_dir and os.path.exists(temp_dir):
            try:
                shutil.rmtree(temp_dir)
            except Exception as cleanup_error:
                logger.error(f"清理临时目录失败: {cleanup_error}")

        logger.error(f"解压ZIP文件失败: {e!s}")
        raise ZipCreationError(message="解压ZIP文件失败", cause=e)


def sanitize_directory_name(name: str) -> str:
    """
    清理目录名称，移除特殊字符并确保其安全
    
    Args:
        name: 原始目录名称
        
    Returns:
        str: 清理后的目录名称
    """
    # 替换非字母数字字符为下划线
    sanitized = re.sub(r'[^\w\-\.]', '_', name)
    # 移除可能导致问题的前导/尾随字符
    sanitized = sanitized.strip('._-')
    # 确保名称不为空
    if not sanitized:
        sanitized = "unnamed_directory"
    return sanitized


def format_size(size_bytes: int) -> str:
    """
    格式化文件大小
    
    Args:
        size_bytes: 文件大小（字节）
        
    Returns:
        str: 格式化后的大小字符串（如 "1.23 MB"）
    """
    if size_bytes < 1024:
        return f"{size_bytes} B"

    size_kb = size_bytes / 1024
    if size_kb < 1024:
        return f"{size_kb:.2f} KB"

    size_mb = size_kb / 1024
    if size_mb < 1024:
        return f"{size_mb:.2f} MB"

    size_gb = size_mb / 1024
    return f"{size_gb:.2f} GB"


def format_url(base_url: str, path: str) -> str:
    """
    拼接并格式化URL
    
    Args:
        base_url: 基础URL，如 "https://example.com"
        path: URL路径，如 "/api/sites"
        
    Returns:
        str: 格式化后的完整URL
    """
    # 确保base_url没有尾随斜杠
    if base_url.endswith('/'):
        base_url = base_url[:-1]

    # 确保path有前导斜杠
    if not path.startswith('/'):
        path = '/' + path

    return base_url + path 
