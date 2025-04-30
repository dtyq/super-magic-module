# 基于LLM的聊天记录压缩方案

## 1. 背景与目标

### 1.1 背景

在与大型语言模型（LLM）进行长时间对话的过程中，聊天历史记录会累积大量内容，导致以下问题：

1. **Token消耗增加**：每次发送上下文给LLM时，过长的历史记录会消耗大量token，增加API调用成本
2. **上下文窗口限制**：当对话累积超过LLM的上下文窗口大小时，早期对话信息会被丢失
3. **响应延迟**：处理大量历史记录增加了LLM的处理时间，影响用户体验
4. **存储成本**：保存完整的对话历史需要更多存储空间

### 1.2 目标

设计并实现一种基于LLM的聊天记录压缩机制，通过语义理解和信息提炼，实现以下目标：

1. **降低Token消耗**：减少发送给LLM的上下文token数，降低API调用成本
2. **保留关键信息**：在压缩过程中保留对话中的关键信息和上下文理解
3. **延长有效对话**：通过压缩历史记录，在固定上下文窗口内实现更长时间的有效对话
4. **提高响应速度**：减少需要处理的信息量，提高LLM的响应速度
5. **减小存储需求**：降低保存对话历史的存储空间需求

## 2. 语义压缩核心原理

### 2.1 语义摘要压缩

**核心思路**：利用LLM的语义理解能力，将对话内容压缩为更简洁但保留关键信息的摘要。

**实现方式**：
- 向LLM提供明确的压缩指令，要求保留关键信息同时减少token数量
- 关注信息密度提高而非简单截断
- 使用特殊标记区分原始内容和压缩内容

**压缩原则**：
- 保留决策点、关键问题和回答
- 保留核心概念和专业术语
- 移除冗余说明、过度解释和非关键细节
- 合并相似内容，提取共性
- 简化表达方式，使用更精炼的语言

### 2.2 对话结构维护

**对话单元保留**：
- 维持用户-助手的对话回合结构
- 保留对话中的因果关系和逻辑流程
- 确保压缩后的内容能反映原始对话的进展

**结构化信息处理**：
- 用户问题可能保留更完整内容，确保意图清晰
- 助手回答压缩为核心要点和结论
- 工具调用保留操作类型和结果摘要，简化过程细节

## 3. 分层压缩策略

### 3.1 基于消息类型的差异化压缩

| 消息类型 | 压缩策略 | 压缩率目标 | 理由 |
|---------|---------|-----------|------|
| 系统消息 | 不压缩，完整保留 | 0% | 系统消息包含关键指令和约束，对模型行为至关重要，必须完整保留 |
| 用户消息 | 保留核心问题和关键约束 | 30-50% | 用户意图是上下文的核心，需要较完整保留 |
| 助手消息 | 大幅压缩为核心观点和关键结论 | 60-70% | 助手回答通常包含大量解释和细节，可压缩空间大 |
| 工具消息 | 保留操作类型和结果摘要 | 50-60% | 工具执行过程细节可简化，保留结果和影响 |

### 3.2 基于内容特性的差异化压缩

| 内容类型 | 压缩策略 | 保留要素 |
|---------|---------|---------|
| 代码块 | 保留关键函数和结构，简化实现细节 | 函数名、参数、返回值、API调用、核心逻辑 |
| 表格数据 | 提取主要趋势和关键数据点 | 表头、极值、趋势、异常值 |
| 列表内容 | 合并相似项，提取共性 | 列表结构、代表性项目、特殊项目 |
| 技术说明 | 保留核心概念和关系 | 专业术语、定义、关系说明 |
| 问题解决 | 关注问题-解决方案的映射 | 问题描述、解决步骤、结果验证 |

### 3.3 上下文敏感压缩

**重要性评估因素**：
- 消息在对话中的位置（近期消息保留更多细节）
- 包含的关键决策点和信息密度
- 被后续对话引用或依赖的程度
- 包含独特信息而非重复内容的程度

**实现机制**：
- 为每条消息计算重要性分数
- 根据分数动态调整压缩率
- 历史越久远，基础压缩率越高，但关键节点保留更多信息

## 4. 压缩触发机制

### 4.1 阈值触发压缩

