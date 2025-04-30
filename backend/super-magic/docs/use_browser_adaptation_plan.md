# UseBrowser 工具适配新架构方案

本文档旨在详细阐述 `app/tools/use_browser.py` 工具如何适配重构后的浏览器控制架构 (`magic_browser.py`, `browser_manager.py`, `page_registry.py`)，以实现更清晰的职责划分、更高的代码质量和更好的可维护性。

## 1. 核心目标与原则

*   **目标**: 将 `use_browser.py` 定位为一个轻量级的 **适配器 (Adapter)** 和 **编排器 (Orchestrator)**，专注于将 AI Agent 的指令转换为对 `MagicBrowser` 核心功能的调用，并将结果转化为 AI Agent 易于理解的格式。
*   **原则**:
    *   **职责清晰**: `use_browser.py` 处理 AI 接口适配、参数初步验证、操作分发、结果翻译；`MagicBrowser` 层处理具体的浏览器自动化逻辑、状态维护、底层错误封装。
    *   **代码简洁优雅**: 遵循"大道至简"，避免冗余逻辑，保持代码结构清晰。
    *   **人类易懂**: 代码逻辑直观，易于人类开发者理解和维护。
    *   **中文注释**: 提供详尽且必要的中文注释，解释设计意图、关键逻辑和交互流程，实现"代码即文档"。
    *   **高内聚低耦合**: 减少 `use_browser.py` 对浏览器底层实现的直接依赖，通过 `MagicBrowser` 接口交互。

## 2. 适配后的架构流程

1.  **AI Agent 调用**: Agent 使用 JSON 格式调用 `use_browser` 工具，提供 `operation` 和 `operation_params`。
2.  **`UseBrowser.execute`**:
    *   获取与当前 Agent 会话关联的共享 `MagicBrowser` 实例（通过 `ToolContext` 或 `app/tools/magic_use/__init__.py` 提供的工厂函数）。
    *   使用 Pydantic 模型初步验证 `operation_params` 的基本格式和类型。
    *   根据 `operation` 和 `operation_params` 确定目标 `page_id`（或使用活动页面）。
    *   调用 `MagicBrowser` 实例上对应的操作方法，传递处理过的参数。
3.  **`MagicBrowser` 执行**:
    *   执行具体的浏览器自动化操作（如导航、点击、JS 执行），依赖 `BrowserManager` 获取上下文，依赖 `PageRegistry` 获取页面对象和加载 JS。
    *   处理底层 Playwright 错误，并封装成结构化的结果返回给 `UseBrowser`。
4.  **结果处理与翻译**:
    *   `UseBrowser.execute` 接收来自 `MagicBrowser` 的结构化结果。
    *   调用 `magic_browser.get_page_state()` 获取最新的页面状态。
    *   **翻译**: 将操作结果和页面状态整合成一个 JSON 字符串，其中包含对 AI 友好的、语义化的信息（如 `summary` 字段总结操作结果）。
    *   **截图**: 调用 `magic_browser.take_screenshot_if_needed()`。
    *   **事件**: 触发截图文件事件。
5.  **返回 `ToolResult`**: 将包含翻译后信息的 JSON 字符串包装在 `ToolResult` 中返回给 AI Agent。

## 3. 详细适配步骤

### 3.1 统一资源管理

*   **移除 `_create_browser`**: 删除 `use_browser.py` 中独立的浏览器创建逻辑。
*   **获取共享 `MagicBrowser` 实例**:
    *   在 `UseBrowser.execute` 方法的开头，修改 `agent_context.get_resource("browser", ...)` 的逻辑。
    *   应改为调用 `app/tools/magic_use/__init__.py` 中提供的 `create_magic_browser` 工厂函数（或者直接使用其内部逻辑获取单例）。
    *   **关键**: 确保 `agent_context.get_resource` 或类似机制能够为同一个 Agent 的连续 `use_browser` 调用返回 **同一个** `MagicBrowser` 实例，以维持页面管理状态和会话连续性。

### 3.2 操作分发与参数处理

