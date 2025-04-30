# Magic-Use 浏览器工具重构方案

## 当前问题

目前的 `use_browser.py` 工具存在以下问题：

1. **参数过度铺平**：所有可能的操作参数都平铺在顶层参数结构中，不够清晰
2. **职责边界模糊**：工具既提供浏览器操作能力，又包含了部分 Agent 逻辑
3. **缺乏操作说明**：大模型无法动态获取特定操作的参数说明
4. **复杂度高**：单个工具集成了太多功能，逻辑复杂
5. **硬编码参数**：参数结构硬编码，扩展新操作需要修改多处代码

## 重构目标

1. **极致简化**：专注提供原子化的浏览器操作能力
2. **职责分离**：将 Agent 逻辑移至调用方
3. **自描述接口**：提供 help 操作，支持大模型查询操作参数
4. **灵活扩展**：便于添加新的浏览器操作
5. **保持单例**：维持浏览器实例的单例模式，节约资源

## 设计方案

### 1. 参数结构重设计

```json
{
  "type": "object",
  "properties": {
    "url": {
      "type": "string",
      "description": "要访问的网址，如不需要访问新网址可留空"
    },
    "action": {
      "type": "string",
      "description": "要执行的浏览器操作，使用 help 操作获取可用操作列表"
    },
    "action_params": {
      "type": "object",
      "description": "操作所需的具体参数，根据不同action而不同，可通过 help 操作查询具体格式"
    }
  },
  "required": ["action"]
}
```

### 2. Help 操作设计

添加 `help` 操作，可查询：
- 无参数：返回所有可用操作列表
- 指定操作名：返回该操作的详细参数说明

```json
// 示例请求：列出所有操作
{
  "action": "help"
}

// 示例请求：查询特定操作
{
  "action": "help",
  "action_params": {
    "operation": "click"
  }
}
```

### 3. 操作注册机制

使用注册机制管理浏览器操作，便于动态扩展：

```python
class UseBrowser(BaseTool):
    # 操作注册表
    _operations = {}

    @classmethod
    def register_operation(cls, name, handler, params_schema):
        """注册浏览器操作"""
        cls._operations[name] = {
            "handler": handler,
            "params_schema": params_schema
        }
```

### 4. 浏览器操作模块化

将每个操作实现为独立函数，便于维护：

```python
@register_operation(
    "click",
    {
        "type": "object",
        "properties": {
            "selector": {
                "type": "string",
                "description": "CSS选择器或XPath"
            },
            "text": {
                "type": "string",
                "description": "要点击的文本内容"
            }
        },
        "required": ["selector"]
    }
)
async def click_operation(browser, page, params):
    """点击元素操作实现"""
    # 操作实现...
```

### 5. 执行流程优化

简化执行流程，专注于操作分发：

```python
async def execute(self, url, action, action_params=None):
    # 1. 获取浏览器实例
    browser = await self.get_browser()

    # 2. 处理help操作
    if action == "help":
        return self._handle_help(action_params)

    # 3. 查找操作处理器
    if action not in self._operations:
        return {"error": f"未知操作: {action}"}

    # 4. 获取页面（如需要）
    if url:
        page = await self._get_page(browser, url)
    else:
        page = await self._get_current_page(browser)

    # 5. 执行操作
    handler = self._operations[action]["handler"]
    return await handler(browser, page, action_params or {})
```

## 具体操作规划

重构后将提供以下核心操作：

1. **help** - 获取操作帮助
2. **navigate** - 导航到URL
3. **click** - 点击元素
4. **input** - 输入文本
5. **extract** - 提取内容
6. **screenshot** - 获取截图
7. **scroll** - 滚动页面
8. **wait** - 等待元素或时间
9. **execute_js** - 执行JavaScript
10. **close** - 关闭页面或浏览器

## 数据流设计

```
┌────────────┐        ┌───────────┐        ┌────────────┐        ┌──────────┐
│   LLM/     │        │           │        │   操作     │        │          │
│  调用方    │──────▶│UseBrowser │──────▶│  处理器    │──────▶│ 浏览器   │
└────────────┘        └───────────┘        └────────────┘        └──────────┘
       ▲                    │                                         │
       │                    │                                         │
       └────────────────────┴─────────────────────────────────────────┘
                          返回操作结果
```

## 实现示例

### 工具类定义

