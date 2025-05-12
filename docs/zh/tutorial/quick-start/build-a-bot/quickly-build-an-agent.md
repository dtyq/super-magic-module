# 快速构建你的第一个 AI 助手

无论你是否具备编程经验，都可以在 Magic 平台上快速构建一个 AI 助手。本文以"智能营养师"助手为例，展示如何从零开始构建一个简单的 AI 助手。

## AI 助手演示

![演示](https://cdn.letsmagic.cn/static/img/20250512165243.jpg)

## 构建步骤
按照以下步骤快速构建一个 AI 助手。

### 创建 AI 助手
1. 登录 [Magic](https://www.letsmagic.cn/) 并点击左侧菜单中的"AI 助手"
2. 点击页面右上角的"创建 AI 助手"
![创建助手](https://cdn.letsmagic.cn/static/img/20250512164212.jpg)

3. 输入 AI 助手信息并点击创建
- 头像上传：选择合适的图片作为助手头像（推荐尺寸：1024 × 1024 像素）。如不上传，将使用默认头像。
- 名称：Magic 营养助手
- 简介：一个个人饮食顾问，能够根据用户的饮食习惯和需求，科学规划每一餐，精确管理每一种营养素的摄入，帮助用户建立健康的生活方式。

![助手信息](https://cdn.letsmagic.cn/static/img/assistant-info.png)

AI 助手已经创建成功，但它还不具备任何能力。让我们开始赋予它能力。

### 配置欢迎消息
我们希望用户在添加"Magic 营养助手"时收到"欢迎消息"，并了解如何使用它。
方法如下：
1. 从工具栏拖出"开始节点"或点击 ➕ 按钮
![开始节点](https://cdn.letsmagic.cn/static/img/start-node.png)
2. 点击"添加为好友时"的小圆圈，选择消息回复节点
![欢迎消息](https://cdn.letsmagic.cn/static/img/welcome-message.png)
3. 在消息回复节点中编写问候语
问候语：我是你的个人饮食顾问，科学规划每一餐，精确管理每一种营养素的摄入，一起建立健康的生活方式，让饮食成为滋养生命的艺术。你可以对我说："我体重 60kg，身高 160cm，想减重 10kg，请帮我规划一天的三餐均衡饮食。"
![欢迎内容](https://cdn.letsmagic.cn/static/img/welcome-content.png)

### 创建大模型节点并编写提示词
1. 为"接收消息时"添加大模型调用节点
![大模型节点](https://cdn.letsmagic.cn/static/img/llm-node.png)
2. 编写提示词，为大模型设置角色和技能
![提示词编辑](https://cdn.letsmagic.cn/static/img/prompt-edit.png)

暂时保持其他设置不变。提示词如下：
```
你是一位个人饮食顾问，能够根据用户的饮食习惯和需求，科学规划每一餐，精确管理每一种营养素的摄入，帮助用户建立健康的生活方式。
你的职责包括：
根据用户的身体状况、健康目标（如减重、增肌、保健）、生活习惯、口味偏好等因素，提供科学合理的饮食建议和营养方案，实现个性化营养方案定制。对各种食材和菜品进行精确的营养分析，帮助用户了解所摄入食物的能量值和微量元素含量，进行食物营养分析。协助用户记录每日饮食，并对其饮食结构和营养素摄入进行实时评估和反馈，确保符合个人健康需求，进行饮食记录和评估。针对用户的营养问题和特殊饮食需求（如糖尿病饮食、孕期饮食、素食营养补充）提供专业咨询服务，解答健康咨询。定期推送多样化的健康食谱，并提供详细的烹饪方法和步骤指导，进行食谱推荐和制作指导。长期跟踪用户的健康数据变化，定期生成报告帮助用户了解自身营养状况改善情况并调整饮食策略，进行健康趋势跟踪。通过互动方式传播营养知识，提高用户的健康素养，培养良好的饮食习惯，进行互动学习与教育。
在创作过程中，你必须严格遵守版权法和道德准则。你应该确保所有作品都是原创的，不侵犯任何人的知识产权或隐私权。避免使用或模仿任何已知艺术家的风格或作品，确保你的创作是独立的，避免涉及任何可能引起争议的内容。
```
1. 为大模型创建回复节点
![大模型回复](https://cdn.letsmagic.cn/static/img/llm-reply.png)
2. 在消息内容编辑器中引用大模型的响应
- 输入"@"符号，选项出现后，滚动到底部并选择大模型回复节点
![模型引用](https://cdn.letsmagic.cn/static/img/model-reference.png)

最终效果如下：
![最终流程](https://cdn.letsmagic.cn/static/img/final-flow.png)

### 调试助手
1. 点击右上角的"测试运行"
![调试运行](https://cdn.letsmagic.cn/static/img/debug-run.png)
2. 输入调试参数："我维生素 C 摄入不足，请推荐一个健康食谱"并点击确认
![调试参数](https://cdn.letsmagic.cn/static/img/debug-params.png)
3. 观察效果 - 可以看到输出节点显示大模型提供的食谱建议

![调试输出](https://cdn.letsmagic.cn/static/img/debug-output.png)

> 如果不满意，可以反复修改提示词并测试运行进行调试。

### 发布
1. 点击右上角的发布按钮
![调试运行](https://cdn.letsmagic.cn/static/img/debug-run.png)
2. 选择"个人使用"
![发布按钮](https://cdn.letsmagic.cn/static/img/publish-button.png)
3. 点击"与 AI 助手对话"
![与 AI 对话](https://cdn.letsmagic.cn/static/img/chat-with-ai.png)
4. 打开新的聊天窗口，你可以在输入框中开始与模型对话
![聊天窗口](https://cdn.letsmagic.cn/static/img/chat-window.png)
> 如果你想再次编辑 AI 助手，可以在页面：点击"AI 助手" -> 右上角"管理 AI 助手" -> 找到你刚刚创建的机器人

恭喜！你现在已经完成了创建你的第一个 AI 助手。