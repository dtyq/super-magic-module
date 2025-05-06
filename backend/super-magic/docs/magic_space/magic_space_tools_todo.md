# Magic Space 工具集成 TODO 列表

## 背景

当前的 Magic Space 部署功能主要通过 shell 脚本实现，需要将其改为基于 LLM 工具调用的方式实现，使得 Deployer Agent 可以直接调用相关功能，而不依赖于 shell 脚本。

## 设计目标

1. 将 Magic Space 的相关操作（部署、更新、删除）实现为工具（tools）
2. 重构 deployer.agent 使用这些工具而不是 shell 脚本
3. 保留原有的智能分析和部署逻辑，但通过 LLM 工具调用的方式实现
4. 提供更灵活和强大的部署功能
5. 每个工具放在独立的 Python 文件中

## 实现步骤

### 1. 创建 Magic Space 工具

- [x] 创建 `app/tools/magic_space_deploy.py` - 负责部署功能
  - [x] 实现 `deploy_to_magic_space` 工具，从目录部署 HTML 项目
  - [x] 保留原有智能分析目录结构的功能
  - [x] 支持创建 index.html 重定向页面

- [x] 创建独立的管理工具文件
  - [x] 实现 `app/tools/list_magic_space_sites.py` - 列出站点工具
  - [x] 实现 `app/tools/update_magic_space_site.py` - 更新站点工具
  - [x] 实现 `app/tools/delete_magic_space_site.py` - 删除站点工具
  - [x] 实现 `app/tools/get_magic_space_site.py` - 获取站点详情工具
  - [x] 删除合并版的 `magic_space_manage.py` 文件

- [x] 在工具内部调用 `app/space/service.py` 中的现有功能
  - [x] 使用 `MagicSpaceService` 的 API 实现
  - [x] 正确处理异步调用和异常

### 2. 更新 Deployer Agent

- [x] 修改 `agents/deployer.agent`
  - [x] 更新工具列表，添加新的 Magic Space 工具
  - [x] 更新部署指令，使用新的工具调用方式
  - [x] 移除对 shell 脚本的依赖

### 3. 实现工具功能

#### deploy_to_magic_space 工具

- [x] 添加参数：
  - [x] `directory_path`: 要部署的目录路径（默认为 .workspace）
  - [x] `site_name`: 站点名称（可选）
  - [x] `target_html`: 指定要部署的 HTML 文件（可选）
  - [x] `target_dir`: 指定要部署的子目录（可选）
  - [x] `access`: 访问权限（public/private/password）
  - [x] `description`: 站点描述
  - [x] `auto_detect`: 是否自动检测项目结构（默认为 true）

- [x] 实现智能分析逻辑：
  - [x] 检查是否存在 index.html
  - [x] 分析目录结构查找可能的项目
  - [x] 检查是否需要创建重定向页面

#### update_magic_space_site 工具

- [x] 添加参数：
  - [x] `site_id`: 要更新的站点 ID
  - [x] `directory_path`: 包含更新内容的目录
  - [x] `options`: 要更新的站点配置（可选）

#### delete_magic_space_site 工具

- [x] 添加参数：
  - [x] `site_id`: 要删除的站点 ID
  - [x] `confirm`: 确认删除

#### list_magic_space_sites 工具

- [x] 添加参数：
  - [x] `page`: 页码（默认为 1）
  - [x] `limit`: 每页数量（默认为 10）

#### get_magic_space_site 工具

- [x] 添加参数：
  - [x] `site_id`: 要获取详情的站点 ID

### 4. 代码整理和优化

- [x] 拆分合并工具为独立文件
  - [x] 将 `list_magic_space_sites` 工具移到独立文件
  - [x] 将 `update_magic_space_site` 工具移到独立文件
  - [x] 将 `delete_magic_space_site` 工具移到独立文件
  - [x] 创建 `get_magic_space_site` 独立工具
  - [x] 更新 `__init__.py` 引入新的工具

### 5. 测试与验证

- [ ] 测试部署功能
  - [ ] 部署单个 HTML 文件
  - [ ] 部署整个目录
  - [ ] 测试自动检测项目结构
  - [ ] 测试创建重定向页面

- [ ] 测试管理功能
  - [ ] 更新站点
  - [ ] 删除站点
  - [ ] 列出站点
  - [ ] 获取站点详情

### 6. 文档更新

- [x] 更新 `docs/magic_space/deployment_guide.md`
  - [x] 添加使用新工具的说明
  - [x] 更新参数和用法
  - [x] 添加管理功能的说明

- [x] 创建 `docs/magic_space/api_tools.md`
  - [x] 详细记录工具的参数和用法
  - [x] 提供示例和最佳实践

## 时间规划

- 工具开发: 完成
- 更新 Deployer Agent: 完成
- 工具拆分: 完成
- 测试与修复: 待完成
- 文档更新: 完成

## 注意事项

1. 所有工具需要遵循现有的工具定义规范
2. 必须保持与现有 Magic Space API 的兼容性
3. 错误处理和用户反馈需要友好易懂
4. 需要提供足够的调试信息来帮助解决问题
5. 每个工具必须放在独立的 Python 文件中 