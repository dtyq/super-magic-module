# 聊天历史压缩功能开发计划

## 阶段一：基础压缩功能（已完成）

- [x] 定义`CompressionConfig`配置类
- [x] 定义`CompressionInfo`元数据类
- [x] 扩展`ChatHistory`类，添加压缩功能支持字段
- [x] 实现`_estimate_tokens_with_tiktoken`方法用于token计算
- [x] 实现`_count_message_tokens`方法用于token总量计算
- [x] 实现`_build_compression_system_prompt`和`_build_compression_user_prompt`方法
- [x] 实现异步版`_call_llm_for_compression`方法，调用LLM进行压缩
- [x] 实现`_compress_messages_async`方法，将多条消息压缩为一条
- [x] 实现`_compress_history_async`方法，用于历史整体压缩
- [x] 实现`check_and_compress_if_needed`方法，用于检查并触发压缩
- [x] 扩展`add_message`方法，在添加消息后检查是否需要压缩
- [x] 添加`add_message_async`异步方法
- [x] 为现有的`append_*_message`方法添加异步版本
- [x] 添加`compress_history_manually`和`compress_history_sync`手动压缩方法
- [x] 添加`upgrade_compression_config`静态方法用于升级旧的ChatHistory对象
- [x] 更新`compress_chat_history.py`工具，使用新的压缩功能
- [x] 添加`test_compression.py`测试模块

## 阶段二：高级压缩策略（计划中）

- [ ] 实现不同消息类型的差异化压缩率
  - [ ] 用户消息压缩率调整
  - [ ] 助手消息压缩率调整
  - [ ] 工具消息压缩率调整
- [ ] 添加基于语义相似度的消息分组压缩
- [ ] 实现多轮对话压缩为单一摘要的优化策略
- [ ] 添加压缩质量评估机制

## 阶段三：API与UI集成（计划中）

- [ ] 对外暴露压缩状态和控制API
- [ ] 添加WebSocket事件通知压缩状态变化
- [ ] 为压缩前后的消息添加UI标记
- [ ] 实现压缩消息的展开查看功能
- [ ] 添加手动触发压缩的UI界面

## 阶段四：优化与扩展（计划中）

- [ ] 添加细粒度的token预算控制
- [ ] 实现增量压缩算法
- [ ] 优化LLM提示和压缩效果
- [ ] 添加多模型切换支持
- [ ] 实现压缩历史恢复功能

## 测试计划

- [x] 单元测试：token计算
- [x] 集成测试：压缩触发条件
- [ ] 性能测试：压缩效率和token节省率
- [ ] 用户体验测试：压缩质量评估

## 注意事项

- LLM调用需要处理失败重试
- 压缩阈值需基于真实场景进行调整
- 需保持与原有聊天历史API的兼容性 