*   **保留 Pydantic 验证**: 继续使用 `UseBrowserParams` 及其关联的 Pydantic 模型 (`op_params`) 对 `operation_params` 进行初步的格式和类型验证。这能拦截明显错误的调用。
*   **查找操作处理器**: `operations_registry` 查找逻辑保持不变，用于找到 `MagicBrowser` 中对应的目标方法。
*   **确定目标页面 ID**:
    *   在调用 `MagicBrowser` 方法之前，增加逻辑判断 `page_id`：
        *   检查 `operation_params` 或其 Pydantic 解析结果 (`op_params`) 中是否包含 `page_id` 字段。
        *   **如果提供了 `page_id`**:
            *   获取 `MagicBrowser` 实例 (`mb_instance = await _get_magic_browser_instance(...)`)。
            *   验证 `page_id` 是否在 `mb_instance._managed_page_ids` 中。若不在，立即返回明确的错误 `ToolResult`（如：`{"status": "error", "message": f"页面 {page_id} 不由当前浏览器会话管理。"}`）。
        *   **如果未提供 `page_id`**:
            *   根据 `operation` 判断是否允许在活动页面操作。例如，`scroll_page`, `input_text` 通常允许，而 `goto` 可能需要显式 ID 或触发新页面（`MagicBrowser.new_page()` 由特定操作如 `open_page` 触发，而不是 `goto`）。
            *   若允许，调用 `active_page_id = await mb_instance.get_active_page_id()`。
            *   如果 `active_page_id` 为 `None`，返回错误 `ToolResult`（如：`{"status": "error", "message": "没有活动的页面可供操作，请先导航或指定页面 ID。"}`）。
            *   将获取到的 `active_page_id` 作为目标 `page_id`。
        *   **如果操作必须指定 `page_id`**（如 `get_markdown`）但未提供，返回参数错误 `ToolResult`。
*   **调用 `MagicBrowser` 方法**:
    *   使用 `getattr(mb_instance, operation_handler_name)` 获取 `MagicBrowser` 上的方法。
    *   将必要的参数（如 `page_id`, `url`, `selector`, `text` 等，从 `op_params` 中提取）传递给该方法。

### 3.3 结果处理与翻译

*   **获取页面状态**: 在 `MagicBrowser` 操作方法成功返回后（即结果字典中 `status` 不是 "error"），调用 `page_states = await mb_instance.get_page_state()`。
*   **移除手动状态组装**: 删除 `use_browser.py` 中手动获取 URL、Title、计算滚动描述等代码。
*   **整合结果**:
    *   创建一个最终的 `response` 字典。
    *   将 `MagicBrowser` 操作的原始结果（`operation_result`）放入 `response["result"]`。
    *   将 `page_states`（包含 `active_page` 和 `inactive_pages`）放入 `response["page_state"]`。
    *   **添加 `summary` 字段**: 根据 `operation` 和 `operation_result["status"]`，生成一个简洁的人类可读的中文摘要，说明执行了什么操作以及结果如何。
        *   **示例 (成功)**: `{"status": "success", "operation": "click", "summary": "成功点击了"登录"按钮。", "result": {...}, "page_state": {...}}`
        *   **示例 (失败)**: `{"status": "error", "operation": "goto", "summary": "导航到指定网址失败。", "result": {"status": "error", "message": "net::ERR_NAME_NOT_RESOLVED"}, "page_state": {...}}`
        *   **示例 (部分成功)**: `{"status": "partial_success", "operation": "goto", "summary": "导航操作超时，但页面似乎已部分加载。", "result": {"status": "partial_success", ...}, "page_state": {...}}`
*   **JSON 序列化**: 使用 `json.dumps(response, ensure_ascii=False)` 生成最终的 `ToolResult.content`。

### 3.4 分层错误处理

*   **`UseBrowser` 错误**:
    *   **Invalid Operation**: `operations_registry.get_operation` 失败 -> 返回 `{"status": "error", "message": f"未知操作: {operation}", "available_operations": ...}`。
    *   **Param Validation**: Pydantic 验证失败 (`except Exception as validation_error:`) -> 返回友好的参数错误信息，指出缺失或类型错误的字段，并可能提供字段说明（如现有代码）。标记 `friendly_error: True`。
    *   **Invalid/Missing `page_id`**: 在确定目标页面 ID 时检查 -> 返回 `{"status": "error", "message": "页面 ID 无效或缺失。"}` 或更具体的提示。标记 `friendly_error: True`。
    *   **Unexpected Errors**: 顶层 `try...except Exception` 捕获其他意外错误 -> 返回通用错误 `{"status": "error", "message": "执行浏览器操作时发生意外错误。", "error_details": str(e)}`。
*   **`MagicBrowser` 错误**:
    *   `MagicBrowser` 方法应捕获 Playwright 异常、JS 异常等，并返回包含 `{"status": "error", "message": "具体错误信息", "details": ...}` 的字典。
    *   `UseBrowser.execute` 在收到 `operation_result` 后，检查其 `status`。如果是 "error"，**直接将 `operation_result` 作为 `response["result"]`**。可以基于 `operation_result["message"]` 生成 `response["summary"]`，但**避免**在 `UseBrowser` 中重新解释或生成底层的错误消息。

