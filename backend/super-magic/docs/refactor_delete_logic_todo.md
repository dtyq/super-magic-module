# 重构文件删除逻辑 Todo

- [x] 在 `app/utils/` 下创建 `file_system_utils.py` 文件。
- [x] 在 `file_system_utils.py` 中实现 `safe_delete(path: Path)` 函数，包含 `trash` 检查和回退逻辑。
- [x] 修改 `bin/magic.py`，导入并使用 `app.utils.file_system_utils.safe_delete` 来清理 `CHAT_HISTORY_DIR` 和 `WORKSPACE_DIR`。（同步版本）
- [x] 修改 `app/tools/delete_file.py`，导入并使用 `app.utils.file_system_utils.safe_delete` 来执行文件删除，替换原有逻辑。（同步版本）
- [x] 添加 `aiofiles` 到项目依赖（例如 `requirements.txt` 或 `pyproject.toml`）。
- [x] 重构 `app/utils/file_system_utils.safe_delete` 为异步函数，优先使用 `aiofiles.os` 相关函数 (`exists`, `isfile`, `isdir`, `remove`)，对于递归删除目录 (`shutil.rmtree`) 保留使用 `asyncio.to_thread`。
- [x] 确认 `bin/magic.py` 和 `app/tools/delete_file.py` 中的异步调用逻辑无需更改。
- [x] 将 `bin/magic.py` 中的 `mount_directory` 函数改造为 `async def`，优先使用 `aiofiles.os`，并使用 `asyncio.to_thread` 包装 `shutil.copy2`。
- [x] 修改 `bin/magic.py` 的 `main` 函数以 `await` 调用 `mount_directory`。
- [ ] 验证修改后的功能是否正常，包括 `mount_directory` 和 `safe_delete` 的异步行为及错误处理。
