"""
路径相关的常量和工具函数，使用面向对象方式实现
"""

from pathlib import Path
from typing import Optional, ClassVar

class PathManager:
    """
    路径管理器，提供项目中所有相关路径的访问
    使用静态方法实现，不需要实例化
    """

    # 静态类变量
    _project_root: ClassVar[Optional[Path]] = None
    _logs_dir: ClassVar[Optional[Path]] = None
    _workspace_dir_name: ClassVar[str] = ".workspace"
    _workspace_dir: ClassVar[Optional[Path]] = None
    _chat_history_dir_name: ClassVar[str] = ".chat_history"
    _chat_history_dir: ClassVar[Optional[Path]] = None
    _browser_data_dir_name: ClassVar[str] = ".browser"
    _browser_data_dir: ClassVar[Optional[Path]] = None
    _browser_storage_state_file: ClassVar[Optional[Path]] = None
    _project_archive_dir_name: ClassVar[str] = "project_archive"
    _cache_dir: ClassVar[Optional[Path]] = None
    _credentials_dir_name: ClassVar[str] = ".credentials"
    _credentials_dir: ClassVar[Optional[Path]] = None
    _init_client_message_file: ClassVar[Optional[Path]] = None
    _project_schema_dir_name: ClassVar[str] = ".project_schemas"
    _project_schema_absolute_dir: ClassVar[Optional[Path]] = None
    _project_archive_info_file_relative_path: ClassVar[Optional[str]] = None
    _project_archive_info_file: ClassVar[Optional[Path]] = None
    _initialized: ClassVar[bool] = False

    @classmethod
    def set_project_root(cls, project_root: Path) -> None:
        """
        设置项目根目录并初始化所有路径

        Args:
            project_root: 项目根目录路径
        """
        if cls._initialized:
            return

        cls._project_root = project_root

        # 初始化所有路径
        cls._logs_dir = cls._project_root / "logs"

        cls._workspace_dir = cls._project_root.joinpath(cls._workspace_dir_name)

        cls._chat_history_dir = cls._project_root.joinpath(cls._chat_history_dir_name)

        # 浏览器持久化数据目录
        cls._browser_data_dir = cls._project_root.joinpath(cls._browser_data_dir_name)
        cls._browser_storage_state_file = cls._browser_data_dir / "storage_state.json"

        # 缓存目录
        cls._cache_dir = cls._project_root / "cache"

        # 凭证目录
        cls._credentials_dir = cls._project_root.joinpath(cls._credentials_dir_name)

        cls._init_client_message_file = cls._credentials_dir / "init_client_message.json"

        # 项目架构目录
        cls._project_schema_absolute_dir = cls._project_root / cls._project_schema_dir_name
        cls._project_archive_info_file_relative_path = f"{cls._project_schema_dir_name}/project_archive_info.json"
        cls._project_archive_info_file = cls._project_schema_absolute_dir / "project_archive_info.json"

        # 确保必要的目录存在
        cls._ensure_directories_exist()

        print("项目根目录: ", cls._project_root)

        cls._initialized = True

    @classmethod
    def _ensure_directories_exist(cls) -> None:
        """确保所有必要的目录存在"""
        if cls._project_root is None:
            raise RuntimeError("必须先调用 set_project_root 设置项目根目录")

        cls._logs_dir.mkdir(exist_ok=True)
        cls._workspace_dir.mkdir(exist_ok=True)
        cls._chat_history_dir.mkdir(exist_ok=True)
        cls._browser_data_dir.mkdir(exist_ok=True)
        cls._cache_dir.mkdir(exist_ok=True)
        cls._credentials_dir.mkdir(exist_ok=True)
        cls._project_schema_absolute_dir.mkdir(exist_ok=True)

    # 所有静态的 getter 方法
    @classmethod
    def get_project_root(cls) -> Path:
        """获取项目根目录路径"""
        if cls._project_root is None:
            raise RuntimeError("必须先调用 set_project_root 设置项目根目录")
        return cls._project_root

    @classmethod
    def get_logs_dir(cls) -> Path:
        """获取日志目录路径"""
        if cls._logs_dir is None:
            raise RuntimeError("必须先调用 set_project_root 设置项目根目录")
        return cls._logs_dir

    @classmethod
    def get_workspace_dir_name(cls) -> str:
        """获取工作空间目录名称"""
        return cls._workspace_dir_name

    @classmethod
    def get_workspace_dir(cls) -> Path:
        """获取工作空间目录路径"""
        if cls._workspace_dir is None:
            raise RuntimeError("必须先调用 set_project_root 设置项目根目录")
        return cls._workspace_dir

    @classmethod
    def get_chat_history_dir_name(cls) -> str:
        """获取聊天历史目录名称"""
        return cls._chat_history_dir_name

    @classmethod
    def get_chat_history_dir(cls) -> Path:
        """获取聊天历史目录路径"""
        if cls._chat_history_dir is None:
            raise RuntimeError("必须先调用 set_project_root 设置项目根目录")
        return cls._chat_history_dir

    @classmethod
    def get_browser_data_dir_name(cls) -> str:
        """获取浏览器数据目录名称"""
        return cls._browser_data_dir_name

    @classmethod
    def get_browser_data_dir(cls) -> Path:
        """获取浏览器数据目录路径"""
        if cls._browser_data_dir is None:
            raise RuntimeError("必须先调用 set_project_root 设置项目根目录")
        return cls._browser_data_dir

    @classmethod
    def get_browser_storage_state_file(cls) -> Path:
        """获取浏览器存储状态文件路径"""
        if cls._browser_storage_state_file is None:
            raise RuntimeError("必须先调用 set_project_root 设置项目根目录")
        return cls._browser_storage_state_file

    @classmethod
    def get_project_archive_dir_name(cls) -> str:
        """获取项目归档目录名称"""
        return cls._project_archive_dir_name

    @classmethod
    def get_cache_dir(cls) -> Path:
        """获取缓存目录路径"""
        if cls._cache_dir is None:
            raise RuntimeError("必须先调用 set_project_root 设置项目根目录")
        return cls._cache_dir

    @classmethod
    def get_credentials_dir_name(cls) -> str:
        """获取凭证目录名称"""
        return cls._credentials_dir_name

    @classmethod
    def get_credentials_dir(cls) -> Path:
        """获取凭证目录路径"""
        if cls._credentials_dir is None:
            raise RuntimeError("必须先调用 set_project_root 设置项目根目录")
        return cls._credentials_dir

    @classmethod
    def get_init_client_message_file(cls) -> Path:
        """获取初始客户端消息文件路径"""
        if cls._init_client_message_file is None:
            raise RuntimeError("必须先调用 set_project_root 设置项目根目录")
        return cls._init_client_message_file

    @classmethod
    def get_project_schema_dir_name(cls) -> str:
        """获取项目架构目录名称"""
        return cls._project_schema_dir_name

    @classmethod
    def get_project_schema_absolute_dir(cls) -> Path:
        """获取项目架构绝对目录路径"""
        if cls._project_schema_absolute_dir is None:
            raise RuntimeError("必须先调用 set_project_root 设置项目根目录")
        return cls._project_schema_absolute_dir

    @classmethod
    def get_project_archive_info_file_relative_path(cls) -> str:
        """获取项目归档信息文件相对路径"""
        if cls._project_archive_info_file_relative_path is None:
            raise RuntimeError("必须先调用 set_project_root 设置项目根目录")
        return cls._project_archive_info_file_relative_path

    @classmethod
    def get_project_archive_info_file(cls) -> Path:
        """获取项目归档信息文件路径"""
        if cls._project_archive_info_file is None:
            raise RuntimeError("必须先调用 set_project_root 设置项目根目录")
        return cls._project_archive_info_file
