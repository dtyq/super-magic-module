"""
ASR服务工厂模块
"""

from typing import Optional

from app.core.config_manager import ConfigManager
from app.infrastructure.asr.types import ASRConfig
from app.infrastructure.asr.ve_asr_service import VEASRService


class ASRServiceFactory:
    """ASR服务工厂，用于创建不同的ASR服务实例"""

    _instance: Optional[VEASRService] = None

    @classmethod
    def get_ve_asr_service(cls) -> VEASRService:
        """
        获取火山引擎语音识别服务实例
        
        Returns:
            VEASRService: 火山引擎语音识别服务实例
        """
        if cls._instance is None:
            # 从配置中获取ASR配置
            config_manager = ConfigManager()
            asr_config = config_manager.get_config().asr

            # 创建ASR配置对象
            config = ASRConfig(
                app_id=asr_config.app_id,
                token=asr_config.token,
                cluster=asr_config.cluster,
                secret_key=asr_config.secret_key
            )

            # 创建服务实例
            cls._instance = VEASRService(config)

        return cls._instance 
