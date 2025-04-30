import json
import os
import shutil
import tempfile
import zipfile
from pathlib import Path
from typing import Any, Dict, List, Optional

from pydantic import Field

from app.core.config_manager import ConfigManager
from app.core.context.tool_context import ToolContext
from app.core.entity.tool.tool_result import MagicSpaceToolResult, ToolResult
from app.logger import get_logger
from app.space.exceptions import ApiError, ValidationError
from app.space.service import MagicSpaceService
from app.tools.core import BaseTool, BaseToolParams, tool

logger = get_logger(__name__)


class DeployToMagicSpaceParams(BaseToolParams):
    """将HTML项目部署到Magic Space的参数"""
    directory_path: str = Field(
        ".workspace",
        description="要部署的目录路径（默认为 .workspace）"
    )
    site_name: Optional[str] = Field(
        None,
        description="站点名称（可选，省略时使用目录名称）"
    )
    target_html: Optional[str] = Field(
        None,
        description="指定要部署的HTML文件（可选，省略时自动检测）"
    )
    target_dir: Optional[str] = Field(
        None,
        description="指定要部署的子目录（可选，省略时部署整个目录）"
    )
    access: str = Field(
        "public", 
        description="访问权限（public/private/password）"
    )
    description: Optional[str] = Field(
        None,
        description="站点描述（可选）"
    )
    auto_detect: bool = Field(
        True,
        description="是否自动检测项目结构（默认为true）"
    )


