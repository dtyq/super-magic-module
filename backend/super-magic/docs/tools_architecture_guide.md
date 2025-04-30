# 工具系统架构指南

本文档提供了工具系统架构的详细说明，包括设计原则、核心组件、使用方法和最佳实践。

## 1. 架构概述

工具系统采用模块化设计，主要由以下核心组件组成：

- **BaseTool**: 工具基类，所有工具继承自此类
- **BaseToolParams**: 工具参数基类，所有参数类继承自此类
- **tool_factory**: 工具工厂单例，负责工具的注册、发现和实例化
- **tool_executor**: 工具执行器单例，负责工具的执行和错误处理
- **工具装饰器**：`@tool()` 用于自动注册工具类

### 1.1 架构图

```
                           ┌────────────────┐
                           │ @tool()        │
                           │ 装饰器         │
                           └───────┬────────┘
                                   │
                                   ▼
┌────────────────┐         ┌───────────────┐         ┌────────────────┐
│ BaseToolParams │◄────────┤   BaseTool    │────────►│  ToolResult    │
└────────────────┘         └───────┬───────┘         └────────────────┘
                                   │
                                   │
                  ┌────────────────┴────────────────┐
                  │                                  │
                  ▼                                  ▼
         ┌────────────────┐                 ┌───────────────────┐
         │  tool_factory  │◄────────────────┤   tool_executor   │
         └────────────────┘                 └───────────────────┘
                  ▲                                  ▲
                  │                                  │
                  └────────────────┬────────────────┘
                                   │
                                   ▼
                         ┌──────────────────────┐
                         │    具体工具实现      │
                         │  (ListDir, ReadFile) │
                         └──────────────────────┘
```

### 1.2 设计原则

1. **单一职责**：每个组件负责一种功能，工厂负责管理，执行器负责执行
2. **依赖注入**：通过构造函数传递依赖，避免硬编码依赖关系
3. **类型安全**：使用Pydantic模型确保参数类型安全和验证
4. **自动注册**：使用装饰器实现工具的自动注册
5. **错误隔离**：对工具执行错误进行捕获和处理，避免影响主流程

## 2. 核心组件

### 2.1 工具基类 (BaseTool)

所有工具必须继承自 `BaseTool` 基类，它提供了工具的基本接口和实现。

```python
class BaseTool(ABC, Generic[T]):
    """工具基类"""
    # 工具元数据
    name: str = ""
    description: str = ""

    # 参数模型类型
    params_class: Type[T] = None

    @abstractmethod
    async def execute(self, tool_context: ToolContext, params: T) -> ToolResult:
        """执行工具，子类必须实现"""
        pass

    async def __call__(self, tool_context: ToolContext, **kwargs) -> ToolResult:
        """工具调用的入口点，处理参数转换等通用逻辑"""
        # ...处理参数转换和错误捕获
        return result
```

### 2.2 工具参数基类 (BaseToolParams)

工具参数必须继承自 `BaseToolParams` 基类，它提供了参数的基本字段和验证规则。

```python
class BaseToolParams(BaseModel):
    """工具参数基类"""
    explanation: str = Field(
        ...,
        description="以第一人称简要说明执行此工具的目的和预期效果"
    )
```

### 2.3 工具工厂 (tool_factory)

工具工厂负责工具的注册、发现和实例化。它使用单例模式确保全局一致性。

```python
# 使用工具工厂获取工具实例
tool_instance = tool_factory.get_tool_instance("list_dir")

# 获取所有工具名称
tool_names = tool_factory.get_tool_names()

# 初始化工厂（通常不需要手动调用）
tool_factory.initialize()
```

### 2.4 工具执行器 (tool_executor)

工具执行器负责工具的执行和错误处理。它也使用单例模式确保全局一致性。

```python
# 执行工具
result = await tool_executor.execute_tool_call(tool_context, arguments)

# 获取工具实例
tool = tool_executor.get_tool("list_dir")

# 获取所有工具函数调用模式
schemas = tool_executor.get_tool_schemas()
```

### 2.5 工具装饰器 (@tool)

工具装饰器用于自动注册工具类，简化工具的定义。

```python
@tool()
class MyTool(BaseTool):
    """我的工具"""
    # 工具实现...
```

## 3. 工具开发指南

