# DOM解析和异步操作重构方案

## 问题分析

通过对当前项目代码的审查，我们发现存在几个关键问题：

1. **同步阻塞问题**：在异步函数中直接使用同步的BeautifulSoup操作，导致事件循环被阻塞
2. **架构设计问题**：DOM解析在Python端而非浏览器端进行，增加了不必要的CPU负担
3. **伪异步实现**：许多方法仅添加了`async`关键字但底层仍是同步操作
4. **层级依赖复杂**：Controller依赖DOM层，Agent又依赖Controller，嵌套调用过深
5. **缺乏缓存**：频繁重复解析相同的DOM结构

与开源库`browser-use`相比，我们的实现存在根本性的设计差异。开源库通过JavaScript在浏览器中直接构建DOM树，而我们的实现从浏览器获取HTML后在Python中重新解析。

## 重构目标

1. 将DOM解析从Python端移至浏览器端
2. 实现真正的异步架构，消除所有同步阻塞点
3. 分离DOM元素的数据表示和操作逻辑
4. 简化接口层次，减少依赖关系
5. 优化性能，减少不必要的DOM解析

## 重构计划

### 阶段一：DOM解析迁移（浏览器端实现）

#### 1. 创建浏览器端DOM树构建脚本

```javascript
// browser/dom_tree_builder.js
function buildDomTree(options = {}) {
    const {
        highlightElements = true,
        focusElement = -1,
        viewportExpansion = 0,
        debugMode = false
    } = options;

    // 性能计时
    const perfMetrics = debugMode ? { startTime: performance.now() } : null;

    // 递归构建DOM树
    function processNode(node, parent) {
        // 检查节点类型
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent.trim();
            if (!text) return null;

            // 检查可见性
            const isVisible = isNodeVisible(node);

            return {
                type: 'TEXT_NODE',
                text: text,
                isVisible: isVisible
            };
        }

        // 元素节点处理
        if (node.nodeType === Node.ELEMENT_NODE) {
            // 获取元素属性和位置信息
            const rect = node.getBoundingClientRect();
            const isVisible = isNodeVisible(node) &&
                              rect.width > 0 &&
                              rect.height > 0;

            // 检查是否可交互
            const isInteractive = isInteractiveElement(node);

            // 构建属性映射
            const attributes = {};
            for (const attr of node.attributes) {
                attributes[attr.name] = attr.value;
            }

            // 构建XPath
            const xpath = getXPath(node);

            // 构建元素数据
            const elementData = {
                tagName: node.tagName.toLowerCase(),
                xpath: xpath,
                attributes: attributes,
                isVisible: isVisible,
                isInteractive: isInteractive,
                isInViewport: isElementInViewport(node),
                children: []
            };

            // 递归处理子节点
            for (const child of node.childNodes) {
                const childData = processNode(child);
                if (childData) {
                    elementData.children.push(childData);
                }
            }

            return elementData;
        }

        return null;
    }

    // 处理整个文档
    const rootNode = document.documentElement;
    const domTree = processNode(rootNode);

    // 查找并标记可交互元素
    let highlightIndex = 0;
    const nodeMap = {};
    const selectorMap = {};

    function processInteractiveNodes(node) {
        if (!node) return;

        // 为可交互元素添加索引
        if (node.isInteractive && node.isVisible) {
            node.highlightIndex = highlightIndex++;
            selectorMap[node.highlightIndex] = node;
        }

        // 处理子节点
        if (node.children) {
            for (const child of node.children) {
                processInteractiveNodes(child);
            }
        }
    }

    processInteractiveNodes(domTree);

    // 记录性能指标
    if (perfMetrics) {
        perfMetrics.endTime = performance.now();
        perfMetrics.totalTime = perfMetrics.endTime - perfMetrics.startTime;
    }

    return {
        rootNode: domTree,
        selectorMap: selectorMap,
        perfMetrics: perfMetrics
    };
}
```

#### 2. 实现Bridge层与浏览器通信

