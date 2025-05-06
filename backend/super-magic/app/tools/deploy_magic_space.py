"""
Magic Space 部署工具模块

提供将指定工作目录打包并部署到 Magic Space 平台的功能。
"""

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
from app.space.service import MagicSpaceService
from app.tools.core import BaseTool, BaseToolParams, tool

logger = get_logger(__name__)


class DeployToMagicSpaceParams(BaseToolParams):
    """将指定目录部署到Magic Space的参数"""
    workspace_path: str = Field(
        ...,
        description="要部署的工作目录路径"
    )
    site_name: str = Field(
        ...,
        description="部署后的站点名称"
    )


@tool()
class DeployToMagicSpace(BaseTool[DeployToMagicSpaceParams]):
    """将指定工作目录打包并部署到Magic Space平台
    
    此工具可以将指定工作目录下的文件打包，并通过API部署到Magic Space平台。
    
    主要功能：
    1. 将目标目录复制到临时目录
    2. 处理HTML文件，自动创建index.html（如果不存在）
    3. 将临时目录打包成ZIP文件
    4. 通过API将ZIP文件部署到Magic Space平台
    5. 返回部署结果和站点访问链接
    """

    # 设置参数类型
    params_class = DeployToMagicSpaceParams

    async def execute(self, tool_context: ToolContext, params: DeployToMagicSpaceParams) -> MagicSpaceToolResult:
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
            workspace_path = params.workspace_path
            site_name = params.site_name

            # 验证工作目录路径
            if not os.path.exists(workspace_path):
                error_result = MagicSpaceToolResult(error=f"工作目录不存在: {workspace_path}")
                return error_result

            if not os.path.isdir(workspace_path):
                error_result = MagicSpaceToolResult(error=f"指定的路径不是目录: {workspace_path}")
                return error_result

            # 创建临时目录
            with tempfile.TemporaryDirectory() as temp_dir:
                # 1. 复制文件到临时目录
                staging_dir = os.path.join(temp_dir, "staging")
                os.makedirs(staging_dir)
                self._copy_files(workspace_path, staging_dir)

                # 2. 检查是否有HTML文件
                html_files = self._find_html_files(staging_dir)
                if not html_files:
                    error_result = MagicSpaceToolResult(error="目录中没有HTML文件")
                    return error_result

                # 3. 检查是否有index.html，如果没有则创建重定向文件
                created_index_html = False
                target_html = ""
                if not os.path.isfile(os.path.join(staging_dir, "index.html")):
                    # 选择第一个HTML文件作为重定向目标
                    target_html = os.path.basename(html_files[0])
                    self._create_redirect_index_html(staging_dir, target_html)
                    created_index_html = True
                    logger.info(f"创建了重定向到 {target_html} 的 index.html")

                # 4. 创建ZIP文件
                zip_path = os.path.join(temp_dir, "deploy.zip")
                self._create_zip_file(staging_dir, zip_path)

                # 5. 调用API部署
                result = await self._deploy_to_magic_space(zip_path, site_name)

                # 6. 处理结果
                if result:
                    # 计算文件数量
                    file_count = sum(1 for _ in Path(staging_dir).rglob('*') if _.is_file())

                    # 获取HTML文件列表
                    html_files_list = [os.path.basename(f) for f in self._find_html_files(staging_dir)]

                    # 构建结果
                    magic_space_result = MagicSpaceToolResult(content="")
                    
                    # 获取站点信息
                    site_id = result.get("id", "")
                    site_name = result.get("name", "")
                    site_url = result.get("url", "")
                    
                    # 如果API返回的是嵌套结构，则从中提取站点信息
                    if not site_id and not site_url and isinstance(result, dict):
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
                        redirect_target=target_html if created_index_html else "",
                        html_files=html_files_list
                    )

                    # 设置输出文本
                    output_dict = {
                        "message": f"成功将 {workspace_path} 部署到 Magic Space",
                        "results": magic_space_result.to_dict()
                    }
                    magic_space_result.content = json.dumps(output_dict, ensure_ascii=False)

                    return magic_space_result
                else:
                    error_result = MagicSpaceToolResult(error="部署失败，无法获取部署结果")
                    return error_result

        except Exception as e:
            logger.exception(f"部署到 Magic Space 过程中出错: {e}")
            error_result = MagicSpaceToolResult(error=f"部署操作失败: {e!s}")
            return error_result

    def _copy_files(self, source_dir: str, target_dir: str) -> None:
        """
        复制文件到临时目录，排除无关文件
        
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

    async def _deploy_to_magic_space(self, zip_path: str, site_name: str) -> Optional[Dict[str, Any]]:
        """
        将 ZIP 文件部署到 Magic Space
        
        Args:
            zip_path: ZIP 文件路径
            site_name: 站点名称
            
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
                "access": "public",
            }

            # 执行部署
            logger.info(f"开始部署到 Magic Space，站点名称: {site_name}")
            response = await magic_space.deploy_from_zip(
                zip_path=zip_path,
                site_name=site_name,
                options=deploy_data
            )

            # 打印完整的响应内容，用于调试
            logger.info(f"API 响应内容: {json.dumps(response, ensure_ascii=False)}")

            # 检查结果
            if response.get("success") and "data" in response:
                site_data = response.get("data", {})
                logger.info(f"部署成功：{site_data.get('url', '未获取到站点URL')}")
                return site_data
            else:
                error = response.get("error", "未知错误")
                logger.error(f"部署失败: {error}")
                return None

        except Exception as e:
            logger.exception(f"部署过程中出现错误: {e}")
            return None

    async def get_before_tool_call_friendly_content(self, tool_context: ToolContext, arguments: Dict[str, Any] = None) -> str:
        """
        获取工具调用前的友好内容
        """
        workspace_path = arguments.get("workspace_path", "") if arguments else ""
        site_name = arguments.get("site_name", "") if arguments else ""

        if workspace_path and site_name:
            return f"开始将 {workspace_path} 部署到 Magic Space，站点名称: {site_name}"
        elif workspace_path:
            return f"开始部署 {workspace_path} 到 Magic Space"
        else:
            return arguments.get("explanation", "开始部署到 Magic Space")

    async def get_after_tool_call_friendly_action_and_remark(self, tool_name: str, tool_context: ToolContext, result: MagicSpaceToolResult, execution_time: float, arguments: Dict[str, Any] = None) -> Dict:
        """
        获取工具调用后的友好动作和备注

        Args:
            tool_name: 工具名称
            tool_context: 工具上下文
            result: 工具执行结果
            execution_time: 执行时间
            arguments: 工具参数

        Returns:
            Dict: 友好动作和备注
        """
        # 直接使用MagicSpaceToolResult中的属性
        remark = "部署完成"
        if result.site_name:
            remark = f"站点名称: {result.site_name}"
            if result.site_url:
                remark += f", 访问地址: {result.site_url}"
        
        return {
            "action": "Magic Space 部署",
            "remark": remark
        }

    async def get_after_tool_call_friendly_content(self, tool_context: ToolContext, result: MagicSpaceToolResult, execution_time: float, arguments: Dict[str, Any] = None) -> str:
        """
        获取工具调用后的友好内容，用于显示部署结果

        Args:
            tool_context: 工具上下文
            result: 工具执行结果
            execution_time: 执行耗时
            arguments: 执行参数

        Returns:
            str: 友好的执行结果消息，包含部署成功的网站地址
        """
        # 如果结果不是成功的，直接返回错误信息
        if not result.ok:
            return f"部署失败: {result.content}"
            
        # 直接使用MagicSpaceToolResult中的属性
        if result.success and result.site_url:
            return f"部署成功！你的网站已发布：\n站点名称: {result.site_name}\n访问地址: {result.site_url}"
        
        # 如果site_url为空但有site_name
        if result.site_name:
            return f"部署已完成，站点名称: {result.site_name}"
            
        return "部署已完成" 