### 3.1 定义工具参数

首先定义工具参数类，继承自 `BaseToolParams`：

```python
class MyToolParams(BaseToolParams):
    """工具参数"""
    param1: str = Field(..., description="参数1的描述")
    param2: int = Field(10, description="参数2的描述")
    param3: bool = Field(False, description="参数3的描述")
```

### 3.2 定义工具类

然后定义工具类，继承自 `BaseTool`，使用 `@tool()` 装饰器注册：

```python
@tool()
class MyTool(BaseTool):
    """工具描述，第一行将作为工具简述"""

    # 设置参数类型
    params_class = MyToolParams

    async def execute(self, tool_context: ToolContext, params: MyToolParams) -> ToolResult:
        """执行工具逻辑"""
        # 实现工具逻辑
        result = do_something(params.param1, params.param2, params.param3)

        # 返回结果
        return ToolResult(output=result)
```

### 3.3 工具执行流程

工具执行的完整流程如下：

1. 装饰器 `@tool()` 标记类为工具，设置元数据
2. 工具工厂在初始化时扫描并注册所有工具
3. 执行器通过工具工厂获取工具实例
4. 执行器调用工具实例的 `__call__` 方法
5. `__call__` 方法处理参数转换，调用 `execute` 方法
6. `execute` 方法执行工具逻辑，返回结果

## 4. 最佳实践

### 4.1 工具命名

- 工具类名称使用 CamelCase，如 `ListDir`
- 工具名称自动转换为 snake_case，如 `list_dir`
- 文件名应该与工具名称一致，如 `list_dir.py`

### 4.2 参数设计

- 使用清晰的参数名称，避免缩写
- 使用 Pydantic 的 Field 为参数添加描述和约束
- 为可选参数提供合理的默认值
- 使用合适的类型注解

### 4.3 工具实现

- 实现专注的工具，遵循单一职责原则
- 使用 try-except 块处理可能的错误
- 在 execute 方法中使用类型注解
- 将通用逻辑抽取到基类或辅助方法中

### 4.4 工具测试

- 为每个工具编写单元测试
- 测试正常流程和异常场景
- 使用 mock 对象模拟依赖
- 验证结果和错误处理

## 5. 升级与迁移

### 5.1 从旧工具系统迁移

从旧的工具系统迁移到新系统：

1. 添加 `@tool()` 装饰器
2. 定义 `params_class` 和参数模型
3. 更新 `execute` 方法的签名，使用参数模型
4. 删除旧的工具注册代码

### 5.2 使用工具系统的代码更新

将导入从旧系统更新到新系统：

```python
# 旧代码
from app.magic.tool.tool_factory import ToolFactory
from app.magic.tool.tool_executor import ToolExecutor

# 新代码
from app.tools.core.tool_factory import tool_factory
from app.tools.core.tool_executor import tool_executor
```

更新工具执行方式：

```python
# 旧代码
result = await ToolFactory.run_tool(tool_context, args)

# 新代码
result = await tool_executor.execute_tool_call(tool_context, arguments)
```

### 5.3 兼容性考虑

新工具系统完全兼容旧的调用模式，但以下改变需要注意：

- 工具参数现在使用 Pydantic 模型，而不是字典
- 工具调用使用 `__call__` 方法，而不是直接调用 `execute`
- 工具装饰器负责注册工具，不需要手动注册

## 6. 常见问题

### 6.1 工具没有被发现

**问题**：添加了新工具，但系统没有发现它。

**解决**：
1. 确保工具类使用了 `@tool()` 装饰器
2. 确保工具文件在 `app/tools` 目录或其子目录下
3. 确保工具被正确导入，可能需要重启应用
4. 检查工具类名称与文件名是否匹配

### 6.2 参数验证失败

**问题**：工具执行时报参数验证错误。

**解决**：
1. 检查传入的参数是否符合参数模型的定义
2. 检查必需参数是否都已提供
3. 检查参数类型是否正确
4. 如果使用自定义验证逻辑，检查验证函数

### 6.3 工具执行失败

**问题**：工具执行报错。

**解决**：
1. 检查工具逻辑中的错误处理
2. 确保所有依赖服务和资源可用
3. 查看日志中的详细错误信息
4. 使用 try-except 块处理可能的异常
