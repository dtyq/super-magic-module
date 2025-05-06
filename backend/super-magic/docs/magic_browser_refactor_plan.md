# Magic Browser 重构方案

本文档旨在阐述 `app/tools/magic_use/magic_browser.py` 模块的重构计划，旨在提升代码的可维护性、可扩展性，并实现全局浏览器资源的共享，同时遵循大道至简、易于理解和维护的原则。

## 1. 重构目标

*   **降低单文件复杂度**: 将原 `magic_browser.py` 拆分为多个职责单一的文件。
*   **全局资源共享**: 实现全局唯一的 Playwright `Browser` 和 `BrowserContext` 实例，供所有 `MagicBrowser` 实例共享，减少资源消耗。
*   **清晰的职责划分**: 每个模块负责特定的功能（浏览器管理、页面管理、JS 加载、核心业务逻辑）。**坚持单一职责原则**。
*   **明确接口与实现**: 区分公共 API 类（以 `Magic` 开头）和内部实现类。内部类虽然不带下划线，但应通过文档和模块导入（如 `__init__.py` 的 `__all__`）明确其内部属性。
*   **代码即文档**: 使用简洁、准确、必要的中文注释解释设计意图和关键逻辑，而非逐行解释代码。

## 2. 文件结构与类设计

重构后，相关功能将分布在以下文件中：

*   **`app/tools/magic_use/magic_browser_config.py`**:
    *   **类**: `MagicBrowserConfig` (公共类)
    *   **职责**: 定义浏览器启动、上下文和页面相关的配置选项。保持不变。
*   **`app/tools/magic_use/browser_manager.py`**:
    *   **类**: `BrowserManager` (内部类)
    *   **职责**: 管理全局唯一的 Playwright `Browser` 和 `BrowserContext` 实例。
        *   负责 Playwright 和浏览器进程的生命周期（启动、关闭）。
        *   处理全局配置（如 `storage_state` 加载/保存）。
        *   提供获取全局 `BrowserContext` 的方法。
        *   **优化**: 推荐实现为可通过**显式依赖注入**使用的单例。在其 `get_context` 方法中实现**惰性异步初始化**，确保首次使用时浏览器已启动。
*   **`app/tools/magic_use/page_registry.py`**:
    *   **类**: `PageRegistry` (内部类)
    *   **职责**: 全局管理所有 `Page` 实例及相关状态。
        *   维护页面 ID 到 `Page` 对象的映射。
        *   负责页面的注册、注销。
        *   提供获取页面基础信息和详细状态的方法（封装滚动、分段等逻辑）。
        *   **JS加载内部化**: 内部管理与页面关联的 `JSLoader` 实例（维护 `page_id` -> `JSLoader` 映射），提供 `ensure_js_module_loaded` 等方法供内部调用，**不向外暴露 `JSLoader` 类或实例**。
        *   推荐实现为可通过**显式依赖注入**使用的单例。
*   **`app/tools/magic_use/js_loader.py`**:
    *   **类**: `JSLoader` (内部类，由 `PageRegistry` 内部使用)
    *   **职责**: 负责在特定页面内加载和管理 JavaScript 模块，处理依赖关系和执行。对外部透明。
*   **`app/tools/magic_use/magic_browser.py`**:
    *   **类**: `MagicBrowser` (公共类)
    *   **职责**: 作为主要的外部交互接口。管理一个**页面集合**（通过页面 ID 列表）。
        *   **不直接控制** Playwright `Browser` 或 `Context`。
        *   通过**构造函数注入** `BrowserManager` 和 `PageRegistry` 的单例实例进行交互。
        *   负责创建新页面（通过 `BrowserManager` 获取 `Context`，创建 `Page`，通过 `PageRegistry` 注册）。
        *   维护自己管理的页面 ID 列表 (`_managed_page_ids`) 和当前活动页面 ID (`_active_page_id`)。
        *   提供面向业务的页面操作方法（如 `goto`, `click`, `input_text`, `scroll_page`, `get_markdown`, `get_interactive_elements`），内部通过 `PageRegistry` 获取 `Page` 对象并执行操作（必要时调用 `PageRegistry` 的 JS 加载方法）。
        *   提供 `get_page_state` 方法，用于获取其管理的页面集合的状态信息（活动页面的详细信息，非活动页面的基本信息），数据来源于 `PageRegistry`。
        *   提供 `close` 方法，用于关闭其管理的所有页面并从 `PageRegistry` 注销，**但不关闭**全局浏览器。

## 3. 核心逻辑变更

*   **全局单例与注入**: `BrowserManager` 和 `PageRegistry` 作为单例，通过显式依赖注入传递给 `MagicBrowser`。
*   **惰性初始化**: `BrowserManager` 在首次需要 `BrowserContext` 时异步启动浏览器。
*   **JS 加载封装**: JS 加载逻辑完全封装在 `PageRegistry` 内部。
*   **状态管理**: `MagicBrowser` 的状态报告完全依赖 `PageRegistry` 提供的数据。
*   **页面生命周期**: `MagicBrowser` 的页面创建和关闭操作会同步调用 `PageRegistry` 的注册和注销方法。
*   **全局关闭**: 需要应用层面的逻辑，在适当的时候（如应用退出）调用 `BrowserManager.close_browser()` 来关闭全局浏览器。

## 4. 预期收益

*   代码结构更清晰，职责更单一，易于理解和维护。
*   减少了浏览器进程和上下文的资源消耗。
*   提高了代码的可测试性（通过依赖注入）。
*   保持了灵活性，支持未来可能需要多个独立页面集合管理器的场景。
*   通过惰性初始化简化了使用流程。
