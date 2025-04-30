import json
from typing import Optional

from pydantic import Field

from app.core.config_manager import ConfigManager
from app.core.context.tool_context import ToolContext
from app.core.entity.tool.tool_result import ToolResult
from app.logger import get_logger
from app.space.exceptions import ApiError
from app.space.service import MagicSpaceService
from app.tools.core import BaseTool, BaseToolParams, tool

logger = get_logger(__name__)


class DeleteMagicSpaceSiteParams(BaseToolParams):
    """删除 Magic Space 站点参数"""
    site_id: str = Field(
        ...,
        description="要删除的站点ID"
    )
    confirm: bool = Field(
        ...,
        description="确认删除（必须为true）"
    )


@tool()
class DeleteMagicSpaceSite(BaseTool[DeleteMagicSpaceSiteParams]):
    """删除 Magic Space 站点工具"""

    # 设置参数类
    params_class = DeleteMagicSpaceSiteParams

    # 设置工具元数据
    name = "delete_magic_space_site"
    description = """删除已部署的 Magic Space 站点。
    
本工具用于永久删除已部署的站点。此操作不可撤销，删除后站点URL将不再可用。

使用场景：
- 删除不再需要的站点
- 清理测试或临时站点
- 清理占用空间的旧站点

必须提供站点ID和确认标志。为防止误操作，confirm参数必须明确设置为true。
"""

    async def execute(
        self,
        tool_context: ToolContext,
        params: DeleteMagicSpaceSiteParams
    ) -> ToolResult:
        """
        执行删除操作
        
        Args:
            tool_context: 工具上下文
            params: 删除参数
            
        Returns:
            ToolResult: 操作结果
        """
        try:
            # 解析参数
            site_id = params.site_id
            confirm = params.confirm

            # 验证参数
            if not site_id:
                return ToolResult(error="站点ID不能为空")

            if not confirm:
                return ToolResult(error="必须确认删除操作，请将confirm参数设置为true")

            # 获取 Magic Space 服务
            service = await self._get_magic_space_service()
            if not service:
                return ToolResult(error="无法创建 Magic Space 服务，请检查配置")

            # 获取站点详情（用于记录删除了什么）
            try:
                site_details = await service.get_site_details(site_id)
                site_name = ""
                site_url = ""

                if site_details.get("success") and "data" in site_details:
                    site_data = site_details["data"]
                    site_name = site_data.get("name", "")
                    site_url = site_data.get("url", "")
            except Exception:
                # 忽略获取站点详情失败的错误，继续执行删除操作
                logger.warning(f"获取站点详情失败: {site_id}")
                site_name = ""
                site_url = ""

            # 调用 API 删除站点
            try:
                success = await service.delete_site(site_id)

                if success:
                    # 构建结果
                    result = {
                        "site_id": site_id,
                        "name": site_name,
                        "url": site_url,
                        "message": "站点删除成功"
                    }

                    content = json.dumps(result, ensure_ascii=False)
                    return ToolResult(content=content)
                else:
                    return ToolResult(error=f"删除站点失败: {site_id}")

            except ApiError as e:
                return ToolResult(error=f"删除站点失败: {e!s}")

        except Exception as e:
            logger.exception(f"删除 Magic Space 站点时出错: {e}")
            return ToolResult(error=f"删除站点失败: {e!s}")

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
