# browser-use支持的浏览器动作分析

browser-use是一个强大的基于AI的浏览器自动化工具，它通过大语言模型（如GPT-4o）来控制浏览器完成各种网页任务。通过分析源码，我发现browser-use支持多种浏览器动作，这些动作可以分为几个主要类别：

## 基础浏览动作

1. **go_to_url**: 在当前标签页导航到指定URL
   - 文件出处: `browser_use/controller/service.py`
   ```python
   @self.registry.action('Navigate to URL in the current tab', param_model=GoToUrlAction)
   async def go_to_url(params: GoToUrlAction, browser: BrowserContext):
   ```

2. **go_back**: 返回上一页
   - 文件出处: `browser_use/controller/service.py`
   ```python
   @self.registry.action('Go back', param_model=NoParamsAction)
   async def go_back(_: NoParamsAction, browser: BrowserContext):
   ```

3. **search_google**: 在谷歌中搜索指定查询
   - 文件出处: `browser_use/controller/service.py`
   ```python
   @self.registry.action(
     'Search the query in Google in the current tab, the query should be a search query like humans search in Google, concrete and not vague or super long. More the single most important items. ',
     param_model=SearchGoogleAction,
   )
   async def search_google(params: SearchGoogleAction, browser: BrowserContext):
   ```

4. **wait**: 等待指定秒数（默认3秒）
   - 文件出处: `browser_use/controller/service.py`
   ```python
   @self.registry.action('Wait for x seconds default 3')
   async def wait(seconds: int = 3):
   ```

## 元素交互动作

1. **click_element_by_index**: 通过索引点击页面元素
   - 文件出处: `browser_use/controller/service.py`
   ```python
   @self.registry.action('Click element by index', param_model=ClickElementAction)
   async def click_element_by_index(params: ClickElementAction, browser: BrowserContext):
   ```

2. **click_element_by_selector**: 通过CSS选择器点击元素
   - 文件出处: `browser_use/controller/service.py`
   ```python
   @self.registry.action('Click element by selector', param_model=ClickElementBySelectorAction)
   async def click_element_by_selector(params: ClickElementBySelectorAction, browser: BrowserContext):
   ```

3. **click_element_by_xpath**: 通过XPath点击元素
   - 文件出处: `browser_use/controller/service.py`
   ```python
   @self.registry.action('Click on element by xpath', param_model=ClickElementByXpathAction)
   async def click_element_by_xpath(params: ClickElementByXpathAction, browser: BrowserContext):
   ```

4. **click_element_by_text**: 通过文本内容点击元素
   - 文件出处: `browser_use/controller/service.py`
   ```python
   @self.registry.action('Click element with text', param_model=ClickElementByTextAction)
   async def click_element_by_text(params: ClickElementByTextAction, browser: BrowserContext):
   ```

5. **input_text**: 在输入框内输入文本
   - 文件出处: `browser_use/controller/service.py`
   ```python
   @self.registry.action(
     'Input text into a input interactive element',
     param_model=InputTextAction,
   )
   async def input_text(params: InputTextAction, browser: BrowserContext, has_sensitive_data: bool = False):
   ```

6. **send_keys**: 发送特殊键如Escape、Backspace等或组合键
   - 文件出处: `browser_use/controller/service.py`
   ```python
   @self.registry.action(
     'Send strings of special keys like Escape,Backspace, Insert, PageDown, Delete, Enter, Shortcuts such as `Control+o`, `Control+Shift+T` are supported as well. This gets used in keyboard.press. ',
     param_model=SendKeysAction,
   )
   async def send_keys(params: SendKeysAction, browser: BrowserContext):
   ```

## 页面内容操作

1. **extract_content**: 提取页面内容，用于获取特定信息
   - 文件出处: `browser_use/controller/service.py`
   ```python
   @self.registry.action(
     'Extract page content to retrieve specific information from the page, e.g. all company names, a specifc description, all information about, links with companies in structured format or simply links',
   )
   async def extract_content(goal: str, browser: BrowserContext, page_extraction_llm: BaseChatModel):
   ```

2. **scroll_down**: 向下滚动页面（可指定像素数或默认整页）
   - 文件出处: `browser_use/controller/service.py`
   ```python
   @self.registry.action(
     'Scroll down the page by pixel amount - if no amount is specified, scroll down one page',
     param_model=ScrollAction,
   )
   async def scroll_down(params: ScrollAction, browser: BrowserContext):
   ```

3. **scroll_up**: 向上滚动页面（可指定像素数或默认整页）
   - 文件出处: `browser_use/controller/service.py`
   ```python
   @self.registry.action(
     'Scroll up the page by pixel amount - if no amount is specified, scroll up one page',
     param_model=ScrollAction,
   )
   async def scroll_up(params: ScrollAction, browser: BrowserContext):
   ```

