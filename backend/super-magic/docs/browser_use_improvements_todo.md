# Browser DOM处理优化TODO

> 本文档总结了从browser-use项目中借鉴的改进点，按照执行计划优先级排序。

## 第一阶段（立即执行）

### 1. 统一使用DOMService替代直接DOMBridge调用

**问题**：当前Browser类中的方法直接使用DOMBridge，使得DOM状态管理分散，导致状态不一致和更新问题。

**解决方案**：
```python
# 在Browser类中添加服务实例管理
def _get_or_create_dom_service(self, page_id: str) -> DOMService:
    """获取或创建DOM服务实例"""
    page = self._pages.get(page_id)
    if not page:
        raise ValueError(f"无效的页面ID: {page_id}")

    # 创建DOMService实例或从缓存获取
    if not hasattr(page, "_dom_service"):
        from app.tools.magic_use.dom import DOMService
        page._dom_service = DOMService(page)

    return page._dom_service

# 更新get_visible_content方法使用DOM服务
async def get_visible_content(self, page_id: str, selector: str = "body"):
    page = self._pages.get(page_id)
    if not page:
        return {"status": "error", "message": f"无效的页面ID: {page_id}"}

    try:
        # 使用服务实例管理方法获取DOM服务
        dom_service = self._get_or_create_dom_service(page_id)

        # 确保DOM状态已刷新
        await dom_service.get_dom_state(force_refresh=True)

        # 使用DOM服务的桥接器获取可视内容
        visible_content = await dom_service.dom_bridge.get_visible_content(selector)

        # ... 后续现有代码 ...
    # ... 异常处理 ...

# 其他直接使用DOMBridge的方法也需要统一更新
async def get_interactive_elements(self, page_id: str, element_types: List[str] = None):
    dom_service = self._get_or_create_dom_service(page_id)
    # 使用DOM服务...
```

**参考出处**：
- browser-use/browser_use/browser/context.py中的上下文管理
- super-magic/app/tools/magic_use/browser.py中现有的get_interactive_elements方法

**投入产出比**：高，解决DOM状态管理分散问题，统一服务访问模式，解决滚动等场景中的DOM状态不一致问题。

## 第二阶段（本次不做下次优化）

### 2. DOM缓存机制优化

**问题**：频繁重建DOM树消耗资源，特别是在大型页面中。

**解决方案**：
```javascript
// 在DOM JavaScript中添加缓存机制
const DOM_CACHE = {
  boundingRects: new WeakMap(),
  computedStyles: new WeakMap(),
  clearCache: () => {
    DOM_CACHE.boundingRects = new WeakMap();
    DOM_CACHE.computedStyles = new WeakMap();
  }
};

function getCachedBoundingRect(element) {
  if (DOM_CACHE.boundingRects.has(element)) {
    return DOM_CACHE.boundingRects.get(element);
  }

  const rect = element.getBoundingClientRect();
  DOM_CACHE.boundingRects.set(element, rect);
  return rect;
}
```

**参考出处**：
- browser-use/browser_use/dom/buildDomTree.js中的DOM_CACHE实现

**投入产出比**：中，需要修改JavaScript代码并集成到现有系统，但可显著提高性能。

### 3. 滚动监听器实现

**问题**：DOM状态变化（如滚动）没有监听机制，需要手动刷新。

**解决方案**：
```javascript
// 在dom_tree_builder.js中添加
const updatePositions = () => {
  // 更新元素位置信息
};

// 添加监听器
window.addEventListener('scroll', updatePositions);
window.addEventListener('resize', updatePositions);
```

**参考出处**：
- browser-use/browser_use/dom/buildDomTree.js中的滚动监听器实现

**投入产出比**：中，需要修改JavaScript代码，但可提供自动更新DOM状态的能力。

### 4. DOM树双向引用实现

**问题**：当前DOM树结构只有从父到子的单向引用。

**解决方案**：
```python
@dataclass
class DOMBaseNode:
    is_visible: bool
    parent: Optional['DOMElementNode'] = None
```

**参考出处**：
- browser-use/browser_use/dom/views.py中的DOMBaseNode实现

**投入产出比**：低，需要全面重构DOM相关类，但可提供更强大的树遍历和上下文分析能力。

### 5. DOM语义分析增强

**问题**：当前DOM分析主要基于标签和属性，缺少更高级的语义理解。

**解决方案**：探索从browser-use中借鉴更高级的DOM语义分析能力。

**参考出处**：
- browser-use/browser_use/dom/buildDomTree.js中的isInteractiveElement等函数

**投入产出比**：待评估，需要进一步研究收益。

## 不执行的任务

### 滚动操作后强制刷新DOM状态

**原计划**：在browser.py的scroll_page方法中添加强制刷新DOM状态的代码。

**不执行原因**：统一使用DOMService后，通过get_dom_state(force_refresh=True)在需要时强制刷新DOM状态更为合理，无需在scroll_page方法中特别处理。滚动操作与DOM刷新逻辑分离，保持单一职责原则。
