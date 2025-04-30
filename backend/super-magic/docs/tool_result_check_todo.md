# ToolResult 使用检查 Todo

根据 `app/core/entity/tool/tool_result.py` 的正确用法：
- 成功结果应使用 `content` 字段
- 错误结果应使用 `error` 字段
- 不能同时设置 `error` 和 `content` 参数

## 文件检查列表

### ✓ 已完成修改
- [x] filebase_search.py - 已修复，使用了不存在的 success, message, data 字段
- [x] append_to_file.py - 已修复，错误使用了 content 字段报告错误，应使用 error 字段
- [x] shell_exec.py - 已修复，使用了不存在的 data 字段，并错误使用了 error 字段返回成功内容
- [x] wechat_article_search.py - 已修复，使用了不存在的 data 字段，已改为使用 system 字段保存 JSON 数据

### ✓ 已完成检查，结果正确
- [x] fetch_douyin_data.py - 检查正确
- [x] fetch_xiaohongshu_data.py - 检查正确
- [x] fetch_zhihu_article_detail.py - 使用 WebpageToolResult，继承自 ToolResult，检查正确
- [x] grep_search.py - 检查正确
- [x] list_dir.py - 检查正确
- [x] get_js_cdn_address.py - 检查正确
- [x] read_file.py - 检查正确
- [x] replace_in_file.py - 检查正确
- [x] thinking.py - 检查正确
- [x] abstract_file_tool.py - 未直接使用 ToolResult
- [x] ask_user.py - 检查正确
- [x] call_agent.py - 检查正确
- [x] delete_file.py - 检查正确
- [x] file_search.py - 检查正确
- [x] finish_task.py - 检查正确
- [x] python_execute.py - 检查正确
- [x] use_browser.py - 检查正确，使用了 content 字段存储 JSON 形式的错误和成功信息，符合其特性
- [x] workspace_guard_tool.py - 未直接使用 ToolResult
- [x] write_to_file.py - 检查正确
- [x] bing_search.py - 使用 BingSearchToolResult，继承自 ToolResult，正确使用了 content 和 error 字段

### ⚠ 需要检查的文件
- [x] bing_search.py
- [x] wechat_article_search.py


## 检查详情

### 1. abstract_file_tool.py
- 此文件不直接使用 ToolResult ✓

### 2. append_to_file.py
- 第104行：~~`return ToolResult(content=f"追加文件失败: {e!s}")`~~ → 已修改为 `return ToolResult(error=f"追加文件失败: {e!s}")` ✓

### 3. ask_user.py
- 第54行：`return ToolResult(content={"question": params.question}, system="ASK_USER")` - ✓ 正确使用

### 4. call_agent.py
- 第85行：`return ToolResult(content=result)` - ✓ 正确使用
- 第89行：`return ToolResult(error=f"调用智能体失败: {e!s}")` - ✓ 正确使用

### 5. delete_file.py
- 第78行：`return ToolResult(error=error)` - ✓ 正确使用
- 第82行：`return ToolResult(error=f"文件不存在: {file_path}")` - ✓ 正确使用
- 第96行：`return ToolResult(content=f"文件已成功移动到回收站\nfile_path: {file_path!s}\nmethod: trash")` - ✓ 正确使用
- 第104行：`return ToolResult(content=f"文件已成功删除（trash命令失败，使用了直接删除）\nfile_path: {file_path!s}\nmethod: direct_delete")` - ✓ 正确使用
- 第113行：`return ToolResult(content=f"文件已成功删除\nfile_path: {file_path!s}\nmethod: direct_delete")` - ✓ 正确使用
- 第117行：`return ToolResult(error=f"删除文件失败: {e!s}")` - ✓ 正确使用

### 6. fetch_douyin_data.py
- 错误情况使用了 error 字段，成功情况使用了 content 字段 - ✓ 正确使用

### 7. fetch_xiaohongshu_data.py
- 错误情况使用了 error 字段，成功情况使用了 content 字段 - ✓ 正确使用

### 8. fetch_zhihu_article_detail.py
- 使用 WebpageToolResult，它继承自 ToolResult，使用了正确的 error 字段 - ✓ 正确使用

### 9. file_search.py
- 第49行：`return ToolResult(content=result)` - ✓ 正确使用

### 10. finish_task.py
- 第34行：`return ToolResult(content=params.message, system="FINISH_TASK")` - ✓ 正确使用

### 11. grep_search.py
- 使用了 `return ToolResult(content=result)` - ✓ 正确使用

### 12. list_dir.py
- 使用了 `return ToolResult(content=result)` - ✓ 正确使用

### 13. get_js_cdn_address.py
- 使用 error 和 content 字段 - ✓ 正确使用

### 14. python_execute.py
- 第85行：`return ToolResult(error=f"执行超时，超过 {timeout} 秒")` - ✓ 正确使用
- 第89行：`return ToolResult(error=error_message)` - ✓ 正确使用
- 第96行：`return ToolResult(content=observation)` - ✓ 正确使用

### 15. read_file.py
- 错误情况使用了 error 字段，成功情况使用了 content 字段 - ✓ 正确使用

### 16. replace_in_file.py
- 错误情况使用了 error 字段，成功情况使用了 content 字段 - ✓ 正确使用

### 17. shell_exec.py
- 第424行：~~`result = ToolResult(error=result_message, data={...})`~~ → 已修改为根据 exit_code 使用 content 或 error 字段，并使用 system 字段存储命令信息 ✓

### 18. thinking.py
- 第85行：`return ToolResult(content="\n".join(output), name=self.name)` - ✓ 正确使用

### 19. use_browser.py
- 使用了 content 字段存储 JSON 形式的错误和成功信息 - ✓ 符合工具特性的使用方式

### 20. workspace_guard_tool.py
- 此文件不直接使用 ToolResult - ✓

### 21. write_to_file.py
- 错误情况使用了 error 字段，成功情况使用了 content 字段 - ✓ 正确使用

### 22. filebase_search.py
- 已完成检查，使用了正确的 content 和 error 字段 - ✓ 正确使用

### 23. bing_search.py
- 使用了 BingSearchToolResult 类，它继承自 ToolResult，使用了正确的 content 和 error 字段 - ✓ 正确使用

### 24. wechat_article_search.py
- 第267行：~~`return ToolResult(content=output, data={...})`~~ → 已修改为 `return ToolResult(content=output, system=json.dumps({...}, ensure_ascii=False))` ✓
- 错误情况使用了 error 字段，成功情况使用了 content 字段 - ✓ 正确使用
