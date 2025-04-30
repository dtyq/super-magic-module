# Magic Space API 工具参考

本文档详细介绍了 Magic Space 相关的工具 API，包括部署、列表、更新和删除功能。

## 工具概述

Magic Space 工具集包含以下工具：

1. `deploy_to_magic_space` - 部署 HTML 项目到 Magic Space 平台
2. `list_magic_space_sites` - 列出已部署的站点
3. `get_magic_space_site` - 获取单个站点的详细信息
4. `update_magic_space_site` - 更新已部署站点的内容或配置
5. `delete_magic_space_site` - 删除已部署站点

## 部署工具 (deploy_to_magic_space)

将 HTML 项目部署到 Magic Space 平台。

### 参数

| 参数名 | 类型 | 必填 | 默认值 | 描述 |
|--------|------|------|--------|------|
| directory_path | string | 否 | ".workspace" | 要部署的目录路径 |
| site_name | string | 否 | 目录名称 | 站点名称 |
| target_html | string | 否 | null | 指定要部署的 HTML 文件 |
| target_dir | string | 否 | null | 指定要部署的子目录 |
| access | string | 否 | "public" | 访问权限（public/private/password） |
| description | string | 否 | null | 站点描述 |
| auto_detect | boolean | 否 | true | 是否自动检测项目结构 |

### 返回结果

成功时返回包含以下字段的结果：

```json
{
  "success": true,
  "site_id": "site-123456",
  "site_name": "my-site",
  "site_url": "https://my-site.letsmagic.space",
  "file_count": 10,
  "created_index_html": true,
  "redirect_target": "portfolio.html",
  "html_files": ["index.html", "portfolio.html", "contact.html"]
}
```

### 示例

```python
# 部署整个工作空间
deploy_to_magic_space(
  site_name="my-website",
  description="我的个人网站"
)

# 部署特定 HTML 文件
deploy_to_magic_space(
  target_html="report.html",
  site_name="annual-report",
  access="private"
)

# 部署子目录
deploy_to_magic_space(
  target_dir="project/portfolio",
  site_name="my-portfolio"
)
```

## 列表工具 (list_magic_space_sites)

列出已部署的 Magic Space 站点。

### 参数

| 参数名 | 类型 | 必填 | 默认值 | 描述 |
|--------|------|------|--------|------|
| page | integer | 否 | 1 | 页码 |
| limit | integer | 否 | 10 | 每页数量（最大50） |

### 返回结果

成功时返回包含以下字段的结果：

```json
{
  "page": 1,
  "limit": 10,
  "total": 25,
  "total_pages": 3,
  "sites": [
    {
      "id": "site-123456",
      "name": "my-site",
      "url": "https://my-site.letsmagic.space",
      "access": "public",
      "created_at": "2023-05-20T12:30:45Z",
      "description": "我的个人网站"
    },
    // 更多站点...
  ]
}
```

### 示例

```python
# 列出第一页站点（默认10条）
list_magic_space_sites()

# 列出第二页站点，每页20条
list_magic_space_sites(
  page=2,
  limit=20
)
```

## 获取站点详情工具 (get_magic_space_site)

获取单个 Magic Space 站点的详细信息。

### 参数

| 参数名 | 类型 | 必填 | 默认值 | 描述 |
|--------|------|------|--------|------|
| site_id | string | 是 | - | 要获取详情的站点 ID |

### 返回结果

成功时返回包含以下字段的结果：

```json
{
  "id": "site-123456",
  "name": "my-site",
  "url": "https://my-site.letsmagic.space",
  "access": "public",
  "description": "我的个人网站",
  "created_at": "2023-05-20T12:30:45Z",
  "updated_at": "2023-05-21T10:15:22Z",
  "custom_domain": "",
  "ssl_enabled": false,
  "file_count": 15,
  "size": 1024000
}
```

### 示例

```python
# 获取站点详情
get_magic_space_site(
  site_id="site-123456"
)
```

