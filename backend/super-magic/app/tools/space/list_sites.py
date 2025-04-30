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


class ListMagicSpaceSitesParams(BaseToolParams):
    """列出 Magic Space 站点参数"""
    page: int = Field(
        1,
        description="页码（默认为1）"
    )
    limit: int = Field(
        10,
        description="每页数量（默认为10，最大50）"
    )


@tool()
class ListMagicSpaceSites(BaseTool[ListMagicSpaceSitesParams]):
    """列出 Magic Space 站点工具"""

    # 设置参数类
    params_class = ListMagicSpaceSitesParams

    # 设置工具元数据
    name = "list_magic_space_sites"
    description = """列出当前账户下的 Magic Space 站点。
    
本工具用于查看已部署的 Magic Space 站点列表。

返回信息包括:
- 站点ID、名称、URL
- 创建时间
- 访问权限设置
- 站点描述

使用场景:
- 查看已部署的站点列表
- 获取站点ID用于更新或删除操作
- 检查站点状态和配置
"""

    async def execute(
        self,
        tool_context: ToolContext,
        params: ListMagicSpaceSitesParams
    ) -> ToolResult:
        """
        执行列表操作
        
        Args:
            tool_context: 工具上下文
            params: 列表参数
            
        Returns:
            ToolResult: 操作结果
        """
        try:
            # 解析参数
            page = params.page
            limit = params.limit

            # 参数验证
            if page < 1:
                return ToolResult(error="页码必须大于或等于1")

            if limit < 1 or limit > 50:
                return ToolResult(error="每页数量必须在1到50之间")

            # 获取 Magic Space 服务
            service = await self._get_magic_space_service()
            if not service:
                return ToolResult(error="无法创建 Magic Space 服务，请检查配置")

            # 调用 API 获取站点列表
            response = await service.get_sites(page=page, limit=limit)

            if not response.get("success"):
                error = response.get("error", "未知错误")
                return ToolResult(error=f"获取站点列表失败: {error}")

            # 提取站点列表和分页信息
            data = response.get("data", {})
            sites = data.get("items", [])
            total = data.get("total", 0)
            total_pages = data.get("total_pages", 0)

            # 格式化结果
            result = {
                "page": page,
                "limit": limit,
                "total": total,
                "total_pages": total_pages,
                "sites": []
            }

            for site in sites:
                result["sites"].append({
                    "id": site.get("id", ""),
                    "name": site.get("name", ""),
                    "url": site.get("url", ""),
                    "access": site.get("access", "public"),
                    "created_at": site.get("created_at", ""),
                    "description": site.get("description", "")
                })

            # 创建结果内容
            content = json.dumps(result, ensure_ascii=False)
            return ToolResult(content=content)

        except Exception as e:
            logger.exception(f"列出 Magic Space 站点时出错: {e}")
            return ToolResult(error=f"列出站点失败: {e!s}")

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
