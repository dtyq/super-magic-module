from typing import Any, Dict, List, Optional
from datetime import datetime

from pydantic import Field

from app.core.context.tool_context import ToolContext
from app.core.entity.factory.tool_detail_factory import ToolDetailFactory
from app.core.entity.message.server_message import ToolDetail
from app.core.entity.tool.tool_result import ReasoningToolResult, ToolResult
from app.llm.factory import LLMFactory
from app.logger import get_logger
from app.tools.core import BaseTool, BaseToolParams, tool
from app.tools.read_file import ReadFile, ReadFileParams

logger = get_logger(__name__)


class ReasoningParams(BaseToolParams):
    """推理工具参数"""
    query: str = Field(
        ...,
        description="需要进行推理的问题或任务，详细描述清楚推理需求"
    )
    reference_files: List[str] = Field(
        ...,
        description="参考文件路径列表，这些文件的内容将作为参考材料附加到推理查询中，是至关重要的内容"
    )


@tool()
class Reasoning(BaseTool[ReasoningParams]):
    """推理工具"""

    # 设置参数类
    params_class = ReasoningParams

    # 设置工具元数据
    name = "reasoning"
    description = """推理工具，用于解决复杂问题、逐步推理和论证。

适用于包括但不限于以下场景：
- 解决需要多步推理的复杂问题
- 逻辑谜题和推理挑战
- 科学问题的分析和解答
- 复杂决策的利弊分析

要求：
- 所有内容必须基于参考文件，不要虚构内容，不要编造事实，不要生成没有根据的结论

调用示例：
```
{
    "query": "请根据参考文件，生成一篇关于 AI 的 Markdown 文章，微信公众号风格，内容深刻富有见地",
    "reference_files": ["./webview_report/file1.md", "./webview_report/file2.md"]
}
```
"""

    async def execute(
        self,
        tool_context: ToolContext,
        params: ReasoningParams
    ) -> ToolResult:
        """执行推理并返回格式化的结果。

        Args:
            tool_context: 工具上下文
            params: 推理参数对象

        Returns:
            ReasoningToolResult: 包含推理结果的工具结果
        """
        try:
            # 获取参数
            query = params.query
            files = params.files or []

            # 检查文件数量
            if len(files) < 3:
                error_msg = "为确保推理的结果有可靠的来源依据，参考文件的数量不得小于三个，建议进行联网搜索获取足够的信息源后再进行推理"
                logger.warning(f"推理中止：{error_msg} (提供了 {len(files)} 个文件)")
                return ReasoningToolResult(error=error_msg)

            # 固定值，未来可能会重新放到参数里
            temperature = 0.7
            model_id = "deepseek-reasoner"

            # 记录推理请求
            logger.info(f"执行推理: 查询={query}, 文件数量={len(files)}, 模型={model_id}")

            # 处理参考文件
            reference_materials = ""
            if files:
                reference_materials = await self._process_reference_files(tool_context, files)

            # 获取并格式化当前时间上下文
            current_time_str = datetime.now().strftime("%Y年%m月%d日 %H:%M:%S 星期{}(第%W周)".format(["一", "二", "三", "四", "五", "六", "日"][datetime.now().weekday()]))

            # context_info 包含第一个分隔符
            context_info = f"当前上下文信息:\n当前时间: {current_time_str}\n\n---\n\n"

            # 定义提示语
            prompt_text = "请完全根据参考资料输出内容，严禁杜撰信息、严禁虚构内容、严禁虚假引用，严禁编造内容，严禁编造名人名言，所有内容都需要有来源出处引用标注，且所有引用都要来源于参考资料！！！参考资料中会有元数据信息，写明了网页的标题和来源，因此引用标注可以是一个 Markdown 链接，如：引用自[《网页标题》](网页URL)！"

            # 创建查询部分列表
            query_parts = []

            # 添加开头的提示语
            query_parts.append(prompt_text + "\n\n---\n\n")

            # 添加上下文信息
            query_parts.append(context_info)

            # 如果有参考资料，添加资料和它后面的分隔符
            if reference_materials:
                query_parts.append(f"参考材料（请充分利用）：\n{reference_materials}\n\n---\n\n")

            # 添加用户问题
            query_parts.append(f"用户问题：{query}")

            # 在末尾再次添加提示语
            query_parts.append("\n\n---\n\n再次强调：" + prompt_text + "你需要一步一步思考，是否所有内容都是基于已有的参考资料与事实生成的，再完成你的推理。")

            full_query = "".join(query_parts) # 将所有部分连接起来

            # 构建推理消息
            messages = [
                {
                    "role": "system",
                    "content": "" # 系统消息恢复为空
                },
                {
                    "role": "user",
                    "content": full_query
                }
            ]

            # 请求模型
            response = await LLMFactory.call_with_tool_support(
                model_id=model_id,
                messages=messages,
                tools=None,  # 不需要工具支持
                stop=None,
                agent_context=tool_context.agent_context
            )

            # 处理响应
            if not response or not response.choices or len(response.choices) == 0:
                return ReasoningToolResult(error="没有从模型收到有效响应")

            # 获取模型原生的推理内容和结论
            message = response.choices[0].message
            reasoning_content = getattr(message, "reasoning_content", "")
            content = message.content

            # 创建结果
            result = ReasoningToolResult(content=content)
            if reasoning_content:
                result.set_reasoning_content(reasoning_content)

            return result

        except Exception as e:
            logger.exception(f"推理操作失败: {e!s}")
            return ReasoningToolResult(error=f"推理操作失败: {e!s}")

    async def get_tool_detail(self, tool_context: ToolContext, result: ToolResult, arguments: Dict[str, Any] = None) -> Optional[ToolDetail]:
        """
        生成工具详情，用于前端展示

        Args:
            tool_context: 工具上下文
            result: 工具结果
            arguments: 工具参数

        Returns:
            Optional[ToolDetail]: 工具详情
        """
        if not result.content:
            return None

        try:
            if not isinstance(result, ReasoningToolResult):
                return None

            # 返回结构化数据用于前端展示
            return ToolDetailFactory.create_reasoning_detail(
                title="推理结果",
                reasoning_content=result.reasoning_content or "无推理过程",
                content=result.content
            )
        except Exception as e:
            logger.error(f"生成工具详情失败: {e!s}")
            return None

    async def get_after_tool_call_friendly_action_and_remark(self, tool_name: str, tool_context: ToolContext, result: ToolResult, execution_time: float, arguments: Dict[str, Any] = None) -> Dict:
        """获取工具调用后的友好动作和备注"""
        if not arguments or "query" not in arguments:
            return {
                "action": "复杂推理",
                "remark": "已完成推理"
            }

        query = arguments["query"]
        # 截取问题前15个字符作为备注，防止过长
        short_query = query[:100] + "..." if len(query) > 100 else query
        return {
            "action": "复杂推理",
            "remark": f"推理问题: {short_query}"
        }

    async def _process_reference_files(self, tool_context: ToolContext, file_paths: List[str]) -> str:
        """处理参考文件，使用 ReadFile 工具读取内容并格式化

        Args:
            tool_context: 工具上下文
            file_paths: 文件路径列表

        Returns:
            str: 格式化后的参考材料内容
        """
        reference_content = []
        read_file_tool = ReadFile()

        for i, file_path in enumerate(file_paths, 1):
            try:
                # 使用 ReadFile 工具读取文件内容
                read_file_params = ReadFileParams(
                    file_path=file_path,
                    should_read_entire_file=True
                )

                # @FIXME: 使用不依赖 tool_context 的方法来调用
                result = await read_file_tool.execute(tool_context, read_file_params)

                if result.ok:
                    content = result.content
                    # 提取文件名
                    file_name = file_path.split('/')[-1]
                    reference_content.append(f"[文件{i}: {file_name}]\n{content}")
                else:
                    logger.error(f"读取参考文件 {file_path} 失败: {result.content}")
                    reference_content.append(f"[文件{i}: {file_path}] 读取失败: {result.content}")
            except Exception as e:
                logger.error(f"处理参考文件 {file_path} 时发生异常: {e}")
                reference_content.append(f"[文件{i}: {file_path}] 处理异常: {e!s}")

        # 用分隔线连接所有参考内容
        if reference_content:
            return "\n\n---\n\n".join(reference_content)
        return ""
