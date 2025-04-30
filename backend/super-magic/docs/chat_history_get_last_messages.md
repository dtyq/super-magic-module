# ChatHistory 获取最近消息的统一方法

## 背景

在之前的实现中，`ChatHistory` 类有两个分开的方法来获取最近的消息：
- `get_last_message()`: 获取最后一条消息
- `get_second_last_message()`: 获取倒数第二条消息

这种设计存在以下问题：
1. API不够统一，获取不同位置的消息需要不同的方法
2. 不够灵活，如果需要获取最后n条消息，需要多次调用或添加新方法
3. 代码存在冗余，两个方法有类似的逻辑

## 实现方案

我们引入了一个新的统一方法 `get_last_messages(n: int = 1)`，可以通过参数控制获取最后n条消息：

```python
def get_last_messages(self, n: int = 1) -> Union[Optional[ChatMessage], List[ChatMessage]]:
    """
    获取最后的n条消息。

    Args:
        n (int): 要获取的消息数量，默认为1。

    Returns:
        Union[Optional[ChatMessage], List[ChatMessage]]: 
        - 当n=1时：返回最后一条消息，如果历史为空则返回None
        - 当n>1时：返回最后n条消息的列表，如果历史记录少于n条则返回所有可用消息
    """
    if not self.messages:
        return None if n == 1 else []
        
    if n == 1:
        # 返回单个消息对象，保持与旧get_last_message()相同的返回类型
        return self.messages[-1]
    else:
        # 返回最后n条消息的列表
        return self.messages[-min(n, len(self.messages)):]
```

同时，保留了原有的方法作为包装，以保持向后兼容性：

```python
def get_last_message(self) -> Optional[ChatMessage]:
    """
    获取最后一条消息。
    
    注意: 此方法保留用于向后兼容性，建议使用get_last_messages()。
    """
    return self.get_last_messages(1)

def get_second_last_message(self) -> Optional[ChatMessage]:
    """
    获取倒数第二条消息。
    
    注意: 此方法保留用于向后兼容性，建议使用get_last_messages(2)[0]。
    """
    if len(self.messages) >= 2:
        return self.messages[-2]
    return None
```

## 使用示例

### 基本用法

```python
# 获取最后一条消息
last_message = chat_history.get_last_messages()  # 默认n=1
# 或者明确指定
last_message = chat_history.get_last_messages(1)

# 获取倒数第二条消息
second_last_message = chat_history.get_last_messages(2)[0]  # 需要安全检查

# 获取最后三条消息
recent_messages = chat_history.get_last_messages(3)
# recent_messages是一个列表，按时间顺序排列（从旧到新）
```

### 高级用法

```python
# 安全地获取倒数第二条消息
messages = chat_history.get_last_messages(2)
second_last_message = messages[0] if len(messages) > 1 else None

# 分析消息对话上下文
recent_context = chat_history.get_last_messages(5)
user_messages = [msg for msg in recent_context if msg.role == "user"]
assistant_messages = [msg for msg in recent_context if msg.role == "assistant"]

# 检查最近是否有工具调用
has_recent_tool_calls = any(
    msg.role == "assistant" and hasattr(msg, "tool_calls") and msg.tool_calls
    for msg in chat_history.get_last_messages(3)
)

# 获取最近的用户提问
recent_user_messages = []
for msg in chat_history.get_last_messages(10):
    if msg.role == "user":
        recent_user_messages.append(msg)
    if len(recent_user_messages) >= 3:  # 只获取最近3条用户消息
        break
```

## 类型处理

`get_last_messages`方法的返回类型是动态的，基于参数 `n` 的值：
- 当 `n=1` 时，返回单个 `ChatMessage` 对象或 `None`
- 当 `n>1` 时，返回 `List[ChatMessage]`（可能为空列表）

## 最佳实践

1. **使用新方法替代旧方法**：
   ```python
   # 旧方式
   last_msg = chat_history.get_last_message()
   second_last_msg = chat_history.get_second_last_message()
   
   # 新方式
   last_msg = chat_history.get_last_messages(1)
   second_last_msg = chat_history.get_last_messages(2)[0] if len(chat_history.get_last_messages(2)) > 1 else None
   ```

2. **优化获取多条消息的场景**：
   ```python
   # 低效方式
   msg1 = chat_history.get_last_message()
   msg2 = chat_history.get_second_last_message()
   
   # 高效方式
   recent_msgs = chat_history.get_last_messages(2)
   msg1 = recent_msgs[-1] if recent_msgs else None
   msg2 = recent_msgs[0] if len(recent_msgs) > 1 else None
   ```

3. **处理边界情况**：
   ```python
   messages = chat_history.get_last_messages(5)
   
   # 始终检查列表长度
   if len(messages) >= 2:
       # 安全地访问元素
       first_msg = messages[0]
       last_msg = messages[-1]
   ```

4. **结合其他过滤方法**：
   ```python
   # 获取最近对话并筛选特定类型
   recent_tool_results = [
       msg for msg in chat_history.get_last_messages(10)
       if msg.role == "tool" and hasattr(msg, "system") and msg.system == "RESULT"
   ]
   ```

## 注意事项

1. 当只需要获取单个消息时，为了保持代码简洁，仍可以使用旧的 `get_last_message()` 和 `get_second_last_message()` 方法。
2. 当从 `get_last_messages(n)` (n>1) 获取结果时，始终检查返回列表的长度，以避免索引越界错误。
3. 返回的消息列表按时间顺序排列（从旧到新），这意味着最后一条消息是 `messages[-1]`，而不是 `messages[0]`。 