```python
import asyncio
from typing import Dict, Any, Optional, Callable, ClassVar
from functools import wraps

from app.core.context.tool_context import ToolContext
from app.core.entity.tool.tool_result import ToolResult
from app.core.config_manager import config
from app.logger import get_logger
from app.tools.base_tool import BaseTool

from app.tools.magic_use.browser import Browser, BrowserConfig

logger = get_logger(__name__)


def register_operation(name: str, params_schema: Dict[str, Any]):
    """操作注册装饰器"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            return await func(*args, **kwargs)

        # 存储操作元数据
        wrapper.operation_name = name
        wrapper.params_schema = params_schema
        return wrapper
    return decorator


class UseBrowser(BaseTool):
    """浏览器使用工具 (重构版)

    提供原子化的浏览器操作能力，通过 help 操作获取详细使用说明。
    """

    name: str = "use_browser"
    description: str = """浏览器控制工具，提供原子化的浏览器操作能力。使用 help 操作了解详情。"""

    # 参数定义
    parameters: dict = {
        "type": "object",
        "properties": {
            "url": {
                "type": "string",
                "description": "要访问的网址，如不需要访问新网址可留空"
            },
            "action": {
                "type": "string",
                "description": "要执行的浏览器操作，使用 help 操作获取可用操作列表"
            },
            "action_params": {
                "type": "object",
                "description": "操作所需的具体参数，根据不同action而不同，可通过 help 操作查询具体格式"
            }
        },
        "required": ["action"]
    }

    # 浏览器实例缓存
    _browser_instance: Optional[Browser] = None

    # 操作注册表
    _operations: ClassVar[Dict[str, Dict[str, Any]]] = {}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._register_operations()

    def _register_operations(self):
        """注册所有操作处理器"""
        for name, method in inspect.getmembers(self, inspect.ismethod):
            if hasattr(method, 'operation_name'):
                self._operations[method.operation_name] = {
                    "handler": method,
                    "params_schema": method.params_schema,
                    "description": method.__doc__.split('\n')[0] if method.__doc__ else ""
                }
```

### Help 操作实现

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
    }
)
async def help_operation(self, browser: Browser, page: Any, params: Dict[str, Any]) -> Dict[str, Any]:
    """获取操作帮助信息

    不提供operation参数时返回所有操作列表，提供时返回指定操作的详细信息
    """
    operation = params.get("operation")

    if not operation:
        # 返回所有操作列表
        operations_info = {}
        for name, op_info in self._operations.items():
            operations_info[name] = op_info["description"]

        return {
            "status": "success",
            "available_operations": operations_info,
            "message": "使用 help 操作并提供 operation 参数获取特定操作的详细信息"
        }

    # 返回指定操作的详细信息
    if operation not in self._operations:
        return {
            "status": "error",
            "message": f"未知操作: {operation}",
            "available_operations": list(self._operations.keys())
        }

    op_info = self._operations[operation]
    return {
        "status": "success",
        "operation": operation,
        "description": op_info["description"],
        "params_schema": op_info["params_schema"],
        "example": self._get_operation_example(operation)
    }
```

### 执行方法实现

```python
async def execute(
    self,
    tool_context: ToolContext,
    action: str,
    url: Optional[str] = None,
    action_params: Optional[Dict[str, Any]] = None,
    **kwargs
) -> ToolResult:
    """执行浏览器操作

    Args:
        tool_context: 工具上下文
        action: 要执行的操作
        url: 要访问的URL（可选）
        action_params: 操作参数（可选）

    Returns:
        ToolResult: 操作结果
    """
    result = ToolResult()

    try:
        # 获取浏览器实例
        browser = await self._get_browser()

        # 处理help操作
        if action == "help":
            result.output = str(await self.help_operation(browser, None, action_params or {}))
            return result

        # 查找操作处理器
        if action not in self._operations:
            result.output = str({
                "status": "error",
                "message": f"未知操作: {action}",
                "available_operations": list(self._operations.keys())
            })
            return result

        # 获取页面（如需要）
        page = None
        if action != "close_browser":  # 关闭浏览器操作不需要页面
            if url:
                page = await self._get_page(browser, url)
            else:
                page = await self._get_current_page(browser)

                if not page and action != "new_page":
                    result.output = str({
                        "status": "error",
                        "message": "没有活动页面，请提供URL参数或先创建页面"
                    })
                    return result

        # 执行操作
        handler = self._operations[action]["handler"]
        operation_result = await handler(browser, page, action_params or {})

        # 返回结果
        result.output = str({
            "status": "success",
            "action": action,
            "data": operation_result
        })

        return result

    except Exception as e:
        logger.error(f"浏览器操作失败: {str(e)}")
        result.output = str({
            "status": "error",
            "message": f"浏览器操作失败: {str(e)}",
            "action": action
        })
        return result
