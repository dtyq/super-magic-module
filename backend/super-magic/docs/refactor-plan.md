# SuperMagic类重构计划

## 分析概述

SuperMagic类是一个复杂的AI代理实现，整合了多个功能模块，包括工具执行、模型调用、历史管理等。经过代码分析，发现该类存在以下可优化点：

1. **代码冗余**：多个方法之间存在相似逻辑和重复代码
2. **方法过长**：部分方法过长，功能混杂
3. **职责不清**：单个类承担了太多职责，违反单一职责原则
4. **重复初始化**：多处存在相似的初始化逻辑

## 具体优化计划

LLMAdapterLLMAdapter### 1. 合并相似方法

#### 1.1 模型相关方法整合

合并以下相关方法：
- `set_llm_model()`
- `_initialize_model_from_main_agent()`
- 部分`_setup_agent_and_model()`方法中的模型设置逻辑

建议创建一个统一的`_initialize_model(model_name, agent_name=None)`私有方法，处理所有模型初始化和设置逻辑。

**代码示例**：

```python
def _initialize_model(self, model_name: Optional[str] = None, agent_name: Optional[str] = None, 
                     update_context: bool = True) -> bool:
    """
    统一的模型初始化方法，处理所有模型相关的初始化逻辑
    
    Args:
        model_name: 指定的模型名称，如果为None则尝试从agent文件获取
        agent_name: 代理名称，用于从对应agent文件提取模型名称
        update_context: 是否更新agent上下文中的模型设置
        
    Returns:
        bool: 初始化是否成功
    """
    # 如果未指定模型名称但提供了agent名称，尝试从agent文件提取
    if not model_name and agent_name:
        model_name = self._prompt_processor.extract_model_from_agent_file(agent_name)
        logger.info(f"从 {agent_name}.agent 文件提取模型名称: {model_name}")
    
    # 检查模型是否存在
    model_info = self.llm_adapter.get_model_info(model_name)
    
    if model_name and model_info:
        # 更新当前使用的模型
        previous_model = self._current_model_name
        self._current_model_name = model_name
        
        # 如果需要更新上下文
        if update_context and self._agent_context:
            success = self.llm_adapter.set_default_model(model_name, self._agent_context)
            if not success:
                logger.warning(f"设置模型 {model_name} 到代理上下文失败")
                return False
        
        # 记录模型变更日志
        if previous_model != model_name:
            logger.info(f"模型已从 {previous_model} 更改为 {model_name}")
        
        return True
    elif model_name == "deepseek-reasoner":
        # 特殊处理 deepseek-reasoner 模型
        available_models = self.llm_adapter.get_available_models()
        if "deepseek-reasoner" in available_models:
            self._current_model_name = "deepseek-reasoner"
            
            if update_context and self._agent_context:
                self.llm_adapter.set_default_model("deepseek-reasoner", self._agent_context)
                
            logger.info(f"特殊处理设置模型: deepseek-reasoner")
            return True
    
    # 使用默认模型
    default_model = self.llm_adapter.default_model
    self._current_model_name = default_model
    
    if model_name:
        logger.warning(f"指定的模型 {model_name} 不可用，使用默认模型: {default_model}")
    else:
        logger.info(f"未指定模型，使用默认模型: {default_model}")
    
    return False
```

**使用示例**：

以下是如何替换现有方法的示例：

```python
# 替换 set_llm_model 方法
def set_llm_model(self, model: str) -> bool:
    """
    设置LLM模型
    
    Args:
        model: 模型名称
        
    Returns:
        bool: 设置是否成功
    """
    return self._initialize_model(model_name=model, update_context=True)

# 替换 _initialize_model_from_main_agent 方法
def _initialize_model_from_main_agent(self):
    """
    从 magic.agent 文件中提取并设置 LLM 模型
    """
    self._initialize_model(agent_name="magic", update_context=True)

# 修改 _setup_agent_and_model 方法中的模型设置部分
def _setup_agent_and_model(self, agent_name: str, update_history_manager: bool = True) -> None:
    """设置代理和模型的共享逻辑"""
    # 更新当前agent名称
    previous_agent_name = self._current_agent_name
    self._current_agent_name = agent_name
    
    # 记录agent文件路径
    from app.paths import PathManager
    agent_file = os.path.join(PathManager.get_project_root(), "agents", f"{agent_name}.agent")
    if not os.path.exists(agent_file):
        logger.warning(f"未找到agent文件: {agent_file}")
    
    # 重置系统提示词，使其在下次使用时重新加载
    self.system_prompt = None
    
    # 更新历史管理器中的agent名称
    if update_history_manager and hasattr(self, "history_manager") and self.history_manager is not None:
        if hasattr(self.history_manager, "set_agent_name"):
            self.history_manager.set_agent_name(agent_name)
            logger.info(f"已更新历史管理器的agent名称: {agent_name}")
        else:
            logger.warning("历史管理器不支持set_agent_name方法")
    
    # 初始化模型 - 替换原有的模型设置逻辑
    self._initialize_model(agent_name=agent_name)
    
    # 记录当前正在运行的agent名称
    if previous_agent_name != agent_name:
        logger.info(f"当前运行的agent: {agent_name}")
        
        # 打印更具描述性的模型使用日志
        agent_display_name = agent_name.capitalize()
        if agent_name == "web-browser":
            agent_display_name = "Web Browser"
        logger.info(f"{agent_display_name} Agent 使用 {self._current_model_name} 模型")
```

