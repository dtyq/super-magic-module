"""浏览器操作映射模块

该模块定义了浏览器操作的中文名称和对应的图标

"""

from enum import Enum

from app.logger import get_logger

logger = get_logger(__name__)


# 映射字典，方便直接使用字典方式查询
OPERATION_NAME_MAPPING = {
    "goto": "打开网页",
    "scroll_page": "滚动页面",
    "read_as_markdown": "阅读网页内容",
    "get_interactive_elements": "理解网页",
    "click": "操作网页",
    "input_text": "输入内容",
}

class BrowserOperationNames(Enum):
    """浏览器操作对应的中文名称

    各个操作的中文名称
    """

    @classmethod
    def get_operation_info(cls, operation_name: str) -> str:
        """获取操作的中文名称和图标

        Args:
            operation_name: 操作名称，如 goto, scroll_page 等

        Returns:
            包含中文名称和图标的字典，如果找不到对应操作则返回 None
        """
        if operation_name not in OPERATION_NAME_MAPPING:
            logger.warning(f"未知操作: {operation_name}，使用原操作名称")
            return operation_name
        else:
            return OPERATION_NAME_MAPPING[operation_name]
