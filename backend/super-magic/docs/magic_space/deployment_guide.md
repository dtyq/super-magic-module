# Magic Space 部署指南

本指南介绍如何使用 `deployer.agent` 将 HTML 项目部署到 Magic Space 平台。

## 特性

- **智能项目分析**：自动识别 HTML 项目结构和相关资源文件
- **灵活部署选项**：支持部署整个目录、特定子目录或单个 HTML 文件
- **资源筛选**：自动过滤与部署无关的文件（如 .git、node_modules 等）
- **入口文件生成**：自动创建 index.html 重定向页面（当需要时）
- **部署简化**：通过简单的命令行或对话方式执行部署
- **站点管理**：支持列出、更新和删除已部署的站点

## 前提条件

1. 确保配置文件中包含有效的 Magic Space API 密钥
2. 配置文件中需要设置以下内容：
   ```yaml
   magic_space:
     api_key: "YOUR_API_KEY"
     api_base_url: "https://www.letsmagic.space"
   ```
3. 确保 `.workspace` 目录中包含要部署的 HTML 文件及相关资源

## 使用方法

### 方法一：通过 deployer.agent 部署（智能模式）

1. 在 SuperMagic 对话框中输入：
   ```
   请使用 deployer.agent 将 .workspace 中的 HTML 项目部署到 Magic Space
   ```

2. deployer.agent 会智能分析 .workspace 目录，识别项目结构，并根据情况进行部署。

3. 如果 .workspace 目录中有多个可能的 HTML 项目，deployer.agent 会询问你要部署哪一个。

### 方法二：通过 deployer.agent 部署（指定选项）

1. 你可以为 deployer.agent 指定具体的部署选项：

   ```
   请使用 deployer.agent 部署 .workspace 中的 report.html 文件到 Magic Space，站点名称为 annual-report
   ```

   或者

   ```
   请使用 deployer.agent 部署 .workspace/project/resume 目录到 Magic Space
   ```

2. 可以添加以下参数：
   - 站点名称：`--site_name my-site`
   - 访问权限：`--access public|private|password`
   - 站点描述：`--description "这是我的网站"`
   - 目标HTML文件：`--target_html path/to/file.html`
   - 目标目录：`--target_dir path/to/directory`

3. 例如：
   ```
   请使用 deployer.agent 部署 .workspace 中的 HTML 项目到 Magic Space --site_name my-awesome-site --access public --target_html portfolio.html
   ```

### 方法三：管理已部署站点

1. 列出已部署的站点：
   ```
   请使用 deployer.agent 列出我的 Magic Space 站点
   ```

2. 更新已部署站点：
   ```
   请使用 deployer.agent 更新站点ID为 site-123456 的内容
   ```

3. 删除已部署站点：
   ```
   请使用 deployer.agent 删除站点ID为 site-123456 的站点
   ```

## 参数说明

### 部署参数

- `directory_path`：要部署的目录路径，默认为 `.workspace`
- `site_name`：站点名称，默认使用目录名称
- `access`：访问权限设置，可选值：`public`、`private`、`password`，默认为 `public`
- `description`：站点描述
- `target_html`：指定要部署的目标 HTML 文件，省略时会自动检测
- `target_dir`：指定要部署的目标子目录，省略时自动分析或部署整个工作目录
- `auto_detect`：是否自动检测项目结构，默认为 `true`

### 管理参数

#### 列出站点
- `page`：页码，默认为 1
- `limit`：每页数量，默认为 10

#### 更新站点
- `site_id`：要更新的站点 ID
- `directory_path`：包含更新内容的目录路径
- `site_name`：站点名称（可选，不更新则保持原值）
- `access`：访问权限（可选）
- `description`：站点描述（可选）

#### 删除站点
- `site_id`：要删除的站点 ID
- `confirm`：确认删除（必须为 true）

## 项目结构识别

deployer.agent 会根据以下规则识别 HTML 项目：

1. **入口文件检测**：寻找 index.html、main.html 或 home.html 作为可能的入口文件
2. **项目结构分析**：检查是否有目录同时包含 HTML、CSS 和 JS 文件
3. **引用关系分析**：分析 HTML 文件之间的链接，以及它们对 CSS/JS 的引用
4. **文件名关联**：检查文件名是否表明它们属于同一个项目

如果找到多个可能的 HTML 项目，deployer.agent 会询问你想要部署哪一个。

## 自动创建的 index.html

如果部署的目录中没有 `index.html` 文件，或者指定部署的不是 index.html 文件，部署工具会自动创建一个重定向页面。重定向的目标文件选择逻辑如下：

1. 如果指定了 `target_html`，则重定向到该文件
2. 否则，首先查找名称包含 "main" 或 "home" 的 HTML 文件
3. 如果没有找到符合条件的文件，则使用第一个 HTML 文件

自动创建的 `index.html` 包含以下功能：
- Meta 刷新重定向
- JavaScript 重定向
- 用户点击链接手动跳转选项
- 美观的界面样式

## 部署结果

部署成功后，你将看到以下信息：

```
部署成功！

站点信息:
- 站点名称: my-site
- 站点 ID: site-123456
- 访问地址: https://my-site.letsmagic.space
- 文件数量: 10
- 创建了重定向 index.html 文件，指向: portfolio.html

HTML 文件列表:
- index.html
- portfolio.html
- contact.html
```

## 常见问题

### 配置问题

**问题**: Magic Space API Key 未配置
**解决方案**: 确保在 `config/config.yaml` 文件中正确设置了 `magic_space.api_key`

### 文件问题

**问题**: 工作目录中没有 HTML 文件
**解决方案**: 确保 `.workspace` 目录中至少有一个 HTML 文件

**问题**: 找不到指定的目标 HTML 文件或目录
**解决方案**: 检查文件路径是否正确，路径应相对于 .workspace 目录

### 项目结构问题

**问题**: 无法识别正确的项目结构
**解决方案**: 使用 `target_html` 或 `target_dir` 明确指定要部署的内容

### 部署问题

**问题**: 部署失败，API 请求错误
**解决方案**: 检查网络连接，确认 API 密钥是否有效，站点名称是否可用

### 管理问题

**问题**: 无法找到站点 ID
**解决方案**: 使用 `list_magic_space_sites` 工具查看已部署的站点列表及其 ID

**问题**: 删除站点失败
**解决方案**: 确保 `confirm` 参数设置为 `true` 