#### 1.2 工具调用处理方法整合

合并以下相关方法：
- `_parse_tool_calls()`
- `_parse_tool_content()`
- `_parse_arguments()`

这些方法都是用于解析工具调用的不同方面，可以整合为一个更强大的工具调用解析器。

**代码示例**：

```python
class ToolCallParser:
    """
    工具调用解析器，负责处理各种格式的工具调用解析
    """
    
    def __init__(self, known_tool_names: List[str] = None):
        """
        初始化工具调用解析器
        
        Args:
            known_tool_names: 已知的工具名称列表，用于识别未明确格式化的调用
        """
        self.known_tool_names = known_tool_names or []
        
    def parse_from_response(self, response: ChatCompletionMessage) -> List[ChatCompletionMessageToolCall]:
        """
        从LLM响应中解析工具调用
        
        Args:
            response: 模型响应
            
        Returns:
            工具调用列表，如果没有工具调用则返回空列表
        """
        # 解析OpenAI响应中的工具调用
        if hasattr(response, "tool_calls") and response.tool_calls:
            return response.tool_calls
            
        # 检查内容是否包含可能的工具调用格式
        if response.content:
            # 尝试从文本内容解析工具调用
            parsed_tool = self.parse_from_text(response.content)
            if parsed_tool:
                # 创建工具调用对象
                tool_id = str(uuid.uuid4())
                return [ChatCompletionMessageToolCall(
                    id=tool_id,
                    type="function",
                    function={
                        "name": parsed_tool["name"],
                        "arguments": parsed_tool["arguments"]
                    }
                )]
                
        return []
    
    def parse_from_text(self, content: str) -> Optional[Dict[str, Any]]:
        """
        从文本内容解析工具调用
        
        Args:
            content: 工具调用内容文本
            
        Returns:
            Dict: 包含工具名称和参数的字典，如果无法解析则返回None
        """
        # 尝试多种模式匹配工具调用
        # 模式1: 直接调用格式 tool_name(arg1="value1", arg2="value2")
        tool_call_pattern = r"([a-zA-Z0-9_]+)\s*\((.*)\)"
        match = re.search(tool_call_pattern, content)
        
        if match:
            tool_name = match.group(1)
            args_str = match.group(2)
            
            # 解析参数字典
            args_dict = self._parse_arguments_string(args_str)
            return {"name": tool_name, "arguments": json.dumps(args_dict, ensure_ascii=False)}
            
        # 模式2: JSON格式
        try:
            # 尝试解析为JSON对象
            data = json.loads(content)
            if isinstance(data, dict) and "name" in data:
                # 确保arguments是JSON字符串
                if "arguments" in data:
                    if not isinstance(data["arguments"], str):
                        data["arguments"] = json.dumps(data["arguments"], ensure_ascii=False)
                else:
                    data["arguments"] = "{}"
                return {"name": data["name"], "arguments": data["arguments"]}
        except:
            pass
            
        # 模式3: 处理python风格的调用，如bing_search("query")
        python_call_pattern = r'([a-zA-Z0-9_]+)\s*\(\s*(?:"([^"]*)"|\{([^}]*)\}|\'([^\']*)\'|([^,\)]+))\s*\)'
        match = re.search(python_call_pattern, content)
        if match:
            tool_name = match.group(1)
            # 获取第一个非None的组作为值
            arg_value = next((g for g in match.groups()[1:] if g is not None), "")
            
            # 根据工具名称确定参数名
            arg_name = self._get_default_arg_name(tool_name)
            
            return {"name": tool_name, "arguments": json.dumps({arg_name: arg_value}, ensure_ascii=False)}
            
        # 如果都无法匹配，尝试提取可能的工具名称
        words = re.findall(r"\b([a-zA-Z0-9_]+)\b", content)
        for word in words:
            if word in self.known_tool_names:
                # 发现已知的工具名称，返回空参数
                return {"name": word, "arguments": "{}"}
                
        # 实在无法匹配，返回None
        return None
        
    def _parse_arguments_string(self, args_str: str) -> Dict[str, Any]:
        """
        解析参数字符串为字典
        
        Args:
            args_str: 参数字符串，如 'arg1="value1", arg2=123'
            
        Returns:
            解析后的参数字典
        """
        args_dict = {}
        # 使用正则表达式匹配参数
        arg_pattern = r'([a-zA-Z0-9_]+)\s*=\s*(?:"([^"]*)"|\{([^}]*)\}|\'([^\']*)\'|([^,\)]+))'
        for arg_match in re.finditer(arg_pattern, args_str):
            arg_name = arg_match.group(1)
            # 获取第一个非None的组作为值
            arg_value = next((g for g in arg_match.groups()[1:] if g is not None), "")
            
            # 尝试解析JSON对象
            if arg_value.startswith("{") and arg_value.endswith("}"):
                try:
                    arg_value = json.loads(arg_value)
                except:
                    pass  # 如果无法解析为JSON，保持原样
                    
            args_dict[arg_name] = arg_value
            
        return args_dict
        
    def _get_default_arg_name(self, tool_name: str) -> str:
        """
        根据工具名称获取默认的参数名
        
        Args:
            tool_name: 工具名称
            
        Returns:
            默认参数名
        """
        # 为常见工具定义默认参数名
        tool_params = {
            "bing_search": "query",
            "browser_use": "url",
            "python_execute": "code",
            "read_file": "path",
            "write_to_file": "path",
            "replace_in_file": "path",
            "delete_file": "path",
            "shell_exec": "command",
        }
        
        return tool_params.get(tool_name, "input")
        
    def parse_arguments(self, arguments_str: str) -> Dict:
        """
        解析工具调用参数字符串为字典
        
        Args:
            arguments_str: 参数字符串，可能是JSON字符串或已经是字典
            
        Returns:
            解析后的参数字典
        """
        if isinstance(arguments_str, str):
            try:
                return json.loads(arguments_str)
            except:
                return {}
        return arguments_str
```

