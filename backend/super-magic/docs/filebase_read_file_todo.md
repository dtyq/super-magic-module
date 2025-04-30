# Filebase Read File 工具实现计划

## 需求
- ✅ 创建 `filebase_read_file` 工具，用于从 Qdrant 对应的索引中读取文件内容
- ✅ 根据 metadata 的 file_path 匹配所有的 points
- ✅ 可以选择读取全部内容或部分内容
- ✅ 部分内容时，根据 query 的相似性进行匹配
- ✅ 部分内容时，需要包含内容对应的行号

## 实现步骤
1. ✅ 创建 `FilebaseReadFileParams` 类，定义工具所需参数
   - ✅ `file_path`: 文件路径，必填
   - ✅ `query`: 查询内容，用于匹配部分内容，可选
   - ✅ `return_all`: 是否返回全部内容，默认为 `False`
   - ✅ `limit`: 返回结果的数量限制，默认为 10

2. ✅ 创建 `FilebaseReadFile` 工具类
   - ✅ 实现 `execute` 方法，从 Qdrant 中读取文件内容
   - ✅ 实现对行号的提取和处理
   - ✅ 实现友好的输出格式化方法

3. ✅ 在 Qdrant 中查询文件内容的实现
   - ✅ 根据 file_path 构建过滤条件
   - ✅ 处理全文返回和部分内容返回两种模式
   - ✅ 部分内容时，使用 query 进行相似性搜索

4. ✅ 结果处理和格式化
   - ✅ 将结果按行号排序
   - ✅ 合并内容并添加行号信息
   - ✅ 处理重复内容

5. ✅ 注册工具
   - ✅ 在 `app/tools/__init__.py` 中添加导入和 `__all__` 列表更新

6. ✅ 创建命令行工具
   - ✅ 在 bin 目录中创建 `filebase.py` 命令行工具
   - ✅ 支持 `search` 和 `read` 两种操作，对应 filebase_search 和 filebase_read_file 工具
   - ✅ 接受相应的命令行参数，并调用对应的工具功能
   - ✅ 优化输出格式，展示友好的结果

## 验证测试
- 测试全文读取功能
- 测试按查询读取部分内容
- 验证行号提取的准确性
- 测试命令行工具的两种操作功能

## 总结
FilebaseReadFile 工具已经完成实现，它具有以下功能：
1. 通过文件路径从 Qdrant 检索文件内容
2. 支持检索全部内容或基于查询的部分内容
3. 为检索到的部分内容提供行号标记，便于定位
4. 根据 metadata 的 file_path 匹配 points
5. 结果支持友好格式化输出，提供良好的用户体验

同时，我们还创建了一个命令行工具 `bin/filebase.py`，支持：
1. `search` 操作：快速搜索 filebase 中的内容
2. `read` 操作：读取指定文件的内容，支持全文读取和部分内容读取

使用示例：
```bash
# 搜索功能
./bin/filebase.py search --query "查询内容" --limit 10 --sandbox "sandbox_id"

# 读取文件功能
./bin/filebase.py read --file_path "文件路径" --return_all --sandbox "sandbox_id"
./bin/filebase.py read --file_path "文件路径" --query "查询内容" --sandbox "sandbox_id"
```

工具已在应用中正确注册，可供系统调用使用。 