```

### 典型操作实现示例

```python
@register_operation(
    "navigate",
    {
        "type": "object",
        "properties": {
            "url": {
                "type": "string",
                "description": "要导航到的URL"
            },
            "wait_until": {
                "type": "string",
                "enum": ["load", "domcontentloaded", "networkidle"],
                "description": "等待导航完成的条件",
                "default": "networkidle"
            },
            "timeout": {
                "type": "integer",
                "description": "超时时间（毫秒）",
                "default": 30000
            }
        },
        "required": ["url"]
    }
)
async def navigate_operation(self, browser: Browser, page: Any, params: Dict[str, Any]) -> Dict[str, Any]:
    """导航到指定URL

    支持设置等待条件和超时时间
    """
    url = params["url"]
    wait_until = params.get("wait_until", "networkidle")
    timeout = params.get("timeout", 30000)

    try:
        response = await page.goto(url, wait_until=wait_until, timeout=timeout)

        return {
            "url": await page.url(),
            "title": await page.title(),
            "status": response.status if response else None
        }
    except Exception as e:
        return {
            "error": str(e),
            "url": url
        }

@register_operation(
    "click",
    {
        "type": "object",
        "properties": {
            "selector": {
                "type": "string",
                "description": "CSS选择器、XPath或元素索引"
            },
            "text": {
                "type": "string",
                "description": "要点击的文本内容"
            },
            "button": {
                "type": "string",
                "enum": ["left", "right", "middle"],
                "description": "鼠标按钮",
                "default": "left"
            },
            "click_count": {
                "type": "integer",
                "description": "点击次数",
                "default": 1
            },
            "timeout": {
                "type": "integer",
                "description": "等待元素出现的超时时间（毫秒）",
                "default": 5000
            }
        }
    }
)
async def click_operation(self, browser: Browser, page: Any, params: Dict[str, Any]) -> Dict[str, Any]:
    """点击页面元素

    支持通过选择器、XPath或文本内容定位元素
    """
    selector = params.get("selector")
    text = params.get("text")
    button = params.get("button", "left")
    click_count = params.get("click_count", 1)
    timeout = params.get("timeout", 5000)

    from app.tools.magic_use.actions import ElementActions
    actions = ElementActions(page)

    try:
        if text:
            result = await actions.click_by_text(text, button=button, click_count=click_count, timeout=timeout)
        elif selector:
            if selector.isdigit():
                result = await actions.click_by_index(int(selector), button=button, click_count=click_count)
            elif selector.startswith("//"):
                result = await actions.click_by_xpath(selector, button=button, click_count=click_count, timeout=timeout)
            else:
                result = await actions.click_by_selector(selector, button=button, click_count=click_count, timeout=timeout)
        else:
            return {"error": "必须提供selector或text参数"}

        return {
            "success": result.success,
            "message": result.message
        }
    except Exception as e:
        return {
            "error": str(e),
            "selector": selector,
            "text": text
        }
```

## 使用示例

### 示例1：获取操作帮助

```python
# LLM调用方式
result = await tool.execute(
    action="help"
)

# 查询特定操作
result = await tool.execute(
    action="help",
    action_params={"operation": "click"}
)
```

### 示例2：导航到URL并点击元素

```python
# 导航到网页
result = await tool.execute(
    action="navigate",
    action_params={"url": "https://example.com"}
)

# 点击元素
result = await tool.execute(
    action="click",
    action_params={"selector": ".login-button"}
)
```

### 示例3：提取内容

```python
# 提取页面内容
result = await tool.execute(
    action="extract",
    action_params={
        "type": "text",
        "selector": "main"
    }
)
```

## 实现计划

1. 创建操作注册机制
2. 实现help操作功能
3. 重构现有操作为模块化方法
4. 简化工具执行逻辑
5. 编写完整操作文档
6. 添加操作示例
7. 单元测试

## 优势

1. **简化接口**：调用方只需知道 action 名称，通过 help 获取详情
2. **职责明确**：专注于浏览器操作，Agent 逻辑交由调用方
3. **易于扩展**：添加新操作只需注册新函数
4. **自文档化**：内建帮助系统
5. **保持高效**：维持浏览器实例单例模式

## 影响与兼容性

重构将导致接口变化，需要调用方做相应调整。建议：

1. 提供兼容层支持旧接口一段时间
2. 更新文档并通知现有用户
3. 在新文档中提供迁移指南

## 后续优化方向

1. 添加操作超时控制
2. 支持多浏览器上下文隔离
3. 提供批量操作能力
4. 增加更多元素定位策略
