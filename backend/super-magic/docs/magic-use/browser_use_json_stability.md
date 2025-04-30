# 增强Browser-Use对不同LLM模型的JSON输出稳定性方案

## 问题背景

在使用Browser-Use简化演示程序时，我们发现ChatGPT等模型的JSON输出不够稳定，可能导致解析错误，而Claude相对表现较好。原始的browser-use库通过一系列机制解决了这个问题，本文档基于原始browser-use库的实现，提出一种增强JSON输出稳定性的方案。

## 参考实现

**出处**: 本方案参考了原始browser-use库的实现方式，具体位于:
- `browser_use/agent/service.py`（主要处理逻辑）
- `browser_use/utils/json_utils.py`（JSON处理工具）
- `browser_use/agent/message_manager/service.py`（消息管理）

## 解决方案

### 1. 多种工具调用方法支持

为不同的LLM模型提供不同的工具调用方法:

```python
class LLMJsonHandler:
    def __init__(self, model_name):
        self.model_name = model_name.lower()
        self.tool_calling_method = self._get_tool_calling_method()

    def _get_tool_calling_method(self):
        """根据模型确定最佳工具调用方法"""
        if "gpt-4" in self.model_name or "gpt-3.5" in self.model_name:
            # OpenAI模型优先使用function_calling
            return "function_calling"
        elif "claude" in self.model_name:
            # Claude模型更适合json_mode
            return "json_mode"
        else:
            # 其他模型使用raw模式
            return "raw"
```

### 2. 增强的JSON解析

实现健壮的JSON提取函数:

```python
def extract_json_from_model_output(content):
    """从模型输出中提取有效的JSON

    处理各种常见情况:
    1. 直接返回的JSON
    2. 代码块中的JSON (```json ... ```)
    3. 有前缀或后缀的JSON
    4. 多个JSON块，取最可能的一个
    """
    # 尝试直接解析
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        pass

    # 尝试从代码块中提取
    json_block_pattern = r'```(?:json)?\s*([\s\S]*?)\s*```'
    matches = re.findall(json_block_pattern, content)

    for match in matches:
        try:
            return json.loads(match)
        except json.JSONDecodeError:
            continue

    # 尝试搜索大括号包围的内容
    brace_pattern = r'\{[\s\S]*\}'
    match = re.search(brace_pattern, content)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass

    # 更进一步的处理...可以添加更多逻辑

    # 最后返回错误
    raise ValueError(f"无法从内容中提取有效的JSON: {content[:100]}...")
```

### 3. 错误恢复机制

当解析失败时提供恢复措施:

```python
async def get_next_action(self, messages):
    """获取LLM的下一步操作决策，包含错误恢复机制"""
    try:
        # 首次尝试
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            response_format={"type": "json_object"} if self.tool_calling_method == "json_mode" else None
        )

        content = response.choices[0].message.content

        # 尝试解析
        try:
            return self.extract_json_from_model_output(content)
        except ValueError:
            # 首次解析失败，添加纠正提示并重试
            corrective_message = {"role": "user", "content": "你的回复不是有效的JSON格式。请提供有效的JSON，遵循系统提示中指定的格式。"}
            messages.append(corrective_message)

            # 重试
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                response_format={"type": "json_object"} if self.tool_calling_method == "json_mode" else None
            )

            content = response.choices[0].message.content
            return self.extract_json_from_model_output(content)

    except Exception as e:
        # 记录错误
        print(f"获取LLM决策时出错: {str(e)}")
        # 返回一个默认的安全操作
        return {
            "current_state": {
                "evaluation_previous_goal": "Unknown - 无法获取模型回复",
                "memory": "模型调用失败，需要重试",
                "next_goal": "尝试一个安全的操作"
            },
            "action": [{"wait": {"ms": 1000}}]
        }
```

### 4. JSON修复功能

实现一个JSON修复函数，处理常见的格式问题:

```python
def fix_common_json_errors(json_str):
    """修复常见的JSON格式错误"""
    # 移除尾部逗号
    json_str = re.sub(r',\s*}', '}', json_str)
    json_str = re.sub(r',\s*]', ']', json_str)

    # 修复未闭合的引号
    open_quotes = json_str.count('"') % 2
    if open_quotes == 1:
        json_str = json_str + '"'

    # 修复未闭合的大括号
    open_braces = json_str.count('{') - json_str.count('}')
    if open_braces > 0:
        json_str = json_str + ('}' * open_braces)

    # 修复键值对中缺少的引号
    json_str = re.sub(r'([{,]\s*)(\w+)(\s*:)', r'\1"\2"\3', json_str)

    return json_str
```

