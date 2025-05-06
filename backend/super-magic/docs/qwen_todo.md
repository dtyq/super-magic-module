# 通义千问集成计划

## 任务列表

- [x] 在.env文件中添加通义千问配置
- [x] 在config/config.yaml中添加通义千问模型配置
- [x] 在bin/config/config.yaml中添加通义千问配置
- [x] 检查现有的LLMFactory是否支持通义千问API的调用
  - [x] 修正API基础URL，将`https://dashscope.aliyuncs.com/api/v1`更改为`https://dashscope.aliyuncs.com/compatible-mode/v1`
  - 通义千问API使用OpenAI兼容接口，已将provider设置为"openai"
  - 修复404错误问题，确保API请求正确发送到`/compatible-mode/v1/chat/completions`端点

## 使用方法

在代码中可以通过以下方式使用通义千问模型：

```python
from app.llm.factory import LLMFactory

# 获取通义千问模型客户端
qwen_client = LLMFactory.get("qwen-max")

# 调用通义千问模型
response = await qwen_client.chat.completions.create(
    model="qwen-max",
    messages=[
        {"role": "system", "content": "你是一个有用的AI助手。"},
        {"role": "user", "content": "请介绍一下自己。"}
    ]
)
```

## 注意事项

- 通义千问API使用OpenAI兼容接口，provider设置为"openai"
- 默认模型名称为"qwen-max"
- API基础URL为`https://dashscope.aliyuncs.com/compatible-mode/v1`
  - 原来的`https://dashscope.aliyuncs.com/api/v1`是错误的地址
  - 应该使用OpenAI兼容模式的接口`https://dashscope.aliyuncs.com/compatible-mode/v1`
- 已配置支持工具调用(supports_tool_use=true)
