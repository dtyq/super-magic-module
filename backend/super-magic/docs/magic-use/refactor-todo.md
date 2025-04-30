# Magic-Use 浏览器工具重构 TODO

## 第一阶段：架构设计与核心框架（已完成）

### 1. 操作注册机制实现
- [x] 创建操作注册装饰器 `register_operation`
- [x] 修改 `UseBrowser` 类，添加操作注册表
- [x] 实现操作注册方法 `_register_operations`
- [x] 添加操作元数据存储逻辑

### 2. 参数结构重设计
- [x] 修改 `parameters` 属性，简化为 `url`、`action` 和 `action_params`
- [x] 更新类文档字符串，说明新的参数使用方式
- [x] 调整 `execute` 方法接口，适配新参数结构

### 3. 浏览器实例管理优化
- [x] 重构 `get_browser` 方法，确保单例模式正确性
- [x] 添加 `_get_page` 和 `_get_current_page` 辅助方法
- [x] 实现页面缓存和复用机制

### 4. 执行流程优化
- [x] 重构 `execute` 方法，实现操作分发
- [x] 添加异常处理和错误上下文
- [x] 统一操作结果格式
- [x] 优化操作日志记录

### 5. Help 操作实现
- [x] 实现 `help_operation` 方法，支持查询所有操作和特定操作
- [x] 添加操作示例返回功能 `_get_operation_example`
- [x] 完善操作帮助格式，确保输出友好

### 6. 集成浏览器操作库
- [x] 确保与 `app/tools/magic_use/browser.py` 正确集成
- [x] 调整与 `app/tools/magic_use/actions.py` 的交互
- [x] 集成 `app/tools/magic_use/helpers.py` 中的辅助函数

## 第二阶段：基础操作实现（待定，根据用户选择添加）

### 1. 基础导航操作（可选实现）
- [ ] 实现 `navigate_operation` - 导航到URL
- [ ] 实现 `back_operation` - 页面后退
- [ ] 实现 `forward_operation` - 页面前进
- [ ] 实现 `refresh_operation` - 刷新页面
- [ ] 实现 `new_page_operation` - 创建新页面
- [ ] 实现 `close_page_operation` - 关闭页面
- [ ] 实现 `close_browser_operation` - 关闭浏览器

### 2. 核心元素操作（可选实现）
- [ ] 实现 `click_operation` - 点击元素
- [ ] 实现 `input_operation` - 输入文本
- [ ] 实现 `extract_operation` - 提取内容
- [ ] 实现 `scroll_operation` - 滚动页面
- [ ] 实现 `screenshot_operation` - 截图
- [ ] 实现 `wait_operation` - 等待元素或时间
- [ ] 实现 `execute_js_operation` - 执行JavaScript
