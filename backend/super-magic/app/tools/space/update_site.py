import json
import os
import tempfile
from typing import Optional

from pydantic import Field

from app.core.config_manager import ConfigManager
from app.core.context.tool_context import ToolContext
from app.core.entity.tool.tool_result import ToolResult
from app.logger import get_logger
from app.space.exceptions import ApiError, ValidationError
from app.space.service import MagicSpaceService
from app.tools.core import BaseTool, BaseToolParams, tool

logger = get_logger(__name__)


class UpdateMagicSpaceSiteParams(BaseToolParams):
    """更新 Magic Space 站点参数"""
    site_id: str = Field(
        ...,
        description="要更新的站点ID"
    )
    directory_path: str = Field(
        ".workspace",
        description="包含更新内容的目录路径（默认为 .workspace）"
    )
    site_name: Optional[str] = Field(
        None,
        description="站点名称（可选，不更新则保持原值）"
    )
    access: Optional[str] = Field(
        None, 
        description="访问权限（public/private/password，可选）"
    )
    description: Optional[str] = Field(
        None,
        description="站点描述（可选）"
    )


@tool()
class UpdateMagicSpaceSite(BaseTool[UpdateMagicSpaceSiteParams]):
    """更新 Magic Space 站点工具"""

    # 设置参数类
    params_class = UpdateMagicSpaceSiteParams

    # 设置工具元数据
    name = "update_magic_space_site"
    description = """更新已部署的 Magic Space 站点。
    
本工具用于更新已部署站点的内容或配置。可以更新：
- 站点内容（HTML文件及相关资源）
- 站点名称
- 访问权限设置
- 站点描述

使用场景：
- 更新网站内容但保持URL不变
- 修改站点访问权限
- 更新站点名称或描述

需要提供站点ID和要更新的内容。
"""

    async def execute(
        self,
        tool_context: ToolContext,
        params: UpdateMagicSpaceSiteParams
    ) -> ToolResult:
        """
        执行更新操作
        
        Args:
            tool_context: 工具上下文
            params: 更新参数
            
        Returns:
            ToolResult: 操作结果
        """
        try:
            # 解析参数
            site_id = params.site_id
            directory_path = params.directory_path
            site_name = params.site_name
            access = params.access
            description = params.description

            # 验证参数
            if not site_id:
                return ToolResult(error="站点ID不能为空")

            # 验证并处理目录路径
            workspace_dir = os.path.abspath(directory_path)

            if not os.path.exists(workspace_dir):
                return ToolResult(error=f"工作目录不存在: {directory_path}")

            if not os.path.isdir(workspace_dir):
                return ToolResult(error=f"指定的路径不是目录: {directory_path}")

            # 获取 Magic Space 服务
            service = await self._get_magic_space_service()
            if not service:
                return ToolResult(error="无法创建 Magic Space 服务，请检查配置")

            # 检查是否需要更新站点配置
            if site_name or access or description is not None:
                # 构建更新数据
                update_data = {}
                if site_name:
                    update_data["name"] = site_name
                if access:
                    update_data["access"] = access
                if description is not None:
                    update_data["description"] = description

                # 更新站点配置
                try:
                    await service.update_site(site_id, update_data)
                    logger.info(f"成功更新站点配置: {site_id}")
                except ApiError as e:
                    return ToolResult(error=f"更新站点配置失败: {e!s}")

            # 更新站点内容
            with tempfile.TemporaryDirectory() as temp_dir:
                # 创建 ZIP 文件
                zip_path = os.path.join(temp_dir, "update.zip")
                self._create_zip_from_directory(workspace_dir, zip_path)

                try:
                    # 调用 API 更新站点内容
                    await service.update_site_from_directory(site_id, workspace_dir)

                    # 获取更新后的站点详情
                    site_details = await service.get_site_details(site_id)

                    if site_details.get("success") and "data" in site_details:
                        site_data = site_details["data"]

                        # 构建结果
                        result = {
                            "site_id": site_id,
                            "name": site_data.get("name", ""),
                            "url": site_data.get("url", ""),
                            "access": site_data.get("access", "public"),
                            "description": site_data.get("description", ""),
                            "message": "站点更新成功"
                        }

                        content = json.dumps(result, ensure_ascii=False)
                        return ToolResult(content=content)
                    else:
                        error = site_details.get("error", "未知错误")
                        return ToolResult(error=f"更新成功但获取站点详情失败: {error}")

                except ApiError as e:
                    return ToolResult(error=f"更新站点内容失败: {e!s}")
                except ValidationError as e:
                    return ToolResult(error=f"站点验证失败: {e!s}")

        except Exception as e:
            logger.exception(f"更新 Magic Space 站点时出错: {e}")
            return ToolResult(error=f"更新站点失败: {e!s}")

    def _create_zip_from_directory(self, directory_path: str, output_path: str) -> None:
        """
        从目录创建 ZIP 文件
        
        Args:
            directory_path: 源目录路径
            output_path: 输出 ZIP 文件路径
        """
        import zipfile

        with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, _, files in os.walk(directory_path):
                for file in files:
                    file_path = os.path.join(root, file)
                    zipf.write(
                        file_path, 
                        os.path.relpath(file_path, directory_path)
                    )

    async def _get_magic_space_service(self) -> Optional[MagicSpaceService]:
        """
        获取 Magic Space 服务实例
        
        Returns:
            Optional[MagicSpaceService]: 服务实例，失败时返回 None
        """
        try:
            # 获取配置
            config = ConfigManager()
            magic_space_config = config.get('magic_space', {})

            # 检查配置
            if not magic_space_config.get('api_key'):
                logger.error("Magic Space API Key 未配置，请检查配置文件")
                return None

            # 创建服务
            api_key = magic_space_config.get('api_key')
            base_url = magic_space_config.get('api_base_url')
            
            # 确保正确初始化MagicSpaceService
            service = MagicSpaceService(api_key=api_key)
            if base_url:
                service = MagicSpaceService(api_key=api_key, base_url=base_url)
                
            return service

        except Exception as e:
            logger.exception(f"创建 Magic Space 服务时出错: {e}")
            return None 
