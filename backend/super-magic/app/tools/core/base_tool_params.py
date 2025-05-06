"""工具参数基类模块

定义所有工具参数模型的基类，提供通用参数字段
"""

from typing import Optional

from pydantic import BaseModel, Field


class BaseToolParams(BaseModel):
    """工具参数基类

    所有工具参数模型的基类，定义共同参数
    """
    # TODO： 重复率太高，浪费 token
    explanation: str = Field(
        "", # 虽然有默认值，但在实际调用时会被处理为必填字段，以确保大模型始终提供解释
        description="Explain why you're using this tool in first person (with 'I') - briefly state your purpose, expected outcome, and how you'll use the results to help the user. "
                   "**Never mention tool names when communicating with users.** For example, say \"I'll edit your file\" instead of \"I need to use write_to_file tool to edit your file\""
    )

    @classmethod
    def get_custom_error_message(cls, field_name: str, error_type: str) -> Optional[str]:
        """获取自定义参数错误信息

        此方法允许工具参数类为特定字段和错误类型提供自定义错误消息。
        子类可以覆盖此方法，为常见错误场景提供更友好、更具有指导性的错误信息。

        Args:
            field_name: 参数字段名称
            error_type: 错误类型，来自Pydantic验证错误

        Returns:
            Optional[str]: 自定义错误信息，None表示使用默认错误信息
        """
        return None