```python
# browser/dom_bridge.py
import asyncio
import json
from typing import Dict, Any, Optional

from ..utils.enhanced_logging import log_with_context

class DOMBridge:
    """DOM桥接器，负责与浏览器端JavaScript通信获取DOM信息"""

    def __init__(self, page):
        """初始化DOM桥接器

        Args:
            page: Playwright页面对象
        """
        self.page = page
        self._js_loaded = False
        self._js_code = None

    async def _load_js_code(self):
        """加载JavaScript代码"""
        if self._js_loaded:
            return

        # 从文件加载JS代码
        import importlib.resources as pkg_resources
        from .. import browser

        self._js_code = pkg_resources.read_text(browser, 'dom_tree_builder.js')
        self._js_loaded = True

    async def get_dom_tree(self,
                          highlight_elements: bool = True,
                          focus_element: int = -1,
                          viewport_expansion: int = 0,
                          debug_mode: bool = False) -> Dict[str, Any]:
        """获取DOM树结构

        Args:
            highlight_elements: 是否标记可交互元素
            focus_element: 聚焦的元素索引
            viewport_expansion: 视口扩展大小
            debug_mode: 是否启用调试模式

        Returns:
            包含DOM树和选择器映射的字典
        """
        await self._load_js_code()

        # 构建参数
        args = {
            'highlightElements': highlight_elements,
            'focusElement': focus_element,
            'viewportExpansion': viewport_expansion,
            'debugMode': debug_mode
        }

        # 执行JavaScript获取DOM树
        try:
            result = await self.page.evaluate(f"{self._js_code}; buildDomTree({json.dumps(args)})")
            return result
        except Exception as e:
            log_with_context(
                logging.error,
                "Failed to get DOM tree from browser",
                error=str(e)
            )
            raise
```

#### 3. 实现DOM元素数据类

```python
# dom/models.py
from dataclasses import dataclass
from typing import Dict, List, Optional, Any

@dataclass
class DOMNodeBase:
    """DOM节点基类"""
    is_visible: bool

@dataclass
class DOMTextNode(DOMNodeBase):
    """文本节点"""
    text: str
    type: str = "TEXT_NODE"

@dataclass
class DOMElementNode(DOMNodeBase):
    """元素节点"""
    tag_name: str
    xpath: str
    attributes: Dict[str, str]
    children: List[Any]  # 可能包含DOMTextNode或DOMElementNode
    is_interactive: bool = False
    is_in_viewport: bool = False
    highlight_index: Optional[int] = None

    def get_attribute(self, name: str) -> Optional[str]:
        """获取属性值"""
        return self.attributes.get(name)

    def has_attribute(self, name: str) -> bool:
        """检查是否有指定属性"""
        return name in self.attributes

    def get_text_content(self) -> str:
        """获取元素包含的所有文本内容"""
        text_parts = []

        def collect_text(node):
            if isinstance(node, DOMTextNode):
                text_parts.append(node.text)
            elif isinstance(node, DOMElementNode):
                for child in node.children:
                    collect_text(child)

        collect_text(self)
        return " ".join(text_parts)

@dataclass
class DOMState:
    """DOM状态"""
    element_tree: DOMElementNode
    selector_map: Dict[int, DOMElementNode]
```

### 阶段二：DOM操作层重构

#### 1. 实现异步DOM服务