**基于token数量**：
- 设置历史记录总token数阈值（如3000tokens）
- 当历史记录超过阈值时触发压缩
- 可设置保留最新N条消息不压缩（如最近5轮对话）

**基于时间跨度**：
- 设置时间窗口（如对话持续超过30分钟）
- 超过时间窗口的早期消息进行压缩
- 不同时间段可应用不同压缩率

### 4.2 批量压缩处理

**批次处理**：
- 每次只压缩一部分历史（如最早30%的未压缩消息）
- 保留一定比例的最新对话不进行压缩
- 根据对话活跃度动态调整压缩频率
- 系统消息自动排除在压缩批次之外

### 4.3 手动与自动模式

**手动触发**：
- 提供API允许手动触发对话历史压缩
- 可指定目标token数

**自动模式**：
- 在预设条件下自动触发压缩
- 在消息发送前检查历史长度
- 可配置自动压缩的触发条件

## 5. 统一压缩方案

### 5.1 压缩标准

**均衡压缩**:
- 目标：减少约50-60%的token，保留核心语义
- 方法：删除冗余内容，简化表达，提取关键信息
- 特点：在保留重要信息和可理解性之间取得平衡

**压缩效果标准**:
- 信息保留：确保压缩后内容保留原始对话的关键信息和决策点
- 结构保留：保持对话的因果关系和逻辑流程
- 上下文连贯：确保压缩后内容仍能为后续对话提供必要上下文
- 语义密度：提高信息密度，每个token传递更多有效信息

### 5.2 压缩状态标记

**消息状态标记**：
- `ORIGINAL`: 原始未压缩消息
- `COMPRESSED`: 已压缩消息

**内容标记**：
- 用特殊标记表示内容已压缩 `[COMPRESSED]`
- 可选择性添加压缩率指示 `[COMPRESSED:60%]`
- 在压缩内容前可添加提示 `[The following is a compressed summary of previous conversation]`

### 5.3 压缩前后的消息对比

为了直观展示压缩效果，以下是将多条消息压缩成单条摘要的对比示例：

#### 例1：多轮对话压缩成摘要

