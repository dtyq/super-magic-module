# 工具系统重构说明

本文档简要说明了工具系统重构的主要变化和迁移方案。

## 主要变化

1. **架构升级**：
   - 从静态方法转向实例方法和单例模式
   - 从字典参数转向Pydantic模型
   - 从手动注册转向装饰器自动注册

2. **目录结构**：
   - 旧系统：`app/magic/tool/`
   - 新系统：`app/tools/core/`

3. **核心组件**：
   - `BaseTool`：工具基类，所有工具继承自此类
   - `BaseToolParams`：工具参数基类，所有参数模型继承自此类
   - `tool_factory`：工具工厂单例，负责工具的注册、发现和实例化
   - `tool_executor`：工具执行器单例，负责工具的执行和错误处理
   - `@tool()`：工具装饰器，用于自动注册工具类

## 迁移指南

1. **导入语句更新**：
   ```python
   # 旧代码
   from app.magic.tool.tool_factory import ToolFactory
   from app.magic.tool.tool_executor import ToolExecutor

   # 新代码
   from app.tools.core.tool_factory import tool_factory
   from app.tools.core.tool_executor import tool_executor
   ```

2. **工具注册更新**：
   ```python
   # 旧代码
   ToolFactory.register_tool(tool_name, tool_config)

   # 新代码 - 使用装饰器自动注册
   @tool()
   class MyTool(BaseTool):
       # 工具实现...
   ```

3. **工具执行更新**：
   ```python
   # 旧代码
   result = await ToolFactory.run_tool(tool_context, args)

   # 新代码
   result = await tool_executor.execute_tool_call(tool_context, arguments)
   ```

4. **参数定义更新**：
   ```python
   # 旧代码 - 使用字典
   {
       "type": "object",
       "properties": {
           "param1": {"type": "string", "description": "参数1"}
       }
   }

   # 新代码 - 使用Pydantic模型
   class MyToolParams(BaseToolParams):
       param1: str = Field(..., description="参数1")
   ```

## 重构后的优势

1. **类型安全**：使用Pydantic模型确保参数类型安全和验证
2. **代码简洁**：装饰器和自动注册减少了样板代码
3. **错误处理**：统一的错误捕获和处理机制
4. **扩展性**：更容易添加新的工具和功能
5. **可维护性**：模块化设计和清晰的职责划分

## 详细文档

详细的工具系统架构文档请参阅 [工具系统架构指南](tools_architecture_guide.md)。
