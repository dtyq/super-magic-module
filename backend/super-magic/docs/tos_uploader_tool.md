# TOS文件上传工具

本文档介绍如何使用TOS文件上传工具（`bin/tos_uploader.py`）监控并自动上传.workspace目录中的文件变化到火山引擎的对象存储服务(TOS)。

## 功能介绍

TOS文件上传工具提供以下功能：

1. 监控.workspace目录中的文件变化
2. 自动将新建或修改的文件上传到火山引擎TOS
3. 支持一次性扫描模式和持续监控模式
4. 使用文件哈希避免重复上传相同内容的文件
5. 自动构建存储路径，确保文件组织合理

## 安装依赖

该工具基于watchdog库实现文件系统监控，确保已安装所需的依赖：

```bash
pip install watchdog
```

其他依赖(如dotenv、tos等)应该已经在项目依赖中。

## 使用方法

### 基本用法

```bash
# 持续监控.workspace目录并上传文件变化
python bin/tos_uploader.py watch

# 指定沙盒ID (默认为"default")
python bin/tos_uploader.py watch --sandbox my_sandbox_id

# 指定要监控的目录 (默认为".workspace")
python bin/tos_uploader.py watch --dir .workspace

# 只扫描一次已有文件后退出，不持续监控
python bin/tos_uploader.py watch --once

# 强制刷新所有文件(忽略缓存)
python bin/tos_uploader.py watch --refresh

# 指定凭证文件路径
python bin/tos_uploader.py watch --credentials config/upload_credentials.json

# 使用已存在的上下文凭证
python bin/tos_uploader.py watch --use-context

# 指定任务ID和组织编码用于注册上传的文件
python bin/tos_uploader.py watch --task-id 12345 --organization-code ORG001
```

### 凭证配置

工具默认从`config/upload_credentials.json`文件加载TOS凭证。此凭证文件会在WebSocket连接时自动导出，确保上传工具可以无缝使用最新的凭证信息。凭证格式示例：

```json
{
  "upload_config": {
    "platform": "tos",
    "temporary_credential": {
      "host": "tos.volcengineapi.com",
      "region": "cn-beijing",
      "endpoint": "tos-cn-beijing.volcengineapi.com",
      "bucket": "your-bucket-name",
      "dir": "uploads/",
      "expires": 3600,
      "callback": "",
      "credentials": {
        "AccessKeyId": "your-access-key",
        "SecretAccessKey": "your-secret-key",
        "SessionToken": "your-session-token",
        "ExpiredTime": "2099-12-31T23:59:59Z",
        "CurrentTime": "2023-01-01T00:00:00Z"
      }
    }
  }
}
```

## 上传路径说明

上传到TOS的文件路径由以下部分组成：

```
{凭证中的dir}/{沙盒ID}/{文件相对于workspace目录的路径}
```

例如，如果：
- 凭证中的dir为"uploads/"
- 沙盒ID为"my_sandbox"
- 文件路径为".workspace/src/main.py"

则上传到TOS的键(key)将是：`uploads/my_sandbox/src/main.py`

如果沙盒ID为空，则路径结构将是：

```
{凭证中的dir}/{文件相对于workspace目录的路径}
```

例如：`uploads/src/main.py`

这样可以避免在路径中出现不必要的空目录层级。

## 避免重复上传

工具使用文件哈希来判断文件内容是否发生变化，如果文件内容未变化，即使触发了文件修改事件，也不会重复上传，从而提高效率并减少对象存储成本。

## 文件注册功能

当指定了`--task-id`参数时，工具会自动将上传成功的文件注册到TaskFileModel API。这个功能使得上传的文件可以与指定任务关联，并在系统中正确显示。

注册功能的特点：
- 自动收集上传成功的文件信息
- 在完成扫描后立即注册已上传的文件
- 在监控模式下，每隔30秒检查是否有新上传的文件，如果最近20秒内没有新上传，则注册文件
- 支持指定组织编码，通过`--organization-code`参数提供

