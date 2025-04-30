# URL文件下载工具 (`download_from_url`)

该工具允许从任意HTTP/HTTPS网址下载文件到工作目录，支持自动处理重定向。

## 功能特点

- 支持从任意HTTP或HTTPS URL下载文件
- 自动处理URL重定向
- 自动创建必要的目录结构
- 支持配置是否覆盖已存在的文件
- 支持自定义文件名，自动安全处理和保留原文件扩展名
- 提供下载进度和结果信息
- 安全地处理文件路径，确保只能下载到工作目录内

## 参数说明

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| url | string | 是 | - | 要下载的文件URL地址，支持HTTP和HTTPS协议 |
| filepath | string | 是 | - | 保存文件的路径，相对于工作目录 |
| filename | string | 否 | null | 自定义文件名，如果提供则使用此名称替换原始文件名，保持扩展名不变。不包含路径信息，仅文件名部分 |
| override | boolean | 否 | false | 如果文件已存在，是否覆盖 |

## 使用示例

### 基本用法

下载网络图片到工作目录的images文件夹：

```python
{
  "operation": "download_from_url",
  "operation_params": {
    "url": "https://example.com/image.jpg",
    "filepath": "images/example.jpg"
  }
}
```

### 使用自定义文件名

下载文件并使用自定义文件名：

```python
{
  "operation": "download_from_url",
  "operation_params": {
    "url": "https://example.com/document-with-long-name-v1.2.3.pdf",
    "filepath": "documents/report.pdf",
    "filename": "项目报告2024"
  }
}
```

系统会自动将"项目报告2024"处理为安全的文件名，并保留原始文件的扩展名(.pdf)。

### 覆盖已存在的文件

如果需要覆盖已存在的文件，可以设置`override`参数为`true`：

```python
{
  "operation": "download_from_url",
  "operation_params": {
    "url": "https://example.com/document.pdf",
    "filepath": "documents/report.pdf",
    "override": true
  }
}
```

## 返回结果

工具执行成功时会返回以下格式的信息：

```
文件下载成功: .workspace/images/example.jpg | 大小: 256.45 KB | 类型: image/jpeg | 重定向次数: 1
```

返回信息中包含：
- 文件保存路径
- 文件大小（自动格式化为B/KB/MB/GB）
- 文件类型（MIME类型）
- 重定向次数

## 错误处理

工具可能返回的错误包括：

1. 文件已存在且未设置覆盖：
   ```
   文件已存在，如需覆盖请设置 override=True
   file_path: .workspace/images/example.jpg
   ```

2. URL不可访问或服务器返回错误：
   ```
   下载失败，HTTP状态码: 404, 原因: Not Found
   ```

3. 网络连接问题：
   ```
   下载文件失败: 连接超时
   ```

4. 权限问题：
   ```
   安全限制：不允许访问工作目录(.workspace)外的文件: /etc/passwd
   ```

## 注意事项

- 文件下载过程中可能会占用一定的网络和系统资源
- 大文件下载可能需要较长时间
- 工具只能将文件保存到工作目录内，不能保存到系统其他位置
- 文件名会保持原样，如果URL中包含非标准字符，可能需要自行处理文件名
