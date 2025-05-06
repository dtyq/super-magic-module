# Magic Space 模块文档

## 简介

Magic Space 模块是一个连接 Magic Space 托管平台的组件，允许用户通过 API 将 HTML 项目部署为可访问的网站。本模块提供简洁的接口，使开发人员能够将本地项目打包并部署到 Magic Space 托管服务。

## 文档目录

1. [设计文档](./design.md) - Magic Space 模块的架构设计
2. [实现计划](./todo.md) - 开发进度与任务拆分
3. [API参考文档](./api_reference.md) - Magic Space API 接口详情
4. [使用指南](./usage_guide.md) - 开发者使用说明

## 主要功能

- 将本地 HTML 项目打包成 ZIP 文件
- 通过 API 部署 ZIP 文件到 Magic Space 托管平台
- 管理已部署的站点（创建、查询、修改、删除）
- 配置站点选项（访问权限、错误页面、HTTP 头信息等）
- 查看站点统计数据（大小、文件数量、访问量等）

## 快速入门

```python
from app.space.service import MagicSpaceService
from app.core.config_manager import ConfigManager

# 获取配置
config = ConfigManager().get_config()

# 创建服务实例
space_service = MagicSpaceService(
    api_key=config.magic_space.api_key,
    base_url=config.magic_space.api_base_url
)

# 从目录部署站点
response = await space_service.deploy_from_directory(
    directory_path="./my-project",
    site_name="my-awesome-site",
    options={
        "description": "我的个人网站",
        "access": "public"
    }
)

if response["success"]:
    site = response["data"]["site"]
    print(f"站点已部署: {site['url']}")
else:
    print(f"部署失败: {response['error']}")
```

## API 响应格式

Magic Space API 始终返回一个包含 `success` 字段的 JSON 对象：

```json
// 成功时的响应
{
  "success": true,
  "data": {
    // 响应数据...
  }
}

// 失败时的响应
{
  "success": false,
  "error": "错误信息"
}
```

## 站点访问控制

Magic Space 支持三种访问控制模式：

- **public** - 公开访问，任何人都可以访问
- **private** - 私有访问，仅站点所有者可以访问
- **password** - 密码保护，需要输入密码才能访问

## 技术栈

- Python 3.8+
- asyncio 和 aiohttp 用于异步 HTTP 请求
- Pydantic 用于数据验证和序列化

## 配置要求

在项目的 `.env` 文件中需要以下配置：

```
MAGIC_SPACE_API_KEY=your_api_key
MAGIC_SPACE_API_BASE_URL=https://www.letsmagic.space
```

## 开发团队

Magic Space 模块由 Super Magic 团队开发和维护。

## 官方文档

- [Magic Space API 官方文档](https://www.letsmagic.space/api-docs/json) 