**使用示例**：

```python
# 在SuperMagic类中使用工具调用解析器
def __init__(self, system_prompt: Optional[str] = None, agent_context: Optional[AgentContext] = None):
    # ... 其他初始化代码 ...
    
    # 初始化工具调用解析器
    self._tool_parser = ToolCallParser(known_tool_names=[
        "bing_search", "browser_use", "python_execute", "read_file", 
        "write_to_file", "replace_in_file", "delete_file", "shell_exec",
        "compress_chat_history", "finish_task"
    ])
    
    # ... 其他初始化代码 ...

# 替换 _parse_tool_calls 方法
def _parse_tool_calls(self, response: ChatCompletionMessage) -> List[ChatCompletionMessageToolCall]:
    """从模型响应中解析工具调用"""
    return self._tool_parser.parse_from_response(response)
    
# 替换 _parse_arguments 方法
def _parse_arguments(self, arguments_str: str) -> Dict:
    """解析工具调用参数"""
    return self._tool_parser.parse_arguments(arguments_str)
    
# _parse_tool_content 方法可以完全移除，直接使用 _tool_parser.parse_from_text 方法
```

#### 1.3 历史管理方法整合

合并以下相关方法：
- `_save_chat_history()`
- `_load_chat_history()`
- `_initialize_history_manager_from_context()`

创建一个统一的历史管理接口方法。

**代码示例**：

