# 浏览器操作模块重构计划 (Refactor Plan for Browser Operations)

**最后更新:** {{自动插入当前日期和时间}}

## 1. 目标

本次重构旨在优化浏览器交互相关模块 (`app.tools.magic_use` 和 `app.tools.use_browser_operations`) 的代码结构、错误处理机制和接口类型安全，提升代码的可维护性和健壮性。主要解决代码重复、错误处理分散、接口类型模糊等问题。

## 2. 影响范围

*   **核心浏览器控制层:** `app.tools.magic_use.magic_browser.MagicBrowser` (将包含结果DTO定义)
*   **页面注册表:** `app.tools.magic_use.page_registry.PageRegistry` (可能需要微调以适应 MagicBrowser 变化)
*   **浏览器操作组基类:** `app.tools.use_browser_operations.base.OperationGroup`
*   **具体操作组:**
    *   `app.tools.use_browser_operations.content.ContentOperations`
    *   `app.tools.use_browser_operations.interaction.InteractionOperations`
    *   `app.tools.use_browser_operations.navigation.NavigationOperations`
*   **(新增)** 创建新文件存放结果 DTO: `app.tools.magic_use.browser_results.py`

## 3. 核心改动方案

### 3.1 定义统一的结果对象 (放置于 magic_browser.py)

在 `app.tools.magic_use.magic_browser.py` 中定义 Pydantic 模型来表示 `MagicBrowser` 方法的成功和失败结果。

**通用错误对象 (定义在模块顶部):**

```python
# app/tools/magic_use/magic_browser.py
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, Literal, Union, List # 添加 Union, List
from pathlib import Path
from app.tools.magic_use.page_registry import PageState # 假设 PageState 可导入

class MagicBrowserError(BaseModel):
    """通用的 MagicBrowser 操作失败结果"""
    success: Literal[False] = False
    error: str = Field(..., description="错误信息描述")
    operation: Optional[str] = Field(None, description="执行失败的操作名称")
    details: Optional[Dict[str, Any]] = Field(None, description="可选的错误上下文细节")

```

**特定成功结果对象 (定义在模块级别，MagicBrowser 类之前):**

```python
# app/tools/magic_use/magic_browser.py
# ... MagicBrowserError 定义 ...

class GotoSuccess(BaseModel):
    success: Literal[True] = True
    final_url: str
    title: str

class ClickSuccess(BaseModel):
    success: Literal[True] = True
    final_url: Optional[str] = None # 点击不一定导致导航
    title_after: Optional[str] = None

class InputSuccess(BaseModel):
    success: Literal[True] = True
    final_url: Optional[str] = None # 输入后按回车可能导致导航
    title_after: Optional[str] = None

class ScreenshotSuccess(BaseModel):
    success: Literal[True] = True
    path: Path
    is_temp: bool

class MarkdownSuccess(BaseModel):
    success: Literal[True] = True
    markdown: str
    url: str
    title: str
    scope: str

class InteractiveElementsSuccess(BaseModel):
    success: Literal[True] = True
    elements_by_category: Dict[str, List[Dict[str, Any]]] # JS 返回结构可能仍是 Dict
    total_count: int

class JSEvalSuccess(BaseModel):
    success: Literal[True] = True
    result: Any # JS 返回结果类型未知

class PageStateSuccess(BaseModel):
    success: Literal[True] = True
    state: PageState # 直接封装 PageState

# ... (添加其他操作如 scroll, scroll_to 等的成功结果对象) ...

# 定义统一的返回类型别名 (定义在模块底部或需要的地方)
MagicBrowserResult = Union[
    GotoSuccess, ClickSuccess, InputSuccess, ScreenshotSuccess, MarkdownSuccess,
    InteractiveElementsSuccess, JSEvalSuccess, PageStateSuccess, # ... 其他成功类型
    MagicBrowserError
]

# --- MagicBrowser 类定义开始 ---
class MagicBrowser:
    # ...
```

### 3.2 强化 MagicBrowser 错误处理与返回类型

修改 `app/tools/magic_use/magic_browser.py` 中的核心方法：

*   **方法签名:** 将返回类型改为 `Union[SpecificSuccessObject, MagicBrowserError]` 或使用 `MagicBrowserResult` 类型别名。
*   **内部错误处理:** 在方法内部捕获 Playwright 异常。
*   **返回对象:** 成功时返回对应的成功 DTO 实例，失败时返回 `MagicBrowserError` 实例。
*   **隐藏 JS 依赖:** 确保需要 JS 的方法内部调用 `ensure_js_module_loaded`。

**示例 (magic_browser.py 中的 goto 方法，内部逻辑不变，仅签名调整):**

