import json
import os
from typing import Any, Dict, List, Optional

from app.logger import get_logger
from app.paths import PathManager

# 获取日志记录器
logger = get_logger(__name__)


class WorkspaceService:
    """工作区数据服务类"""

    @staticmethod
    def ensure_workspace_dir() -> str:
        """
        确保工作区目录存在，并返回工作区数据文件路径

        Returns:
            工作区数据文件路径
        """
        # 确保目录存在
        workspace_dir = PathManager.get_workspace_dir()
        os.makedirs(workspace_dir, exist_ok=True)
        # 返回工作区数据文件路径
        return os.path.join(workspace_dir, "workspace_data.json")

    @staticmethod
    def read_workspace_data() -> List[Dict[str, Any]]:
        """
        读取工作区数据

        如果本地文件不存在，返回空列表

        Returns:
            工作区数据列表
        """
        file_path = WorkspaceService.ensure_workspace_dir()

        # 如果文件不存在，返回空列表
        if not os.path.exists(file_path):
            logger.info(f"本地工作区数据文件不存在: {file_path}，返回空列表")
            return []

        try:
            # 读取文件内容
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            # 确保返回的是列表
            if not isinstance(data, list):
                logger.warning(f"工作区数据格式错误: {file_path}")
                return []

            logger.debug(f"成功读取工作区数据，工作区数量: {len(data)}")
            return data
        except Exception as e:
            logger.error(f"读取工作区数据失败: {e!s}")
            return []

    @staticmethod
    def write_workspace_data(data: List[Dict[str, Any]]) -> bool:
        """
        写入工作区数据

        Args:
            data: 工作区数据列表

        Returns:
            是否写入成功
        """
        file_path = WorkspaceService.ensure_workspace_dir()

        try:
            # 写入文件
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

            return True
        except Exception as e:
            logger.error(f"写入工作区数据失败: {e!s}")
            return False

    @staticmethod
    def find_workspace(workspaces: List[Dict[str, Any]], workspace_id: Any) -> Optional[Dict[str, Any]]:
        """
        在工作区列表中查找指定工作区

        Args:
            workspaces: 工作区列表
            workspace_id: 工作区ID

        Returns:
            工作区对象，如果未找到则返回None
        """
        for workspace in workspaces:
            if str(workspace.get("id")) == str(workspace_id):
                return workspace
        return None

