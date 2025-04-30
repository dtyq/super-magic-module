import json
import subprocess
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, model_validator


class ToolResult(BaseModel):
    """Represents the result of a tool execution.

    正确的使用方式:
    1. 成功结果:
       ```python
       # 返回成功结果
       return ToolResult(
           content="操作成功的结果内容",  # 必填，结果内容
           system="可选的系统信息，不会展示给用户",  # 可选
           name="工具名称"  # 可选
       )
       ```

    2. 错误结果:
       ```python
       # 使用 error 参数
       return ToolResult(
           error="发生了错误: xxx"  # 验证器会自动设置 content 并将 ok 设为 False
       )
       ```

    注意:
    - 不能同时设置 error 和 content 参数
    - error 参数会被自动转换为 content 内容，并将 ok 设为 False
    - 在异常处理中，推荐使用 error 参数来标记错误
    """

    content: str = Field(description="工具执行的结果内容，将作为输出返回给大模型")
    ok: bool = Field(default=True, description="工具执行是否成功")
    extra_info: Optional[Dict[str, Any]] = Field(default=None, description="工具执行的额外信息，不会展示给用户")
    system: Optional[str] = Field(default=None)
    tool_call_id: Optional[str] = Field(default=None)
    name: Optional[str] = Field(default=None)
    execution_time: float = Field(default=0.0, description="工具执行耗时（秒）")
    explanation: Optional[str] = Field(default=None, description="大模型执行此工具的意图解释")

    # 方案：在 ToolResult 类中添加一个模型验证器，当通过 error 参数传入值时，自动设置 content 字段并将 ok 置为 false。
    @model_validator(mode='before')
    @classmethod
    def handle_error_parameter(cls, data):
        if not isinstance(data, dict):
            return data

        if 'error' in data and data['error'] is not None:
            if data.get('content') and data['content'] != "":
                raise ValueError("不能同时设置 'error' 和 'content' 参数")

            # 将 error 的值设置到 content
            data['content'] = data.pop('error')
            # 将 ok 设为 False
            data['ok'] = False

        return data

    class Config:
        arbitrary_types_allowed = True

    def __bool__(self):
        return any(getattr(self, field) for field in self.model_fields)

    def __add__(self, other: "ToolResult"):
        def combine_fields(field: Optional[str], other_field: Optional[str], concatenate: bool = True):
            if field and other_field:
                if concatenate:
                    return field + other_field
                raise ValueError("Cannot combine tool results")
            return field or other_field or ""

        return ToolResult(
            content=combine_fields(self.content, other.content),
            system=combine_fields(self.system, other.system),
            tool_call_id=self.tool_call_id or other.tool_call_id,
            name=self.name or other.name,
            execution_time=self.execution_time + other.execution_time,  # 累加执行时间
            explanation=self.explanation or other.explanation,  # 保留第一个非空的explanation
            ok=self.ok and other.ok,  # 只有两者都成功才算成功
        )

    def __str__(self):
        return f"Error: {self.content}" if not self.ok else self.content

    def model_dump_json(self, **kwargs) -> str:
        """将ToolResult对象转换为JSON字符串

        Args:
            **kwargs: 传递给json.dumps的参数

        Returns:
            str: JSON字符串
        """
        return json.dumps(self.model_dump(), **kwargs)

class SearchResult(BaseModel):
    """单个搜索结果项"""
    title: str
    url: str
    snippet: Optional[str] = None
    source: Optional[str] = None
    icon_url: Optional[str] = None  # 添加网站图标URL字段


