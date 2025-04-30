# 工具架构重构方案

## 1. 背景与目标

当前工具（tools）架构存在一些问题：
- 工具分散在多个地方（@tool、@tools）
- 工具参数声明复杂，维护困难
- 没有一个统一的自动扫描与注册机制
- 缺乏分组和分类管理

借鉴浏览器操作（browser_operations）的架构设计，我们提出一个新的工具架构实现方案，目标是：
- 统一工具的声明与注册方式
- 简化工具参数定义，采用基于类型注解的方法
- 实现自动扫描和动态加载
- 减少工具维护成本

## 2. 架构设计

### 2.1 整体架构

```
┌─────────────────────────────────┐
│           app.tools             │
├─────────────────────────────────┤
│  ┌─────────────────────────┐    │
│  │    工具参数模型化       │    │
│  │  (Pydantic参数模型)     │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │      工具装饰器         │    │
│  │  (自动提取工具元数据)   │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │      工具工厂           │    │
│  │  (自动扫描与注册机制)   │    │
│  └─────────────────────────┘    │
└─────────────────────────────────┘
          │
          │ 提供工具实例和元数据
          ▼
┌─────────────────────────────────┐
│        app.agent.tool_executor  │
└─────────────────────────────────┘
```

### 2.2 文件结构

```
app/
├── tools/
│   ├── __init__.py             # 导出工具工厂
│   ├── core/                   # 核心组件
│   │   ├── __init__.py
│   │   ├── base_tool.py        # 工具基类（升级版）
│   │   ├── base_tool_params.py # 参数基类定义
│   │   ├── tool_decorator.py   # 工具装饰器实现
│   │   └── tool_factory.py     # 工具工厂实现
│   ├── read_file.py            # 文件读取工具
│   ├── write_to_file.py        # 文件写入工具
│   ├── list_dir.py             # 目录列表工具
│   ├── grep_search.py          # 内容搜索工具
│   ├── use_browser.py          # 浏览器使用工具
│   └── ...                     # 其他工具
```

## 3. 核心设计

### 3.1 参数模型化

使用Pydantic模型替代手写JSONSchema，简化参数定义，并将参数定义与工具实现放在同一文件中：

```python
# app/tools/read_file.py
from typing import Optional
from pydantic import Field, BaseModel

from app.tools.core.base_tool_params import BaseToolParams
from app.tools.core.base_tool import BaseTool
from app.tools.core.tool_decorator import tool

class ReadFileParams(BaseToolParams):
    target_file: str = Field(..., description="要读取的文件路径")
    offset: Optional[int] = Field(0, description="开始读取的行号（从0开始）")
    limit: Optional[int] = Field(100, description="要读取的行数")
    should_read_entire_file: Optional[bool] = Field(False, description="是否读取整个文件")

@tool()
class ReadFile(BaseTool):
    """读取指定文件的内容

    支持按行读取或读取整个文件
    """

    async def execute(self, tool_context: ToolContext, params: ReadFileParams) -> ToolResult:
        # 工具实现...
        pass
```

### 3.2 工具装饰器

提供简单的装饰器用于注册工具，支持自动提取工具名称和描述：

```python
@tool() # 自动从类名提取工具名称，从类文档字符串提取描述
class ReadFile(BaseTool):
    """读取指定文件的内容

   自动将此文档字符串的第一行作为工具描述
    """
    # 工具实现...
```

### 3.3 工具工厂

实现工具工厂，负责自动扫描、注册和创建工具实例：

```python
class ToolFactory:
    """工具工厂

    负责扫描、注册和创建工具实例
    """
    _instance = None # 单例模式

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ToolFactory, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self._tools = {}
        self._tool_instances = {}
        self._initialized = True

    def initialize(self):
        """初始化工厂，扫描和注册所有工具"""
        # 实现自动扫描...

    def get_tool_instance(self, tool_name: str) -> BaseTool:
        """获取工具实例"""
        # 实现...
```

## 4. 实现方案

### 4.1 基础组件

#### 4.1.1 工具参数基类

```python
# app/tools/core/base_tool_params.py
from pydantic import BaseModel, Field

class BaseToolParams(BaseModel):
    """工具参数基类

    所有工具参数模型的基类，定义共同参数
    """
    explanation: str = Field(
        ...,
        description="以第一人称简要说明执行此工具的目的和预期效果"
    )
```

#### 4.1.2 工具装饰器

