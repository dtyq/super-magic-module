# SuperMagic

SuperMagic 是一个强大的通用人工智能系统(AGI)，基于大型语言模型(LLM)构建，支持丰富的工具调用和复杂任务处理能力。

## 项目概述

SuperMagic 旨在提供一个灵活、可扩展的智能代理框架，能够理解和执行用户的各种复杂查询与任务。系统整合多种大语言模型，通过工具调用扩展LLM能力，实现从数据分析、代码编写到网页浏览等多种复杂任务的处理。

## 核心功能

- **多模型支持**：集成多种大型语言模型，包括OpenAI的GPT系列、Anthropic的Claude系列、DeepSeek等
- **丰富工具生态**：预置30+种工具，包括文件操作、代码执行、网络搜索、浏览器操作等
- **状态管理**：完善的代理状态管理，支持IDLE、RUNNING、FINISHED、ERROR等状态
- **聊天历史压缩**：智能聊天历史管理，支持历史记录的自动压缩和持久化
- **并行工具调用**：支持并行执行多个工具调用，提高处理效率
- **资源管理**：自动跟踪和清理资源，避免资源泄漏
- **错误处理**：分层的错误处理机制，提高系统稳定性
- **事件系统**：完整的事件分发机制，支持插件式扩展
- **Token使用追踪**：精确追踪和管理Token使用量和成本
- **模块化提示词**：系统级提示词模板化，提高代理行为控制能力

## 系统架构

### 整体架构

SuperMagic采用模块化、事件驱动的架构设计，主要由以下核心组件构成：

1. **Agent核心**：处理用户查询，调度LLM和工具，管理状态和资源
2. **LLM服务层**：提供与各大模型的统一接口
3. **工具系统**：定义工具接口，实现具体工具功能
4. **上下文管理**：维护代理运行时上下文
5. **事件系统**：处理系统内各组件间通信
6. **存储系统**：管理聊天历史和其他持久化数据

### 核心组件详解

#### Agent核心

Agent是系统的核心组件，负责协调其他组件完成用户任务：

- **Agent类**：基础代理类，提供核心功能和接口
- **SuperMagic类**：继承自Agent，实现完整的代理功能
- **AgentState**：管理代理的状态转换
- **AgentLoader**：加载代理配置和提示词模板

#### LLM服务层

负责与各种大型语言模型的交互：

- **LLMFactory**：工厂模式实现，根据配置创建不同的LLM客户端
- **TokenUsageTracker**：追踪token使用量
- **CostLimitService**：管理API调用成本限制

#### 工具系统

提供扩展LLM能力的各种工具：

- **BaseTool**：所有工具的基类，定义通用接口
- **ToolExecutor**：执行工具调用的核心组件
- **ToolFactory**：负责创建和管理工具实例

工具分类：
- **文件操作工具**：read_file, write_to_file, list_dir等
- **代码执行工具**：python_execute, shell_exec等
- **网络工具**：bing_search, download_from_url等
- **浏览器工具**：use_browser, visual_understanding等
- **数据处理工具**：yfinance_tool, purify等
- **用户交互工具**：ask_user, thinking等
- **特色工具**：zhihu工具集、reasoning等

#### 上下文管理

维护代理运行时的上下文信息：

- **AgentContext**：存储代理运行环境、配置等信息
- **ToolContext**：提供给工具执行时的上下文

#### 事件系统

基于发布-订阅模式的事件系统：

- **EventDispatcher**：事件分发器
- **EventType**：定义系统支持的事件类型
- **EventHandler**：事件处理器接口

#### 存储系统

负责数据持久化：

- **ChatHistory**：管理聊天历史记录
- **FileBase**：文件存储和检索系统
- **VectorStore**：向量存储，支持语义搜索

### 执行流程

1. **初始化**：创建Agent实例，加载配置和工具
2. **接收查询**：接收用户输入，初始化环境
3. **循环执行**：
   - 向LLM发送请求（包含历史消息和工具描述）
   - 解析LLM返回的工具调用
   - 执行工具调用
   - 处理工具执行结果
   - 检查是否任务完成
