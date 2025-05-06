# Magic Space API 参考文档

该文档提供了Magic Space API的详细说明，基于官方API文档 (https://www.letsmagic.space/api-docs/json)。

## 基本信息

- 基础URL: `https://www.letsmagic.space`
- API版本: v1
- 认证方式: API Key (通过 `api-token` 请求头传递)

## 认证

所有API请求都需要包含以下请求头进行身份验证：

```
api-token: YOUR_API_KEY
```

API密钥应从配置文件获取，避免硬编码在源代码中。

## 站点管理 API

### 创建站点

将HTML项目部署为新站点。

**请求**:

```
POST /api/v1/sites
```

**请求头**:

```
api-token: YOUR_API_KEY
content-type: application/zip
```

**查询参数**:

- `name` (必填): 站点名称
- `description` (可选): 站点描述
- `access` (可选): 访问权限设置，可选值为 `public`, `private`, `password`
- `password` (可选): 当access为password时需提供

**请求体**:

二进制ZIP文件内容

**响应**:

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

**响应状态码**:

- `201`: 成功创建
- `400`: 请求错误
- `401`: 认证失败
- `403`: 权限不足
- `500`: 服务器错误

### 获取站点列表

获取当前用户所有站点的列表。

**请求**:

```
GET /api/v1/sites
```

**请求头**:

```
api-token: YOUR_API_KEY
```

**查询参数**:

- `page` (可选): 页码，默认为1
- `limit` (可选): 每页数量，默认为20

**响应**:

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
      // ...更多站点
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

**响应状态码**:

- `200`: 成功
- `401`: 认证失败
- `500`: 服务器错误

### 获取站点详情

获取特定站点的详细信息。

**请求**:

```
GET /api/v1/sites/{site_id}
```

**请求头**:

```
api-token: YOUR_API_KEY
```

**路径参数**:

- `site_id`: 站点ID

**响应**:

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

**响应状态码**:

- `200`: 成功
- `401`: 认证失败
- `404`: 站点不存在
- `500`: 服务器错误

### 更新站点

更新站点的配置选项或内容。

**请求**:

```
PUT /api/v1/sites/{site_id}
```

**请求头**:

要更新站点信息：
```
api-token: YOUR_API_KEY
content-type: application/json
```

要更新站点内容：
```
api-token: YOUR_API_KEY
content-type: application/zip
```

**路径参数**:

- `site_id`: 站点ID

**请求体**:

对于更新站点信息:
```json
{
  "name": "updated-site-name",
  "description": "Updated site description",
  "access": "password",
  "password": "site-password",
  "owner": {
    "name": "Owner Name",
    "email": "owner@example.com"
  }
}
```

对于更新站点内容:
二进制ZIP文件内容

**响应**:

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
      "url": "https://updated-site-name.letsmagic.space",
      "owner": {
        "name": "Owner Name",
        "email": "owner@example.com"
      }
    }
  }
}
```

**响应状态码**:

- `200`: 成功更新
- `400`: 请求错误
- `401`: 认证失败
- `403`: 权限不足
- `404`: 站点不存在
- `500`: 服务器错误

### 删除站点

删除一个站点及其所有内容。

**请求**:

```
DELETE /api/v1/sites/{site_id}
```

**请求头**:

```
api-token: YOUR_API_KEY
```

**路径参数**:

- `site_id`: 站点ID

**响应**:

```json
{
  "success": true,
  "data": {
    "message": "Site deleted successfully"
  }
}
```

**响应状态码**:

- `200`: 成功删除
- `401`: 认证失败
- `403`: 权限不足
- `404`: 站点不存在
- `500`: 服务器错误

## 站点配置 API

### 获取站点配置

获取站点的配置信息。

**请求**:

```
GET /api/v1/sites/{site_id}/config
```

**请求头**:

```
api-token: YOUR_API_KEY
```

**路径参数**:

- `site_id`: 站点ID

**响应**:

```json
{
  "success": true,
  "data": {
    "siteId": "site-123456",
    "config": {
      "errorPages": {
        "404": "/404.html",
        "500": "/error.html"
      },
      "defaultContentType": "text/html",
      "headers": {
        "/*": {
          "X-Frame-Options": "DENY",
          "X-Content-Type-Options": "nosniff"
        }
      }
    }
  }
}
```

### 更新站点配置

更新站点的配置信息。

**请求**:

```
PUT /api/v1/sites/{site_id}/config
```

**请求头**:

```
api-token: YOUR_API_KEY
content-type: application/json
```

**路径参数**:

- `site_id`: 站点ID

**请求体**:

```json
{
  "errorPages": {
    "404": "/404.html",
    "500": "/error.html"
  },
  "defaultContentType": "text/html",
  "headers": {
    "/*": {
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff"
    }
  }
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "siteId": "site-123456",
    "config": {
      "errorPages": {
        "404": "/404.html",
        "500": "/error.html"
      },
      "defaultContentType": "text/html",
      "headers": {
        "/*": {
          "X-Frame-Options": "DENY",
          "X-Content-Type-Options": "nosniff"
        }
      }
    }
  }
}
```

## 统计分析 API

### 获取站点统计

获取站点的访问和资源统计信息。

**请求**:

```
GET /api/v1/sites/{site_id}/stats
```

**请求头**:

```
api-token: YOUR_API_KEY
```

**路径参数**:

- `site_id`: 站点ID

**响应**:

```json
{
  "success": true,
  "data": {
    "siteId": "site-123456",
    "stats": {
      "size": 1024000,
      "fileCount": 42,
      "visits": 1500,
      "lastAccessed": "2023-10-01T12:00:00Z"
    }
  }
}
```

### 获取访问日志

获取站点的访问日志。

**请求**:

```
GET /api/v1/sites/{site_id}/access-logs
```

**请求头**:

```
api-token: YOUR_API_KEY
```

**路径参数**:

- `site_id`: 站点ID

**查询参数**:

- `offset` (可选): 偏移量
- `limit` (可选): 返回数量限制

**响应**:

```json
{
  "success": true,
  "data": {
    "siteId": "site-123456",
    "logs": [
      {
        "id": "log-123",
        "timestamp": "2023-10-01T12:00:00Z",
        "ip": "192.168.1.1",
        "path": "/index.html",
        "userAgent": "Mozilla/5.0 ...",
        "referer": "https://example.com"
      }
    ],
    "total": 1500,
    "pagination": {
      "offset": 0,
      "limit": 10,
      "hasMore": true
    }
  }
}
```

## 错误处理

所有API错误响应都将返回以下格式:

```json
{
  "success": false,
  "error": "Detailed error message"
}
```

可能的错误情况包括:

- 认证失败: 无效的API令牌
- 资源不存在: 请求的站点或资源不存在
- 请求格式错误: 请求参数或格式有误
- 服务器内部错误: 服务器处理请求时遇到问题

## 限流政策

Magic Space API实施了限流政策:

- 每分钟最多60个请求
- 每天最多1000个请求

超过限制时，API将返回状态码`429 Too Many Requests`。 