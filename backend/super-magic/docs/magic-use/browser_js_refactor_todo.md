# 浏览器JavaScript模块化重构TODO

## 当前状态

目前，我们的项目中JavaScript代码主要通过以下两种方式使用：

1. 直接嵌入在Python代码中作为字符串
2. 部分通过`dom.py`中的DOMBridge从`dom_tree_builder.js`加载

这种方式存在几个问题：
- 代码难以维护和调试
- 缺乏模块化和复用
- JavaScript代码分散在多个Python文件中

## 目标

1. 为当前需求（获取可视区域Markdown内容）实现一个最简化但架构合理的解决方案
2. 建立可扩展的JavaScript模块化架构
3. 避免重复代码，提高复用性

## 实施步骤

### 1. 创建基础JavaScript模块结构

在`app/tools/magic_use/js/`目录下创建以下文件：

- `dom_tree_builder.js` - 原有文件，负责DOM树构建（已存在）
- `viewport_content.js` - 新文件，负责可视区域内容提取

### 2. 实现可视区域内容提取模块

在`viewport_content.js`中实现以下功能：

```javascript
/**
 * MagicUseViewport模块 - 处理可视区域内容提取
 */
window.MagicUseViewport = (function() {
    /**
     * 提取当前可视区域内的HTML内容
     * @param {Object} options - 配置选项
     * @param {string} options.selector - 要提取内容的选择器，默认为"body"
     * @param {boolean} options.includeHidden - 是否包含隐藏元素，默认为false
     * @returns {string} 可视区域内的HTML内容
     */
    function extractVisibleContent(options = {}) {
        const {
            selector = 'body',
            includeHidden = false
        } = options;

        const el = document.querySelector(selector);
        if (!el) return '';

        // 获取可视区域信息
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        // 创建一个新的容器来存储可视内容的克隆
        const visibleContentContainer = document.createElement('div');

        // 递归检查元素是否在可视区域内
        function isInViewport(element) {
            const rect = element.getBoundingClientRect();
            return (
                rect.top < viewportHeight &&
                rect.left < viewportWidth &&
                rect.bottom > 0 &&
                rect.right > 0
            );
        }

        // 递归克隆可视元素
        function cloneVisibleContent(sourceNode, targetParent) {
            if (sourceNode.nodeType === Node.TEXT_NODE) {
                targetParent.appendChild(sourceNode.cloneNode(true));
                return;
            }

            if (sourceNode.nodeType === Node.ELEMENT_NODE) {
                // 跳过不可见元素（除非includeHidden为true）
                if (!includeHidden) {
                    const style = window.getComputedStyle(sourceNode);
                    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
                        return;
                    }
                }

                // 检查元素是否在可视区域内
                if (!isInViewport(sourceNode) && !includeHidden) {
                    return;
                }

                // 克隆当前元素
                const clone = sourceNode.cloneNode(false);
                targetParent.appendChild(clone);

                // 递归处理子元素
                for (const child of sourceNode.childNodes) {
                    cloneVisibleContent(child, clone);
                }
            }
        }

        // 开始克隆可视内容
        cloneVisibleContent(el, visibleContentContainer);

        return visibleContentContainer.innerHTML;
    }

    // 暴露公共API
    return {
        extractVisibleContent
    };
})();
```

### 3. 修改DOMBridge类支持多模块加载

修改`app/tools/magic_use/dom.py`中的DOMBridge类：

```python
class DOMBridge:
    """DOM桥接器，负责与浏览器端JavaScript通信"""

    def __init__(self, page: Page):
        """初始化DOM桥接器

        Args:
            page: Playwright页面对象
        """
        self.page = page
        self._js_loaded = {}  # 改为字典，记录各模块加载状态
        self._js_code = {}    # 存储各模块代码

    async def _load_js_module(self, module_name: str) -> None:
        """加载JavaScript模块

        Args:
            module_name: 模块名称，对应js/目录下的文件名（不含.js扩展名）
        """
        if self._js_loaded.get(module_name, False):
            return

        try:
            # 从文件加载JavaScript代码
            js_path = Path(__file__).parent / "js" / f"{module_name}.js"
            self._js_code[module_name] = js_path.read_text(encoding="utf-8")

            # 在页面中注入JavaScript代码
            await self.page.add_script_tag(content=self._js_code[module_name])
            self._js_loaded[module_name] = True
            logger.debug(f"JavaScript模块 {module_name} 已加载")
        except Exception as e:
            logger.error(f"加载JavaScript模块 {module_name} 失败: {e}")
            raise

    async def get_visible_content(self, selector: str = "body", include_hidden: bool = False) -> str:
        """获取可视区域内的HTML内容

        Args:
            selector: 要获取内容的CSS选择器
            include_hidden: 是否包含隐藏元素

        Returns:
            可视区域内的HTML内容
        """
        await self._load_js_module("viewport_content")

        options = {
            "selector": selector,
            "includeHidden": include_hidden
        }

        try:
            result = await self.page.evaluate("window.MagicUseViewport.extractVisibleContent", options)
            return result
        except Exception as e:
            logger.error(f"获取可视内容失败: {e}")
            raise
```

### 4. 更新Browser类中的方法

修改`app/tools/magic_use/browser.py`中的`get_visible_content_markdown`方法：

```python
async def get_visible_content_markdown(self, page_id: str, selector: str = "body") -> Dict[str, Any]:
    """获取当前可视区域内的内容并转换为Markdown格式

    Args:
        page_id: 页面ID
        selector: 要获取内容的CSS选择器，默认为"body"

    Returns:
        包含Markdown内容的结果字典
    """
    page = self._pages.get(page_id)
    if not page:
        return {"status": "error", "message": f"无效的页面ID: {page_id}"}

    try:
        # 从dom.py导入DOMBridge
        from app.tools.magic_use.dom import DOMBridge

        # 创建DOM桥接器
        dom_bridge = DOMBridge(page)

        # 获取可视区域内的HTML
        visible_content = await dom_bridge.get_visible_content(selector)

        if not visible_content:
            return {
                "status": "warning",
                "message": "没有找到可视区域内的内容",
                "url": page.url,
                "title": await page.title()
            }

        # TODO: 使用新方法

        return {
            "status": "success",
            "url": page.url,
            "title": await page.title(),
            "selector": selector,
            "markdown_length": len(markdown_text),
            "markdown_text": markdown_text
        }
    except Exception as e:
        import traceback
        return {
            "status": "error",
            "message": f"获取可视内容并转换为Markdown失败: {str(e)}",
            "error_details": traceback.format_exc()
        }
```

### 5. 创建必要的目录结构

```bash
mkdir -p app/tools/magic_use/js
```

## 文件结构

实施后的文件结构应为：

```
app/tools/magic_use/
├── browser.py                # 浏览器控制核心
├── dom.py                    # DOM服务和桥接器
└── js/
    ├── dom_tree_builder.js   # DOM树构建模块
    └── viewport_content.js   # 可视区域内容提取模块
```

## 后续扩展

这种模块化结构可以很容易地扩展以支持更多功能：

1. 添加更多JavaScript模块，如表单处理、元素交互等
2. 扩展DOMBridge类以支持更多浏览器端操作
3. 改进模块加载机制，如使用依赖管理

## 注意事项

1. 确保创建js目录并正确放置JavaScript文件
2. 针对潜在的JavaScript错误添加适当的错误处理
3. 为了简化实现，当前方案不包括模块间依赖管理；如有需要，后续可以改进
