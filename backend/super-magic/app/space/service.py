"""
Magic Space 服务层
"""

import logging
import os
import tempfile
import zipfile
from typing import Any, Dict, List, Optional, Tuple

from app.space.client import MagicSpaceClient
from app.space.exceptions import ApiError, ValidationError, ZipCreationError
from app.space.models import (
    AccessLog,
    Site,
    SiteConfig,
    SiteStats,
)
from app.space.utils import create_zip_from_directory, validate_html_project, validate_project_directory

logger = logging.getLogger(__name__)


class MagicSpaceService:
    """Magic Space 服务层，封装客户端操作并提供高级功能"""

    def __init__(self, api_key: str, base_url: Optional[str] = None):
        """
        初始化Magic Space服务
        
        Args:
            api_key: Magic Space API密钥
            base_url: API基础URL，可选
        """
        self.client = MagicSpaceClient(api_key=api_key, base_url=base_url) if base_url else MagicSpaceClient(api_key=api_key)
        logger.info(f"初始化Magic Space服务，API基础URL: {self.client.base_url}")

    async def create_site_from_directory(
        self, 
        site_name: str, 
        directory_path: str, 
        options: Optional[Dict[str, Any]] = None,
        validate: bool = True,
        exclude_patterns: Optional[List[str]] = None
    ) -> Site:
        """
        从目录创建站点
        
        Args:
            site_name: 站点名称
            directory_path: 目录路径
            options: 站点选项
            validate: 是否验证HTML项目结构
            exclude_patterns: 排除的文件/目录模式列表
            
        Returns:
            Site: 创建的站点对象
            
        Raises:
            ValidationError: 当验证失败时
            ZipCreationError: 当ZIP创建失败时
            ApiError: 当API请求失败时
        """
        # 默认排除模式
        if exclude_patterns is None:
            exclude_patterns = [
                "node_modules/**", ".git/**", ".vscode/**", ".idea/**", 
                "__pycache__/**", "*.pyc", ".DS_Store"
            ]

        # 验证项目
        if validate:
            valid, issues = validate_html_project(directory_path)
            if not valid:
                error_message = f"HTML项目验证失败: {'; '.join(issues)}"
                logger.error(error_message)
                raise ValidationError(error_message)

        # 创建临时ZIP文件
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".zip") as temp_file:
                temp_zip_path = temp_file.name

            # 创建ZIP文件
            create_zip_from_directory(
                directory_path=directory_path,
                output_path=temp_zip_path,
                exclude_patterns=exclude_patterns
            )

            # 读取ZIP文件
            with open(temp_zip_path, "rb") as zip_file:
                # 调用API创建站点
                response = await self.client.create_site(
                    site_name=site_name,
                    zip_data=zip_file,
                    options=options
                )

                # 转换响应为Site对象
                if response.get("success") and "data" in response:
                    site_data = response["data"]
                    return Site.parse_obj(site_data)
                else:
                    error_message = response.get("error", "创建站点失败，未知错误")
                    logger.error(f"创建站点失败: {error_message}")
                    raise ApiError(error_message)

        except Exception as e:
            logger.exception(f"从目录创建站点时出错: {e!s}")

            # 重新抛出异常，确保类型正确
            if isinstance(e, (ValidationError, ZipCreationError, ApiError)):
                raise
            else:
                raise ApiError(f"创建站点失败: {e!s}")
        finally:
            # 清理临时文件
            if os.path.exists(temp_zip_path):
                try:
                    os.unlink(temp_zip_path)
                except Exception as e:
                    logger.warning(f"清理临时ZIP文件失败: {e!s}")

    async def update_site_from_directory(
        self, 
        site_id: str, 
        directory_path: str, 
        validate: bool = True,
        exclude_patterns: Optional[List[str]] = None
    ) -> Site:
        """
        从目录更新站点内容
        
        Args:
            site_id: 站点ID
            directory_path: 目录路径
            validate: 是否验证HTML项目结构
            exclude_patterns: 排除的文件/目录模式列表
            
        Returns:
            Site: 更新后的站点对象
            
        Raises:
            ValidationError: 当验证失败时
            ZipCreationError: 当ZIP创建失败时
            ApiError: 当API请求失败时
        """
        # 默认排除模式
        if exclude_patterns is None:
            exclude_patterns = [
                "node_modules/**", ".git/**", ".vscode/**", ".idea/**", 
                "__pycache__/**", "*.pyc", ".DS_Store"
            ]

        # 验证项目
        if validate:
            valid, issues = validate_html_project(directory_path)
            if not valid:
                error_message = f"HTML项目验证失败: {'; '.join(issues)}"
                logger.error(error_message)
                raise ValidationError(error_message)

        # 创建临时ZIP文件
        temp_zip_path = None
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".zip") as temp_file:
                temp_zip_path = temp_file.name

            # 创建ZIP文件
            create_zip_from_directory(
                directory_path=directory_path,
                output_path=temp_zip_path,
                exclude_patterns=exclude_patterns
            )

            # 读取ZIP文件
            with open(temp_zip_path, "rb") as zip_file:
                # 调用API更新站点内容
                response = await self.client.update_site_content(
                    site_id=site_id,
                    zip_data=zip_file
                )

                # 转换响应为Site对象
                if response.get("success") and "data" in response:
                    site_data = response["data"]
                    return Site.parse_obj(site_data)
                else:
                    error_message = response.get("error", "更新站点内容失败，未知错误")
                    logger.error(f"更新站点内容失败: {error_message}")
                    raise ApiError(error_message)

        except Exception as e:
            logger.exception(f"从目录更新站点内容时出错: {e!s}")

            # 重新抛出异常，确保类型正确
            if isinstance(e, (ValidationError, ZipCreationError, ApiError)):
                raise
            else:
                raise ApiError(f"更新站点内容失败: {e!s}")
        finally:
            # 清理临时文件
            if temp_zip_path and os.path.exists(temp_zip_path):
                try:
                    os.unlink(temp_zip_path)
                except Exception as e:
                    logger.warning(f"清理临时ZIP文件失败: {e!s}")

    async def get_site(self, site_id: str) -> Site:
        """
        获取站点详情
        
        Args:
            site_id: 站点ID
            
        Returns:
            Site: 站点对象
            
        Raises:
            ApiError: 当API请求失败时
        """
        try:
            response = await self.client.get_site(site_id)

            if response.get("success") and "data" in response:
                site_data = response["data"]
                return Site.parse_obj(site_data)
            else:
                error_message = response.get("error", "获取站点详情失败，未知错误")
                logger.error(f"获取站点详情失败: {error_message}")
                raise ApiError(error_message)

        except Exception as e:
            logger.exception(f"获取站点详情时出错: {e!s}")

            # 重新抛出异常，确保类型正确
            if isinstance(e, ApiError):
                raise
            else:
                raise ApiError(f"获取站点详情失败: {e!s}")

    async def list_sites(self, page: int = 1, limit: int = 20) -> Tuple[List[Site], int, int]:
        """
        获取站点列表
        
        Args:
            page: 页码，默认为1
            limit: 每页数量，默认为20
            
        Returns:
            Tuple[List[Site], int, int]: 站点列表，总数量和总页数
            
        Raises:
            ApiError: 当API请求失败时
        """
        try:
            response = await self.client.list_sites(page=page, limit=limit)

            if response.get("success") and "data" in response:
                data = response["data"]
                sites_data = data.get("items", [])
                pagination = data.get("pagination", {})

                sites = [Site.parse_obj(site_data) for site_data in sites_data]
                total = pagination.get("total", 0)
                total_pages = pagination.get("totalPages", 0)

                return sites, total, total_pages
            else:
                error_message = response.get("error", "获取站点列表失败，未知错误")
                logger.error(f"获取站点列表失败: {error_message}")
                raise ApiError(error_message)

        except Exception as e:
            logger.exception(f"获取站点列表时出错: {e!s}")

            # 重新抛出异常，确保类型正确
            if isinstance(e, ApiError):
                raise
            else:
                raise ApiError(f"获取站点列表失败: {e!s}")

    async def delete_site(self, site_id: str) -> bool:
        """
        删除站点
        
        Args:
            site_id: 站点ID
            
        Returns:
            bool: 删除是否成功
            
        Raises:
            ApiError: 当API请求失败时
        """
        try:
            response = await self.client.delete_site(site_id)
            if response.get("success"):
                return True
            else:
                error_message = response.get("error", "删除站点失败，未知错误")
                logger.error(f"删除站点失败: {error_message}")
                raise ApiError(error_message)

        except Exception as e:
            logger.exception(f"删除站点时出错: {e!s}")

            # 重新抛出异常，确保类型正确
            if isinstance(e, ApiError):
                raise
            else:
                raise ApiError(f"删除站点失败: {e!s}")

    async def update_site(self, site_id: str, update_data: Dict[str, Any]) -> Site:
        """
        更新站点信息
        
        Args:
            site_id: 站点ID
            update_data: 要更新的数据
            
        Returns:
            Site: 更新后的站点对象
            
        Raises:
            ApiError: 当API请求失败时
        """
        try:
            response = await self.client.update_site(site_id, update_data)

            if response.get("success") and "data" in response:
                site_data = response["data"]
                return Site.parse_obj(site_data)
            else:
                error_message = response.get("error", "更新站点信息失败，未知错误")
                logger.error(f"更新站点信息失败: {error_message}")
                raise ApiError(error_message)

        except Exception as e:
            logger.exception(f"更新站点信息时出错: {e!s}")

            # 重新抛出异常，确保类型正确
            if isinstance(e, ApiError):
                raise
            else:
                raise ApiError(f"更新站点信息失败: {e!s}")

    async def get_site_config(self, site_id: str) -> SiteConfig:
        """
        获取站点配置
        
        Args:
            site_id: 站点ID
            
        Returns:
            SiteConfig: 站点配置对象
            
        Raises:
            ApiError: 当API请求失败时
        """
        try:
            response = await self.client.get_site_config(site_id)

            if response.get("success") and "data" in response:
                config_data = response["data"]
                return SiteConfig.parse_obj(config_data)
            else:
                error_message = response.get("error", "获取站点配置失败，未知错误")
                logger.error(f"获取站点配置失败: {error_message}")
                raise ApiError(error_message)

        except Exception as e:
            logger.exception(f"获取站点配置时出错: {e!s}")

            # 重新抛出异常，确保类型正确
            if isinstance(e, ApiError):
                raise
            else:
                raise ApiError(f"获取站点配置失败: {e!s}")

    async def update_site_config(self, site_id: str, config: Dict[str, Any]) -> SiteConfig:
        """
        更新站点配置
        
        Args:
            site_id: 站点ID
            config: 站点配置
            
        Returns:
            SiteConfig: 更新后的站点配置对象
            
        Raises:
            ApiError: 当API请求失败时
        """
        try:
            response = await self.client.update_site_config(site_id, config)

            if response.get("success") and "data" in response:
                config_data = response["data"]
                return SiteConfig.parse_obj(config_data)
            else:
                error_message = response.get("error", "更新站点配置失败，未知错误")
                logger.error(f"更新站点配置失败: {error_message}")
                raise ApiError(error_message)

        except Exception as e:
            logger.exception(f"更新站点配置时出错: {e!s}")

            # 重新抛出异常，确保类型正确
            if isinstance(e, ApiError):
                raise
            else:
                raise ApiError(f"更新站点配置失败: {e!s}")

    async def get_site_stats(self, site_id: str) -> SiteStats:
        """
        获取站点统计信息
        
        Args:
            site_id: 站点ID
            
        Returns:
            SiteStats: 站点统计信息对象
            
        Raises:
            ApiError: 当API请求失败时
        """
        try:
            response = await self.client.get_site_stats(site_id)

            if response.get("success") and "data" in response:
                stats_data = response["data"]
                return SiteStats.parse_obj(stats_data)
            else:
                error_message = response.get("error", "获取站点统计信息失败，未知错误")
                logger.error(f"获取站点统计信息失败: {error_message}")
                raise ApiError(error_message)

        except Exception as e:
            logger.exception(f"获取站点统计信息时出错: {e!s}")

            # 重新抛出异常，确保类型正确
            if isinstance(e, ApiError):
                raise
            else:
                raise ApiError(f"获取站点统计信息失败: {e!s}")

    async def get_access_logs(
        self, 
        site_id: str, 
        offset: int = 0, 
        limit: int = 20
    ) -> Tuple[List[AccessLog], AccessLog]:
        """
        获取站点访问日志
        
        Args:
            site_id: 站点ID
            offset: 偏移量，默认为0
            limit: 返回数量，默认为20
            
        Returns:
            Tuple[List[AccessLog], dict]: 访问日志列表和分页信息
            
        Raises:
            ApiError: 当API请求失败时
        """
        try:
            response = await self.client.get_access_logs(
                site_id=site_id,
                offset=offset,
                limit=limit
            )

            if response.get("success") and "data" in response:
                data = response["data"]
                logs_data = data.get("items", [])
                pagination = data.get("pagination", {})

                logs = [AccessLog.parse_obj(log_data) for log_data in logs_data]

                return logs, pagination
            else:
                error_message = response.get("error", "获取访问日志失败，未知错误")
                logger.error(f"获取访问日志失败: {error_message}")
                raise ApiError(error_message)

        except Exception as e:
            logger.exception(f"获取访问日志时出错: {e!s}")

            # 重新抛出异常，确保类型正确
            if isinstance(e, ApiError):
                raise
            else:
                raise ApiError(f"获取访问日志失败: {e!s}")

    async def deploy_from_directory(
        self, 
        directory_path: str, 
        site_name: str, 
        options: Optional[Dict[str, Any]] = None,
        validate: bool = True,
        exclude_patterns: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        从目录部署站点（更友好的API）
        
        Args:
            directory_path: 目录路径
            site_name: 站点名称
            options: 站点选项
            validate: 是否验证HTML项目结构
            exclude_patterns: 排除的文件/目录模式列表
            
        Returns:
            Dict[str, Any]: API响应
            
        Raises:
            ValidationError: 当验证失败时
            ZipCreationError: 当ZIP创建失败时
            ApiError: 当API请求失败时
        """
        logger.info(f"从目录部署站点: {directory_path} -> {site_name}")

        # 默认排除模式
        if exclude_patterns is None:
            exclude_patterns = [
                "node_modules/**", ".git/**", ".vscode/**", ".idea/**", 
                "__pycache__/**", "*.pyc", ".DS_Store"
            ]

        # 验证项目目录
        if validate:
            issues = validate_project_directory(directory_path)
            if issues:
                error_message = "\n".join(issues)
                logger.error(f"项目验证失败: {error_message}")
                raise ValidationError(message="HTML项目验证失败", problems=issues)

        # 创建临时ZIP文件
        temp_zip_path = None
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".zip") as temp_file:
                temp_zip_path = temp_file.name

            # 创建ZIP文件
            create_zip_from_directory(directory_path, temp_zip_path)
            logger.info(f"已创建临时ZIP文件: {temp_zip_path}")

            # 使用ZIP文件部署
            return await self.deploy_from_zip(
                zip_path=temp_zip_path,
                site_name=site_name,
                options=options
            )

        except Exception as e:
            logger.exception(f"从目录部署站点时出错: {e!s}")

            # 重新抛出异常，确保类型正确
            if isinstance(e, (ValidationError, ZipCreationError, ApiError)):
                raise
            else:
                raise ApiError(f"部署站点失败: {e!s}")
        finally:
            # 清理临时文件
            if temp_zip_path and os.path.exists(temp_zip_path):
                try:
                    os.unlink(temp_zip_path)
                    logger.debug(f"已清理临时ZIP文件: {temp_zip_path}")
                except Exception as e:
                    logger.warning(f"清理临时ZIP文件失败: {e!s}")

    async def deploy_from_zip(
        self,
        zip_path: str,
        site_name: str,
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        从ZIP文件部署站点
        
        Args:
            zip_path: ZIP文件路径
            site_name: 站点名称
            options: 站点选项
            
        Returns:
            Dict[str, Any]: API响应
            
        Raises:
            ValidationError: 当验证失败时
            ZipCreationError: 当ZIP文件无效时
            ApiError: 当API请求失败时
        """
        logger.info(f"从ZIP文件部署站点: {zip_path} -> {site_name}")

        # 验证ZIP文件
        if not os.path.exists(zip_path):
            raise ValidationError(f"ZIP文件不存在: {zip_path}")

        if not zipfile.is_zipfile(zip_path):
            raise ValidationError(f"文件不是有效的ZIP格式: {zip_path}")

        # 设置默认选项
        options = options or {}
        if "access" not in options:
            options["access"] = "public"

        try:
            # 读取ZIP文件
            with open(zip_path, "rb") as zip_file:
                # 调用API创建站点
                logger.info(f"发送请求创建站点: {site_name}")
                response = await self.client.create_site(
                    site_name=site_name,
                    zip_data=zip_file,
                    options=options
                )

                # 处理响应
                if response.get("success"):
                    logger.info(f"站点部署成功: {site_name}")
                else:
                    error = response.get("error", "未知错误")
                    logger.error(f"站点部署失败: {error}")

                return response

        except ApiError:
            # 直接重新抛出API错误
            raise
        except Exception as e:
            logger.exception(f"从ZIP部署站点时出错: {e!s}")
            raise ApiError(f"部署站点失败: {e!s}")

    async def get_sites(self, page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """
        获取站点列表（直接返回原始响应）
        
        Args:
            page: 页码，默认为1
            limit: 每页数量，默认为20
            
        Returns:
            Dict[str, Any]: API响应
            
        Raises:
            ApiError: 当API请求失败时
        """
        try:
            logger.info(f"获取站点列表 (页码: {page}, 每页: {limit})")
            response = await self.client.list_sites(page=page, limit=limit)
            return response
        except ApiError:
            # 直接重新抛出API错误
            raise
        except Exception as e:
            logger.exception(f"获取站点列表时出错: {e!s}")
            raise ApiError(f"获取站点列表失败: {e!s}")

    async def get_site_details(self, site_id: str) -> Dict[str, Any]:
        """
        获取站点详情（直接返回原始响应）
        
        Args:
            site_id: 站点ID
            
        Returns:
            Dict[str, Any]: API响应
            
        Raises:
            ApiError: 当API请求失败时
        """
        try:
            logger.info(f"获取站点详情: {site_id}")
            response = await self.client.get_site(site_id)
            return response
        except ApiError:
            # 直接重新抛出API错误
            raise
        except Exception as e:
            logger.exception(f"获取站点详情时出错: {e!s}")
            raise ApiError(f"获取站点详情失败: {e!s}")

    async def get_site_stats(self, site_id: str) -> Dict[str, Any]:
        """
        获取站点统计信息（直接返回原始响应）
        
        Args:
            site_id: 站点ID
            
        Returns:
            Dict[str, Any]: API响应
            
        Raises:
            ApiError: 当API请求失败时
        """
        try:
            logger.info(f"获取站点统计信息: {site_id}")
            response = await self.client.get_site_stats(site_id)
            return response
        except ApiError:
            # 直接重新抛出API错误
            raise
        except Exception as e:
            logger.exception(f"获取站点统计信息时出错: {e!s}")
            raise ApiError(f"获取站点统计信息失败: {e!s}") 