```python
# app/tools/core/tool_decorator.py
import inspect
import functools
from typing import Optional, Type, Dict, Any

def tool():
    """工具注册装饰器

    用于注册工具类，自动提取名称和描述
    """
    def decorator(cls):
        # 从类名提取工具名称（转为蛇形命名法）
        import re
        tool_name = re.sub(r'(?<!^)(?=[A-Z])', '_', cls.__name__).lower()

        # 从文档字符串提取描述
        tool_description = None
        if cls.__doc__:
            tool_description = cls.__doc__.split('\n')[0].strip()

        # 查找execute方法的参数类型
        if hasattr(cls, 'execute'):
            sig = inspect.signature(cls.execute)
            params_class = None
            for param_name, param in list(sig.parameters.items())[2:]:  # 跳过self和tool_context
                if param.annotation != inspect.Parameter.empty:
                    params_class = param.annotation
                    break

        # 标记此类为工具
        cls._is_tool = True
        cls._tool_name = tool_name
        cls._tool_description = tool_description
        cls._params_class = params_class

        # 确保name和description字段设置正确
        if not hasattr(cls, 'name') or not cls.name:
            cls.name = tool_name
        if not hasattr(cls, 'description') or not cls.description:
            cls.description = tool_description

        # 自动注册到工具工厂
        from app.tools.core.tool_factory import ToolFactory
        ToolFactory().register_tool(cls)

        return cls
    return decorator
```

### 4.2 工具工厂实现

```python
# app/tools/core/tool_factory.py
import os
import inspect
import importlib
import pkgutil
from typing import Dict, List, Any, Type, Optional

from app.logger import get_logger
from app.core.entity.tool.tool_result import ToolResult
from app.tools.core.base_tool import BaseTool

logger = get_logger(__name__)

class ToolFactory:
    """工具工厂

    负责扫描、注册和创建工具实例
    """
    _instance = None # 单例模式

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ToolFactory, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self._tools = {}
        self._tool_instances = {}
        self._initialized = True

    def register_tool(self, tool_class: Type[BaseTool]):
        """注册工具类

        Args:
            tool_class: 工具类
        """
        if not hasattr(tool_class, '_tool_name'):
            logger.warning(f"工具类 {tool_class.__name__} 未通过@tool装饰器装饰，跳过注册")
            return

        tool_name = tool_class._tool_name

        # 记录工具信息
        self._tools[tool_name] = {
            "class": tool_class,
            "name": tool_name,
            "description": tool_class._tool_description,
            "params_class": getattr(tool_class, '_params_class', None)
        }

        logger.debug(f"注册工具: {tool_name}")

    def auto_discover_tools(self):
        """自动发现并注册工具

        扫描app.tools包下的所有模块，查找并注册所有通过@tool装饰的工具类
        """
        # 获取工具包路径
        package_name = 'app.tools'
        try:
            package = importlib.import_module(package_name)
            package_path = os.path.dirname(package.__file__)

            # 扫描该包下的所有模块
            for _, module_name, is_pkg in pkgutil.iter_modules([package_path]):
                # 跳过核心模块和包
                if is_pkg or module_name == 'core':
                    continue

                # 动态导入模块
                module_fullname = f"{package_name}.{module_name}"
                try:
                    # 导入模块会触发@tool装饰器自动注册
                    importlib.import_module(module_fullname)
                except Exception as e:
                    logger.error(f"加载模块 {module_fullname} 失败: {str(e)}")
        except ImportError:
            logger.error(f"未找到工具包: {package_name}")

    def initialize(self):
        """初始化工厂，扫描和注册所有工具"""
        self.auto_discover_tools()
        logger.info(f"工具工厂初始化完成，共发现 {len(self._tools)} 个工具")

    def get_tool(self, tool_name: str) -> Dict[str, Any]:
        """获取工具信息

        Args:
            tool_name: 工具名称

        Returns:
            Dict[str, Any]: 工具信息
        """
        if not self._tools:
            self.initialize()

        return self._tools.get(tool_name)

    def get_tool_instance(self, tool_name: str) -> BaseTool:
        """获取工具实例

        Args:
            tool_name: 工具名称

        Returns:
            BaseTool: 工具实例
        """
        # 先检查缓存
        if tool_name in self._tool_instances:
            return self._tool_instances[tool_name]

        # 获取工具信息
        tool_info = self.get_tool(tool_name)
        if not tool_info:
            raise ValueError(f"工具 {tool_name} 不存在")

        # 创建工具实例
        tool_class = tool_info["class"]
        tool_instance = tool_class()

        # 缓存实例
        self._tool_instances[tool_name] = tool_instance

        return tool_instance

    def get_all_tools(self) -> Dict[str, Dict[str, Any]]:
        """获取所有工具信息

        Returns:
            Dict[str, Dict[str, Any]]: 工具名称和信息的字典
        """
        if not self._tools:
            self.initialize()

        return self._tools

    def get_all_tool_instances(self) -> List[BaseTool]:
        """获取所有工具实例

        Returns:
            List[BaseTool]: 工具实例列表
        """
        all_tools = self.get_all_tools()
        return [self.get_tool_instance(tool_name) for tool_name in all_tools.keys()]

    async def run_tool(self, tool_context: ToolContext, tool_name: str, **kwargs) -> ToolResult:
        """运行工具

        Args:
            tool_context: 工具上下文
            tool_name: 工具名称
            **kwargs: 工具参数

        Returns:
            ToolResult: 工具执行结果
        """
        try:
            # 获取工具实例
            tool_instance = self.get_tool_instance(tool_name)

            # 执行工具
            result = await tool_instance(tool_context=tool_context, **kwargs)

            return result
        except Exception as e:
            logger.error(f"执行工具 {tool_name} 失败: {str(e)}")

            # 创建错误结果
            result = ToolResult()
            result.error = f"执行工具失败: {str(e)}"
            result.name = tool_name

            return result
```

