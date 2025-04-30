from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field


class PromptType(str, Enum):
    """Prompt 类型枚举"""

    SYSTEM = "system"  # 系统级 Prompt
    TASK = "task"  # 任务相关 Prompt
    CONTEXT = "context"  # 上下文相关 Prompt
    TEMPLATE = "template"  # 模板 Prompt
    SCENARIO = "scenario"  # 场景相关 Prompt


class ScenarioType(str, Enum):
    """场景类型枚举"""

    RESEARCH_REPORT = "research_report"  # 调研报告
    WEB_GENERATION = "web_generation"  # 网页生成
    DATA_ANALYSIS = "data_analysis"  # 数据分析（处理、预测）
    DATA_CRAWLING = "data_crawling"  # 数据爬取
    SHIFT_PLANNING = "shift_planning"  # 排班计划
    ONBOARDING_PLAN = "onboarding_plan"  # 入职计划
    CODE_REPOSITORY = "code_repository"  # 代码库（分析、review、修复、功能、重构、测试、pr、issue处理）
    THIRD_PARTY_SYSTEM = "third_party_system"  # 第三方网站系统操作
    PPT = "ppt"  # PPT
    GRAPHIC = "graphic"  # 图形
    RESUME_PROCESSING = "resume_processing"  # 简历处理（筛选、分类、排名）
    FINANCIAL_ANALYSIS = "financial_analysis"  # 金融分析（股票情况、舆情）
    LEGAL_CONTRACT = "legal_contract"  # 法律、合同（检查、优化）
    MEETING_SUMMARY = "meeting_summary"  # 会议整理
    NEWS_RETRIEVAL = "news_retrieval"  # 新闻获取
    WEEKLY_REPORT = "weekly_report"  # 周报、总结
    TRAVEL_PLANNING = "travel_planning"  # 机票、火车（信息及计划）
    PRODUCT_DOCUMENT = "product_document"  # 产品文档、原型
    AUDIO_GENERATION = "audio_generation"  # 声音生成
    SERVER_SSH = "server_ssh"  # 服务器ssh连接
    CLOUD_DOCUMENT = "cloud_document"  # 云文档、神奇表格连接
    WECHAT_ARTICLE = "wechat_article"  # 公众号文章
    SHORT_VIDEO = "short_video"  # 抖音、快手视频
    COURSE_DESIGN = "course_design"  # 课程设计
    PATENT_TRADEMARK = "patent_trademark"  # 专利、商标查询
    WEATHER_TRAVEL = "weather_travel"  # 天气、穿搭、旅行
    ITINERARY_PLANNING = "itinerary_planning"  # 行程规划
    SCHEDULE_MANAGEMENT = "schedule_management"  # 日程管理
    TRANSLATION = "translation"  # 翻译


class PromptStatus(str, Enum):
    """Prompt 状态枚举"""

    ACTIVE = "active"  # 活跃状态
    INACTIVE = "inactive"  # 非活跃状态
    ARCHIVED = "archived"  # 已归档


class PromptMetadata(BaseModel):
    """Prompt 元数据模型"""

    version: str = Field(default="1.0")
    author: str = Field(default="system")
    tags: List[str] = Field(default_factory=list)
    category: List[str] = Field(default_factory=list)
    language: str = Field(default="zh")
    source: Optional[str] = None
    requires_context: bool = Field(default=False)
    context_requirements: List[str] = Field(default_factory=list)
    usage_count: int = Field(default=0)
    success_rate: float = Field(default=0.0)
    average_latency: float = Field(default=0.0)
    custom_attributes: Dict[str, Any] = Field(default_factory=dict)


class Prompt(BaseModel):
    """Prompt 基础模型"""

    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    description: str
    content: str
    type: PromptType
    status: PromptStatus = Field(default=PromptStatus.ACTIVE)
    metadata: PromptMetadata = Field(default_factory=PromptMetadata)
    vector: Optional[List[float]] = None
    vector_updated_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    model_config = ConfigDict(json_encoders={datetime: lambda v: v.isoformat()})

    def update_usage_stats(self, success: bool, latency: float) -> None:
        """更新使用统计信息

        Args:
            success: 是否成功使用
            latency: 使用延迟（秒）
        """
        self.metadata.usage_count += 1
        if success:
            # 使用移动平均值更新成功率
            self.metadata.success_rate = (
                self.metadata.success_rate * (self.metadata.usage_count - 1) + 1.0
            ) / self.metadata.usage_count
        else:
            self.metadata.success_rate = (
                self.metadata.success_rate * (self.metadata.usage_count - 1)
            ) / self.metadata.usage_count

        # 更新平均延迟
        self.metadata.average_latency = (
            self.metadata.average_latency * (self.metadata.usage_count - 1) + latency
        ) / self.metadata.usage_count

        self.updated_at = datetime.now()


class TaskPrompt(Prompt):
    """任务型 Prompt 模型"""

    task_type: str
    expected_input: Dict[str, Any] = Field(default_factory=dict)
    expected_output: Dict[str, Any] = Field(default_factory=dict)
    examples: List[Dict[str, Any]] = Field(default_factory=list)


class ContextPrompt(Prompt):
    """上下文型 Prompt 模型"""

    context_type: str
    required_fields: List[str] = Field(default_factory=list)
    optional_fields: List[str] = Field(default_factory=list)
    context_rules: List[str] = Field(default_factory=list)


class TemplatePrompt(Prompt):
    """模板型 Prompt 模型"""

    template_variables: List[str] = Field(default_factory=list)
    default_values: Dict[str, Any] = Field(default_factory=dict)
    validation_rules: Dict[str, Any] = Field(default_factory=dict)


class SystemPrompt(Prompt):
    """系统型 Prompt 模型"""

    system_role: str
    capabilities: List[str] = Field(default_factory=list)
    constraints: List[str] = Field(default_factory=list)
    dependencies: List[str] = Field(default_factory=list)


class ScenarioPrompt(Prompt):
    """场景型 Prompt 模型"""

    scenario_type: ScenarioType
    purpose: str  # Prompt 的用途（例如: 任务描述, 约束条件, 示例）
    instructions: List[str] = Field(default_factory=list)  # 使用说明
    examples: List[Dict[str, Any]] = Field(default_factory=list)  # 示例
    related_scenarios: List[ScenarioType] = Field(default_factory=list)  # 相关场景
