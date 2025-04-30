# Magic-Use 浏览器自动化工具

Magic-Use 是一个基于 Python 和 Playwright 的现代化浏览器自动化工具，专为大型语言模型控制浏览器设计，提供高效、可靠、异步的浏览器操作能力。

## 特性

- **完全异步架构**：基于 `asyncio` 设计，消除所有同步阻塞点
- **浏览器端 DOM 解析**：在浏览器中直接构建 DOM 树，大幅提升性能
- **稳定可靠**：自动重试机制、错误恢复策略和详细错误上下文
- **易于扩展**：模块化设计，低耦合，便于添加新功能
- **LLM 友好**：针对大语言模型的使用场景优化，支持多种主流 LLM

## 使用示例

### 基础用法

浏览器任务执行:

```python
# 导入工具
from app.tools.use_browser import UseBrowser

# 创建工具实例
browser_tool = UseBrowser()

# 执行任务
result = await browser_tool.execute(
    tool_context=tool_context,
    url="https://www.example.com",
    action="run_task",
    task_data={
        "task": "分析页面内容，提取主要标题和链接",
        "model": "gpt-4o",
        "use_vision": True
    }
)
```

### 元素操作

点击元素:

```python
result = await browser_tool.execute(
    tool_context=tool_context,
    url="https://www.example.com",
    action="click",
    element_selector=".login-button"
)
```

输入文本:

```python
result = await browser_tool.execute(
    tool_context=tool_context,
    url="https://www.example.com",
    action="input_text",
    element_selector="#username",
    text_content="user@example.com"
)
```

### 内容提取

提取页面内容:

```python
result = await browser_tool.execute(
    tool_context=tool_context,
    url="https://www.example.com",
    action="extract_content"
)
```

提取特定元素内容:

```python
result = await browser_tool.execute(
    tool_context=tool_context,
    url="https://www.example.com",
    action="extract_content",
    element_selector=".main-content"
)
```

## 支持的操作

Magic-Use 支持以下操作:

| 操作 | 说明 | 参数 |
|------|------|------|
| run_task | 执行特定任务 | task_data: 任务相关数据 |
| click | 点击元素 | element_selector: 元素选择器 |
| input_text | 输入文本 | element_selector: 元素选择器, text_content: 要输入的文本 |
| extract_content | 提取内容 | element_selector: 元素选择器(可选) |
| scroll | 滚动页面 | scroll_direction: 滚动方向, scroll_amount: 滚动量 |
| navigate | 导航到URL | url: 目标URL |
| screenshot | 获取截图 | screenshot_path: 截图保存路径(可选) |

## 架构概述

Magic-Use 采用三层架构设计:

1. **浏览器层**: 封装 Playwright，提供基础浏览器控制能力
   - browser.py: 浏览器初始化与页面管理
   - dom_tree_builder.js: 浏览器端DOM树构建
   - dom.py: DOM数据模型和操作接口

2. **操作层**: 提供统一的浏览器操作接口
   - actions.py: 实现点击、输入、滚动等操作

3. **辅助层**: 提供各种辅助功能
   - helpers.py: 工具函数集合
   - json_utils.py: JSON处理工具

## 与大语言模型集成

Magic-Use 特别优化了与大型语言模型的集成:

1. 支持基于视觉的页面理解
2. 提供通用任务执行能力
3. 支持常见LLM的JSON输出格式
4. 更加详细的上下文信息

## 错误处理

提供三个级别的错误处理:

1. **自动重试**: 针对常见的临时性错误自动重试
2. **详细错误信息**: 提供丰富的错误上下文，便于调试
3. **恢复策略**: 提供错误恢复选项

## 性能优化

主要性能优化点:

1. 浏览器端DOM解析，减少Python端CPU负担
2. DOM状态缓存，避免频繁重建DOM树
3. 异步操作，减少阻塞
4. 智能元素定位策略，提高查找效率