## 5. 示例代码

### 5.1 工具实现示例

```python
# app/tools/read_file.py
from typing import Optional
from pydantic import Field

from app.tools.core.base_tool_params import BaseToolParams
from app.tools.core.base_tool import BaseTool
from app.tools.core.tool_decorator import tool
from app.core.context.tool_context import ToolContext
from app.core.entity.tool.tool_result import ToolResult

class ReadFileParams(BaseToolParams):
    """读取文件参数"""
    target_file: str = Field(..., description="要读取的文件路径")
    offset: Optional[int] = Field(0, description="开始读取的行号（从0开始）")
    limit: Optional[int] = Field(100, description="要读取的行数")
    should_read_entire_file: Optional[bool] = Field(False, description="是否读取整个文件")

@tool()
class ReadFile(BaseTool):
    """读取指定文件的内容

    支持按行读取或读取整个文件
    """

    async def execute(self, tool_context: ToolContext, params: ReadFileParams) -> ToolResult:
        result = ToolResult()
        try:
            # 实现读取文件的逻辑...
            result.output = "文件内容..."
            return result
        except Exception as e:
            result.error = f"读取文件失败: {str(e)}"
            return result
```

### 5.2 工具工厂使用示例

```python
# app/tools/__init__.py
from app.tools.core.tool_factory import ToolFactory

# 创建全局工具工厂实例
tool_factory = ToolFactory()

# 初始化工厂
tool_factory.initialize()

# app/agent/tool_executor.py
from app.tools import tool_factory

async def execute_tool(tool_name: str, tool_context: ToolContext, **kwargs):
    # 执行工具
    result = await tool_factory.run_tool(tool_context, tool_name, **kwargs)
    return result
```

## 6. 重构策略（请在此处标记你的重构进度并打钩）

1. **新的工具架构实现**：
   - 实现工具核心组件（base_tool_params.py, tool_decorator.py, tool_factory.py）
   - 调整BaseTool基类以适应新的参数模型

2. **现有工具重构**：
   - 对每个现有工具文件进行重构
   - 使用新的参数模型替代JSONSchema定义
   - 应用@tool装饰器
   - 确保工具功能保持一致

3. **更新系统集成**：
   - 更新工具工厂并添加自动发现机制
   - 确保完整地改造现有代码
   - 清理废弃或无用的文件

## 7. 总结

本方案通过借鉴browser_operations的架构设计中的部分理念，提出了一个更简洁的工具架构实现方案。每个工具独立到单独的文件中，参数定义与工具实现放在同一文件，采用装饰器自动注册机制，简化了工具的开发和维护工作。

工具工厂（ToolFactory）增强了自动发现和注册能力，通过扫描app.tools包下的所有模块，自动加载和注册工具，形成了一个统一的工具管理中心。工具装饰器支持自动提取工具名称和描述，进一步减少了手动配置的需要。

与browser_operations基于工具组的设计不同，本方案保留了平铺式的工具结构，确保每个工具文件独立干净，便于理解和维护。
