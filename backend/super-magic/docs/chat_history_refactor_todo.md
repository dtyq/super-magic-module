# Chat History Refactor 重构计划

## 背景

ChatHistory类的代码变得越来越庞大和复杂，包含了很多不同的功能，现在需要进行重构以提高代码的可维护性和可读性。

## 已完成工作

1. ✅ 创建了一个新的文件用于放置Chat History相关的模型定义（已完成）
   - 新文件路径：`app/core/chat_history_model.py`
   - 将`ChatMessage`和相关的数据模型移动到这个新文件中

2. ✅ 对现有的Chat History文件进行修改（已完成）
   - 将压缩逻辑移至单独的`ChatHistoryCompressor`类
   - 更新了`ChatHistory`类以使用新的压缩类
   - 修改了与压缩相关的方法，以支持同步和异步操作

3. ✅ 运行测试以确保所有功能正常工作（已完成）
   - 所有测试都通过了，确保重构没有破坏现有功能

4. ✅ 修改`Agent`类实现，直接使用`ChatHistory`的压缩功能（已完成）
   - 删除了对工具调用的依赖
   - 更新了Agent初始化，传入合适的压缩配置
   - 保留了原有的消息和token阈值检查逻辑

5. ✅ 清理`ChatHistory`类中废弃的压缩相关方法（已完成）
   - 删除了以下废弃方法：
     - `compress_history`
     - `_build_compression_system_prompt`
     - `_build_compression_user_prompt`
     - `_call_llm_for_compression`
     - `_compress_messages`
     - `_estimate_tokens_with_tiktoken`
     - `_count_message_tokens`

6. ✅ 优化`ChatHistory`类中的获取消息方法（已完成）
   - 添加了新的`get_last_messages(n)`方法，允许灵活获取最近n条消息
   - 保留了原有的`get_last_message()`和`get_second_last_message()`方法以保持兼容性
   - 创建了详细的文档和使用示例：`docs/chat_history_get_last_messages.md`

7. ✅ 移除同步压缩方法，全部使用异步API（已完成）
   - 删除了同步压缩方法`compress_history_sync`的实现，保留空壳以提供警告信息
   - 修改了`add_message`方法，移除了自动尝试异步压缩的逻辑
   - 添加了异步兼容性方法`async_compress_history`作为`compress_history_manually`的别名
   - 确保所有压缩功能都通过异步API提供

## 未来工作

1. 📝 对`ChatHistory`类中的其他方法进行审查和可能的重构
   - 审查消息添加和修改相关的方法
   - 审查token计算相关的方法
   - 考虑将更多功能分离到专门的类中

2. 📝 优化`ChatHistoryCompressor`类
   - 审查和优化压缩算法
   - 考虑添加更多的压缩策略选项
   - 改进对不同类型消息的处理

3. 📝 完善测试覆盖率
   - 为新添加的方法编写单元测试
   - 为各种边缘情况添加测试

4. 📝 文档更新
   - 更新API文档以反映变更
   - 为开发人员提供更详细的使用指南
   - 添加使用异步压缩API的最佳实践指南

## 重构收益

1. 改进的代码结构：将相关功能分组到专门的类中
2. 提高了代码可维护性：每个类都有清晰的职责
3. 更好的抽象：通过分离模型和业务逻辑提高了代码的抽象性
4. 提高了性能：直接使用类方法而不是工具调用可以减少开销
5. 更灵活的API：新添加的方法提供了更强大和灵活的功能
6. 统一了压缩API：所有压缩功能都使用异步方法，避免混合同步和异步逻辑 