### 3.5 截图逻辑

*   **移除**: 从 `use_browser.py` 中删除 `_take_screenshot` 方法及 `_last_screenshot_hash`, `_last_screenshot_path` 属性。
*   **添加**: 在 `MagicBrowser` 类中添加 `async def take_screenshot_if_needed(self, page_id: str) -> Optional[str]` 方法，内部包含哈希比较、截图保存、更新哈希和路径的逻辑。
*   **调用**: 在 `UseBrowser.execute` 中，**仅在 `MagicBrowser` 操作成功后**，调用 `screenshot_path = await mb_instance.take_screenshot_if_needed(target_page_id)`。
*   **事件分发**: 如果 `screenshot_path` 有效，继续由 `UseBrowser` 调用 `self._dispatch_file_event`。

### 3.6 辅助方法更新

*   **`get_tool_detail`**:
    *   需要获取共享的 `MagicBrowser` 实例 (`mb_instance`)。
    *   调用 `active_page_id = await mb_instance.get_active_page_id()`。
    *   如果 `active_page_id` 存在，调用 `page_state = await mb_instance.get_page_state()`。
    *   从 `page_state["active_page"]` 中获取 `url` 和 `title`。
    *   使用这些信息和 `event_context.attachments` 创建 `ToolDetail`。
*   **`get_after_tool_call_friendly_action_and_remark`**:
    *   类似地，获取 `mb_instance` 和 `active_page_id` / `page_state`。
    *   从 `page_state["active_page"]` 获取 `title` 或 `url` 作为 `remark`。
    *   使用 `BrowserOperationNames.get_operation_info(operation)` 作为 `action`。

### 3.7 代码风格与注释

*   **注释**: 在 `use_browser.py` 中，重点注释：
    *   获取共享 `MagicBrowser` 实例的逻辑。
    *   确定目标 `page_id` 的判断流程。
    *   调用 `MagicBrowser` 方法的目的。
    *   **结果翻译逻辑**: 如何根据 `operation_result` 和 `page_state` 生成 `summary`。
    *   错误处理的分层策略。
*   **代码整洁**: 保持 `execute` 方法的结构清晰，可考虑将参数验证、页面 ID 确定、操作执行、结果处理等步骤封装为私有辅助方法（如果 `execute` 过于庞大）。

## 4. 示例流程 (Click 操作)

1.  AI 调用: `use_browser(operation="click", operation_params={"selector": "#login-button", "page_id": "pg_1"})`
2.  `UseBrowser.execute`:
    *   获取共享 `mb_instance`。
    *   验证 `operation_params` 符合 Click 操作的 Pydantic 模型。
    *   提取 `page_id="pg_1"` 和 `selector="#login-button"`。
    *   验证 `pg_1` 在 `mb_instance._managed_page_ids` 中。
    *   调用 `operation_result = await mb_instance.click(page_id="pg_1", selector="#login-button")`。
3.  `MagicBrowser.click`:
    *   调用 `self._page_registry.get_page("pg_1")` 获取 `page` 对象。
    *   执行 `await page.click("#login-button")`。
    *   如果成功，返回 `{"status": "success", "message": "成功点击元素: #login-button"}`。
    *   如果失败 (超时)，捕获异常，返回 `{"status": "error", "message": "点击元素失败: TimeoutError(...)", "details": ...}`。
4.  `UseBrowser.execute` (续):
    *   接收 `operation_result`。
    *   **如果成功**:
        *   调用 `page_states = await mb_instance.get_page_state()`。
        *   调用 `screenshot_path = await mb_instance.take_screenshot_if_needed("pg_1")`。
        *   如果 `screenshot_path` 有值，调用 `_dispatch_file_event`。
        *   构建 `response = {"status": "success", "operation": "click", "summary": "成功点击了选择器 '#login-button' 对应的元素。", "result": operation_result, "page_state": page_states}`。
    *   **如果失败**:
        *   调用 `page_states = await mb_instance.get_page_state()` (仍然尝试获取状态)。
        *   构建 `response = {"status": "error", "operation": "click", "summary": "尝试点击选择器 '#login-button' 失败。", "result": operation_result, "page_state": page_states}`。
    *   `result.content = json.dumps(response, ensure_ascii=False)`。
5.  返回 `ToolResult`。

## 5. 总结

通过以上适配，`use_browser.py` 将成为一个职责更单一、逻辑更清晰的接口层，专注于 AI 交互和结果翻译，而将浏览器自动化的复杂性完全交给 `MagicBrowser` 及其依赖项处理。这将显著提高代码的可维护性和可扩展性，并减少潜在的逻辑冲突。
