# Magic Space 模块使用指南

本指南介绍如何使用 Magic Space 模块将HTML项目部署到Magic Space托管平台。

## 安装与配置

Magic Space 模块已集成到项目中，无需额外安装。确保项目配置中包含正确的API密钥和基础URL。

在`.env`文件或配置中应有以下设置：

```
MAGIC_SPACE_API_KEY=your_api_key
MAGIC_SPACE_API_BASE_URL=https://www.letsmagic.space
```

## 基本使用

### 导入模块

```python
from app.space.service import MagicSpaceService
from app.space.models import Site, SiteOwner
```

### 创建服务实例

```python
# 使用配置中的API密钥和基础URL创建服务实例
from app.core.config_manager import ConfigManager

config = ConfigManager().get_config()
space_service = MagicSpaceService(
    api_key=config.magic_space.api_key,
    base_url=config.magic_space.api_base_url
)
```

### 从目录部署网站

```python
# 设置站点选项
options = {
    "description": "我的个人网站",
    "access": "public"  # 可选值: "public", "private", "password"
}

# 如果选择password访问控制，需要提供密码
if options["access"] == "password":
    options["password"] = "site-password"

# 从目录部署
response = await space_service.deploy_from_directory(
    directory_path="/path/to/your/project",
    site_name="my-awesome-site", 
    options=options
)

# 输出部署结果
site = response["data"]["site"]
print(f"站点已部署: {site['url']}")
```

### 从ZIP文件部署网站

```python
# 如果已有打包好的ZIP文件
response = await space_service.deploy_from_zip(
    zip_path="/path/to/your/project.zip",
    site_name="my-awesome-site", 
    options={
        "description": "从ZIP部署的站点",
        "access": "public"
    }
)

site = response["data"]["site"]
print(f"站点已部署: {site['url']}")
```

### 获取站点列表

```python
# 获取第一页站点列表(默认每页20条)
response = await space_service.get_sites(page=1, limit=10)

# 打印站点信息
sites = response["data"]["sites"]
pagination = response["data"]["pagination"]

print(f"总站点数: {pagination['total']}")
print(f"当前页: {pagination['page']}/{pagination['pages']}")

for site in sites:
    print(f"站点ID: {site['id']}")
    print(f"站点名称: {site['name']}")
    print(f"站点URL: {site['url']}")
    print(f"访问控制: {site['access']}")
    print(f"创建时间: {site['createdAt']}")
    print("-----------------")
```

### 获取站点详情

```python
# 获取单个站点详细信息
response = await space_service.get_site_details("site-123456")

if response["success"]:
    site = response["data"]["site"]
    print(f"站点详情:")
    print(f"名称: {site['name']}")
    print(f"描述: {site['description']}")
    print(f"URL: {site['url']}")
    print(f"访问控制: {site['access']}")
    
    if site["owner"] and site["owner"]["name"]:
        print(f"所有者: {site['owner']['name']}")
else:
    print("获取站点详情失败")
```

### 更新站点信息

```python
# 更新站点信息
update_data = {
    "name": "updated-site-name",
    "description": "Updated site description",
    "access": "password",
    "password": "site-password",
    "owner": {
        "name": "Site Owner",
        "email": "owner@example.com"
    }
}

response = await space_service.update_site_info("site-123456", update_data)

if response["success"]:
    site = response["data"]["site"]
    print(f"站点已更新: {site['name']} ({site['url']})")
else:
    print("更新站点失败")
```

### 删除站点

```python
# 通过站点ID删除站点
response = await space_service.delete_site("site-123456")

if response["success"]:
    print(f"站点已删除: {response['data']['message']}")
else:
    print("删除站点失败")
```

## 高级功能

### 站点配置管理

```python
# 获取站点配置
config_response = await space_service.get_site_config("site-123456")

if config_response["success"]:
    config = config_response["data"]["config"]
    print("当前配置:")
    print(f"错误页面: {config['errorPages']}")
    print(f"默认内容类型: {config['defaultContentType']}")
    
    # 更新站点配置
    new_config = {
        "errorPages": {
            "404": "/custom-404.html",
            "500": "/custom-500.html"
        },
        "defaultContentType": "text/html",
        "headers": {
            "/*": {
                "X-Frame-Options": "DENY",
                "X-Content-Type-Options": "nosniff"
            }
        }
    }
    
    update_response = await space_service.update_site_config("site-123456", new_config)
    
    if update_response["success"]:
        print("站点配置已更新")
    else:
        print("更新站点配置失败")
else:
    print("获取站点配置失败")
```

### 查看站点统计

