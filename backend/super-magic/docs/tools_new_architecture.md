# 新的工具架构

## 设计目标

重构工具架构的主要目标：
- 简化工具声明与参数定义
- 提供自动发现与注册机制
- 使用基于类型注解的参数验证
- 保持向后兼容性

## 核心组件

### 1. 工具参数基类 (BaseToolParams)

工具参数基类使用Pydantic模型，提供参数验证和类型转换功能：

```python
class BaseToolParams(BaseModel):
    """工具参数基类

    所有工具参数模型的基类，定义共同参数
    """
    explanation: str = Field(
        ...,
        description="以第一人称简要说明执行此工具的目的和预期效果"
    )
```

### 2. 工具装饰器 (@tool)

工具装饰器用于简化工具注册，自动提取工具名称、描述和参数类型：

```python
@tool()
class ReadFile(BaseTool):
    """读取文件内容工具

    这个工具可以读取指定路径的文件内容。
    """
    # 设置参数类型
    params_class = ReadFileParams

    async def execute(self, tool_context: ToolContext, params: ReadFileParams) -> ToolResult:
        # 工具实现...
```

### 3. 工具工厂 (ToolFactory)

工具工厂负责自动发现、注册和创建工具实例：

```python
# 全局工具工厂实例
tool_factory = ToolFactory()

# 初始化工厂（自动扫描工具）
tool_factory.initialize()

# 获取工具实例
tool = tool_factory.get_tool_instance("read_file")

# 执行工具
result = await tool_factory.run_tool(tool_context, "read_file", **params)
```

## 使用方式

### 1. 创建工具参数模型

```python
class ReadFileParams(BaseToolParams):
    """读取文件参数"""
    target_file: str = Field(..., description="要读取的文件路径")
    offset: Optional[int] = Field(0, description="开始读取的行号")
    limit: Optional[int] = Field(100, description="要读取的行数")
```

### 2. 创建工具实现

```python
@tool()
class ReadFile(BaseTool):
    """读取文件内容工具"""

    # 设置参数类型
    params_class = ReadFileParams

    async def execute(self, tool_context: ToolContext, params: ReadFileParams) -> ToolResult:
        # 工具实现...
        return ToolResult(output="文件内容...")
```

### 3. 工具自动注册

通过工具装饰器，工具会在工具工厂初始化时被自动发现和注册。

## 与现有系统集成

新架构已完全集成到现有的工具执行系统中：

- `tool_registry.py` 已更新为使用工具工厂
- `tool_executor.py` 已更新为使用工具工厂
- 现有工具执行流程保持不变，但底层实现更简洁

## 向后兼容性

为了保证向后兼容性，BaseTool实现了两种执行方式：

1. 新方式：使用参数模型
   ```python
   await tool.execute(tool_context, params_instance)
   ```

2. 旧方式：使用关键字参数
   ```python
   await tool.execute(tool_context, **kwargs)
   ```

这样确保逐步迁移时不会破坏现有功能。