**压缩前（多条原始消息）**：
```json
[
  {
    "content": "我想了解Python中异步编程的最佳实践，尤其是在处理高并发Web请求时如何有效地使用异步功能。",
    "role": "user",
    "created_at": "2023-09-15 10:23:45"
  },
  {
    "content": "异步编程是处理高并发Web请求的有效方式。在Python中，主要有几个关键库和框架：asyncio（标准库）、trio、FastAPI和aiohttp。您能具体说明您的使用场景吗？",
    "role": "assistant",
    "created_at": "2023-09-15 10:24:15",
    "token_usage": {
      "prompt_tokens": 45,
      "completion_tokens": 65
    }
  },
  {
    "content": "我正在开发一个需要处理数千个并发连接的API服务，目前使用的是同步方法，但遇到了性能瓶颈。我尝试过使用threading模块，但似乎仍然存在资源竞争问题。",
    "role": "user",
    "created_at": "2023-09-15 10:24:45"
  },
  {
    "content": "明白了，对于您的高并发API服务，我建议使用asyncio配合FastAPI。让我帮您分析一下当前的代码结构，看看哪些部分适合异步化：",
    "role": "assistant",
    "created_at": "2023-09-15 10:25:15",
    "tool_calls": [
      {
        "id": "call_abc123",
        "type": "function",
        "function": {
          "name": "search_files",
          "arguments": "{\"directory\":\"/app/src\",\"patterns\":[\"*.py\"],\"content_pattern\":\"connection|request|http\"}"
        }
      }
    ],
    "token_usage": {
      "prompt_tokens": 120,
      "completion_tokens": 45
    }
  },
  {
    "content": "搜索结果显示您的项目中有7个文件包含网络连接相关代码，主要集中在API路由和数据库操作上。",
    "tool_call_id": "call_abc123",
    "role": "tool",
    "created_at": "2023-09-15 10:25:30"
  },
  {
    "content": "基于搜索结果，我建议您从以下几个方面入手改造系统：\n\n1. **API层改造**：将路由处理器改为异步函数\n2. **数据库操作**：使用asyncpg替代同步驱动\n3. **HTTP客户端**：使用aiohttp进行外部API调用\n\n以下是一个简化的FastAPI示例：\n\n```python\nfrom fastapi import FastAPI\nimport asyncpg\nimport asyncio\n\napp = FastAPI()\ndb_pool = None\n\n@app.on_event(\"startup\")\nasync def startup():\n    global db_pool\n    db_pool = await asyncpg.create_pool(\"postgresql://user:password@localhost/dbname\")\n\n@app.get(\"/users/\")\nasync def get_users():\n    async with db_pool.acquire() as conn:\n        return await conn.fetch(\"SELECT * FROM users LIMIT 100\")\n```\n\n这样可以显著提高系统吞吐量。",
    "role": "assistant",
    "created_at": "2023-09-15 10:26:20",
    "token_usage": {
      "prompt_tokens": 180,
      "completion_tokens": 210
    }
  },
  {
    "content": "了解了，谢谢建议。我还想知道如何处理异步环境中的第三方库调用，特别是那些只提供同步API的库？",
    "role": "user",
    "created_at": "2023-09-15 10:27:00"
  },
  {
    "content": "对于同步第三方库，您有几种处理方式：\n\n1. **使用线程池**：\n   ```python\n   result = await asyncio.to_thread(sync_library.function, arg1, arg2)\n   ```\n\n2. **寻找异步替代品**：许多流行库都有异步版本\n\n3. **异步包装器**：创建自定义包装器隔离同步调用\n\n4. **进程池**：对于CPU密集型任务，使用`ProcessPoolExecutor`\n\n关键是避免在事件循环中直接调用阻塞函数。",
    "role": "assistant",
    "created_at": "2023-09-15 10:27:30",
    "token_usage": {
      "prompt_tokens": 220,
      "completion_tokens": 140
    }
  }
]
```

**压缩后（单条摘要消息）**：
```json
{
  "content": "用户咨询Python异步编程在高并发Web请求处理中的最佳实践。用户正开发处理数千并发连接的API服务，同步方法遇到性能瓶颈，threading模块存在资源竞争问题。\n\n助手建议使用asyncio配合FastAPI，并搜索了项目代码，发现7个文件包含网络连接相关代码，主要在API路由和数据库操作。助手提出三方面改造建议：1)将API路由处理器改为异步函数；2)使用asyncpg替代同步数据库驱动；3)使用aiohttp进行外部API调用。提供了FastAPI示例代码展示基本结构。\n\n用户询问如何处理只提供同步API的第三方库，助手提供四种方法：1)使用asyncio.to_thread的线程池；2)寻找异步替代品；3)创建异步包装器；4)对CPU密集任务使用ProcessPoolExecutor。核心原则是避免在事件循环中直接调用阻塞函数。",
  "role": "assistant",
  "created_at": "2023-09-15 10:28:00",
  "is_compressed": true,
  "compression_info": {
    "original_message_count": 8,
    "compression_ratio": 0.7,
    "compressed_at": "2023-09-15 10:28:00",
    "message_spans": [
      {
        "start_time": "2023-09-15 10:23:45",
        "end_time": "2023-09-15 10:27:30" 
      }
    ]
  }
}
```

#### 例2：包含工具调用的多轮交互压缩

**压缩前（多条原始消息）**：
```json
[
  {
    "content": "你能帮我找出项目中所有使用异步函数的文件吗？",
    "role": "user",
    "created_at": "2023-09-15 11:05:30"
  },
  {
    "content": "我来帮你查找项目中的异步函数。",
    "role": "assistant",
    "created_at": "2023-09-15 11:05:45",
    "tool_calls": [
      {
        "id": "call_def456",
        "type": "function",
        "function": {
          "name": "search_files",
          "arguments": "{\"directory\":\"/app/src\",\"patterns\":[\"*.py\"],\"content_pattern\":\"async def\"}"
        }
      }
    ],
    "token_usage": {
      "prompt_tokens": 25,
      "completion_tokens": 20
    }
  },
  {
    "content": "执行了文件搜索操作，搜索条件为：目录=\"/app/src\"，模式=\"*.py\"，内容=\"async def\"。\n共找到7个匹配文件：\n1. /app/src/api/routes.py - 包含15个匹配项\n2. /app/src/services/data_service.py - 包含8个匹配项\n3. /app/src/services/auth_service.py - 包含4个匹配项\n4. /app/src/utils/http_client.py - 包含6个匹配项\n5. /app/src/tasks/scheduler.py - 包含10个匹配项\n6. /app/src/middleware/logging.py - 包含2个匹配项\n7. /app/src/config/loader.py - 包含1个匹配项",
    "tool_call_id": "call_def456",
    "role": "tool",
    "created_at": "2023-09-15 11:06:00"
  },
  {
    "content": "我找到了7个包含异步函数的Python文件，总共46个异步函数。主要分布如下：\n\n- API路由（routes.py）：15个异步函数，主要处理HTTP请求\n- 数据服务（data_service.py）：8个异步函数，处理数据库操作\n- 认证服务（auth_service.py）：4个异步函数，处理认证逻辑\n- HTTP客户端（http_client.py）：6个异步函数，处理外部API调用\n- 任务调度（scheduler.py）：10个异步函数，处理后台任务\n- 日志中间件（logging.py）：2个异步函数\n- 配置加载（loader.py）：1个异步函数\n\n是否需要我查看某个特定文件的具体内容？",
    "role": "assistant",
    "created_at": "2023-09-15 11:06:30",
    "token_usage": {
      "prompt_tokens": 150,
      "completion_tokens": 180
    }
  },
  {
    "content": "请查看data_service.py的内容，我想了解它是如何处理数据库连接的。",
    "role": "user",
    "created_at": "2023-09-15 11:07:00"
  },
  {
    "content": "我来查看data_service.py的内容。",
    "role": "assistant",
    "created_at": "2023-09-15 11:07:15",
    "tool_calls": [
      {
        "id": "call_ghi789",
        "type": "function",
        "function": {
          "name": "read_file",
          "arguments": "{\"file_path\":\"/app/src/services/data_service.py\"}"
        }
      }
    ],
    "token_usage": {
      "prompt_tokens": 175,
      "completion_tokens": 15
    }
  },
  {
    "content": "```python\n# /app/src/services/data_service.py\nimport asyncpg\nfrom typing import List, Dict, Any\nfrom config import settings\n\nclass DataService:\n    _pool = None\n    \n    @classmethod\n    async def get_pool(cls):\n        if cls._pool is None:\n            cls._pool = await asyncpg.create_pool(\n                host=settings.DB_HOST,\n                port=settings.DB_PORT,\n                user=settings.DB_USER,\n                password=settings.DB_PASSWORD,\n                database=settings.DB_NAME,\n                min_size=5,\n                max_size=20\n            )\n        return cls._pool\n    \n    @classmethod\n    async def close_pool(cls):\n        if cls._pool:\n            await cls._pool.close()\n            cls._pool = None\n    \n    async def get_users(self, limit: int = 100) -> List[Dict[str, Any]]:\n        pool = await self.get_pool()\n        async with pool.acquire() as conn:\n            records = await conn.fetch(f\"SELECT * FROM users LIMIT {limit}\")\n            return [dict(r) for r in records]\n    \n    async def get_user_by_id(self, user_id: int) -> Dict[str, Any]:\n        pool = await self.get_pool()\n        async with pool.acquire() as conn:\n            record = await conn.fetchrow(\"SELECT * FROM users WHERE id = $1\", user_id)\n            return dict(record) if record else None\n    \n    async def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:\n        pool = await self.get_pool()\n        async with pool.acquire() as conn:\n            async with conn.transaction():\n                record = await conn.fetchrow(\"\"\"\n                    INSERT INTO users(username, email, created_at)\n                    VALUES($1, $2, NOW())\n                    RETURNING *\n                \"\"\", user_data['username'], user_data['email'])\n                return dict(record)\n    \n    # Other CRUD operations...\n    \n    async def execute_batch_query(self, query_batch):\n        pool = await self.get_pool()\n        async with pool.acquire() as conn:\n            async with conn.transaction():\n                results = []\n                for query, params in query_batch:\n                    result = await conn.fetch(query, *params)\n                    results.append(result)\n                return results\n```",
    "tool_call_id": "call_ghi789",
    "role": "tool",
    "created_at": "2023-09-15 11:07:30"
  },
  {
    "content": "查看了data_service.py的内容，我发现它使用了asyncpg库处理PostgreSQL数据库连接。以下是其关键特点：\n\n1. **连接池管理**：\n   - 使用类级别的连接池（`_pool`）\n   - `get_pool()`方法懒加载连接池，设置了最小5个、最大20个连接\n   - `close_pool()`方法用于优雅关闭连接\n\n2. **事务处理**：\n   - 使用`async with conn.transaction()`进行事务管理\n   - 确保操作原子性，特别是在`create_user`和`execute_batch_query`方法中\n\n3. **连接获取模式**：\n   - 每个方法都使用`async with pool.acquire() as conn`获取连接\n   - 操作完成后自动释放连接回池\n\n4. **批量查询**：\n   - `execute_batch_query`方法支持在单个事务中执行多个查询\n\n这是一个良好的异步数据库访问层实现，有效利用了连接池和事务管理。",
    "role": "assistant",
    "created_at": "2023-09-15 11:08:15",
    "token_usage": {
      "prompt_tokens": 450,
      "completion_tokens": 230
    }
  }
]
```

**压缩后（单条摘要消息）**：
```json
{
  "content": "用户请求查找项目中所有使用异步函数的文件。搜索结果显示7个文件共包含46个异步函数，主要分布在API路由(15)、数据服务(8)、任务调度(10)、HTTP客户端(6)、认证服务(4)等模块。\n\n用户进一步请求查看data_service.py的数据库连接处理方式。文件分析显示该服务使用asyncpg库处理PostgreSQL连接，主要特点包括：1)采用类级别连接池(最小5/最大20连接)；2)使用事务管理确保操作原子性；3)采用'async with pool.acquire()'模式获取和释放连接；4)支持在单事务中执行批量查询。整体实现了高效的异步数据库访问层。",
  "role": "assistant",
  "created_at": "2023-09-15 11:08:30",
  "is_compressed": true,
  "compression_info": {
    "original_message_count": 8,
    "compression_ratio": 0.85,
    "compressed_at": "2023-09-15 11:08:30",
    "message_spans": [
      {
        "start_time": "2023-09-15 11:05:30",
        "end_time": "2023-09-15 11:08:15" 
      }
    ]
  }
}
```

#### 例3：系统消息与初始对话保留，压缩早期对话

**压缩逻辑示例**：
```json
[
  // 系统消息永远不压缩
  {
    "content": "你是一位Python专家，擅长解答关于异步编程、Web开发和高性能应用的问题。当用户询问相关问题时，请提供全面而实用的建议，并在必要时提供代码示例。",
    "role": "system",
    "created_at": "2023-09-15 10:20:00"
  },
  // 最近的N轮对话保持不压缩
  {
    "content": "异步函数和协程有什么区别？asyncio.gather和asyncio.wait有什么不同？",
    "role": "user",
    "created_at": "2023-09-15 12:15:00"
  },
  {
    "content": "异步函数与协程的区别，以及asyncio.gather与asyncio.wait的比较：\n\n**异步函数 vs 协程**：\n- 异步函数：使用`async def`定义的函数，调用时返回一个协程对象\n- 协程：可暂停执行的函数，允许在等待I/O时释放控制权\n- 关系：异步函数是创建协程的语法糖，协程是异步执行的实际单位\n\n**asyncio.gather vs asyncio.wait**：\n1. **gather**：\n   - 同时运行多个协程并等待所有完成\n   - 返回结果顺序与输入协程顺序一致\n   - 一个协程异常会导致整体异常（除非设置return_exceptions=True）\n   - 使用简单：`results = await asyncio.gather(coro1(), coro2())`\n\n2. **wait**：\n   - 提供更细粒度控制，包括超时和完成条件\n   - 可以等待第一个完成（FIRST_COMPLETED）或所有完成（ALL_COMPLETED）\n   - 返回(done, pending)任务集合，需手动获取结果\n   - 使用较复杂：`done, pending = await asyncio.wait([coro1(), coro2()])`\n\n大多数情况下，gather更简单直接；需要更精细控制时，选择wait。",
    "role": "assistant",
    "created_at": "2023-09-15 12:16:30",
    "token_usage": {
      "prompt_tokens": 40,
      "completion_tokens": 290
    }
  },
  // 较早的对话会被压缩成摘要
  {
    "content": "这是前面多轮关于Python异步编程的对话摘要：用户询问了异步编程基础、asyncio事件循环工作原理、异步上下文管理器和异步迭代器的使用方法。助手解释了事件循环如何调度协程、异步上下文管理器的实现(使用__aenter__/__aexit__)以及异步迭代器的实现(使用__aiter__/__anext__)。还讨论了异步编程的常见陷阱，包括阻塞事件循环、忽略awaitable对象和异常处理问题等。",
    "role": "assistant",
    "created_at": "2023-09-15 12:10:00",
    "is_compressed": true,
    "compression_info": {
      "original_message_count": 12,
      "compression_ratio": 0.88,
      "compressed_at": "2023-09-15 12:10:00",
      "message_spans": [
        {
          "start_time": "2023-09-15 11:30:00",
          "end_time": "2023-09-15 12:05:45" 
        }
      ]
    }
  }
]
```

这些示例展示了压缩机制如何将多轮对话压缩成简洁的摘要消息，同时保留关键信息和上下文。压缩操作应用于整个对话片段，而不是单独处理每条消息，这使得上下文保持连贯且信息量丰富。压缩消息中包含了额外的元数据，如压缩率和原始消息数量，方便追踪压缩效果。

## 6. 技术实现架构

### 6.1 核心功能组件

聊天记录压缩功能的核心组件包括：

1. **压缩触发器**：监控历史记录长度，在适当时机触发压缩
2. **消息选择器**：选择待压缩的消息，排除系统消息和最近对话
3. **LLM压缩处理器**：调用LLM执行实际压缩
4. **结果验证器**：验证压缩结果的质量和完整性
5. **历史更新器**：用压缩后的内容更新历史记录

### 6.2 压缩处理流程

1. **检测触发条件**：
   - 监控历史记录长度
   - 检查是否超过设定阈值
   - 确定可压缩的消息范围
   - 排除所有系统消息

2. **消息分类与筛选**：
   - 对消息按类型和重要性分类
   - 筛选出需要压缩的消息（始终排除系统消息）
   - 确定消息的上下文重要性

3. **构建压缩提示**：
   - 为LLM创建专门的压缩指令
   - 包含压缩目标和保留要点
   - 可使用少量示例指导压缩方式

4. **调用LLM执行压缩**：
   - 发送消息批次给LLM
   - 接收压缩后的结果
   - 验证压缩质量和信息保留

5. **更新历史记录**：
   - 用压缩版本替换原始消息
   - 更新历史记录状态
   - 保存更新后的历史记录

### 6.3 LLM压缩提示设计

**基础压缩提示模板**：

```
你是一个专业的对话压缩助手。你的任务是压缩以下对话内容，同时保留关键信息和上下文。

