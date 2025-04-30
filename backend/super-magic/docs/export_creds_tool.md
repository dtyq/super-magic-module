# 凭证导出工具

`bin/export_creds.py` 是一个命令行工具，用于导出存储凭证。它可以将系统中的凭证导出到指定文件，方便其他工具或程序使用。

## 功能

- 从 `config/upload_credentials.json` 加载现有凭证
- 创建新的 `AgentContext` 对象并设置凭证
- 将凭证导出到指定文件路径
- 支持指定沙盒ID

## 使用方法

```bash
# 使用默认参数导出凭证到config/upload_credentials.json
python bin/export_creds.py

# 指定沙盒ID
python bin/export_creds.py --sandbox my_sandbox_id

# 导出到自定义路径
python bin/export_creds.py --output custom/path/credentials.json

# 同时指定沙盒ID和输出路径
python bin/export_creds.py --sandbox my_sandbox_id --output custom/path/credentials.json
```

## 参数说明

- `--sandbox`, `-s`: 指定沙盒ID，默认为"default"
- `--output`, `-o`: 指定导出文件路径，默认为"config/upload_credentials.json"

## 集成场景

该工具在以下场景中特别有用：

1. **CI/CD环境**: 在自动化部署过程中设置凭证
2. **多沙盒环境**: 为不同的沙盒环境生成不同的凭证文件
3. **开发测试**: 手动准备测试环境所需的凭证

## 技术实现

该工具使用 `app/utils/credential_utils.py` 模块中的函数，将 `AgentContext` 中的凭证序列化为JSON文件。具体实现过程：

1. 从源凭证文件加载凭证数据
2. 创建 `VolcEngineCredentials` 对象
3. 创建 `AgentContext` 并设置凭证和沙盒ID
4. 调用 `export_credentials` 函数导出到目标文件

## 凭证文件格式

生成的凭证文件采用标准JSON格式，示例如下：

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