class BingSearchToolResult(ToolResult):
    """必应搜索工具的结构化结果"""
    # 存放需要返回给大模型的搜索结果
    output_results: Dict[str, List[SearchResult]] = Field(default_factory=dict)
    # 存放需要返回给客户端的搜索结果
    search_results: Dict[str, List[SearchResult]] = Field(default_factory=dict)

    def set_output_results(self, query: str, results: List[Dict[str, Any]]) -> None:
        """将原始搜索结果转换为结构化的output_results

        Args:
            query: 搜索查询字符串
            results: 原始搜索结果列表
        """
        if query not in self.output_results:
            self.output_results[query] = []

        for result in results:
            search_result = SearchResult(
                title=result.get("title", ""),
                url=result.get("link", ""),
            )
            self.output_results[query].append(search_result)

    def set_search_results(self, query: str, results: List[Dict[str, Any]]) -> None:
        """将原始搜索结果转换为结构化的search_results

        Args:
            query: 搜索查询字符串
            results: 原始搜索结果列表
        """
        if query not in self.search_results:
            self.search_results[query] = []

        for result in results:
            search_result = SearchResult(
                title=result.get("title", ""),
                url=result.get("link", ""),
                snippet=result.get("snippet"),
                source=result.get("source"),
                icon_url=result.get("icon_url", "")  # 添加图标URL，仅用于客户端显示
            )
            self.search_results[query].append(search_result)

    def add_query_results(self, query: str, results: List[SearchResult]) -> None:
        """添加查询结果到search_results

        Args:
            query: 搜索查询字符串
            results: 结构化的搜索结果列表
        """
        self.search_results[query] = results

    def output_results_to_dict(self) -> Dict[str, List[Dict[str, Any]]]:
        """将output_results转换为字典格式

        Returns:
            Dict[str, List[Dict[str, Any]]]: 转换后的字典
        """
        result_dict = {}
        for k, v in self.output_results.items():
            result_dict[k] = []
            for r in v:
                # 转换为字典
                item_dict = r.model_dump()
                # 移除空值字段
                if item_dict.get("snippet") is None:
                    item_dict.pop("snippet", None)
                if item_dict.get("source") is None:
                    item_dict.pop("source", None)
                if item_dict.get("icon_url") is None:
                    item_dict.pop("icon_url", None)
                result_dict[k].append(item_dict)
        return result_dict

class TerminalToolResult(ToolResult):
    """终端命令执行工具的结构化结果"""
    command: str = Field(default="", description="执行的终端命令")
    exit_code: int = Field(default=0, description="命令执行的退出码，0表示成功")

    def set_command(self, command: str) -> None:
        """设置执行的终端命令

        Args:
            command: 终端命令
        """
        self.command = command

    def set_exit_code(self, exit_code: int) -> None:
        """设置命令执行的退出码

        Args:
            exit_code: 退出码，通常0表示成功
        """
        self.exit_code = exit_code

    def _handle_terminal_result(self, process_result: subprocess.CompletedProcess, command: str) -> None:
        """从subprocess执行结果中设置属性

        Args:
            process_result: subprocess.CompletedProcess对象
            command: 执行的命令
        """
        self.command = command
        self.exit_code = process_result.returncode

        # 处理输出
        if process_result.stdout:
            self.content = process_result.stdout.strip()

        if process_result.stderr:
            self.content = process_result.stderr.strip()


class BrowserToolResult(ToolResult):
    """浏览器工具的结构化结果"""
    url: Optional[str] = Field(default=None, description="访问的URL")
    operation: str = Field(default="", description="执行的浏览器操作")
    oss_key: Optional[str] = Field(default=None, description="截图的对象存储键值")
    title: Optional[str] = Field(default=None, description="页面标题")


class WebpageToolResult(ToolResult):
    """网页相关工具的结构化结果，用于知乎、小红书等平台的内容获取工具"""
    url: Optional[str] = Field(default=None, description="内容的原始URL")
    title: Optional[str] = Field(default=None, description="内容标题")

    def set_url(self, url: str) -> None:
        """设置内容URL

        Args:
            url: 内容的原始URL
        """
        self.url = url

    def set_title(self, title: str) -> None:
        """设置内容标题

        Args:
            title: 内容标题
        """
        self.title = title


class ReasoningToolResult(ToolResult):
    """推理工具的结构化结果，对应 deepseek-reasoner 模型输出"""
    reasoning_content: Optional[str] = Field(default=None, description="详细的推理过程内容")

    def set_reasoning_content(self, reasoning_content: str) -> None:
        """设置推理过程内容

        Args:
            reasoning_content: 详细的推理过程内容
        """
        self.reasoning_content = reasoning_content


