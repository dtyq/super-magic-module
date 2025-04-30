from app.core.config_manager import config


class Environment:
    @staticmethod
    def is_dev() -> bool:
        return config.get("sandbox.app_env") == "dev"

    @staticmethod
    def is_support_fetch_workspace() -> bool:
        return config.get("sandbox.fetch_workspace")

    @staticmethod
    def get_agent_idle_timeout() -> int:
        return config.get("sandbox.agent_idle_timeout")

    @staticmethod
    def get_idle_monitor_interval() -> int:
        return config.get("sandbox.idle_monitor_interval")