@tool()
class DeployToMagicSpace(BaseTool[DeployToMagicSpaceParams]):
    """将HTML项目部署到Magic Space平台"""

    # 设置参数类
    params_class = DeployToMagicSpaceParams

    # 设置工具元数据
    name = "deploy_to_magic_space"
    description = """将HTML项目部署到Magic Space平台工具。
本工具可以智能分析HTML项目结构，并将其打包部署到Magic Space平台。

主要功能：
- 智能识别HTML项目结构和相关资源文件
- 支持部署整个目录、特定子目录或单个HTML文件
- 自动过滤与部署无关的文件（如.git、node_modules等）
- 自动创建index.html重定向页面（当需要时）
- 提供完整的部署结果和站点访问链接

使用场景：
- 部署静态网站或单页应用
- 发布HTML报告或文档
- 分享网页原型或设计

部署结果将包含站点名称、URL、文件数量等信息。
"""

    async def execute(
        self,
        tool_context: ToolContext,
        params: DeployToMagicSpaceParams
    ) -> ToolResult:
        """
        执行部署操作

        Args:
            tool_context: 工具上下文
            params: 部署参数

        Returns:
            MagicSpaceToolResult: 部署结果
        """
        try:
            # 解析参数
            directory_path = params.directory_path
            site_name = params.site_name
            target_html = params.target_html
            target_dir = params.target_dir
            access = params.access
            description = params.description
            auto_detect = params.auto_detect

            # 验证并处理目录路径
            workspace_dir = os.path.abspath(directory_path)

            if not os.path.exists(workspace_dir):
                error_result = MagicSpaceToolResult(content="", error=f"工作目录不存在: {directory_path}")
                return error_result

            if not os.path.isdir(workspace_dir):
                error_result = MagicSpaceToolResult(content="", error=f"指定的路径不是目录: {directory_path}")
                return error_result

            # 处理目标目录
            pack_dir = workspace_dir
            target_html_filename = ""

            if target_dir:
                full_target_dir = os.path.join(workspace_dir, target_dir)
                if not os.path.isdir(full_target_dir):
                    error_result = MagicSpaceToolResult(content="", error=f"目标目录不存在: {target_dir}")
                    return error_result
                pack_dir = full_target_dir
                logger.info(f"将从指定的目标目录部署: {target_dir}")

            # 处理目标HTML文件
            if target_html:
                full_target_html = os.path.join(workspace_dir, target_html)
                if not os.path.isfile(full_target_html):
                    error_result = MagicSpaceToolResult(content="", error=f"目标HTML文件不存在: {target_html}")
                    return error_result

                # 获取目标HTML文件的目录作为打包目录
                pack_dir = os.path.dirname(full_target_html)
                logger.info(f"将从目标HTML文件所在目录部署: {pack_dir}")

                # 使用HTML文件名作为主页
                target_html_filename = os.path.basename(full_target_html)

            # 如果没有指定站点名称，使用打包目录名称
            if not site_name:
                site_name = os.path.basename(pack_dir)
                logger.info(f"未指定站点名称，使用目录名称: {site_name}")

            # 创建临时目录用于打包
            with tempfile.TemporaryDirectory() as temp_dir:
                staging_dir = os.path.join(temp_dir, "staging")
                os.makedirs(staging_dir)

                # 分析项目结构，智能识别HTML项目
                if auto_detect:
                    # 检查是否存在 index.html
                    index_html_path = os.path.join(pack_dir, "index.html")
                    has_index_html = os.path.isfile(index_html_path)

                    if not has_index_html and not target_html:
                        # 查找所有HTML文件
                        html_files = self._find_html_files(pack_dir)
                        if not html_files:
                            error_result = MagicSpaceToolResult(content="", error="未找到HTML文件，请确保目录中至少有一个HTML文件")
                            return error_result

                        # 查找可能的主项目
                        project_dirs = self._find_project_dirs(pack_dir)

                        if len(project_dirs) == 1:
                            # 使用找到的单个项目目录
                            pack_dir = project_dirs[0]
                            logger.info(f"找到单个项目目录，将只部署该目录: {pack_dir}")

                # 复制文件到临时目录
                self._copy_project_files(pack_dir, staging_dir)

                # 检查临时目录中是否有HTML文件
                html_files = self._find_html_files(staging_dir)
                if not html_files:
                    error_result = MagicSpaceToolResult(content="", error="处理后的目录中没有HTML文件")
                    return error_result

                # 检查是否需要创建 index.html
                created_index_html = False

                if target_html_filename and target_html_filename != "index.html":
                    # 如果指定了非index.html的目标文件，创建重定向的index.html
                    if not os.path.isfile(os.path.join(staging_dir, "index.html")):
                        self._create_redirect_index_html(staging_dir, target_html_filename)
                        created_index_html = True

                elif not os.path.isfile(os.path.join(staging_dir, "index.html")):
                    # 自动检测项目但缺少index.html，创建重定向
                    # 查找 main.html 或 home.html，如果不存在则使用第一个 HTML 文件
                    main_html_files = [f for f in html_files if "main" in f.lower() or "home" in f.lower()]
                    target_file = main_html_files[0] if main_html_files else html_files[0]

                    # 获取相对路径
                    target_path = os.path.basename(target_file)
                    logger.info(f"创建重定向到 {target_path} 的 index.html 文件")

                    self._create_redirect_index_html(staging_dir, target_path)
                    created_index_html = True
                    target_html_filename = target_path

                # 创建ZIP文件
                zip_path = os.path.join(temp_dir, "deploy.zip")
                self._create_zip_file(staging_dir, zip_path)

                # 调用 Magic Space API 部署
                result = await self._deploy_to_magic_space(zip_path, site_name, access, description)

                # 设置部署结果
                if result:
                    # 计算文件数量
                    file_count = sum(1 for _ in Path(staging_dir).rglob('*') if _.is_file())

                    # 获取HTML文件列表
                    html_files_list = [os.path.basename(f) for f in self._find_html_files(staging_dir)]

                    # 构建结果
                    magic_space_result = MagicSpaceToolResult(content="", error="")
                    
                    # 检查返回的结果结构，确保正确获取站点信息
                    site_id = result.get("id", "")
                    site_name = result.get("name", "")
                    site_url = result.get("url", "")
                    
                    # 如果API返回的是嵌套结构，则从中提取站点信息
                    if not site_id and not site_url and isinstance(result, dict):
                        # 如果返回的result是带有data字段的结构
                        site_data = result.get("data", {})
                        if isinstance(site_data, dict):
                            site_id = site_data.get("id", "")
                            site_name = site_data.get("name", "")
                            site_url = site_data.get("url", "")
                    
                    magic_space_result.set_deployment_result(
                        site_id=site_id,
                        site_name=site_name,
                        site_url=site_url,
                        file_count=file_count,
                        created_index_html=created_index_html,
                        redirect_target=target_html_filename if created_index_html else "",
                        html_files=html_files_list
                    )

                    # 设置输出文本
                    output_dict = {
                        "message": "成功将 HTML 项目部署到 Magic Space",
                        "results": magic_space_result.to_dict()
                    }
                    magic_space_result.content = json.dumps(output_dict, ensure_ascii=False)

                    return magic_space_result
                else:
                    error_result = MagicSpaceToolResult(content="", error="部署失败，无法获取部署结果")
                    return error_result

        except Exception as e:
            logger.exception(f"部署到 Magic Space 过程中出错: {e}")
            error_result = MagicSpaceToolResult(content="", error=f"部署操作失败: {e!s}")
            return error_result

    def _find_html_files(self, directory: str) -> List[str]:
        """
        查找目录中的所有 HTML 文件
        
        Args:
            directory: 要搜索的目录
            
        Returns:
            List[str]: HTML 文件路径列表
        """
        html_files = []
        for root, _, files in os.walk(directory):
            for file in files:
                if file.lower().endswith(".html") or file.lower().endswith(".htm"):
                    html_files.append(os.path.join(root, file))
        return html_files

    def _find_project_dirs(self, directory: str) -> List[str]:
        """
        在目录中查找可能的项目目录
        
        Args:
            directory: 要搜索的目录
            
        Returns:
            List[str]: 可能的项目目录列表
        """
        project_dirs = []

        # 检查一级子目录
        for item in os.listdir(directory):
            item_path = os.path.join(directory, item)

            if os.path.isdir(item_path):
                # 检查子目录中是否有 HTML 文件
                html_files = self._find_html_files(item_path)

                # 检查是否存在 index.html
                has_index_html = any(os.path.basename(f).lower() == "index.html" for f in html_files)

                # 检查是否有 CSS 和 JS 文件
                has_css = any(os.path.exists(os.path.join(item_path, d)) for d in ["css", "style", "styles"])
                has_js = any(os.path.exists(os.path.join(item_path, d)) for d in ["js", "script", "scripts"])

                # 如果子目录包含 HTML 文件，且存在 index.html 或有 CSS/JS 文件，则认为是项目目录
                if html_files and (has_index_html or has_css or has_js):
                    project_dirs.append(item_path)

        return project_dirs

    def _copy_project_files(self, source_dir: str, target_dir: str) -> None:
        """
        复制项目文件到临时目录，排除无关文件
        
        Args:
            source_dir: 源目录
            target_dir: 目标目录
        """
        def should_exclude(path: str) -> bool:
            """判断是否应该排除该路径"""
            exclude_dirs = [
                ".git", ".github", "node_modules", "__pycache__", 
                ".vscode", ".idea", "venv", ".venv", "env", ".env",
                "dist", "build", ".cache", "tmp", "temp", "logs"
            ]

            exclude_files = [
                ".gitignore", ".DS_Store", "package-lock.json", "yarn.lock",
                "Dockerfile", "docker-compose.yml", ".env", ".env.local",
                "README.md", "LICENSE", ".npmignore", ".eslintrc"
            ]

            path_parts = path.split(os.sep)
            filename = os.path.basename(path)

            # 排除隐藏文件（以.开头）
            if filename.startswith(".") and not filename.endswith(".html"):
                return True

            # 排除指定目录
            for part in path_parts:
                if part in exclude_dirs:
                    return True

            # 排除特定文件
            if filename in exclude_files:
                return True

            return False

        # 递归复制文件
        for root, dirs, files in os.walk(source_dir):
            # 过滤排除的目录
            dirs[:] = [d for d in dirs if not should_exclude(os.path.join(root, d))]

            # 创建相对路径
            rel_path = os.path.relpath(root, source_dir)
            if rel_path == ".":
                rel_path = ""

            # 创建目标目录
            target_path = os.path.join(target_dir, rel_path)
            os.makedirs(target_path, exist_ok=True)

            # 复制文件
            for file in files:
                if not should_exclude(os.path.join(root, file)):
                    source_file = os.path.join(root, file)
                    target_file = os.path.join(target_path, file)
                    shutil.copy2(source_file, target_file)

    def _create_redirect_index_html(self, directory: str, target_file: str) -> None:
        """
        创建重定向到目标 HTML 文件的 index.html
        
        Args:
            directory: 目标目录
            target_file: 目标 HTML 文件名
        """
        index_path = os.path.join(directory, "index.html")

        # 创建重定向 HTML
        html_content = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="0;url={target_file}">
    <title>重定向到 {target_file}</title>
    <script>
        window.location.href = "{target_file}";
    </script>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            margin: 0;
            padding: 20px;
            text-align: center;
            line-height: 1.6;
        }}
        .container {{
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            border-radius: 8px;
            background-color: #f8f9fa;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }}
        h1 {{
            color: #333;
            font-size: 24px;
            margin-bottom: 20px;
        }}
        p {{
            color: #666;
            margin-bottom: 15px;
        }}
        a {{
            color: #007bff;
            text-decoration: none;
            font-weight: bold;
        }}
        a:hover {{
            text-decoration: underline;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>正在重定向...</h1>
        <p>如果页面没有自动跳转，请点击下面的链接：</p>
        <p><a href="{target_file}">{target_file}</a></p>
    </div>
</body>
</html>"""

        # 写入文件
        with open(index_path, "w", encoding="utf-8") as f:
            f.write(html_content)

        logger.info(f"已创建重定向 index.html 指向 {target_file}")

    def _create_zip_file(self, source_dir: str, output_path: str) -> None:
        """
        将源目录打包为 ZIP 文件
        
        Args:
            source_dir: 源目录
            output_path: 输出 ZIP 文件路径
        """
        with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, _, files in os.walk(source_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    zipf.write(
                        file_path, 
                        os.path.relpath(file_path, source_dir)
                    )

        logger.info(f"已创建部署 ZIP 文件: {output_path}")

    async def _deploy_to_magic_space(
        self, 
        zip_path: str, 
        site_name: str, 
        access: str, 
        description: Optional[str]
    ) -> Optional[Dict[str, Any]]:
        """
        将 ZIP 文件部署到 Magic Space
        
        Args:
            zip_path: ZIP 文件路径
            site_name: 站点名称
            access: 访问权限
            description: 站点描述
            
        Returns:
            Optional[Dict[str, Any]]: 部署结果
        """
        try:
            # 获取 Magic Space 配置
            config = ConfigManager()
            magic_space_config = config.get('magic_space', {})

            # 检查 API 密钥是否存在
            if not magic_space_config.get('api_key'):
                logger.error("Magic Space API Key 未配置，请检查配置文件")
                return None

            # 创建 MagicSpace 服务
            api_key = magic_space_config.get('api_key')
            base_url = magic_space_config.get('api_base_url')
            
            # 确保 base_url 参数正确传递
            magic_space = MagicSpaceService(api_key=api_key)
            if base_url:
                magic_space = MagicSpaceService(api_key=api_key, base_url=base_url)

            # 构建部署参数
            deploy_data = {
                "name": site_name,
                "access": access
            }

            if description:
                deploy_data["description"] = description

            # 执行部署
            logger.info(f"开始部署HTML项目到Magic Space，站点名称: {site_name}")
            response = await magic_space.deploy_from_zip(
                zip_path=zip_path,
                site_name=site_name,
                options=deploy_data
            )

            # 检查结果
            if response.get("success") and "data" in response:
                site_data = response.get("data", {})
                logger.info(f"部署成功：{site_data.get('url', '未获取到站点URL')}")
                return site_data
            else:
                error = response.get("error", "未知错误")
                logger.error(f"部署失败: {error}")
                return None

        except ApiError as e:
            logger.exception(f"Magic Space API 错误: {e}")
            return None
        except ValidationError as e:
            logger.exception(f"Magic Space 验证错误: {e}")
            return None
        except Exception as e:
            logger.exception(f"部署过程中出现错误: {e}")
            return None

    async def get_tool_detail(self, tool_context: ToolContext, result: ToolResult, arguments: Dict[str, Any] = None) -> Optional[Dict[str, Any]]:
        """
        获取工具详情

        Args:
            tool_context: 工具上下文
            result: 工具结果
            arguments: 工具参数

        Returns:
            Optional[Dict[str, Any]]: 工具详情
        """
        if not result.content:
            return {"status": "failed", "error": result.error}

        try:
            result_data = json.loads(result.content)
            return {"status": "success", "data": result_data}
        except Exception:
            return {"status": "failed", "error": "无法解析部署结果"}

    async def get_after_tool_call_friendly_action_and_remark(self, tool_name: str, tool_context: ToolContext, result: ToolResult, execution_time: float, arguments: Dict[str, Any] = None) -> Dict:
        """
        获取工具调用后的友好动作和备注

        Args:
            tool_name: 工具名称
            tool_context: 工具上下文
            result: 工具结果
            execution_time: 执行时间
            arguments: 工具参数

        Returns:
            Dict: 友好动作和备注
        """
        return {
            "action": "执行 Magic Space 部署",
            "remark": "部署 HTML 项目到 Magic Space 平台",
        } 
