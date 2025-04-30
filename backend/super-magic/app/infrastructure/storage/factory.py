"""
Storage factory module.
"""

import os
from typing import Dict, Type, Optional

from .base import AbstractStorage
from .types import PlatformType, BaseStorageCredentials
from .volcengine import VolcEngineUploader
from app.core.entity.message.client_message import STSTokenRefreshConfig


class StorageFactory:
    """存储工厂类，用于创建不同平台的存储实例。"""

    _instances: Dict[PlatformType, AbstractStorage] = {}
    _implementations: Dict[PlatformType, Type[AbstractStorage]] = {
        PlatformType.tos: VolcEngineUploader,
        # 在这里添加其他平台的实现
        # PlatformType.aliyun: AliOSSUploader,
    }

    @classmethod
    async def get_storage(
        cls, 
        sts_token_refresh: Optional[STSTokenRefreshConfig] = None,
        metadata: Optional[Dict] = None
    ) -> AbstractStorage:
        """
        获取指定平台的存储实例。
        使用单例模式，确保每个平台只创建一个实例。
        
        Args:
            sts_token_refresh: STS Token刷新配置（可选）
            metadata: 元数据，用于凭证刷新（可选）

        Returns:
            AbstractStorage: 存储平台的实例

        Raises:
            ValueError: 如果指定的平台类型不支持
        """
        # 从环境变量获取存储平台类型，默认为'tos'
        platform_str = os.environ.get('STORAGE_PLATFORM', 'tos')
        platform = PlatformType(platform_str)
        
        if platform not in cls._instances:
            if platform not in cls._implementations:
                raise ValueError(f"Unsupported storage platform: {platform}")

            implementation = cls._implementations[platform]
            cls._instances[platform] = implementation()

        storage_service = cls._instances[platform]
        
        storage_service.set_sts_refresh_config(sts_token_refresh)
        storage_service.set_metadata(metadata)
        
        await storage_service.refresh_credentials()
            
        return storage_service

    @classmethod
    def register_implementation(
        cls,
        platform: PlatformType,
        implementation: Type[AbstractStorage]
    ) -> None:
        """
        注册新的存储平台实现。

        Args:
            platform: 存储平台类型
            implementation: 存储平台的实现类

        Raises:
            ValueError: 如果实现类不是 AbstractStorage 的子类
        """
        if not issubclass(implementation, AbstractStorage):
            raise ValueError(
                f"Implementation must be a subclass of AbstractStorage, got {implementation}"
            )

        cls._implementations[platform] = implementation
        # 清除已存在的实例，以便使用新的实现
        if platform in cls._instances:
            del cls._instances[platform] 