## 更新工具 (update_magic_space_site)

更新已部署站点的内容或配置。

### 参数

| 参数名 | 类型 | 必填 | 默认值 | 描述 |
|--------|------|------|--------|------|
| site_id | string | 是 | - | 要更新的站点 ID |
| directory_path | string | 否 | ".workspace" | 包含更新内容的目录路径 |
| site_name | string | 否 | null | 站点名称（可选，不更新则保持原值） |
| access | string | 否 | null | 访问权限（可选） |
| description | string | 否 | null | 站点描述（可选） |

### 返回结果

成功时返回包含以下字段的结果：

```json
{
  "site_id": "site-123456",
  "name": "updated-site-name",
  "url": "https://updated-site-name.letsmagic.space",
  "access": "private",
  "description": "更新后的站点描述",
  "message": "站点更新成功"
}
```

### 示例

```python
# 更新站点内容
update_magic_space_site(
  site_id="site-123456",
  directory_path=".workspace"
)

# 更新站点配置
update_magic_space_site(
  site_id="site-123456",
  site_name="new-site-name",
  access="private",
  description="新的站点描述"
)

# 同时更新内容和配置
update_magic_space_site(
  site_id="site-123456",
  directory_path=".workspace/updated-content",
  site_name="new-site-name",
  access="private"
)
```

## 删除工具 (delete_magic_space_site)

删除已部署的 Magic Space 站点。

### 参数

| 参数名 | 类型 | 必填 | 默认值 | 描述 |
|--------|------|------|--------|------|
| site_id | string | 是 | - | 要删除的站点 ID |
| confirm | boolean | 是 | - | 确认删除（必须为 true） |

### 返回结果

成功时返回包含以下字段的结果：

```json
{
  "site_id": "site-123456",
  "name": "deleted-site",
  "url": "https://deleted-site.letsmagic.space",
  "message": "站点删除成功"
}
```

### 示例

```python
# 删除站点
delete_magic_space_site(
  site_id="site-123456",
  confirm=true
)
```

## 最佳实践

### 部署项目

1. **准备项目结构**：确保 HTML 文件和相关资源（CSS、JS、图片等）组织良好
2. **选择合适的部署方式**：
   - 如果是单个 HTML 文件，使用 `target_html` 参数
   - 如果是完整网站，使用 `target_dir` 或直接部署 `.workspace` 整个目录
3. **设置适当的访问权限**：根据内容敏感度选择 public、private 或 password

### 更新站点

1. **获取站点 ID**：先使用 `list_magic_space_sites` 获取要更新的站点 ID
2. **最小化更新**：只更新需要变更的内容，不必每次都更新所有配置
3. **保持 URL 一致**：更新时尽量不要修改站点名称，以保持 URL 一致性

### 删除站点

1. **谨慎操作**：删除操作不可逆，请确认站点 ID 是否正确
2. **必须确认**：必须设置 `confirm=true` 参数才能执行删除操作
3. **先备份**：如有需要，删除前先备份站点内容

## 错误处理

所有工具在遇到错误时都会返回相应的错误信息。常见错误包括：

- 配置缺失：Missing API key（缺少 Magic Space API 密钥）
- 参数错误：Invalid parameter（参数无效）
- 资源不存在：Site not found（站点不存在）
- 权限问题：Permission denied（无权限执行操作）
- 服务错误：Service unavailable（服务不可用）

遇到错误时，请检查错误信息，并确保：

1. 配置文件中包含有效的 Magic Space API 密钥
2. 参数格式和值符合要求
3. 操作的资源（如站点 ID）存在且有权限操作
4. 网络连接正常

## 注意事项

1. 所有工具都会自动处理异步操作，无需手动管理异步流程
2. 文件路径参数应相对于工作目录（如 `.workspace`）
3. 站点名称会用于生成 URL，因此应避免使用特殊字符
4. 每个账户的站点数量可能有限制，请适当管理已部署的站点 