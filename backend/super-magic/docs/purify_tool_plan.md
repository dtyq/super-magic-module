# Purify 工具技术方案

1.  **目标**: 创建一个名为 `Purify` 的新工具，用于清理文本文件，移除用户定义或通用的无关行（如广告、导航、页眉/页脚、版权信息、非必要的注释、过多空行等），遵循"简单的力量"原则。
2.  **核心功能**: 读取指定文件，将内容按行添加行号后提交给 LLM，要求 LLM 根据通用规则和用户提供的可选标准 (`criteria`) 返回需要删除的行号，最后根据行号列表清理原始文件内容。
3.  **文件位置**: 新建 `app/tools/purify.py`。
4.  **参数定义 (`PurifyParams`)**:
    *   `file_path: str`: 必需，需要净化的文件的路径。
    *   `criteria: Optional[str] = None`: 可选，用户自定义的净化标准描述，例如 "移除所有包含'广告'的行" 或 "只保留正文内容"。
5.  **主要类 (`Purify`)**:
    *   继承 `BaseTool[PurifyParams]`。
    *   设置 `name = "purify"` 和清晰的 `description`。
    *   实现 `execute` 方法，调用 `execute_purely`。
    *   **`execute_purely` 方法**:
        *   **读取文件**: 使用 `aiofiles` 异步读取 `params.file_path` 的完整内容。处理文件不存在或读取权限等异常。
        *   **调用净化逻辑**: 将读取到的文件内容和 `params.criteria` 传递给内部辅助方法 `_get_purified_content`。
        *   **处理结果**: 如果 `_get_purified_content` 成功返回净化后的内容，则创建成功的 `ToolResult`；否则，创建包含错误信息的 `ToolResult`。
    *   **`_get_purified_content` 方法**:
        *   接收原始文件内容 `content` 和 `criteria`。
        *   **预处理**: 将 `content` 按行分割。
        *   **添加行号**: 创建一个新的文本版本，每行开头加上 `行号:`（1-based indexing）。
        *   **（可选）截断处理**: 为防止超出 LLM 上下文限制，可以考虑对带行号的文本进行 Token 或字符数截断（参考 `summarize.py` 的 `DEFAULT_MAX_TOKENS` 和 `truncate_text_by_token`）。如果发生截断，需要记录日志并可能在结果中告知用户。
        *   **构建 Prompt**:
            *   设定角色："你是一个文本净化助手。"
            *   任务描述："分析以下带行号的文本内容，识别出需要删除的行。通用删除标准包括：广告、导航链接、页眉、页脚、版权声明、无关的元数据、非主要内容的注释、连续的多个空行等。"
            *   用户标准（如果 `criteria` 提供）："请特别注意以下用户要求：{criteria}"。
            *   输出要求："**请严格按照格式要求，仅输出需要删除的行的行号列表，以英文逗号分隔，不要包含任何其他文字或解释。例如：3,5,10,11,25**"
            *   附上带行号的文本内容。
        *   **调用 LLM**: 使用 `LLMFactory.call_with_tool_support`（或其他合适的 LLM 调用方式）发送 Prompt。
        *   **解析响应**:
            *   获取 LLM 返回的文本。
            *   使用正则表达式 `\d+` 提取所有数字（行号）。
            *   将提取到的数字字符串转换为整数列表。进行错误处理，忽略无效条目。
        *   **过滤内容**: 遍历**原始**文件内容的行（按 `\n` 分割的列表），根据解析出的行号列表，保留那些行号**不**在列表中的行。
        *   **重组内容**: 将保留的行用 `\n` 重新连接成净化后的文本字符串。
        *   返回净化后的字符串。
    *   **`get_tool_detail`**: 参考 `summarize.py`，用于前端展示净化后的内容（可能是 Markdown 格式）。
    *   **`get_after_tool_call_friendly_action_and_remark`**: 参考 `summarize.py`，提供操作反馈。
6.  **依赖**: 确认项目中已安装 `aiofiles`，如未安装则添加到 `requirements.txt`。
7.  **代码风格**: 遵循"简单的力量"，代码简洁、函数职责清晰、注释到位。