```python
# dom/service.py
import asyncio
import logging
from typing import Dict, List, Optional, Any, Union

from ..browser.dom_bridge import DOMBridge
from .models import DOMElementNode, DOMTextNode, DOMState

class DOMService:
    """DOM服务，提供DOM相关操作"""

    def __init__(self, page):
        """初始化DOM服务

        Args:
            page: Playwright页面对象
        """
        self.dom_bridge = DOMBridge(page)
        self.page = page
        self._dom_state = None
        self._last_update_time = 0

    async def get_dom_state(self,
                           force_refresh: bool = False,
                           highlight_elements: bool = True,
                           focus_element: int = -1) -> DOMState:
        """获取DOM状态

        Args:
            force_refresh: 是否强制刷新
            highlight_elements: 是否标记可交互元素
            focus_element: 聚焦元素索引

        Returns:
            DOM状态对象
        """
        # 检查是否需要刷新
        current_time = time.time()
        if (not self._dom_state or force_refresh or
            (current_time - self._last_update_time > 5)):  # 缓存5秒

            # 从浏览器获取DOM树
            dom_data = await self.dom_bridge.get_dom_tree(
                highlight_elements=highlight_elements,
                focus_element=focus_element
            )

            # 解析DOM数据
            self._dom_state = await self._parse_dom_data(dom_data)
            self._last_update_time = current_time

        return self._dom_state

    async def _parse_dom_data(self, dom_data: Dict[str, Any]) -> DOMState:
        """解析从浏览器获取的DOM数据

        Args:
            dom_data: 浏览器返回的DOM数据

        Returns:
            DOM状态对象
        """
        # 构建DOM节点树和选择器映射
        root_node_data = dom_data.get('rootNode', {})
        selector_map_data = dom_data.get('selectorMap', {})

        # 构建节点映射
        node_map = {}

        def build_node(node_data):
            if not node_data:
                return None

            if node_data.get('type') == 'TEXT_NODE':
                return DOMTextNode(
                    text=node_data.get('text', ''),
                    is_visible=node_data.get('isVisible', False)
                )

            # 处理元素节点
            children = []
            for child_data in node_data.get('children', []):
                child_node = build_node(child_data)
                if child_node:
                    children.append(child_node)

            element = DOMElementNode(
                tag_name=node_data.get('tagName', 'div'),
                xpath=node_data.get('xpath', ''),
                attributes=node_data.get('attributes', {}),
                children=children,
                is_visible=node_data.get('isVisible', False),
                is_interactive=node_data.get('isInteractive', False),
                is_in_viewport=node_data.get('isInViewport', False),
                highlight_index=node_data.get('highlightIndex')
            )

            # 将元素添加到映射
            if element.highlight_index is not None:
                node_map[element.highlight_index] = element

            return element

        # 构建DOM树
        root_element = build_node(root_node_data)

        return DOMState(
            element_tree=root_element,
            selector_map=node_map
        )

    async def find_element_by_index(self, index: int) -> Optional[DOMElementNode]:
        """通过索引查找元素

        Args:
            index: 元素索引

        Returns:
            元素节点，未找到则返回None
        """
        dom_state = await self.get_dom_state()
        return dom_state.selector_map.get(index)

    async def find_elements_by_text(self, text: str, exact: bool = False) -> List[DOMElementNode]:
        """通过文本查找元素

        Args:
            text: 要查找的文本
            exact: 是否精确匹配

        Returns:
            匹配的元素列表
        """
        dom_state = await self.get_dom_state()
        result = []

        def search_text(node, text, exact):
            if isinstance(node, DOMTextNode):
                node_text = node.text
                if (exact and node_text == text) or (not exact and text in node_text):
                    # 找到匹配的文本节点，返回其父元素
                    return True
                return False

            if isinstance(node, DOMElementNode):
                # 对当前节点的文本内容进行检查
                node_text = node.get_text_content()
                if (exact and node_text == text) or (not exact and text in node_text):
                    result.append(node)

                # 递归检查子节点
                for child in node.children:
                    search_text(child, text, exact)

        # 从根节点开始搜索
        search_text(dom_state.element_tree, text, exact)
        return result

    async def find_elements_by_xpath(self, xpath: str) -> List[DOMElementNode]:
        """通过XPath查找元素

        Args:
            xpath: XPath表达式

        Returns:
            匹配的元素列表
        """
        # 直接在浏览器中执行XPath查询
        elements_data = await self.page.evaluate(f"""
            (() => {{
                const result = [];
                const elements = document.evaluate(
                    "{xpath}",
                    document,
                    null,
                    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                    null
                );

                for (let i = 0; i < elements.snapshotLength; i++) {{
                    const element = elements.snapshotItem(i);
                    result.push({{
                        tagName: element.tagName.toLowerCase(),
                        xpath: "{xpath}",
                        textContent: element.textContent,
                        attributes: Object.fromEntries(
                            Array.from(element.attributes)
                                .map(attr => [attr.name, attr.value])
                        )
                    }});
                }}

                return result;
            }})()
        """)

        # 转换为DOM元素节点
        result = []
        for element_data in elements_data:
            element = DOMElementNode(
                tag_name=element_data.get('tagName', 'div'),
                xpath=element_data.get('xpath', xpath),
                attributes=element_data.get('attributes', {}),
                children=[],
                is_visible=True,  # 简化处理，假设所有元素可见
                is_interactive=False
            )
            result.append(element)

        return result
```

#### 2. 修改控制器层接口