目标压缩率：减少约60%的token
保留重点：决策点、关键问题、核心回答和专业术语

原始对话内容：
{ORIGINAL_CONTENT}

请提供压缩后的内容，确保：
1. 保留所有关键信息和决策点
2. 维持对话的逻辑流程和因果关系
3. 保留专业术语和核心概念
4. 使用更简洁的表达方式
5. 移除冗余和非必要细节

输出格式应该只包含压缩后的内容，不要添加任何解释。
```

**针对不同内容类型的特殊指令**：

- 代码压缩：增加"保留功能完整性，简化实现细节"
- 工具调用压缩：增加"保留操作类型和结果，简化过程"
- 技术解释压缩：增加"保留核心概念和关系，简化举例和背景"

### 6.4 压缩质量评估

**自动评估指标**：
- 压缩率：实际减少的token百分比
- 关键词保留率：核心术语和概念的保留比例
- 结构完整性：对话回合和逻辑结构的保留情况

**人工干预机制**：
- 设置压缩质量阈值
- 低于阈值的压缩结果可标记为需审核
- 提供人工调整接口

## 7. 用户配置选项

### 7.1 全局配置参数

```python
class CompressionConfig:
    """压缩功能的全局配置"""
    # 触发设置
    enable_compression: bool = True  # 是否启用压缩功能
    token_threshold: int = 3000  # 触发压缩的token数阈值
    preserve_recent_turns: int = 3  # 保留不压缩的最近对话轮数
    compress_system_messages: bool = False  # 是否压缩系统消息，默认为False
    
    # 消息类型设置
    target_compression_ratio: float = 0.6  # 总体目标压缩率
    user_message_compression_ratio: float = 0.4  # 用户消息的目标压缩率
    assistant_message_compression_ratio: float = 0.65  # 助手消息的目标压缩率
    tool_message_compression_ratio: float = 0.55  # 工具消息的目标压缩率
    # 系统消息压缩率被忽略，因为系统消息不压缩
    
    # 高级设置
    compression_cooldown: int = 5  # 两次压缩间隔的最小消息数
    compression_batch_size: int = 10  # 每批压缩的最大消息数
    llm_model_for_compression: str = "default"  # 用于压缩的LLM模型