注册请求将发送到环境变量`MAGIC_API_SERVICE_BASE_URL`指定的API服务器，路径为`/api/super-agent/file/process-attachments`。如果未设置此环境变量，文件注册功能将无法使用。

### 环境变量配置

文件注册功能依赖以下环境变量：

```bash
# 在.env文件中或环境中设置
MAGIC_API_SERVICE_BASE_URL=http://127.0.0.1:9501/v1
```

### 注册请求详情

每次注册文件时，工具会在日志中打印详细的请求信息，包括：
- 请求URL
- 请求头
- 请求体
- 响应状态码
- 响应内容

这有助于调试和确认注册是否成功。

### 注册数据格式

上传的文件将按照以下格式注册：
```json
{
  "attachments": [
    {
      "file_key": "uploads/path/to/file.pdf",
      "file_extension": "pdf",
      "filename": "file.pdf",
      "file_size": 1024000,
      "external_url": "https://example.com/uploads/path/to/file.pdf"
    }
  ],
  "task_id": 12345,
  "organization_code": "ORG001"
}
```

`external_url` 字段是通过凭证中的 `host` 和文件的 `file_key` 组合生成的，格式为 `{host}/{file_key}`。这个URL可用于直接访问上传的文件。

## 异常处理

工具实现了全面的异常处理机制，确保在各种情况下都能稳定运行：

1. 文件不存在或无法访问时的处理
2. 上传失败时的错误日志和重试机制
3. 凭证加载失败的友好提示

## 技术实现

TOS文件上传工具主要包含以下组件：

1. **TOSUploader**：核心上传逻辑类，负责初始化凭证、扫描文件和执行上传
2. **TOSFileEventHandler**：文件系统事件处理器，监听文件创建和修改事件
3. **命令行解析**：提供友好的命令行接口

上传逻辑借助`app/infrastructure/storage`中的存储抽象层实现，确保与系统其他部分的一致性。

## 与系统集成

该工具与系统中的对象存储服务集成，复用了现有的:

1. 存储工厂(`app/infrastructure/storage/factory.py`)
2. 存储凭证类型(`app/infrastructure/storage/types.py`)
3. 存储上传实现(`app/infrastructure/storage/volcengine.py`)

## 日志记录

工具使用系统中已有的日志记录机制，日志位于`logs`目录。每次上传操作都会记录详细信息，包括：

1. 扫描到的文件
2. 文件内容是否变化
3. 上传成功或失败的记录
4. 各种异常和错误情况

## 使用场景

该工具适用于以下场景：

1. 持续备份工作空间文件
2. 实现多Agent协作时的文件共享
3. 跟踪和记录用户文件操作
4. 开发和调试过程中的文件变化同步

## 实现代码

以下是`bin/tos_uploader.py`的实现代码：

```python
#!/usr/bin/env python
"""
TOS上传工具 - 监控.workspace目录文件变化并自动上传到火山引擎TOS

命令列表:
    watch - 监控.workspace目录文件变化并自动上传到TOS
"""

# 加载环境变量
from dotenv import load_dotenv

import argparse
import asyncio
import os
import sys
import time
import hashlib
import json
from pathlib import Path
from typing import Dict, Optional

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

load_dotenv(override=True)

from app.infrastructure.storage.factory import StorageFactory
from app.infrastructure.storage.types import PlatformType, VolcEngineCredentials
from app.infrastructure.storage.exceptions import InitException, UploadException
from app.infrastructure.storage.base import BaseFileProcessor

# 导入watchdog库用于文件监控
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler, FileSystemEvent

from app.logger import configure_logging_intercept, get_logger, setup_logger
```

请查看文档`docs/tos_uploader_tool.md`获取完整的使用指南。该文档不包含完整的实现代码，请参考`bin/tos_uploader.py`文件获取完整代码。
