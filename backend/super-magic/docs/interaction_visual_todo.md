# Interaction Visual TODO

1.  [x] 创建文件 `app/tools/use_browser_operations/interaction_visual.py`。
2.  [x] 在 `interaction_visual.py` 中定义 `InteractionVisualOperations` 类，继承 `OperationGroup`。
3.  [x] 在 `interaction_visual.py` 中定义 `InputTextVisualParams` Pydantic 模型，包含 `element_description`, `text`, `clear_first`, `press_enter` 字段。
4.  [x] 实现 `input_text_visual` 异步方法：
    *   [x] 获取活跃页面 ID。
    *   [x] 实现截图逻辑：调用 `browser.take_screenshot` 并保存到系统临时目录下的唯一子目录。
    *   [x] 实现视觉理解调用逻辑：
        *   [x] 实例化 `VisualUnderstanding`。
        *   [x] 构造 `VisualUnderstandingParams` (截图路径, 查询文本)。
        *   [x] 调用 `visual_understanding.execute_purely`。
        *   [x] 解析结果，提取标记文本，处理错误（包括格式校验和"未找到"情况）。
    *   [x] 实现 JS 调用逻辑：
        *   [x] 构造 `window.MagicMarker.find('LABEL')` JS 代码。
        *   [x] 调用 `browser.evaluate_js`。
        *   [x] 获取 `magic-touch-id`，处理错误（包括 JS 失败和返回 null）。
    *   [x] 构造 Playwright 选择器 `[magic-touch-id="ID"]`。
    *   [x] 调用 `browser.input_text`。
    *   [x] 处理 `browser.input_text` 的返回结果。
    *   [x] 实现临时截图文件删除逻辑 (单个文件)。
    *   [x] 构造并返回 `ToolResult`。
5.  [x] 在 `interaction_visual.py` 中添加必要的 import 语句。
6.  [x] 确保 `VisualUnderstanding` 工具可用且已正确配置 (假设已配置)。
7.  [x] 优化视觉理解的查询 prompt 以提高准确性。
8.  [x] 添加全面的错误处理和日志记录 (已在实现中添加)。
9.  [x] 在工具加载机制中注册 `InteractionVisualOperations` (修改 `app/tools/use_browser_operations/__init__.py`)。
