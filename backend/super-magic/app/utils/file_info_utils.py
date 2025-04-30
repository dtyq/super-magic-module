from pathlib import Path
from typing import Optional, Set
from datetime import datetime
import logging

from app.utils.token_estimator import num_tokens_from_string

logger = logging.getLogger(__name__)

# 定义文本/代码文件后缀集合
TEXT_FILE_EXTENSIONS: Set[str] = {
    # Programming Languages
    ".py", ".java", ".c", ".cpp", ".h", ".cs", ".go", ".rs", ".swift", ".kt",
    ".js", ".ts", ".jsx", ".tsx", ".vue", ".rb", ".php", ".pl", ".sh", ".bat",
    # Web Development
    ".html", ".htm", ".css", ".scss", ".less", ".json", ".yaml", ".yml", ".xml",
    # Data & Configuration
    ".csv", ".ini", ".toml", ".sql", ".env", ".xlsx", ".xls",
    # Documentation & Text
    ".md", ".txt", ".rst", ".tex", ".log", ".doc", ".docx",
    # Other common text-based formats
    ".ipynb" # Jupyter notebooks are JSON but often line-counted
}

# 定义二进制文件后缀集合
BINARY_FILE_EXTENSIONS: Set[str] = {
    # Images
    ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".tiff", ".webp", ".ico", ".svg",
    # Audio
    ".mp3", ".wav", ".ogg", ".flac", ".aac", ".m4a",
    # Video
    ".mp4", ".avi", ".mov", ".wmv", ".flv", ".mkv", ".webm",
    # Archives
    ".zip", ".rar", ".gz", ".tar", ".7z",
    # Documents
    ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
    # Executables
    ".exe", ".dll", ".so", ".bin",
    # Other binary formats
    ".db", ".sqlite", ".pyc", ".class"
}

def is_text_file(file_path: Path) -> bool:
    """判断文件是否为文本/代码文件"""
    if file_path.name == "Dockerfile":
        return True
    ext = file_path.suffix.lower()
    return ext in TEXT_FILE_EXTENSIONS or (
        ext and ext not in BINARY_FILE_EXTENSIONS and not ext.startswith('.')
    )

def format_file_size(size: int) -> str:
    """格式化文件大小"""
    if size < 0: return "无效大小"
    for unit in ["B", "KB", "MB", "GB"]:
        if size < 1024:
            # 对于 B 和 KB，保留整数；对于 MB 及以上，保留一位小数
            if unit in ["B", "KB"]:
                return f"{int(size)}{unit}"
            return f"{size:.1f}{unit}"
        size /= 1024
    return f"{size:.1f}TB"

def count_file_lines(file_path: Path) -> Optional[int]:
    """计算文件行数"""
    try:
        # 优化：对于大文件，不实际读取所有行
        if file_path.stat().st_size > 10 * 1024 * 1024: # 超过 10MB 不计数
             return None
        with file_path.open("r", encoding="utf-8", errors='ignore') as f:
            return sum(1 for _ in f)
    except Exception as e:
        logger.debug(f"计算文件行数失败: {file_path}, 错误: {e}")
        return None

def count_file_tokens(file_path: Path) -> Optional[int]:
    """计算文件token数量"""
    try:
        with file_path.open("r", encoding="utf-8", errors='ignore') as f:
            content = f.read()
            return num_tokens_from_string(content)
    except Exception as e:
        logger.debug(f"计算文件token数量失败: {file_path}, 错误: {e}")
        return None

def get_file_info(file_path: str) -> str:
    """获取文件信息，包括大小、行数、token数和修改时间"""
    try:
        path = Path(file_path)
        if not path.exists():
            return f"{file_path} (文件不存在)"

        stat_result = path.stat()
        file_size = stat_result.st_size
        size_str = format_file_size(file_size)

        # 获取修改时间
        last_modified = stat_result.st_mtime
        modified_time = datetime.fromtimestamp(last_modified).strftime("%Y-%m-%d %H:%M:%S")

        # 收集属性
        attributes = [size_str]

        # 对于文本文件计算行数和token数量
        if is_text_file(path):
            line_count = count_file_lines(path)
            if line_count is not None:
                attributes.append(f"{line_count}行")

            token_count = count_file_tokens(path)
            if token_count is not None:
                attributes.append(f"{token_count}个token")

        attributes_str = ", ".join(attributes)
        return f"{file_path} ({attributes_str}, 最后修改：{modified_time})"
    except Exception as e:
        logger.debug(f"获取文件信息失败: {file_path}, 错误: {e}")
        return file_path

def get_file_metadata(file_path: str) -> dict:
    """
    获取文件的元数据信息，以字典形式返回

    Returns:
        包含以下字段的字典：
        - exists: 文件是否存在
        - size: 文件大小（字节）
        - size_formatted: 格式化的文件大小
        - is_text: 是否为文本文件
        - line_count: 行数（仅文本文件）
        - token_count: token数量（仅文本文件）
        - last_modified: 最后修改时间戳
        - modified_time: 格式化的修改时间
    """
    try:
        path = Path(file_path)
        result = {
            "exists": path.exists(),
            "path": str(path),
        }

        if not result["exists"]:
            return result

        stat_result = path.stat()
        result["size"] = stat_result.st_size
        result["size_formatted"] = format_file_size(result["size"])
        result["last_modified"] = stat_result.st_mtime
        result["modified_time"] = datetime.fromtimestamp(stat_result.st_mtime).strftime("%Y-%m-%d %H:%M:%S")

        is_text = is_text_file(path)
        result["is_text"] = is_text

        if is_text:
            result["line_count"] = count_file_lines(path)
            result["token_count"] = count_file_tokens(path)

        return result
    except Exception as e:
        logger.debug(f"获取文件元数据失败: {file_path}, 错误: {e}")
        return {"exists": False, "path": file_path, "error": str(e)}