```python
# controller/controller.py
import asyncio
import logging
from typing import Dict, List, Optional, Any, Union

from ..browser.browser import Browser
from ..dom.service import DOMService
from ..dom.models import DOMElementNode, DOMTextNode

class Controller:
    """控制器，提供浏览器自动化操作的高级接口"""

    def __init__(self, browser: Browser, debug_mode: bool = False, debug_dir: str = None):
        """初始化控制器

        Args:
            browser: 浏览器实例
            debug_mode: 是否启用调试模式
            debug_dir: 调试输出目录
        """
        self.browser = browser
        self.debug_mode = debug_mode
        self.debug_dir = debug_dir
        self.context = None
        self.dom_service = None

    async def initialize(self):
        """初始化控制器"""
        if not self.context:
            self.context = await self.browser.new_context()
            await self.context.new_page()
            self.dom_service = DOMService(self.context.page)

    async def close(self):
        """关闭控制器"""
        if self.context:
            await self.context.close()
            self.context = None

    async def get_interactive_elements(self, include_screenshot: bool = False) -> Dict[str, Any]:
        """获取页面上的可交互元素

        Args:
            include_screenshot: 是否包含截图

        Returns:
            包含互动元素的字典
        """
        # 获取DOM状态
        dom_state = await self.dom_service.get_dom_state(force_refresh=True)

        # 分类元素
        clickable = []
        form = []

        for index, element in dom_state.selector_map.items():
            # 创建元素信息
            element_info = {
                "index": index,
                "tag": element.tag_name,
                "text": element.get_text_content(),
                "attributes": element.attributes,
                "is_visible": element.is_visible,
                "xpath": element.xpath,
            }

            # 根据类型分类
            tag = element.tag_name
            if (tag in ["button", "a"] or
                element.get_attribute("type") in ["button", "submit"] or
                element.get_attribute("role") == "button"):
                clickable.append(element_info)
            elif (tag in ["input", "textarea", "select"] or
                  element.get_attribute("type") in ["text", "password", "email", "search", "tel", "url"]):
                form.append(element_info)

        result = {
            "clickable": clickable,
            "form": form,
            "all_elements": list(clickable) + list(form)
        }

        # 如果需要截图
        if include_screenshot:
            screenshot = await self.context.page.screenshot()
            import base64
            result["screenshot_base64"] = base64.b64encode(screenshot).decode("utf-8")

        return result

    async def click_element(self, index: Optional[int] = None, element: Optional[DOMElementNode] = None, **kwargs):
        """点击元素

        Args:
            index: 元素索引
            element: DOM元素
            **kwargs: 其他参数，传递给Playwright的click方法

        Returns:
            点击操作结果
        """
        if index is not None:
            element = await self.dom_service.find_element_by_index(index)

        if not element:
            if 'selector' in kwargs:
                await self.context.page.click(kwargs['selector'])
            elif 'xpath' in kwargs:
                # 使用evaluate执行XPath点击
                await self.context.page.evaluate(f"""
                    (() => {{
                        const element = document.evaluate(
                            "{kwargs['xpath']}",
                            document,
                            null,
                            XPathResult.FIRST_ORDERED_NODE_TYPE,
                            null
                        ).singleNodeValue;
                        if (element) element.click();
                    }})()
                """)
            else:
                raise ValueError("No element specified for click operation")
        else:
            # 使用XPath定位元素并点击
            await self.context.page.evaluate(f"""
                (() => {{
                    const element = document.evaluate(
                        "{element.xpath}",
                        document,
                        null,
                        XPathResult.FIRST_ORDERED_NODE_TYPE,
                        null
                    ).singleNodeValue;
                    if (element) element.click();
                }})()
            """)

        return {"success": True, "action": "click"}

    async def input_text(self, text: str, index: Optional[int] = None, element: Optional[DOMElementNode] = None, **kwargs):
        """在输入框中输入文本

        Args:
            text: 要输入的文本
            index: 元素索引
            element: DOM元素
            **kwargs: 其他参数

        Returns:
            输入操作结果
        """
        if index is not None:
            element = await self.dom_service.find_element_by_index(index)

        if not element:
            if 'selector' in kwargs:
                await self.context.page.fill(kwargs['selector'], text)
            else:
                raise ValueError("No element specified for input operation")
        else:
            # 使用XPath定位元素并输入文本
            await self.context.page.evaluate(f"""
                (() => {{
                    const element = document.evaluate(
                        "{element.xpath}",
                        document,
                        null,
                        XPathResult.FIRST_ORDERED_NODE_TYPE,
                        null
                    ).singleNodeValue;
                    if (element) {{
                        element.value = "";  // 清空当前值
                        element.focus();
                        element.value = "{text}";
                        element.dispatchEvent(new Event('input', {{ bubbles: true }}));
                        element.dispatchEvent(new Event('change', {{ bubbles: true }}));
                    }}
                }})()
            """)

        return {"success": True, "action": "input_text", "text": text}
```