### 5. 模型特定的提示词优化

为不同的模型定制系统提示:

```python
def get_system_prompt(model_name):
    """根据模型返回优化的系统提示"""
    base_prompt = """你是一个AI代理，设计用于自动化浏览器任务..."""

    if "gpt" in model_name.lower():
        # GPT系列模型的提示词强化
        return base_prompt + """
        注意: 你必须严格以JSON格式响应，不要添加任何其他文本、解释或注释。
        不要使用```json```标记，直接返回JSON对象。
        """

    elif "claude" in model_name.lower():
        # Claude系列模型的提示词强化
        return base_prompt + """
        注意: 你的输出将通过JSON.parse()解析，请确保它是有效的JSON。
        确保你包含所有必须的字段，并遵循上面描述的精确格式。
        """

    else:
        # 通用提示词
        return base_prompt + """
        无论如何，你必须始终返回有效的JSON格式响应，遵循上述格式要求。
        """
```

## 实现建议

1. **分层设计**:
   - 将JSON处理逻辑从主类中分离出来
   - 创建专门的工具类处理不同模型的特性

2. **渐进式失败恢复**:
   - 实现多层次的解析尝试
   - 每次失败后尝试更宽松的解析方式

3. **配置灵活性**:
   - 允许用户自定义处理特定模型的方式
   - 提供开关来启用/禁用特定的修复逻辑

4. **监控与日志**:
   - 记录解析失败的原始响应
   - 统计不同模型的成功率，以便持续优化

## 集成到当前项目

在`browser_use_demo.py`中集成上述方案的最小修改:

```python
# 在SimpleBrowserUse类中添加
def extract_json_from_model_output(self, content):
    """增强的JSON提取"""
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        # 尝试修复常见错误
        fixed_content = self.fix_common_json_errors(content)
        try:
            return json.loads(fixed_content)
        except json.JSONDecodeError:
            # 尝试从代码块中提取
            match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', content)
            if match:
                try:
                    return json.loads(match.group(1))
                except:
                    pass

            # 最后尝试提取大括号内容
            match = re.search(r'(\{[\s\S]*\})', content)
            if match:
                try:
                    return json.loads(match.group(1))
                except:
                    pass

            raise ValueError(f"无法解析JSON: {content[:100]}...")

# 修改get_next_action方法
async def get_next_action(self, messages):
    try:
        print("正在请求LLM决策...")
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            response_format={"type": "json_object"}
        )

        response_text = response.choices[0].message.content
        print(f"LLM响应: {response_text[:200]}...")

        try:
            return self.extract_json_from_model_output(response_text)
        except ValueError as e:
            print(f"JSON解析失败，尝试纠正: {str(e)}")
            # 添加纠正提示
            corrective_messages = messages.copy()
            corrective_messages.append({
                "role": "assistant",
                "content": response_text
            })
            corrective_messages.append({
                "role": "user",
                "content": "你的回复不是有效的JSON格式。请严格按照system prompt中的格式要求，提供有效的JSON。不要添加额外的文本或注释。"
            })

            # 重试
            retry_response = await self.client.chat.completions.create(
                model=self.model,
                messages=corrective_messages,
                response_format={"type": "json_object"}
            )

            retry_text = retry_response.choices[0].message.content
            return self.extract_json_from_model_output(retry_text)

    except Exception as e:
        print(f"获取LLM决策时出错: {str(e)}")
        # 返回一个默认的安全操作
        return {
            "current_state": {
                "evaluation_previous_goal": "Unknown - 发生错误",
                "memory": "模型调用或解析失败",
                "next_goal": "执行安全操作"
            },
            "action": [{"wait": {"ms": 1000}}]
        }
```

## 总结

通过实现上述机制，我们可以显著提高Browser-Use对不同LLM模型JSON输出的处理稳定性，从而支持更广泛的模型选择。这些技术模拟了原始browser-use库的处理方式，但进行了简化和优化，更适合我们的演示程序。