4. **scroll_to_text**: 滚动到包含指定文本的元素
   - 文件出处: `browser_use/controller/service.py`
   ```python
   @self.registry.action(
     description='If you dont find something which you want to interact with, scroll to it',
   )
   async def scroll_to_text(text: str, browser: BrowserContext):
   ```

5. **save_pdf**: 将当前页面保存为PDF文件
   - 文件出处: `browser_use/controller/service.py`
   ```python
   @self.registry.action(
     'Save the current page as a PDF file',
   )
   async def save_pdf(browser: BrowserContext):
   ```

## 标签页管理

1. **switch_tab**: 切换到指定ID的标签页
   - 文件出处: `browser_use/controller/service.py`
   ```python
   @self.registry.action('Switch tab', param_model=SwitchTabAction)
   async def switch_tab(params: SwitchTabAction, browser: BrowserContext):
   ```

2. **open_tab**: 打开新标签页并加载指定URL
   - 文件出处: `browser_use/controller/service.py`
   ```python
   @self.registry.action('Open url in new tab', param_model=OpenTabAction)
   async def open_tab(params: OpenTabAction, browser: BrowserContext):
   ```

3. **close_tab**: 关闭指定ID的标签页
   - 文件出处: `browser_use/controller/service.py`
   ```python
   @self.registry.action('Close an existing tab', param_model=CloseTabAction)
   async def close_tab(params: CloseTabAction, browser: BrowserContext):
   ```

4. **group_tabs**: 对标签页进行分组
   - 文件出处: `browser_use/controller/service.py`
   ```python
   # 从导入的views中可以看到有GroupTabsAction
   from browser_use.controller.views import (
     GroupTabsAction,
   )
   ```

5. **ungroup_tabs**: 解除标签页分组
   - 文件出处: `browser_use/controller/service.py`
   ```python
   # 从导入的views中可以看到有UngroupTabsAction
   from browser_use.controller.views import (
     UngroupTabsAction,
   )
   ```

## 表单元素交互

1. **get_dropdown_options**: 获取下拉框的所有选项
   - 文件出处: `browser_use/controller/service.py`
   ```python
   @self.registry.action(
     description='Get all options from a native dropdown',
   )
   async def get_dropdown_options(index: int, browser: BrowserContext) -> ActionResult:
   ```

2. **select_dropdown_option**: 选择下拉框中的指定选项（通过文本）
   - 文件出处: `browser_use/controller/service.py`
   ```python
   @self.registry.action(
     description='Select dropdown option for interactive element index by the text of the option you want to select',
   )
   async def select_dropdown_option(
     index: int,
     text: str,
     browser: BrowserContext,
   ) -> ActionResult:
   ```

## 任务完成标记

1. **done**: 标记任务完成，提供任务结果文本和成功状态
   - 文件出处: `browser_use/controller/service.py`
   ```python
   @self.registry.action(
     'Complete task - with return text and if the task is finished (success=True) or not yet completly finished (success=False), because last step is reached',
     param_model=DoneAction,
   )
   async def done(params: DoneAction):
   ```

## 实现特性

browser-use的这些动作除了基本功能外，还具有以下特点：

1. **错误处理机制**：当元素不存在或不可点击时，会提供有用的错误信息
2. **跨域iframe支持**：能够处理跨域iframe中的内容提取
3. **文件下载处理**：点击下载链接时会返回下载路径
4. **敏感数据保护**：在处理敏感输入（如密码）时有特殊处理机制
5. **视觉理解**：支持使用页面截图帮助模型理解页面布局

## 在super-magic项目中的使用方式

在super-magic项目中，browser-use被封装成一个工具，通过`BrowserUse`类提供服务。该工具目前仅支持一种主要操作：`run_task`，它接受任务描述和相关配置，然后使用browser-use库执行网页任务。

- 文件出处: `app/tools/browser_use.py`
```python
class BrowserUse(BaseTool):
    # ...

    # 定义action与处理函数的映射关系
    action_handlers = {
        "run_task": self._run_task
    }
```

示例使用方式：
```python
# 创建Agent执行任务
agent = Agent(
    task="搜索「Python 编程」，拿到前三的结果，不要使用谷歌，而是使用bing搜索",
    llm=ChatOpenAI(model="gpt-4o"),
    browser=browser,
    initial_actions=[{"go_to_url": {"url": "https://www.bing.com"}}],
    tool_calling_method='raw'
)
await agent.run()
```

通过这种方式，大语言模型可以通过自然语言理解任务，并使用上述动作组合完成复杂的网页操作任务。