```

### 7.2 实例级配置

允许为不同的ChatHistory实例配置不同的压缩策略：

```python
# 实例化带压缩功能的聊天历史
chat_history = ChatHistory(
    agent_name="research_assistant",
    agent_id="ra123",
    chat_history_dir="./history",
    compression_config=CompressionConfig(
        token_threshold=4000,  # 更高的阈值
        preserve_recent_turns=5,  # 保留更多最近对话
        target_compression_ratio=0.55  # 稍低的压缩率，保留更多信息
    )
)
```

### 7.3 动态控制API

提供在运行时调整压缩行为的API：

```python
# 示例API
chat_history.set_compression_ratio(0.5)  # 调整压缩率
chat_history.disable_compression()  # 临时禁用压缩
chat_history.enable_compression()  # 重新启用压缩
chat_history.compress_now()  # 立即触发压缩
```

## 8. 实施路径与优先级

### 8.1 阶段一：基础压缩功能

1. 扩展ChatHistory类，添加压缩相关字段和方法
2. 实现基础的消息压缩逻辑和LLM调用
3. 添加阈值触发压缩机制
4. 开发基础配置选项
5. 增加压缩状态标记和元数据

### 8.2 阶段二：高级功能

1. 实现基于消息类型的差异化压缩
2. 添加批量处理机制
3. 开发压缩质量评估机制
4. 实现内容特性识别和特殊处理
5. 添加用户动态控制API

### 8.3 阶段三：优化与扩展

1. 开发压缩质量自优化机制
2. 实现原始消息恢复功能(可选)
3. 添加压缩统计与分析功能
4. 优化LLM提示以提高压缩质量
5. 开发批量处理以提高效率

## 9. 兼容性与集成考虑

### 9.1 与现有代码的兼容性

- 保持ChatHistory类的公共接口不变
- 为压缩功能添加专用的新方法和属性
- 确保序列化和反序列化机制支持压缩消息

### 9.2 与不同LLM的集成

- 设计适配器模式支持多种LLM模型
- 对不同模型调整压缩提示和参数
- 考虑模型token计算差异

### 9.3 与UI的集成

- 在UI中添加压缩状态指示
- 提供展开/折叠压缩内容的选项
- 考虑添加压缩状态的可视化指示

## 10. 性能与资源考虑

### 10.1 LLM调用开销

- 压缩本身需要LLM调用，存在token消耗
- 应在批处理模式中高效执行
- 压缩获益应显著大于压缩成本

### 10.2 延迟与用户体验

- 压缩过程应在后台进行，不阻塞主对话流程
- 考虑使用异步处理机制
- 提供压缩进度指示

### 10.3 存储考虑

- 可选择是否保留原始消息以支持恢复
- 对压缩元数据使用紧凑存储格式
- 考虑存储版本兼容性

## 11. 安全性与隐私

### 11.1 数据处理

- 确保压缩过程中不会泄露敏感信息
- 考虑端到端加密选项
- 谨慎处理包含凭证或私密信息的消息

### 11.2 审计与合规

- 记录压缩操作以支持审计
- 确保压缩过程符合数据保留政策
- 提供删除/恢复原始数据的选项

## 12. 总结

基于LLM的聊天记录压缩方案通过语义理解和信息提炼，在保留关键内容的同时大幅减少token消耗。该方案采用统一的压缩策略，针对不同消息类型进行差异化处理，能够显著延长有效对话长度，降低成本，并提高用户体验。

实施该方案需要谨慎平衡压缩率与信息保留，并考虑不同内容类型的特殊处理需求。通过分阶段实施和持续优化，可以构建一个高效、灵活且用户友好的聊天记录压缩系统。 