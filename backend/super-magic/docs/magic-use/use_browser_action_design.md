# UseBrowser 浏览器控制工具改进方案

## 主要目标

改进 use_browser.py 中的 UseBrowser 类，使其更易于使用和理解，特别是对于大模型来说。

## 改进内容

1. 更新 UseBrowser 类的描述，明确说明如何使用 help 功能：
   - 描述应该明确指出可以通过 `help` 操作获取所有可用操作列表
   - 描述应该指导用户如何获取特定操作的详细信息（通过 `help` 操作并提供 `operation` 参数）

2. help_operation 方法的功能：
   - 不带参数调用时：返回所有操作的名称和简短描述
   - 带 operation 参数调用时：返回该特定操作的详细信息，包括输入参数结构、返回值格式、使用示例等

3. 改进操作示例的设计：
   - 将示例直接放在每个操作的装饰器里，使示例和操作定义紧密关联
   - 为每个已实现的操作提供完整的示例参数

4. 改进每个操作的文档字符串，确保清晰说明输入参数和输出结果

## 具体实现

### 1. 更新类的描述

```python
description: str = """浏览器控制工具，提供原子化的浏览器操作能力。
使用 'action': 'help' 获取所有可用操作列表；
使用 'action': 'help', 'action_params': {'operation': '操作名称'} 获取特定操作的详细信息。"""
```

### 2. 修改 register_operation 装饰器

```python
def register_operation(name: str, params_schema: Dict[str, Any], example: Dict[str, Any] = None):
    """操作注册装饰器，用于注册浏览器操作

    Args:
        name: 操作名称
        params_schema: 操作参数的JSON Schema
        example: 操作示例
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            return await func(*args, **kwargs)

        # 存储操作元数据
        wrapper.operation_name = name
        wrapper.params_schema = params_schema
        wrapper.example = example
        return wrapper
    return decorator
```

### 3. 更新操作注册方法

```python
def _register_operations(self):
    """注册所有操作处理器"""
    for name, method in inspect.getmembers(self, inspect.ismethod):
        if hasattr(method, 'operation_name'):
            self._operations[method.operation_name] = {
                "handler": method,
                "params_schema": method.params_schema,
                "description": method.__doc__.split('\n')[0] if method.__doc__ else "",
                "example": getattr(method, 'example', None)
            }
```

### 4. 完善 help_operation 方法

```python
@register_operation(
    "help",
    {
        "type": "object",
        "properties": {
            "operation": {
                "type": "string",
                "description": "要查询的操作名称，不提供则返回所有操作列表"
            }
        }
    },
    example={
        "action": "help"
    }
)
async def help_operation(self, browser: Browser, page: Any, params: Dict[str, Any]) -> Dict[str, Any]:
    """获取操作帮助信息

    不提供operation参数时返回所有操作列表和简短描述，
    提供时返回指定操作的详细信息（参数说明、返回值格式等）
    """
    operation = params.get("operation")

    if not operation:
        # 返回所有操作列表及简短描述
        operations_info = {}
        for name, op_info in self._operations.items():
            operations_info[name] = op_info["description"]

        return {
            "status": "success",
            "available_operations": operations_info,
            "message": "使用 'action': 'help', 'action_params': {'operation': '操作名称'} 获取特定操作的详细信息",
            "example": self._operations["help"]["example"]
        }

    # 返回指定操作的详细信息
    if operation not in self._operations:
        return {
            "status": "error",
            "message": f"未知操作: {operation}",
            "available_operations": list(self._operations.keys())
        }

    op_info = self._operations[operation]

    # 提供更丰富的返回信息
    return {
        "status": "success",
        "operation": operation,
        "description": op_info["description"],
        "params_schema": op_info["params_schema"],
        "example": op_info["example"],
        "return_format": "操作成功时返回 {'status': 'success', ...}，失败时返回 {'status': 'error', 'message': '错误信息'}"
    }
```

### 5. 为每个操作添加示例

示例操作定义：

```python
@register_operation(
    "goto_url",
    {
        "type": "object",
        "properties": {
            "url": {
                "type": "string",
                "description": "要导航到的URL"
            },
            "wait_until": {
                "type": "string",
                "description": "何时认为导航完成，可选: 'load', 'domcontentloaded', 'networkidle'",
                "default": "networkidle"
            }
        },
        "required": ["url"]
    },
    example={
        "action": "goto_url",
        "url": "https://www.baidu.com",
        "action_params": {
            "wait_until": "networkidle"
        }
    }
)
async def goto_url(self, browser: Browser, page: Any, params: Dict[str, Any]) -> Dict[str, Any]:
    """导航到指定URL"""
    # 实现代码...
```

其他操作示例：

```python
@register_operation(
    "get_interactive_elements",
    {
        "type": "object",
        "properties": {
            "element_types": {
                "type": "array",
                "items": {"type": "string"},
                "description": "要获取的元素类型列表，例如 ['button', 'input', 'a']"
            },
            "include_hidden": {
                "type": "boolean",
                "description": "是否包含隐藏元素",
                "default": False
            }
        }
    },
    example={
        "action": "get_interactive_elements",
        "action_params": {
            "element_types": ["button", "input", "a"],
            "include_hidden": False
        }
    }
)

@register_operation(
    "click_element",
    {
        "type": "object",
        "properties": {
            "selector": {
                "type": "string",
                "description": "要点击元素的CSS选择器"
            },
            "wait_for": {
                "type": "string",
                "description": "点击后等待出现的元素选择器",
                "default": null
            },
            "timeout": {
                "type": "integer",
                "description": "等待超时时间（毫秒）",
                "default": 5000
            }
        },
        "required": ["selector"]
    },
    example={
        "action": "click_element",
        "action_params": {
            "selector": "#su",
            "wait_for": ".result_content",
            "timeout": 5000
        }
    }
)

@register_operation(
    "input_text",
    {
        "type": "object",
        "properties": {
            "selector": {
                "type": "string",
                "description": "输入框的CSS选择器"
            },
            "text": {
                "type": "string",
                "description": "要输入的文本"
            },
            "clear_first": {
                "type": "boolean",
                "description": "输入前是否先清空输入框",
                "default": True
            }
        },
        "required": ["selector", "text"]
    },
    example={
        "action": "input_text",
        "action_params": {
            "selector": "#kw",
            "text": "搜索内容",
            "clear_first": True
        }
    }
)
```

## 使用方式

1. 获取所有可用操作列表：
```json
{
    "action": "help"
}
```

2. 获取特定操作的详细信息：
```json
{
    "action": "help",
    "action_params": {
        "operation": "goto_url"
    }
}
```

3. 使用特定操作，例如导航到URL：
```json
{
    "action": "goto_url",
    "url": "https://www.baidu.com",
    "action_params": {
        "wait_until": "networkidle"
    }
}
```

这种设计使 UseBrowser 工具更加易用，大模型可以通过 help 功能按需了解各个操作的详细信息，类似于命令行工具的帮助系统，先概览，再按需深入了解。