```python
# 获取站点访问统计
stats_response = await space_service.get_site_stats("site-123456")

if stats_response["success"]:
    stats = stats_response["data"]["stats"]
    print(f"站点统计:")
    print(f"总大小: {stats['size']} 字节")
    print(f"文件数量: {stats['fileCount']}")
    print(f"访问次数: {stats['visits']}")
    print(f"最后访问时间: {stats['lastAccessed']}")
else:
    print("获取站点统计失败")
```

### 自定义ZIP打包选项

```python
from app.space.utils import create_zip_from_directory

# 创建ZIP文件，排除特定文件和目录
zip_path = create_zip_from_directory(
    directory_path="/path/to/your/project",
    output_path="/tmp/my-project.zip",
    exclude_patterns=["*.log", ".git/", "node_modules/", "__pycache__/"]
)

# 使用自定义ZIP部署
response = await space_service.deploy_from_zip(
    zip_path=zip_path,
    site_name="my-awesome-site", 
    options={"access": "public"}
)

site = response["data"]["site"]
print(f"站点已部署: {site['url']}")
```

### 错误处理

```python
from app.space.exceptions import MagicSpaceError, ApiError, ZipCreationError

try:
    response = await space_service.deploy_from_directory(
        directory_path="/path/to/your/project",
        site_name="my-awesome-site", 
        options={"access": "public"}
    )
    
    if response["success"]:
        site = response["data"]["site"]
        print(f"站点已部署: {site['url']}")
    else:
        print(f"部署失败: {response['error']}")
    
except ZipCreationError as e:
    print(f"ZIP打包失败: {e}")
    
except ApiError as e:
    print(f"API请求失败: {e}")
    
except MagicSpaceError as e:
    print(f"Magic Space错误: {e}")
```

## 最佳实践

1. **始终处理异常**：部署过程可能因网络问题、API限制或权限问题而失败。

2. **验证项目结构**：在部署前验证HTML项目结构，确保包含必要的文件（如index.html）。

3. **避免大文件**：大型ZIP文件可能导致上传超时或失败。考虑压缩图片和优化资源。

4. **不要硬编码API密钥**：始终从配置中获取API密钥，避免硬编码到源代码中。

5. **检查响应状态**：所有API响应都包含`success`字段，在处理响应数据前应先检查此字段。

6. **访问权限设置**：当设置访问权限为`password`时，记得同时提供密码字段。

## 故障排除

### 常见问题

1. **上传失败**
   - 检查网络连接
   - 确认API密钥正确
   - 验证ZIP文件大小（应小于50MB）

2. **认证错误**
   - 检查API密钥是否有效
   - 确认请求中包含正确的授权头

3. **站点无法访问**
   - 确认项目包含index.html文件
   - 检查站点访问设置是否正确

### 日志和调试

启用详细日志以帮助调试：

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 完整示例

以下是一个完整的示例，演示如何将一个简单的HTML项目部署到Magic Space：

```python
import asyncio
from app.space.service import MagicSpaceService
from app.space.exceptions import MagicSpaceError
from app.core.config_manager import ConfigManager

async def deploy_website():
    # 获取配置
    config = ConfigManager().get_config()
    
    # 创建服务实例
    space_service = MagicSpaceService(
        api_key=config.magic_space.api_key,
        base_url=config.magic_space.api_base_url
    )
    
    # 设置站点选项
    options = {
        "description": "演示站点",
        "access": "public",
        "owner": {
            "name": "示例用户",
            "email": "user@example.com"
        }
    }
    
    try:
        # 从目录部署站点
        response = await space_service.deploy_from_directory(
            directory_path="./my-project",
            site_name="demo-website",
            options=options
        )
        
        if response["success"]:
            site = response["data"]["site"]
            print(f"站点已成功部署!")
            print(f"站点ID: {site['id']}")
            print(f"站点名称: {site['name']}")
            print(f"访问地址: {site['url']}")
            
            # 获取站点统计
            stats_response = await space_service.get_site_stats(site["id"])
            if stats_response["success"]:
                stats = stats_response["data"]["stats"]
                print(f"站点大小: {stats['size']} 字节")
                print(f"文件数量: {stats['fileCount']} 个")
        else:
            print(f"部署失败: {response['error']}")
            
    except MagicSpaceError as e:
        print(f"部署过程中出错: {e}")
    except Exception as e:
        print(f"未预期的错误: {e}")

# 运行示例
if __name__ == "__main__":
    asyncio.run(deploy_website())
```

## 进一步阅读

- [Magic Space API参考文档](./api_reference.md)
- [Magic Space设计文档](./design.md) 