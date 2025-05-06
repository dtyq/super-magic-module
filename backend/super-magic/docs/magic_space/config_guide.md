# Magic Space 配置指南

本文档将介绍如何配置和使用 Magic Space 模块的配置系统。

## 配置文件格式

Magic Space 使用 YAML 或 JSON 格式的配置文件。配置文件包含以下主要部分：

```yaml
# API 相关配置
api:
  # API基础URL（必需）
  base_url: "https://www.letsmagic.space"
  # 请求超时时间（可选，默认60秒）
  timeout: 60
  # 请求失败时的最大重试次数（可选，默认3次）
  max_retries: 3

# 存储相关配置
storage:
  # 存储类型（必需）: "local" 或 "s3"
  type: "local"
  # 本地存储路径（当type为"local"时使用，默认"./storage"）
  path: "./storage"
  # S3存储桶名称（当type为"s3"时使用）
  s3_bucket: "magic-space-bucket"
  # S3存储前缀（默认"magic_space/"）
  s3_prefix: "magic-space/"

# 认证相关配置（可选）
auth:
  # 是否启用认证（默认false）
  enabled: true
  # 令牌过期时间（默认86400秒，即24小时）
  token_expiry: 86400

# 日志相关配置（可选）
logging:
  # 日志级别（默认"INFO"）: DEBUG, INFO, WARNING, ERROR, CRITICAL
  level: "INFO"
  # 日志文件路径（可选）
  file: "./logs/magic_space.log"
```

## 配置文件位置

Magic Space 会按以下顺序查找配置文件：

1. 通过环境变量 `MAGIC_SPACE_CONFIG` 指定的路径
2. 当前工作目录中的 `magic_space.yaml` 文件
3. 用户主目录下的 `~/.magic_space/magic_space.yaml` 文件
4. 系统配置目录中的 `/etc/magic_space/magic_space.yaml` 文件

## 环境变量覆盖

所有配置项都可以通过环境变量进行覆盖，格式为 `MAGIC_SPACE_大写配置路径`。例如：

- `MAGIC_SPACE_API_KEY` 覆盖 API 密钥
- `MAGIC_SPACE_API_BASE_URL` 覆盖 API 基础 URL
- `MAGIC_SPACE_STORAGE_TYPE` 覆盖存储类型

## 在代码中使用配置

### 加载配置

```python
from app.space import config_manager

# 加载配置（会自动查找配置文件）
config = config_manager.load_config()

# 或者指定配置文件路径
config = config_manager.load_config("/path/to/config.yaml")
```

### 获取配置值

```python
# 使用点表示法获取配置值
api_base_url = config_manager.get("api.base_url")
timeout = config_manager.get("api.timeout")

# 设置默认值
max_retries = config_manager.get("api.max_retries", 3)
```

### 设置配置值

```python
# 修改配置值
config_manager.set("api.timeout", 120)

# 添加新的配置路径
config_manager.set("new.config.path", "value")
```

### 获取完整配置

```python
# 获取完整配置字典
full_config = config_manager.get_config()
```

## 配置验证

Magic Space 会在加载配置时进行严格的验证：

1. 检查所有必需的配置部分和字段
2. 验证值的类型
3. 验证枚举值（如存储类型）是否在允许的范围内

如果验证失败，会抛出 `ConfigurationError` 异常，包含详细的错误信息。

## 处理配置错误

```python
from app.space import config_manager, ConfigurationError

try:
    config = config_manager.load_config()
    # 配置加载成功，继续执行
    base_url = config_manager.get("api.base_url")
except ConfigurationError as e:
    # 处理配置错误
    print(f"配置错误: {e}")
    # 可以访问具体的问题列表
    if hasattr(e, 'problems') and e.problems:
        for problem in e.problems:
            print(f" - {problem}")
```

## 完整示例

```python
import asyncio
from app.space import config_manager, MagicSpaceService, ConfigurationError

async def main():
    try:
        # 加载配置
        config = config_manager.load_config()
        print("配置加载成功")
        
        # 创建Magic Space服务
        service = MagicSpaceService(
            api_key=config_manager.get("api.api_key"),
            base_url=config_manager.get("api.base_url")
        )
        
        # 使用服务...
        
    except ConfigurationError as e:
        print(f"配置错误: {e}")

if __name__ == "__main__":
    asyncio.run(main())
```

## 配置最佳实践

1. **使用环境变量存储敏感信息**：如API密钥，不要将其硬编码在配置文件中
2. **在版本控制中包含示例配置**：提供一个 `config.example.yaml` 文件，但不要包含实际的配置
3. **设置合理的默认值**：对于非必需的配置项，配置系统已提供合理的默认值
4. **日志级别控制**：在开发环境使用 `DEBUG` 级别，在生产环境使用 `INFO` 或更高级别
5. **配置分离**：将不同环境（开发、测试、生产）的配置分开存储

## 故障排除

### 配置文件找不到

确保配置文件位于期望的位置，或通过环境变量 `MAGIC_SPACE_CONFIG` 显式指定路径。

### 配置验证失败

检查错误消息中的问题列表，确保：
- 所有必需的配置部分和字段都存在
- 值的类型正确
- 枚举值在允许的范围内

### 访问配置前未加载

确保在访问任何配置值之前调用 `load_config()`。 