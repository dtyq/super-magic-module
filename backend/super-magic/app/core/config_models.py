from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class LLMSettings(BaseModel):
    """LLM 配置模型"""

    model: str = Field(..., description="模型名称")
    base_url: str = Field(..., description="API 基础 URL")
    api_key: str = Field("", description="API 密钥")
    max_tokens: int = Field(8192, description="每个请求的最大 token 数")
    temperature: float = Field(1.0, description="采样温度")
    api_type: str = Field("", description="API 类型，如 azure")
    api_version: str = Field("", description="API 版本")


class ProxySettings(BaseModel):
    """代理配置模型"""

    server: str = Field("", description="代理服务器地址")
    username: Optional[str] = Field(None, description="代理用户名")
    password: Optional[str] = Field(None, description="代理密码")


class BrowserSettings(BaseModel):
    """浏览器配置模型"""

    headless: bool = Field(False, description="是否使用无头模式")
    disable_security: bool = Field(True, description="是否禁用安全特性")
    extra_chromium_args: List[str] = Field(default_factory=list, description="额外的 Chromium 参数")
    chrome_instance_path: Optional[str] = Field(None, description="Chrome 实例路径")
    wss_url: Optional[str] = Field(None, description="WebSocket 连接 URL")
    cdp_url: Optional[str] = Field(None, description="CDP 连接 URL")
    proxy: Optional[ProxySettings] = Field(None, description="代理设置")


class OpenAISettings(BaseModel):
    """OpenAI 配置模型"""

    api_key: str = Field("", description="OpenAI API 密钥")
    api_base_url: str = Field("", description="OpenAI API 基础 URL")
    model: str = Field("gpt-4o-global", description="OpenAI 模型名称")


class ClaudeSettings(BaseModel):
    """Claude 配置模型"""

    api_key: str = Field("", description="Claude API 密钥")
    api_base_url: str = Field("", description="Claude API 基础 URL")
    model: str = Field("", description="Claude 模型名称")


class BingSettings(BaseModel):
    """Bing 搜索配置模型"""

    search_api_key: str = Field("", description="Bing 搜索 API 密钥")
    search_endpoint: str = Field("https://api.bing.microsoft.com/v7.0/search", description="Bing 搜索端点")


class FileServiceSettings(BaseModel):
    """文件服务配置模型"""

    ve_access_key_id: str = Field("", description="火山引擎访问密钥 ID")
    ve_access_key_secret: str = Field("", description="火山引擎访问密钥密码")
    ve_bucket_name: str = Field("", description="存储桶名称")
    ve_endpoint: str = Field("", description="服务端点")
    ve_region: str = Field("", description="区域")
    file_service_address: str = Field("", description="文件服务地址")


class TokenServiceSettings(BaseModel):
    """Token 服务配置模型"""

    address: str = Field("", description="Token 服务地址")
    redis_uri: str = Field("", description="Redis 连接 URI")
    app_id: str = Field("", description="应用 ID")
    app_secret: str = Field("", description="应用密钥")


class FaaSSettings(BaseModel):
    """FaaS 配置模型"""

    agent_service_address: str = Field("", description="代理服务地址")


class SystemSettings(BaseModel):
    """系统配置模型"""

    agent_system_prompt: str = Field("", description="代理系统提示词")


class AppConfig(BaseModel):
    """应用配置模型"""

    llm: Dict[str, LLMSettings] = Field(default_factory=dict, description="LLM 配置")
    browser: BrowserSettings = Field(default_factory=BrowserSettings, description="浏览器配置")
    openai: OpenAISettings = Field(default_factory=OpenAISettings, description="OpenAI 配置")
    claude: ClaudeSettings = Field(default_factory=ClaudeSettings, description="Claude 配置")
    bing: BingSettings = Field(default_factory=BingSettings, description="Bing 搜索配置")
    file_service: FileServiceSettings = Field(default_factory=FileServiceSettings, description="文件服务配置")
    token_service: TokenServiceSettings = Field(default_factory=TokenServiceSettings, description="Token 服务配置")
    faas: FaaSSettings = Field(default_factory=FaaSSettings, description="FaaS 配置")
    system: SystemSettings = Field(default_factory=SystemSettings, description="系统配置")


class ASRSettings(BaseModel):
    """火山引擎语音识别配置模型"""

    app_id: str = Field("", description="火山引擎应用ID")
    token: str = Field("", description="火山引擎访问令牌")
    cluster: str = Field("", description="火山引擎集群名称")
    secret_key: str = Field("", description="火山引擎密钥")


class TOSSettings(BaseModel):
    """火山引擎对象存储配置模型"""

    host: str = Field("", description="存储主机地址")
    policy: str = Field("", description="上传策略")
    algorithm: str = Field("", description="签名算法")
    date: str = Field("", description="签名日期")
    credential: str = Field("", description="凭证")
    signature: str = Field("", description="签名")
    dir: str = Field("", description="目录")
    content_type: str = Field("", description="内容类型")


class Settings(BaseModel):
    """应用配置模型，组合各个子配置"""

    browser: BrowserSettings = Field(default_factory=BrowserSettings, description="浏览器配置")
    models: Dict[str, Dict[str, Any]] = Field(default_factory=dict, description="模型配置")
    bing: BingSettings = Field(default_factory=BingSettings, description="Bing搜索配置")
    token_service: TokenServiceSettings = Field(default_factory=TokenServiceSettings, description="Token服务配置")
    asr: ASRSettings = Field(default_factory=ASRSettings, description="语音识别配置")

    # ... existing code ...
