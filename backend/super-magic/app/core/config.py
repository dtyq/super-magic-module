from .config_manager import ConfigManager
from .config_models import AppConfig

# 初始化配置管理器并加载配置模型
config_manager = ConfigManager[AppConfig]()
config_manager.load_config(model=AppConfig)

# 获取配置实例
config = config_manager.get_model()
