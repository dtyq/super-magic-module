# ChatHistory 异步压缩API使用指南

## 背景与变更

为了提高代码质量和一致性，我们对`ChatHistory`类中的压缩相关功能进行了重构，移除了同步压缩方法，统一使用异步API进行历史记录压缩。这些变更包括：

1. 移除了`compress_history_sync`方法的实现，保留方法签名但返回警告
2. 移除了`add_message`方法中自动执行压缩的逻辑
3. 添加了`compress_history_async`作为`compress_history_manually`的别名
4. 废弃了同步版本的`compress_history`方法

## 如何使用异步压缩API

### 基础压缩操作

```python
# 异步环境中手动触发压缩
async def compress_chat_history():
    chat_history = ChatHistory(...)
    
    # 添加消息
    chat_history.append_user_message("用户输入")
    
    # 手动检查并在需要时压缩
    was_compressed = await chat_history.check_and_compress_if_needed()
    if was_compressed:
        print("历史记录已被压缩")
```

### 强制压缩（忽略阈值）

```python
# 强制执行压缩
async def force_compress_history():
    chat_history = ChatHistory(...)
    
    # 无论是否达到阈值，都强制执行压缩
    was_compressed = await chat_history.compress_history_manually()
    print(f"压缩结果: {'成功' if was_compressed else '无需压缩或压缩失败'}")
```

### 在异步Web框架中使用

```python
# 在FastAPI中使用异步压缩
from fastapi import FastAPI, HTTPException

app = FastAPI()

@app.post("/chat")
async def handle_chat(message: str):
    chat_history = get_user_chat_history()
    
    # 添加消息
    chat_history.add_message(UserMessage(content=message))
    
    # 处理回复
    # ...
    
    # 在响应前检查并可能执行压缩
    await chat_history.check_and_compress_if_needed()
    
    return {"status": "success"}
```

## 添加消息后手动压缩

由于我们移除了`add_message`中自动尝试压缩的逻辑，现在您需要在适当的时机手动调用压缩方法：

```python
# 添加多条消息并在最后压缩
async def process_conversation(messages):
    chat_history = ChatHistory(...)
    
    # 添加多条消息
    for msg in messages:
        chat_history.add_message(msg)
    
    # 批量添加完成后再执行压缩检查
    await chat_history.check_and_compress_if_needed()
```

## 异步API参考

| 方法 | 描述 | 返回值 |
|------|------|--------|
| `async check_and_compress_if_needed()` | 检查是否需要压缩并执行压缩 | `bool`: 是否执行了压缩 |
| `async compress_history_manually()` | 强制执行压缩，忽略阈值条件 | `bool`: 是否执行了压缩 |
| `async compress_history_async()` | 别名，等同于`compress_history_manually` | `bool`: 是否执行了压缩 |

## 已废弃的方法

| 方法 | 替代方法 | 说明 |
|------|----------|------|
| `compress_history()` | `async compress_history_manually()` | 同步方法已废弃 |
| `compress_history_sync()` | `async compress_history_manually()` | 同步方法已废弃 |

## 最佳实践

1. **在合适的异步上下文中执行压缩**：总是在异步上下文中调用压缩方法。

2. **批量处理**：当需要添加多条消息时，先添加所有消息，然后在最后进行一次压缩检查，而不是每条消息都检查。

3. **使用专门的压缩任务**：在大型应用中，考虑使用异步任务队列处理压缩操作，以避免阻塞主要请求处理流程。

4. **错误处理**：压缩操作可能失败，确保适当处理异常情况：
   ```python
   try:
       was_compressed = await chat_history.compress_history_manually()
   except Exception as e:
       logger.error(f"压缩失败: {e}")
   ```

5. **测试与监控**：监控压缩操作的频率和性能，确保它不会成为性能瓶颈。

## 示例：从同步代码调用异步压缩

如果您处于同步环境中，但需要执行异步压缩，可以使用以下方法：

```python
import asyncio

def sync_add_and_compress(chat_history, message):
    # 添加消息
    chat_history.add_message(message)
    
    # 创建异步任务并安排执行
    async def compress_task():
        await chat_history.check_and_compress_if_needed()
    
    # 获取或创建事件循环
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    # 如果循环正在运行，创建任务
    if loop.is_running():
        asyncio.create_task(compress_task())
    else:
        # 否则直接运行
        loop.run_until_complete(compress_task())
```

请注意，通常更推荐将整个操作迁移到异步环境，而不是混合使用同步和异步操作。

# 聊天历史压缩配置简化

## 简化背景

在原设计中，聊天历史压缩功能包含了多种针对不同消息类型的压缩率配置：
- `user_message_compression_ratio`
- `assistant_message_compression_ratio`
- `tool_message_compression_ratio`

经过代码审查发现，实际实现中只使用了总体目标压缩率 `target_compression_ratio`，其他压缩率配置并未实际使用。

## 简化调整

1. 移除未使用的差异化压缩率配置：
   - 移除 `user_message_compression_ratio`
   - 移除 `assistant_message_compression_ratio` 
   - 移除 `tool_message_compression_ratio`

2. 只保留总体目标压缩率 `target_compression_ratio`

## 简化优势

1. 代码更加简洁易懂
2. 减少配置复杂度
3. 减少维护成本
4. 避免引起开发者对差异化压缩的误解

## 未来扩展

如果未来确实需要实现差异化压缩策略，可以在代码中重新添加相关参数并完成实际实现。 