import json
from typing import Optional

from pydantic import Field

from app.core.config_manager import ConfigManager
from app.core.context.tool_context import ToolContext
from app.core.entity.tool.tool_result import ToolResult
from app.logger import get_logger
from app.space.service import MagicSpaceService
from app.tools.core import BaseTool, BaseToolParams, tool

logger = get_logger(__name__)


class GetMagicSpaceSiteParams(BaseToolParams):
    """获取 Magic Space 站点详情参数"""
    site_id: str = Field(
        ...,
        description="要获取详情的站点ID"
    )


@tool()
class GetMagicSpaceSite(BaseTool[GetMagicSpaceSiteParams]):
    """获取 Magic Space 站点详情工具"""

    # 设置参数类
    params_class = GetMagicSpaceSiteParams

    # 设置工具元数据
    name = "get_magic_space_site"
    description = """获取单个 Magic Space 站点的详细信息。
    
本工具用于查询单个 Magic Space 站点的详细信息。

返回信息包括:
- 站点ID、名称、URL
- 创建时间和最后更新时间
- 访问权限设置
- 站点描述
- 域名绑定等高级配置

使用场景:
- 获取站点的详细配置
- 确认站点是否部署成功
- 查看站点的访问URL
- 获取站点更新状态
"""

    async def execute(
        self,
        tool_context: ToolContext,
        params: GetMagicSpaceSiteParams
    ) -> ToolResult:
        """
        执行获取站点详情操作
        
        Args:
            tool_context: 工具上下文
            params: 获取站点详情参数
            
        Returns:
            ToolResult: 操作结果
        """
        try:
            # 解析参数
            site_id = params.site_id

            # 验证参数
            if not site_id:
                return ToolResult(error="站点ID不能为空")

            # 获取 Magic Space 服务
            service = await self._get_magic_space_service()
            if not service:
                return ToolResult(error="无法创建 Magic Space 服务，请检查配置")

            # 调用 API 获取站点详情
            response = await service.get_site_details(site_id)

            if not response.get("success"):
                error = response.get("error", "未知错误")
                return ToolResult(error=f"获取站点详情失败: {error}")

            # 提取站点详情
            data = response.get("data", {})
            if not data:
                return ToolResult(error=f"站点不存在或获取详情失败: {site_id}")

            # 格式化结果
            result = {
                "id": data.get("id", ""),
                "name": data.get("name", ""),
                "url": data.get("url", ""),
                "access": data.get("access", "public"),
                "description": data.get("description", ""),
                "created_at": data.get("created_at", ""),
                "updated_at": data.get("updated_at", ""),
                "custom_domain": data.get("custom_domain", ""),
                "ssl_enabled": data.get("ssl_enabled", False),
                "file_count": data.get("file_count", 0),
                "size": data.get("size", 0)
            }

            # 创建结果内容
            content = json.dumps(result, ensure_ascii=False)
            return ToolResult(content=content)

        except Exception as e:
            logger.exception(f"获取 Magic Space 站点详情时出错: {e}")
            return ToolResult(error=f"获取站点详情失败: {e!s}")

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