4. **结果返回**：返回最终结果，清理资源

## 技术选型

- **编程语言**：Python 3.8+
- **LLM接口**：OpenAI API、Anthropic API等
- **异步处理**：asyncio
- **网络请求**：aiohttp
- **数据模型**：Pydantic
- **向量存储**：FAISS
- **浏览器操作**：Playwright
- **命令行接口**：Typer

## 部署方式

系统支持多种部署方式：

1. **开发环境**：直接从源代码运行
2. **Docker部署**：使用提供的Dockerfile构建容器
3. **可执行文件**：使用PyInstaller打包为独立可执行文件

## 配置指南

### 环境变量

必需的环境变量：
- `OPENAI_API_KEY`：OpenAI API密钥
- `ANTHROPIC_API_KEY`：Anthropic API密钥（使用Claude模型时需要）
- `TIKHUB_API_KEY`：TikHub API密钥（使用知乎工具时需要）

可选环境变量：
- `LOG_LEVEL`：日志级别，默认为INFO
- `LLM_COST_LIMIT_CURRENCY`：成本限制货币单位，默认为CNY
- `LLM_SINGLE_TASK_COST_LIMIT`：单任务成本限制，默认为300.0

### 配置文件

主要配置文件位于`config`目录：
- `models.yaml`：配置支持的LLM模型
- `tools.yaml`：配置默认加载的工具
- `config.yaml`：系统通用配置

## 使用示例

### 基本使用

```python
from app.magic.agent import Agent
from app.core.context.agent_context import AgentContext

# 创建上下文
context = AgentContext()
context.workspace_dir = "/path/to/workspace"

# 创建代理实例
agent = Agent("magic", agent_context=context)

# 运行代理处理查询
result = await agent.run("帮我分析一下股票XYZ的历史数据并生成报告")
print(result)
```

### 自定义工具

```python
from app.tools.core.base_tool import BaseTool
from app.tools.core.base_tool_params import BaseToolParams
from pydantic import Field

# 定义工具参数
class MyToolParams(BaseToolParams):
    message: str = Field(description="要处理的消息")

# 定义工具类
class MyCustomTool(BaseTool[MyToolParams]):
    name = "my_custom_tool"
    description = "这是一个自定义工具示例"
    params_class = MyToolParams

    async def execute(self, tool_context, params):
        # 实现工具逻辑
        processed = f"处理结果: {params.message.upper()}"
        return ToolResult(content=processed)

# 注册工具
agent.register_tool(MyCustomTool())
```

### 自定义代理

自定义代理通过创建`.agent`文件实现，包含模型配置、工具列表和系统提示词：

```
# data-analyst.agent
[MODEL]
gpt-4

[TOOLS]
python_execute
bing_search
read_file
write_to_file
yfinance_tool

[ATTRIBUTES]
data_analysis

[PROMPT]
你是一位专业的数据分析师，擅长使用Python进行数据处理和可视化...
```

## 扩展开发

### 添加新工具

1. 创建工具参数类，继承自`BaseToolParams`
2. 创建工具类，继承自`BaseTool`
3. 实现`execute`方法
4. 在`app/tools/__init__.py`中注册工具

### 添加新模型

1. 在`config/models.yaml`中添加模型配置
2. 如果需要特殊处理，在`app/llm/factory.py`中添加支持

### 添加新代理类型

1. 在`agents/`目录下创建新的`.agent`文件
2. 定义所需模型、工具列表和系统提示词

## 开发路线图

详细的开发计划和进度跟踪可在`docs/`目录下的各个文档中找到。主要包括：

- **浏览器功能增强**：改进网页浏览和视觉理解能力
- **聊天历史优化**：提升历史压缩效率和质量
- **工具架构重构**：简化工具开发流程
- **代理能力增强**：提升复杂任务的处理能力
- **性能优化**：降低资源消耗，提高响应速度
- **多模态支持**：增加图像生成和处理能力

## 开发团队

SuperMagic 由一个专注于人工智能应用的团队开发维护，团队成员包括AI研究人员、软件工程师和产品设计师，致力于构建先进、实用的AI助手系统。
