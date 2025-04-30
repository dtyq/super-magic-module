# Interaction Refactor TODO

1.  [x] **准备工作:** 在 `interaction.py` 中添加必要的 import (`tempfile`, `uuid`, `Path`, `os`, `re`, `VisualUnderstanding`, `VisualUnderstandingParams`) 和临时目录设置（截图缓存）。
2.  [x] **实现 `get_interactive_element_visual`:** 在 `InteractionOperations` 类中添加新方法 `get_interactive_element_visual` 及其参数模型 `GetInteractiveElementVisualParams`，并从 `interaction_visual.py` 迁移视觉定位逻辑（截图、调用视觉模型、调用JS、构造选择器、返回结果、清理截图）。
3.  [x] **修改 `click` 操作:** 移除 `click` 方法内对 `selector` 的 `#` 前缀处理逻辑，直接使用传入的 `selector` 调用 `browser.click`。更新 `ClickParams` 的 `selector` 描述和 `@operation` 示例，使用标准 CSS 选择器。更新返回消息。
4.  [x] **修改 `input_text` 操作:** 移除 `input_text` 方法内对 `selector` 的 `#` 前缀处理逻辑，直接使用传入的 `selector` 调用 `browser.input_text`。更新 `InputTextParams` 的 `selector` 描述和 `@operation` 示例。更新返回消息。
5.  [x] **清理:** 使用 `trash` 命令删除 `app/tools/use_browser_operations/interaction_visual.py` 文件。
6.  [x] **检查:** 确认所有修改符合要求，代码风格一致，注释清晰。
