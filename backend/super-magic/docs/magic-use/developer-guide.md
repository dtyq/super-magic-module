# Magic-Use 开发者指南

本文档提供了 Magic-Use 项目的详细开发指南，包括环境配置、架构说明、核心模块解析、扩展指南以及最佳实践。

## 开发环境配置

### 基础环境要求

- Python 3.10+
- Node.js 14+
- 支持的操作系统：Windows 10+, macOS 10.15+, Linux

### 依赖安装

```bash
# 安装 Python 依赖
pip install -r requirements.txt

# 安装 Playwright 及其浏览器
playwright install
```

### 开发工具推荐

- **IDE**：VSCode 或 PyCharm
- **测试工具**：pytest
- **代码检查**：flake8, mypy
- **格式化工具**：black, isort

## 项目架构

Magic-Use 采用三层架构设计，各层职责明确，耦合度低：

### 1. 浏览器层 (Browser Layer)

负责与浏览器直接交互，管理浏览器生命周期，提供基础的页面操作接口。

核心文件：
- `app/tools/magic_use/browser.py` - 浏览器控制核心
- `app/tools/magic_use/dom_tree_builder.js` - 浏览器端DOM树构建
- `app/tools/magic_use/dom.py` - DOM模型与操作接口

### 2. 操作层 (Action Layer)

封装各种浏览器操作，提供统一的操作接口，处理操作结果和错误。

核心文件：
- `app/tools/magic_use/actions.py` - 操作集合
- `app/tools/magic_use/json_utils.py` - JSON处理工具

### 3. 辅助层 (Utility Layer)

提供各类辅助功能，包括日志、配置、错误处理、调试工具等。

核心文件：
- `app/tools/magic_use/helpers.py` - 辅助工具集合

### 4. 工具集成层 (Tool Integration Layer)

将Magic-Use功能集成到应用系统中，提供工具接口。

核心文件：
- `app/tools/use_browser.py` - 浏览器工具实现

## 核心模块详解

### 浏览器控制模块

浏览器控制模块负责浏览器的初始化、页面管理和基础操作。

#### 主要类和方法

```python
class Browser:
    """浏览器控制核心类"""

    async def launch(config: BrowserConfig) -> None:
        """启动浏览器"""

    async def new_page(url: str = None) -> Page:
        """创建新页面"""

    async def close() -> None:
        """关闭浏览器"""

class BrowserConfig:
    """浏览器配置类"""
    browser_type: Literal["chromium", "firefox", "webkit"] = "chromium"
    headless: bool = True
    slow_mo: int = 0
    timeout: int = 30000
    viewport: Dict[str, int] = {"width": 1280, "height": 720}
    user_agent: Optional[str] = None
    proxy: Optional[Dict[str, str]] = None
```

#### 关键实现细节

- 使用单例模式确保浏览器实例唯一
- 支持多页面管理和页面复用
- 实现浏览器资源自动释放
- 支持自定义浏览器启动参数

### DOM处理模块

DOM处理模块负责在浏览器端构建DOM树，并提供DOM操作接口。

#### 浏览器端DOM构建

DOM树在浏览器JavaScript环境中构建，主要过程：

1. 递归遍历DOM节点
2. 提取必要节点信息
3. 构建节点索引和映射
4. 检测元素可见性和可交互性
5. 序列化DOM树返回到Python端

#### Python端DOM模型

```python
class DOMNodeBase(BaseModel):
    """DOM节点基类"""
    node_id: str
    node_type: int

class DOMTextNode(DOMNodeBase):
    """文本节点"""
    text: str

class DOMElementNode(DOMNodeBase):
    """元素节点"""
    tag_name: str
    attributes: Dict[str, str]
    children: List[Union[DOMElementNode, DOMTextNode]]
    selector: str
    xpath: str
    is_visible: bool
    is_clickable: bool

class DOMState:
    """DOM状态管理类"""
    root: DOMElementNode
    node_map: Dict[str, Union[DOMElementNode, DOMTextNode]]
    selector_map: Dict[str, str]

class DOMService:
    """DOM服务类"""

    async def build_dom_tree(page: Page) -> DOMState:
        """构建DOM树"""

    async def find_element(selector: str) -> Optional[DOMElementNode]:
        """查找元素"""

    async def find_elements_by_text(text: str) -> List[DOMElementNode]:
        """通过文本查找元素"""
```

### 操作集合模块

操作集合模块封装各种浏览器操作，提供统一的操作接口。

#### 主要操作

- 导航操作：`go_to_url`, `back`, `forward`
- 点击操作：`click_element`, `click_text`
- 输入操作：`input_text`
- 滚动操作：`scroll`
- 内容提取：`extract_content`
- 截图操作：`screenshot`

#### 操作结果处理

```python
class ActionResult(BaseModel):
    """操作结果"""
    success: bool
    data: Any = None
    error: Optional[str] = None
    error_context: Optional[Dict[str, Any]] = None
```

### JSON处理模块

JSON处理模块负责网页中JSON数据的提取和分析。

