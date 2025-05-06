# 工具架构重构 TODO

## 1. 基础组件实现

- [x] 创建工具参数基类 (BaseToolParams)
- [x] 实现工具装饰器 (tool_decorator.py)
- [x] 实现工具工厂类 (tool_factory.py)
- [x] 调整 BaseTool 以支持参数模型化

## 2. 工具重构示例与迁移策略

- [x] 为 read_file 工具创建参数模型并重构为新架构
- [x] 为 list_dir 工具创建参数模型并重构为新架构
- [x] 为 grep_search 工具创建参数模型并重构为新架构
- [x] 更新工具导入和注册机制 (app/tools/__init__.py)

## 3. 系统集成

- [x] 整合工具工厂到工具执行器 (tool_executor.py)
- [x] 修改工具注册表机制 (tool_registry.py)
- [x] 确保与现有agent调用兼容

## 4. 测试与验证

- [ ] 验证重构工具功能正常
- [ ] 验证自动发现和注册机制

## 5. 清理与文档

- [ ] 清理旧的工具注册与参数定义机制
- [ ] 更新文档以反映新架构