```python
class ChatHistoryManager:
    """
    聊天历史管理器，负责处理聊天历史的加载、保存和初始化操作
    """
    
    def __init__(self, agent_name: str, workspace_dir: str, agent_context: Optional[AgentContext] = None):
        """
        初始化聊天历史管理器
        
        Args:
            agent_name: 代理名称
            workspace_dir: 工作目录
            agent_context: 代理上下文
        """
        from app.agent.chat_history_manager import ChatHistoryManager as OriginalChatHistoryManager
        
        self._agent_name = agent_name
        self._workspace_dir = workspace_dir
        self._agent_context = agent_context
        
        # 内部历史管理器实例
        self._manager_instance = OriginalChatHistoryManager.get_instance(agent_name, workspace_dir)
        logger.info(f"初始化聊天历史管理器: agent_name={agent_name}, workspace_dir={workspace_dir}")
    
    def initialize_from_context(self, agent_context: AgentContext) -> None:
        """
        从代理上下文初始化历史管理器
        
        Args:
            agent_context: 代理上下文
        """
        if agent_context:
            self._agent_context = agent_context
            
            # 更新内部管理器的配置
            if hasattr(self._manager_instance, "set_agent_name"):
                self._manager_instance.set_agent_name(self._agent_name)
                
            # 更新工作目录
            self.set_workspace_dir(agent_context.get_workspace_dir())
            
            logger.info(f"从上下文更新历史管理器: agent_name={self._agent_name}, workspace_dir={self._workspace_dir}")
        else:
            logger.warning("无法从空的代理上下文初始化历史管理器")
            
    def save(self, chat_history: List[Dict[str, Any]]) -> bool:
        """
        保存聊天历史
        
        Args:
            chat_history: 聊天历史列表
            
        Returns:
            bool: 是否保存成功
        """
        if not self._manager_instance:
            logger.warning("聊天历史管理器未初始化，无法保存聊天历史")
            return False
            
        try:
            # 保存聊天历史
            result = self._manager_instance.save_chat_history(chat_history)
            if result:
                logger.info(f"已成功保存 {len(chat_history)} 条聊天历史")
            else:
                logger.warning("保存聊天历史失败")
            return result
        except Exception as e:
            logger.error(f"保存聊天历史时发生异常: {e!s}")
            return False
            
    def load(self, force_reload: bool = False) -> List[Dict[str, Any]]:
        """
        加载聊天历史
        
        Args:
            force_reload: 是否强制重新从文件加载
            
        Returns:
            List[Dict[str, Any]]: 聊天历史列表
        """
        if not self._manager_instance:
            logger.warning("聊天历史管理器未初始化，返回空的聊天历史")
            return []
            
        try:
            # 加载聊天历史
            history = self._manager_instance.load_chat_history(force_reload)
            logger.info(f"加载了 {len(history)} 条聊天历史记录")
            return history
        except Exception as e:
            logger.error(f"加载聊天历史时发生异常: {e!s}")
            return []
            
    def set_workspace_dir(self, workspace_dir: str) -> None:
        """
        设置工作目录
        
        Args:
            workspace_dir: 工作目录
        """
        if workspace_dir != self._workspace_dir:
            self._workspace_dir = workspace_dir
            
            # 更新内部管理器的工作目录
            if hasattr(self._manager_instance, "set_workspace_dir"):
                self._manager_instance.set_workspace_dir(workspace_dir)
                logger.info(f"已更新历史管理器的工作目录: {workspace_dir}")
                
    def set_agent_name(self, agent_name: str) -> None:
        """
        设置代理名称
        
        Args:
            agent_name: 代理名称
        """
        if agent_name != self._agent_name:
            self._agent_name = agent_name
            
            # 更新内部管理器的代理名称
            if hasattr(self._manager_instance, "set_agent_name"):
                self._manager_instance.set_agent_name(agent_name)
                logger.info(f"已更新历史管理器的代理名称: {agent_name}")
                
    def get_compressed_chat_history(self) -> Optional[List[Dict[str, Any]]]:
        """
        获取压缩后的聊天历史
        
        Returns:
            Optional[List[Dict[str, Any]]]: 压缩后的聊天历史，如果没有则返回None
        """
        if hasattr(self._manager_instance, "get_compressed_chat_history"):
            return self._manager_instance.get_compressed_chat_history()
        return None
        
    def clear_compressed_chat_history(self) -> None:
        """清除压缩后的聊天历史"""
        if hasattr(self._manager_instance, "clear_compressed_chat_history"):
            self._manager_instance.clear_compressed_chat_history()
            
    async def compress_chat_history(self, current_task: str = "") -> bool:
        """
        压缩聊天历史
        
        Args:
            current_task: 当前任务描述
            
        Returns:
            bool: 是否压缩成功
        """
        if hasattr(self._manager_instance, "compress_chat_history"):
            return await self._manager_instance.compress_chat_history(current_task=current_task)
        return False
        
    @property
    def instance(self):
        """获取内部管理器实例"""
        return self._manager_instance
```

