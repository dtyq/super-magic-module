# Magic Browser 现有代码分析和重构设计

## 现有代码分析

### MagicBrowser 类的主要职责

目前的 `magic_browser.py` 中的 `MagicBrowser` 类承担了多个职责：

1. **浏览器生命周期管理**
   - 初始化 Playwright
   - 创建浏览器实例
   - 配置和启动浏览器
   - 关闭浏览器

2. **上下文(Context)管理**
   - 创建浏览器上下文
   - 管理上下文状态和存储
   - 保存和加载上下文状态

3. **页面(Page)管理**
   - 创建新页面
   - 跟踪活动页面
   - 通过ID管理多个页面
   - 提供页面状态和信息查询

4. **JavaScript加载**
   - 通过内部的 `JSLoader` 类管理JS代码
   - 加载和执行JS模块
   - 处理JS模块依赖关系

5. **页面操作**
   - 导航(goto)
   - 点击(click)
   - 输入文本(input_text)
   - 滚动页面(scroll_page)
   - 获取页面内容(get_markdown)
   - 查找和操作页面元素(get_interactive_elements)

6. **网络状态监控**
   - 请求和响应监听
   - 网络稳定性检测

### JSLoader 类的职责

`JSLoader` 是 `MagicBrowser` 内部使用的类，负责：

1. 加载JavaScript模块
2. 解析并处理模块依赖关系
3. 在页面中执行JavaScript代码
4. 管理已加载的JS模块状态

## 重构设计

根据单一职责原则和重构计划，我们将把现有代码拆分为以下几个主要组件：

### 1. BrowserManager (新文件: browser_manager.py)

**职责**：管理全局唯一的 Playwright `Browser` 和 `BrowserContext` 实例。

**核心功能**:
- 初始化 Playwright
- 启动浏览器
- 创建上下文
- 管理浏览器和上下文的生命周期
- 提供获取上下文的方法

**设计为单例模式**，确保全局只有一个浏览器实例。

### 2. PageRegistry (新文件: page_registry.py)

**职责**：全局管理所有 `Page` 实例及相关状态。

**核心功能**:
- 页面的注册与注销
- 维护页面ID到Page对象的映射
- 提供获取页面对象的方法
- 收集和提供页面信息和状态
- 内部管理JS加载器实例

**设计为单例模式**，确保统一管理所有页面。

### 3. JSLoader (新文件: js_loader.py)

**职责**：负责JavaScript代码的加载和执行。

**核心功能**:
- 加载JS模块
- 解析模块依赖
- 在页面中执行JS代码
- 监控JS执行状态

设计为**内部使用的类**，由 `PageRegistry` 内部管理。

### 4. MagicBrowser (重构现有文件: magic_browser.py)

**职责**：作为面向用户的接口，管理特定的页面集合。

**核心功能**:
- 创建和关闭自己管理的页面
- 维护当前活动页面
- 提供页面操作方法
- 通过 `PageRegistry` 和 `BrowserManager` 实现功能

## 类关系图

```
+------------------------+      使用      +------------------------+
|                        |--------------->|                        |
|     MagicBrowser       |                |    BrowserManager     |
|                        |                |    (单例)             |
+------------------------+                +------------------------+
         |                                        |
         | 使用                                   | 创建
         v                                        v
+------------------------+      使用      +------------------------+
|                        |--------------->|                        |
|    PageRegistry        |                |   Playwright Browser  |
|    (单例)             |                |   & BrowserContext     |
+------------------------+                +------------------------+
         |
         | 管理
         v
+------------------------+
|                        |
|      JSLoader          |
|   (内部使用)           |
+------------------------+
         |
         | 操作
         v
+------------------------+
|                        |
|   Playwright Page      |
|                        |
+------------------------+
```

## 重构后的公共API

重构后，对外暴露的公共API将保持与当前实现逻辑一致，主要包括：

1. **MagicBrowser**:
   - `__init__(config: Optional[MagicBrowserConfig] = None)`
   - `initialize()`
   - `goto(page_id, url, wait_until)`
   - `click(page_id, selector)`
   - `input_text(page_id, selector, text, clear_first, press_enter)`
   - `scroll_page(page_id, direction, full_page)`
   - `get_markdown(page_id, scope)`
   - `get_interactive_elements(page_id, scope, type)`
   - `get_page_state(page_id)`
   - `new_page(context_id)`
   - `close(keep_alive)`
   - 其他页面操作和状态查询方法

2. **MagicBrowserConfig**:
   - 保持现有的配置选项和接口不变

## 文件和路径设计

```
app/tools/magic_use/
├── __init__.py              # 导出公共类: MagicBrowser, MagicBrowserConfig
├── magic_browser.py         # 重构后的MagicBrowser类
├── magic_browser_config.py  # 保持不变
├── browser_manager.py       # 新增: BrowserManager单例类
├── page_registry.py         # 新增: PageRegistry单例类
├── js_loader.py             # 新增: JSLoader内部类
└── js/                      # JS模块目录(保持不变)
    ├── lens.js
    ├── marker.js
    ├── pure.js
    └── touch.js
```
