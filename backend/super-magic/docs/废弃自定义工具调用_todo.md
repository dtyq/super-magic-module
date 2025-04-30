# 废弃自定义工具调用功能 TODO

以下是废弃自定义工具调用功能的详细任务列表和修改步骤。

## 修改文件

### 1. 修改 app/llm/factory.py

- [ ] 删除导入语句：
  ```python
  from app.llm.custom_tool_calling import LLMFactoryWithCustomToolCalling
  ```

- [ ] 修改 `LLMClientConfig` 类，删除 `use_custom_tool_calling` 字段：
  ```python
  # 修改前
  class LLMClientConfig(BaseModel):
      # ...
      supports_tool_use: bool = True
      use_custom_tool_calling: bool = False
      type: str = "llm"

  # 修改后
  class LLMClientConfig(BaseModel):
      # ...
      supports_tool_use: bool = True
      type: str = "llm"
  ```

- [ ] 修改 `get` 方法，删除 `use_custom_tool_calling` 相关代码：
  ```python
  # 修改前
  llm_config = LLMClientConfig(
      model_id=model_id,
      api_key=model_config["api_key"],
      api_base_url=model_config["api_base_url"],
      name=str(model_config["name"]),
      provider=model_config["provider"],
      supports_tool_use=model_config.get("supports_tool_use", False),
      use_custom_tool_calling=model_config.get("use_custom_tool_calling", False),
  )

  # 修改后
  llm_config = LLMClientConfig(
      model_id=model_id,
      api_key=model_config["api_key"],
      api_base_url=model_config["api_base_url"],
      name=str(model_config["name"]),
      provider=model_config["provider"],
      supports_tool_use=model_config.get("supports_tool_use", False),
  )
  ```

- [ ] 修改 `call_with_tool_support` 方法中的文档字符串，删除自定义工具调用相关的描述：
  ```python
  # 修改前
  """使用工具支持调用 LLM。

  根据模型配置自动选择使用原生工具调用还是自定义工具调用。
  对于支持原生工具调用的模型，直接使用 OpenAI API 的工具调用功能。
  对于不支持原生工具调用的模型，使用自定义工具调用格式，由 LLMFactoryWithCustomToolCalling 处理。
  """

  # 修改后
  """使用工具支持调用 LLM。

  根据模型配置使用工具调用。
  对于支持工具调用的模型，直接使用 OpenAI API 的工具调用功能。
  """
  ```

### 2. 修改 config/config.yaml

- [ ] 修改 `deepseek-reasoner` 模型配置，删除 `use_custom_tool_calling` 字段，同时可能需要更新 `supports_tool_use` 值：
  ```yaml
  # 修改前
  deepseek-reasoner:
    api_key: "${DEEPSEEK_API_KEY}"
    api_base_url: "${DEEPSEEK_API_BASE_URL:-https://api.deepseek.com/v1}"
    name: "${DEEPSEEK_REASONER_MODEL:-deepseek-reasoner}"
    type: "llm"
    supports_tool_use: false
    use_custom_tool_calling: true
    provider: "openai"

  # 修改后
  deepseek-reasoner:
    api_key: "${DEEPSEEK_API_KEY}"
    api_base_url: "${DEEPSEEK_API_BASE_URL:-https://api.deepseek.com/v1}"
    name: "${DEEPSEEK_REASONER_MODEL:-deepseek-reasoner}"
    type: "llm"
    supports_tool_use: true  # 如果现在支持原生工具调用，设为 true
    provider: "openai"
  ```

## 删除文件

- [ ] 删除整个 `app/llm/custom_tool_calling` 目录及其所有文件：
  ```bash
  trash app/llm/custom_tool_calling
  ```

## 相关文档（可选）

如果需要删除相关文档：

- [ ] 删除 `docs/tool_calling/implementation_steps.md`
- [ ] 删除 `docs/tool_calling/custom_tool_calling_implementation.md`
- [ ] 删除 `docs/tool_calling/implementation_todo.md`
- [ ] 删除 `docs/custom_tool_calling_todo.md`

或者可以保留这些文档作为历史记录。

## 测试验证

- [ ] 确认 `deepseek-reasoner` 模型在修改后仍能正常使用工具调用
- [ ] 确认所有依赖原来自定义工具调用功能的代码都能正常工作
- [ ] 对修改后的系统进行全面测试，确保没有引入新的问题
