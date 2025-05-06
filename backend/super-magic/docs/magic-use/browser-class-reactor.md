我将阅读代码文件以深入了解这两个文件的关系和设计意图。

Read file: super-magic/app/tools/magic_use/browser.py

Read file: super-magic/app/tools/use_browser.py
基于对代码的深入阅读，我将提出一个简明的技术改造方案。

# 浏览器工具重构方案

## 现状分析

1. **browser.py**：提供浏览器底层控制能力，直接操作 Playwright 实例。当前返回了 Playwright 的原生对象（Context、Page 等）。

2. **use_browser.py**：面向大模型的工具，依赖 browser.py，但直接使用了 Playwright 的原生对象，违反了封装原则。

## 问题

1. use_browser.py 直接操作 Playwright 实例，使得层次不清晰
2. 大模型只能处理文本，但当前返回的是对象引用而非易于处理的 ID
3. browser.py 的封装不够彻底，导致外层代码需要直接操作底层对象

## 重构目标

1. browser.py 提供完全封装的 API，不暴露底层 Playwright 对象
2. use_browser.py 只通过 browser.py 提供的 API 操作浏览器
3. 使用文本 ID 代替对象引用，便于大模型处理

## 具体改造方案

### 1. 修改 Browser 类接口

```python
class Browser:
    # 现有方法修改
    async def get_active_context(self) -> Optional[BrowserContext]:
        # 改为
    async def get_active_context_id(self) -> Optional[str]:
        """获取当前活动的浏览器上下文ID"""

    async def get_active_page(self) -> Optional[Page]:
        # 改为
    async def get_active_page_id(self) -> Optional[str]:
        """获取当前活动的页面ID"""

    # 新增方法
    async def get_context_by_id(self, context_id: str) -> Optional[BrowserContext]:
        """根据ID获取上下文"""

    async def get_page_by_id(self, page_id: str) -> Optional[Page]:
        """根据ID获取页面"""

    # 封装操作方法，避免外部直接操作Playwright对象
    async def goto(self, page_id: str, url: str, wait_until: str = "networkidle") -> Dict[str, Any]:
        """导航到指定URL"""

    async def click(self, page_id: str, selector: str, timeout: int = 5000) -> Dict[str, Any]:
        """点击元素"""

    async def input_text(self, page_id: str, selector: str, text: str, clear_first: bool = True) -> Dict[str, Any]:
        """输入文本"""

    async def get_page_content(self, page_id: str, selector: str = "body") -> Dict[str, Any]:
        """获取页面内容"""
```

### 2. 修改 UseBrowser 类

```python
class UseBrowser(BaseTool):
    # 重构操作方法，不再直接操作Playwright对象
    @register_operation(
        "goto_url",
        {...}
    )
    async def goto_url(self, browser: Browser, params: Dict[str, Any]) -> Dict[str, Any]:
        """导航到指定URL"""
        url = params.get("url")
        wait_until = params.get("wait_until", "networkidle")

        if not url:
            return {"status": "error", "message": "需要提供URL参数"}

        try:
            # 获取或创建页面ID
            page_id = await browser.get_active_page_id()
            if not page_id:
                # 创建新页面并获取ID
                context_id = await browser.get_active_context_id()
                if not context_id:
                    context_id = await browser.new_context_id()
                page_id = await browser.new_page_id(context_id)

            # 使用封装后的方法
            result = await browser.goto(page_id, url, wait_until)
            return {
                "status": "success",
                "url": result.get("url"),
                "page_title": result.get("title"),
                "status_code": result.get("status_code"),
                "page_id": page_id  # 返回页面ID给大模型使用
            }
        except Exception as e:
            return {"status": "error", "message": f"导航到 {url} 失败: {str(e)}"}
```

### 3. 实现步骤

1. 首先在 browser.py 中实现 ID 管理机制：
   - 使用字典存储 ID 到对象的映射
   - 为每个对象生成唯一 ID
   - 提供通过 ID 获取对象的方法

2. 将所有直接操作 Playwright 对象的方法封装到 Browser 类中:
   - 替换直接返回 Playwright 对象的方法为返回 ID
   - 添加通过 ID 获取对象的内部方法
   - 封装常用操作如导航、点击、输入等

3. 重构 UseBrowser 类中的所有操作方法:
   - 使用 Browser 类提供的 ID 管理方法
   - 不再直接操作 Playwright 对象
   - 在返回结果中包含 ID 信息

## 优势

1. 分层清晰：browser.py 完全封装底层操作，use_browser.py 只关注业务逻辑
2. 大模型友好：使用文本 ID 代替对象引用
3. 更好的封装：防止跨层操作，提高代码可维护性

这种架构将使代码更加模块化，便于大模型理解和使用，同时也提高了系统的可维护性和可扩展性。