**使用示例**：

```python
# 在SuperMagic类中集成新的历史管理接口
def __init__(self, system_prompt: Optional[str] = None, agent_context: Optional[AgentContext] = None):
    # ... 其他初始化代码 ...
    
    # 初始化聊天历史管理器
    self._history_handler = None
    # ... 其他初始化代码 ...

def _initialize_history_manager(self, agent_context: Optional[AgentContext] = None) -> None:
    """
    初始化聊天历史管理器
    
    Args:
        agent_context: 代理上下文
    """
    ctx = agent_context or self._agent_context
    if not ctx:
        logger.warning("代理上下文未设置，使用默认值初始化历史管理器")
        
    # 创建聊天历史管理器
    self._history_handler = ChatHistoryManager(
        agent_name=self._current_agent_name,
        workspace_dir=self._workspace_dir,
        agent_context=ctx
    )
    
    logger.info(f"已初始化聊天历史管理器: agent_name={self._current_agent_name}")
    
    # 更新历史管理器实例的引用
    self.history_manager = self._history_handler.instance
    
# 替换原有的三个方法
def _save_chat_history(self, chat_history: List[Dict[str, Any]]) -> None:
    """保存聊天历史"""
    if self._history_handler:
        self._history_handler.save(chat_history)
    else:
        logger.warning("聊天历史管理器未初始化，无法保存聊天历史")
        
def _load_chat_history(self, force_reload: bool = False) -> List[Dict[str, Any]]:
    """加载聊天历史"""
    if self._history_handler:
        return self._history_handler.load(force_reload)
    else:
        logger.warning("聊天历史管理器未初始化，返回空的聊天历史")
        return []
        
def _initialize_history_manager_from_context(self) -> None:
    """从上下文初始化历史管理器"""
    if not self._agent_context:
        logger.warning("上下文对象为空，无法初始化历史管理器")
        return
        
    # 确保历史管理器已初始化
    if not self._history_handler:
        self._initialize_history_manager(self._agent_context)
    else:
        # 使用现有的历史管理器更新
        self._history_handler.initialize_from_context(self._agent_context)
```

### 2. 提取复杂逻辑到独立类

#### 2.1 工具调用执行逻辑

从`run_async()`方法中提取工具调用循环逻辑到一个单独的方法或类，如`ToolCallExecutionLoop`。

#### 2.2 响应处理逻辑

将以下方法整合到一个`ResponseHandler`类：
- `_handle_non_tool_model_response()`
- `_handle_potential_loop()`
- `_update_history_with_assistant_message()`
- `_process_tool_results()`

### 3. 简化初始化流程

#### 3.1 合并上下文初始化

合并以下方法的逻辑：
- `set_context()`
- `_initialize_agent_environment()`
- 部分`__init__()`方法

创建一个统一的上下文初始化方法。

#### 3.2 简化工作目录设置

合并以下相关方法：
- `set_workspace_dir()`
- `_update_file_tools_base_dir()`
- 部分`_initialize_agent_environment()`中的工作目录设置逻辑

### 4. 优化工具管理

#### 4.1 工具加载与注册

整合以下方法：
- `load_tools_by_config()`
- `register_tool()`
- `register_tools()`
- `_initialize_available_tools()`

创建一个更清晰的工具管理接口。

### 5. 减少冗余日志

整个类中有大量日志记录代码，可以将日志记录逻辑封装成装饰器或辅助方法，减少代码冗余。

## 实施步骤

1. **创建测试案例**：重构前先编写测试确保功能正确性
2. **小步迭代**：按照上述分类逐步实施重构
3. **代码审查**：每步重构后进行代码审查和测试
4. **文档更新**：更新相关文档反映新的代码结构

## 预期收益

1. **代码量减少**：预计可减少20-30%的代码量
2. **可维护性提高**：方法职责更清晰，逻辑更内聚
3. **可扩展性增强**：更容易添加新功能或修改现有功能
4. **可读性改善**：代码结构更清晰，更易理解

## 风险评估

1. **功能回归**：重构可能导致现有功能出现问题
   - 缓解措施：增加测试覆盖率，小步迭代重构
2. **性能影响**：新结构可能影响执行效率
   - 缓解措施：进行性能测试，确保不降低性能
3. **兼容性**：与其他组件的接口可能需要调整
   - 缓解措施：维持公共API不变，仅重构内部实现 