### 阶段三：Agent层重构

```python
# agent/service.py (部分更新)

async def _get_page_state(self) -> Dict[str, Any]:
    """获取当前页面状态"""
    try:
        # 获取页面基本信息
        url = self.controller.context.url
        title = await self.controller.context.get_title()

        # 获取互动元素
        dom_state = await self.controller.get_interactive_elements()

        # 获取页面截图
        screenshot = None
        if self.config.enable_screenshots:
            screenshot = await self.controller.context.page.screenshot()
            # 保存截图
            screenshot_path = os.path.join(
                self.config.screenshot_dir,
                f"step_{self._current_step}_{int(time.time())}.png"
            )
            with open(screenshot_path, "wb") as f:
                f.write(screenshot)

        # 提取页面文本内容
        content = await self.controller.context.page.evaluate('() => document.body.innerText')

        # 构建页面状态
        page_state = {
            "url": url,
            "title": title,
            "elements": [f"[{i}]<{el['tag']}>{el['text']}</{el['tag']}>" for i, el in enumerate(dom_state.get("all_elements", []))],
            "dom_elements": dom_state.get("all_elements", []),
            "content": content,
            "step": self._current_step,
            "timestamp": time.time(),
            "task": self.state.task
        }

        # 记录状态快照
        self.state.record_state_snapshot(page_state)

        return page_state
    except Exception as e:
        logger.error(f"获取页面状态失败: {str(e)}")
        logger.debug(f"错误详情: {traceback.format_exc()}")

        # 返回基本状态
        return {
            "url": self.controller.context.url,
            "title": "(获取页面状态失败)",
            "elements": [],
            "dom_elements": [],
            "content": f"错误: {str(e)}",
            "step": self._current_step,
            "timestamp": time.time(),
            "task": self.state.task
        }
```

## 实施计划

### 阶段一：初步准备和基础重构（2天）

1. 创建浏览器端DOM树构建JavaScript脚本
2. 实现DOM桥接器，负责与浏览器通信
3. 定义DOM元素数据模型

### 阶段二：核心功能重构（3天）

1. 实现DOM服务，提供异步DOM操作接口
2. 修改控制器层，使用新的DOM服务
3. 更新DOM查找和操作方法

### 阶段三：集成和测试（2天）

1. 更新Agent层，使用新的控制器接口
2. 进行全面的功能测试
3. 性能测试和优化

### 阶段四：清理和文档（1天）

1. 移除旧的DOM实现代码
2. 更新项目文档
3. 编写迁移指南

## 预期收益

1. **性能提升**：DOM解析在浏览器端进行，大幅减少Python端CPU负担
2. **真正的异步架构**：消除同步阻塞点，提高并发能力
3. **更简洁的代码**：分离数据和操作，减少复杂度
4. **更好的可维护性**：清晰的层次结构和接口定义
5. **更高的稳定性**：与开源库对齐的架构设计，减少错误

## 风险和缓解措施

### 风险

1. **兼容性问题**：重构可能导致与现有代码不兼容
2. **功能完整性**：新实现可能缺少某些特性
3. **JavaScript执行错误**：浏览器端脚本的错误处理

### 缓解措施

1. 实施分阶段重构，确保向后兼容
2. 编写全面的单元测试和集成测试
3. 添加详细的错误处理和日志记录
4. 构建监控机制，跟踪DOM操作性能

## 结论

本重构方案将解决当前实现中的根本问题，通过将DOM解析移至浏览器端并实现真正的异步架构，大幅提高性能和稳定性。与开源库`browser-use`的架构对齐，使代码更容易维护和扩展。

重构完成后，我们将消除所有同步阻塞点，为未来功能扩展提供更好的基础架构。