```python
# app/tools/magic_use/magic_browser.py
# ... imports and DTO definitions ...

class MagicBrowser:
    # ... other methods ...

    # 使用类型别名或直接 Union
    async def goto(self, page_id: str, url: str, wait_until: str = "networkidle") -> MagicBrowserResult:
        page = await self._page_registry.get_page_by_id(page_id)
        if not page:
            return MagicBrowserError(error=f"页面不存在: {page_id}", operation="goto")

        try:
            # ... (执行导航和等待的代码) ...

            final_url = page.url
            title = "获取标题失败"
            try:
                title = await page.title()
            except Exception as title_e:
                logger.warning(f"获取页面 {page_id} 标题失败: {title_e}")

            return GotoSuccess(final_url=final_url, title=title)

        except Exception as e:
            error_msg = f"导航到 {url} 失败: {e!s}"
            logger.error(error_msg, exc_info=True)
            return MagicBrowserError(error=error_msg, operation="goto", details={"url": url})

    # ... 其他方法类似地重构 ...
```

### 3.3 简化操作组页面处理 (使用辅助方法)

在 `app/tools/use_browser_operations/base.py` 的 `OperationGroup` 中添加辅助方法 `_get_validated_page` (代码不变，参考上一版方案)。

**操作组方法调用流程示例 (`navigation.py` 中的 `goto`):**

```python
# app/tools/use_browser_operations/navigation.py
# ... imports ...
# 从 magic_browser 导入结果类型
from app.tools.magic_use.magic_browser import GotoSuccess, MagicBrowserError

class NavigationOperations(OperationGroup):
    # ... other methods ...

    @operation(...)
    async def goto(self, browser: MagicBrowser, params: GotoParams) -> ToolResult:
        """导航到指定URL"""
        url = params.url

        # 1. （可选）URL 预检查
        is_invalid, error_message = self._check_invalid_url(url)
        if is_invalid: return ToolResult(error=error_message)

        # 2. 获取并验证页面 (如果需要预先验证 page_id)
        page_to_use_id = params.page_id
        if page_to_use_id:
             page, error_result = await self._get_validated_page(browser, params)
             if error_result: return error_result
        else:
             page_to_use_id = await browser.get_active_page_id() # 获取活动ID供 browser.goto 内部使用或创建

        # 3. 调用 MagicBrowser 方法
        result = await browser.goto(page_id=page_to_use_id, url=url) # page_id 可能为 None

        # 4. 处理返回结果 (使用导入的 DTO 类型)
        if isinstance(result, MagicBrowserError):
            suggestion = self._get_document_suggestion(url)
            error_msg = f"{result.error}{f' {suggestion}' if suggestion else ''.strip()}"
            return ToolResult(error=error_msg)
        elif isinstance(result, GotoSuccess):
            suggestion = self._get_document_suggestion(url)
            markdown_content = (
                f"**操作: goto**\n"
                f"状态: 成功 ✓\n"
                f"URL: `{result.final_url}`\n"
                f"标题: {result.title}\n"
            )
            if suggestion:
                markdown_content += f"\n**提示**: {suggestion}"
            return ToolResult(content=markdown_content)
        else:
            logger.error(f"goto 操作返回了未知类型: {type(result)}")
            return ToolResult(error="goto 操作返回了意外的结果类型。")
```

### 3.4 统一临时文件管理 (方案 A)

*   (维持) 修改 `MagicBrowser.take_screenshot` 返回 `ScreenshotSuccess` 或 `MagicBrowserError`。
*   (维持) 在 `MagicBrowser` 中管理 `_temp_files` 列表。
*   (维持) 在 `MagicBrowser` 中实现 `cleanup_temp_files` 并在 `close` 中调用。
*   (维持) 移除操作组中的临时文件清理逻辑。

## 4. 实施步骤 (建议)

1.  **重构 `app/tools/magic_use/magic_browser.py`：** (已完成)
    *   ...
2.  **在 `app/tools/use_browser_operations/base.py` 中实现 `_get_validated_page` 辅助方法。** (已完成)
3.  **依次重构 `navigation.py`, `content.py`, `interaction.py` 中的操作方法：**
    *   `navigation.py` (已完成)
    *   `content.py` (已完成)
    *   `interaction.py` (已完成)
    *   从 `magic_browser.py` 导入所需的 DTO 类型。
    *   使用 `_get_validated_page` 简化页面获取和验证。
    *   修改调用 `browser.method` 的代码，根据返回的成功或失败对象生成 `ToolResult`。
    *   移除操作组中重复的 Playwright 异常捕获逻辑。
    *   移除操作组中对临时截图文件的清理逻辑。
4.  进行全面的测试。

## 5. 预期收益

*   **提高代码可读性:** 减少样板代码，操作组逻辑更清晰。
*   **增强健壮性:** 错误处理更集中和统一，减少遗漏。
*   **提升类型安全:** 接口返回类型明确，利于静态分析和减少运行时错误。
*   **改善可维护性:** 修改浏览器底层交互或错误处理逻辑时，只需改动 `MagicBrowser`。