class MagicSpaceToolResult(ToolResult):
    """Magic Space工具结果"""

    # 部署结果数据
    site_id: str = Field(default="", description="部署站点ID")
    site_name: str = Field(default="", description="部署站点名称")
    site_url: str = Field(default="", description="部署站点URL")
    file_count: int = Field(default=0, description="部署文件数量")
    created_index_html: bool = Field(default=False, description="是否创建了index.html")
    redirect_target: str = Field(default="", description="重定向目标")
    html_files: List[str] = Field(default_factory=list, description="HTML文件列表")
    success: bool = Field(default=False, description="部署是否成功")
    deploy_status: str = Field(default="", description="部署状态")
    deploy_error: str = Field(default="", description="部署错误信息")

    def set_deployment_result(
        self,
        site_id: str,
        site_name: str,
        site_url: str,
        file_count: int = 0,
        created_index_html: bool = False,
        redirect_target: str = "",
        html_files: List[str] = None,
        deploy_status: str = "",
        deploy_error: str = ""
    ):
        """设置部署结果"""
        self.site_id = site_id
        self.site_name = site_name
        self.site_url = site_url
        self.file_count = file_count
        self.created_index_html = created_index_html
        self.redirect_target = redirect_target
        self.html_files = html_files or []
        self.success = True
        self.deploy_status = deploy_status
        self.deploy_error = deploy_error

    def to_dict(self) -> Dict[str, Any]:
        """将部署结果转换为字典格式"""
        return {
            "success": self.success,
            "site_id": self.site_id,
            "site_name": self.site_name,
            "site_url": self.site_url,
            "file_count": self.file_count,
            "created_index_html": self.created_index_html,
            "redirect_target": self.redirect_target,
            "html_files": self.html_files,
            "deploy_status": self.deploy_status,
            "deploy_error": self.deploy_error
        }

class YFinanceToolResult(ToolResult):
    """金融数据工具的结构化结果，用于存储 YFinance 查询结果"""

    ticker: Optional[str] = Field(default=None, description="股票代码")
    query_type: Optional[str] = Field(default=None, description="查询类型，如 history, info, news 等")
    time_period: Optional[str] = Field(default=None, description="查询的时间范围")

    def set_ticker(self, ticker: str) -> None:
        """设置股票代码

        Args:
            ticker: 股票代码
        """
        self.ticker = ticker

    def set_query_type(self, query_type: str) -> None:
        """设置查询类型

        Args:
            query_type: 查询类型，如 history, info, news 等
        """
        self.query_type = query_type

    def set_time_period(self, time_period: str) -> None:
        """设置查询的时间范围

        Args:
            time_period: 查询的时间范围，如 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max
        """
        self.time_period = time_period

class AskUserToolResult(ToolResult):
    """用户询问工具的结构化结果，用于向用户提出问题并等待回复"""

    question: str = Field(
        ...,  # 必填字段
        description="要向用户提出的问题或请求"
    )

    type: Optional[str] = Field(
        default=None,
        description="内容类型，例如 'todo'"
    )

    content: Optional[str] = Field(
        default=None,
        description="与问题相关的内容"
    )

    def set_question(self, question: str) -> None:
        """设置问题内容

        Args:
            question: 向用户提出的问题
        """
        self.question = question

    def set_type(self, type: str) -> None:
        """设置内容类型

        Args:
            type: 内容类型，例如 'todo'
        """
        self.type = type

    def set_content(self, content: str) -> None:
        """设置相关内容

        Args:
            content: 与问题相关的内容
        """
        self.content = content

class ImageToolResult(ToolResult):
    """图片工具的结构化结果"""
    image_url: Optional[str] = Field(default=None, description="图片的URL（已弃用，请使用images）")
    images: List[str] = Field(default_factory=list, description="图片URL列表")

    def set_image_url(self, image_url: str) -> None:
        """设置单张图片的URL（已弃用，请使用set_images）

        Args:
            image_url: 图片的URL
        """
        self.image_url = image_url
        # 同时兼容旧接口，将图片添加到images列表中
        if image_url and image_url not in self.images:
            self.images.append(image_url)

    def set_images(self, images: List[str]) -> None:
        """设置多张图片的URL列表

        Args:
            images: 图片URL列表
        """
        self.images = images
        # 同时更新image_url以保持向后兼容
        if images:
            self.image_url = images[0]
