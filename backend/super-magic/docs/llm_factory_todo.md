# LLMFactory 修复工作计划
问题：在 app/magic/agent.py 中调用了 LLMFactory.call_with_tool_support 方法，但是该方法不存在
任务：在 app/magic/llm/factory.py 中添加 call_with_tool_support 方法
[√] 已实现 call_with_tool_support 方法，支持以下功能：
  - 支持模型配置和参数管理
  - 支持工具传递和配置
  - 支持自定义停止序列
  - 修正了错误的导入路径问题
[√] 测试成功，LLMFactory.call_with_tool_support 方法工作正常
