# Magic Space 模块设计文档

## 1. 背景与目标

Magic Space 是一个允许部署和管理HTML项目的托管空间。通过此模块，我们将实现向Magic Space托管平台发送ZIP格式的项目文件，并部署一个可访问的网站。

## 2. 功能需求

1. 将本地HTML项目打包成ZIP文件
2. 发送ZIP文件到Magic Space API
3. 提供站点管理能力（创建、查询、删除）
4. 支持自定义站点设置（如访问权限配置）

## 3. 系统设计

### 3.1 目录结构

```
app/
└── space/
    ├── __init__.py                # 包初始化文件
    ├── client.py                  # Magic Space API客户端
    ├── models.py                  # 数据模型定义
    ├── exceptions.py              # 异常定义
    ├── service.py                 # 服务层：提供高级接口
    └── utils.py                   # 工具函数（如ZIP文件打包）
```

### 3.2 核心组件

#### 3.2.1 MagicSpaceClient (client.py)

负责与Magic Space API通信的低级客户端类。此类处理API请求的基本操作：

- 身份验证（添加API密钥到请求头）
- 发送HTTP请求
- 错误处理

```python
class MagicSpaceClient:
    def __init__(self, api_key, base_url)
    def create_site(self, site_name, zip_data, options)
    def get_site(self, site_id)
    def list_sites(self, page, limit)
    def delete_site(self, site_id)
    def update_site(self, site_id, options)
```

#### 3.2.2 模型定义 (models.py)

定义与Magic Space API交互所需的数据结构，基于官方API文档：

```python
class SiteOwner(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None

class Site(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    access: str  # public/private/password
    createdAt: datetime
    updatedAt: datetime
    url: str
    owner: Optional[SiteOwner] = None

class PaginationInfo(BaseModel):
    total: int
    page: int
    limit: int
    pages: int

class BaseResponse(BaseModel):
    success: bool = True
    data: Dict[str, Any]

class ErrorResponse(BaseModel):
    success: bool = False
    error: str
```

#### 3.2.3 MagicSpaceService (service.py)

提供更高级别的功能接口，调用客户端并处理业务逻辑：

```python
class MagicSpaceService:
    def __init__(self, api_key, base_url)
    async def deploy_from_directory(self, directory_path, site_name, options)
    async def deploy_from_zip(self, zip_path, site_name, options)
    async def get_sites(self, page=1, limit=20)
    async def delete_site(self, site_id)
```

#### 3.2.4 工具函数 (utils.py)

实现辅助功能：

```python
def create_zip_from_directory(directory_path, output_path=None, exclude_patterns=None)
def validate_html_project(directory_path)
```

### 3.3 异常处理 (exceptions.py)

定义模块特定的异常类：

```python
class MagicSpaceError(Exception):
    """基础异常类"""

class ApiError(MagicSpaceError):
    """API请求相关异常"""

class ZipCreationError(MagicSpaceError):
    """ZIP打包相关异常"""
```

## 4. API 接口设计

根据官方 API 文档（https://www.letsmagic.space/api-docs/json），实现以下主要API接口：

### 4.1 创建/部署站点

```
POST /api/v1/sites
Headers:
  api-token: <MAGIC_SPACE_API_KEY>
  content-type: application/zip
Query Parameters:
  name: <site_name>
  description: <site_description>
  access: <public|private|password>
Body: 
  Binary ZIP file content
```

响应格式：
```json
{
  "success": true,
  "data": {
    "site": {
      "id": "site-123456",
      "name": "my-site",
      "url": "https://my-site.letsmagic.space"
    }
  }
}
```

### 4.2 查询站点列表

```
GET /api/v1/sites
Headers:
  api-token: <MAGIC_SPACE_API_KEY>
Query Parameters:
  page: <page_number>
  limit: <items_per_page>
```

响应格式：
```json
{
  "success": true,
  "data": {
    "sites": [
      {
        "id": "site-123456",
        "name": "my-site",
        "description": null,
        "access": "public",
        "createdAt": "2023-10-01T12:00:00Z",
        "updatedAt": "2023-10-01T12:00:00Z",
        "url": "https://my-site.letsmagic.space",
        "owner": {
          "name": null,
          "email": null
        }
      }
    ],
    "pagination": {
      "total": 10,
      "page": 1,
      "limit": 20,
      "pages": 1
    }
  }
}
```

### 4.3 获取单个站点

```
GET /api/v1/sites/{site_id}
Headers:
  api-token: <MAGIC_SPACE_API_KEY>
```

响应格式：
```json
{
  "success": true,
  "data": {
    "site": {
      "id": "site-123456",
      "name": "my-site",
      "description": null,
      "access": "public",
      "createdAt": "2023-10-01T12:00:00Z",
      "updatedAt": "2023-10-01T12:00:00Z",
      "url": "https://my-site.letsmagic.space",
      "owner": {
        "name": null,
        "email": null
      }
    }
  }
}
```

### 4.4 删除站点

```
DELETE /api/v1/sites/{site_id}
Headers:
  api-token: <MAGIC_SPACE_API_KEY>
```

响应格式：
```json
{
  "success": true,
  "data": {
    "message": "Site deleted successfully"
  }
}
```

### 4.5 更新站点

```
PUT /api/v1/sites/{site_id}
Headers:
  api-token: <MAGIC_SPACE_API_KEY>
  content-type: application/json
Body:
  {
    "name": "updated-site-name",
    "description": "Updated site description",
    "access": "password",
    "password": "site-password"
  }
```

响应格式：
```json
{
  "success": true,
  "data": {
    "site": {
      "id": "site-123456",
      "name": "updated-site-name",
      "description": "Updated site description",
      "access": "password",
      "createdAt": "2023-10-01T12:00:00Z",
      "updatedAt": "2023-10-01T13:00:00Z",
      "url": "https://updated-site-name.letsmagic.space"
    }
  }
}
```

## 5. 实现计划

1. 创建基础目录结构和文件
2. 实现工具函数（ZIP打包功能）
3. 实现客户端（API请求功能）
4. 实现服务层（业务逻辑）
5. 添加完整的错误处理
6. 编写测试用例
7. 编写使用文档

## 6. 使用示例

```python
# 创建服务实例
space_service = MagicSpaceService(
    api_key="your-api-key", 
    base_url="https://www.letsmagic.space"
)

# 从目录部署站点
site = await space_service.deploy_from_directory(
    directory_path="./my-website",
    site_name="my-awesome-site",
    options={
        "description": "My awesome website",
        "access": "public"
    }
)

# 打印站点URL
print(f"站点已部署: {site['url']}")
```

## 7. 注意事项与风险

1. API密钥安全：确保API密钥不会被硬编码或意外泄露
2. 错误处理：可能的网络问题、API限制或权限问题
3. 文件大小：大型ZIP文件可能导致上传超时
4. 限流：考虑API可能的速率限制

## 8. 未来扩展

1. 支持站点配置更新（通过`/api/v1/sites/{id}/config`接口）
2. 站点统计分析功能（通过`/api/v1/sites/{id}/stats`接口）
3. 访问日志查询（通过`/api/v1/sites/{id}/access-logs`接口）
4. 重定向规则管理（通过`/api/v1/sites/{id}/redirects`接口） 