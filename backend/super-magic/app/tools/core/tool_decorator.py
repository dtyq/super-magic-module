"""工具装饰器模块

提供工具注册装饰器，用于自动提取工具元数据并注册工具
"""

import inspect
import os.path
import re
from typing import Optional


def tool(name: Optional[str] = None, description: Optional[str] = None):
    """工具注册装饰器

    用于注册工具类，自动提取名称、描述和参数类型

    Args:
        name: 可选工具名称，若不提供则从类名自动生成
        description: 可选工具描述，若不提供则从类文档字符串自动提取
    """
    def decorator(cls):
        # 从类名提取工具名称（转为蛇形命名法）
        tool_name = name
        if not tool_name:
            tool_name = re.sub(r'(?<!^)(?=[A-Z])', '_', cls.__name__).lower()

            # 也可以从文件名提取工具名称
            try:
                module_file = inspect.getmodule(cls).__file__
                file_name = os.path.basename(module_file)
                file_name_without_ext = os.path.splitext(file_name)[0]
                # 如果文件名与转换后的类名匹配度高，使用文件名
                if file_name_without_ext == tool_name or file_name_without_ext.endswith(tool_name):
                    tool_name = file_name_without_ext
            except (AttributeError, TypeError):
                pass

        # 从文档字符串提取描述
        tool_description = description
        if not tool_description and cls.__doc__:
            # 提取文档字符串的第一段
            doc_lines = [line.strip() for line in cls.__doc__.split('\n') if line.strip()]
            if doc_lines:
                # 取第一段落作为描述（空行前的所有内容）
                desc_lines = []
                for line in doc_lines:
                    if not line:
                        break
                    desc_lines.append(line)
                if desc_lines:
                    tool_description = ' '.join(desc_lines)

        # 查找params_class和execute方法的参数类型
        params_class = getattr(cls, 'params_class', None)
        if hasattr(cls, 'execute') and not params_class:
            sig = inspect.signature(cls.execute)

            # 检查参数注解
            for param_name, param in list(sig.parameters.items())[2:]:  # 跳过self和tool_context
                if param.annotation != inspect.Parameter.empty:
                    params_class = param.annotation
                    break

        # 标记工具元数据
        cls._is_tool = True
        cls._tool_name = tool_name
        cls._tool_description = tool_description
        cls._params_class = params_class

        # 确保name和description字段设置正确（但不覆盖已有值）
        if not hasattr(cls, 'name') or not cls.name:
            cls.name = tool_name
        if not hasattr(cls, 'description') or not cls.description:
            cls.description = tool_description
        if not hasattr(cls, 'params_class') or not cls.params_class:
            cls.params_class = params_class

        # 自动注册到工具工厂
        # 注意: 这里使用延迟导入避免循环引用
        # 实际注册会在ToolFactory初始化时完成
        cls._registered = False

        return cls
    return decorator