#### 主要功能

- 从网络响应中提取JSON
- 从脚本标签中提取JSON
- 从DOM元素中提取JSON
- 从Window对象中提取JSON
- 分析JSON结构
- 转换JSON格式

### 辅助工具模块

辅助工具模块提供各类辅助功能。

#### 主要工具类

- `WaitUtils`: 等待工具类，提供各种等待方法
- `DebugUtils`: 调试工具类，提供截图、保存HTML等功能
- `StringUtils`: 字符串工具类，提供文本处理功能
- `BrowserUtils`: 浏览器工具类，提供浏览器相关辅助功能
- `FileUtils`: 文件工具类，提供文件操作功能

## 扩展指南

### 添加新的浏览器操作

1. 在 `actions.py` 中定义新操作
2. 实现操作逻辑
3. 在 `use_browser.py` 中暴露操作接口

示例：添加一个新的拖放操作

```python
# actions.py
async def drag_and_drop(
    page: Page,
    source_selector: str,
    target_selector: str
) -> ActionResult:
    """拖放操作"""
    try:
        source = await page.wait_for_selector(source_selector)
        target = await page.wait_for_selector(target_selector)

        await source.drag_to(target)

        return ActionResult(success=True)
    except Exception as e:
        return ActionResult(
            success=False,
            error=str(e),
            error_context={
                "source_selector": source_selector,
                "target_selector": target_selector
            }
        )

# use_browser.py
# 在UseBrowser类中添加
async def drag_and_drop(
    self,
    url: str,
    source_selector: str,
    target_selector: str
) -> ToolResult:
    """执行拖放操作"""
    browser = await self._get_browser()
    page = await browser.get_page(url)

    result = await actions.drag_and_drop(
        page,
        source_selector,
        target_selector
    )

    if result.success:
        return ToolResult(success=True, message="拖放操作成功")
    else:
        return ToolResult(
            success=False,
            error=result.error,
            error_context=result.error_context
        )
```

### 添加新的辅助工具

1. 在 `helpers.py` 中定义新工具类或函数
2. 实现工具逻辑
3. 按需引入到其他模块中

示例：添加一个Cookie管理工具

```python
# helpers.py
class CookieUtils:
    """Cookie管理工具类"""

    @staticmethod
    async def save_cookies(page: Page, file_path: str) -> None:
        """保存Cookies到文件"""
        cookies = await page.context.cookies()
        with open(file_path, "w") as f:
            json.dump(cookies, f)

    @staticmethod
    async def load_cookies(page: Page, file_path: str) -> None:
        """从文件加载Cookies"""
        with open(file_path, "r") as f:
            cookies = json.load(f)
        await page.context.add_cookies(cookies)
```

## 最佳实践

### 错误处理

- 所有浏览器操作都应包含适当的错误处理
- 尽可能提供详细的错误上下文
- 对于可恢复的错误，应实现自动重试机制
- 使用结构化日志记录错误信息

### 性能优化

- 避免频繁构建DOM树，合理使用缓存
- 优先使用选择器查找元素，其次才是文本查找
- 使用异步操作，避免同步阻塞
- 合理设置等待策略，避免不必要的固定时间等待

### 代码风格

- 遵循PEP 8规范
- 使用类型注解
- 为所有公共接口编写文档字符串
- 编写单元测试

### 调试技巧

- 使用 `headless=False` 观察浏览器行为
- 使用 `DebugUtils.screenshot` 捕获页面状态
- 使用 `DebugUtils.save_html` 保存页面HTML
- 使用结构化日志跟踪代码执行

## 常见问题解答

### Q: 如何处理动态加载内容?

A: 使用等待策略，如等待特定元素出现、等待网络请求完成等。

```python
# 等待元素出现
await page.wait_for_selector("#dynamic-content")

# 等待网络空闲
await page.wait_for_load_state("networkidle")
```

### Q: 如何处理弹窗和对话框?

A: 使用页面事件处理器。

```python
# 处理对话框
page.on("dialog", lambda dialog: dialog.accept())

# 处理文件选择
async with page.expect_file_chooser() as fc_info:
    await page.click("#upload-button")
file_chooser = await fc_info.value
await file_chooser.set_files("path/to/file.txt")
```

### Q: 如何优化元素查找?

A: 使用更精确的选择器，结合DOM索引。

```python
# 优先使用ID选择器
await page.click("#username")

# 其次使用CSS选择器
await page.click(".login-button")

# 使用DOM索引快速查找
element = dom_state.node_map["node-123"]
```

## 贡献指南

欢迎为Magic-Use项目贡献代码。请遵循以下步骤：

1. Fork项目仓库
2. 创建功能分支
3. 提交变更
4. 确保所有测试通过
5. 提交拉取请求

### 代码审查标准

- 代码必须通过所有自动化测试
- 代码必须遵循项目的代码风格
- 新功能必须有相应的文档
- 所有公共接口必须有文档字符串
- 修复bug时必须包含相应的测试用例
