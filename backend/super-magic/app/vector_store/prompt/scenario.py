"""场景识别模块，识别用户请求对应的场景类型"""

import json
from typing import Dict, List, Optional, Tuple

from openai import AsyncOpenAI

from app.logger import get_logger
from app.vector_store.prompt.models import ScenarioType

logger = get_logger(__name__)


class ScenarioIdentificationError(Exception):
    """场景识别错误"""

    pass


class ScenarioIdentifier:
    """场景识别器，使用大模型识别用户请求的场景类型"""

    def __init__(
        self,
        openai_client: AsyncOpenAI,
        model: str,
        min_confidence_score: float = 0.7,
        default_scenario: Optional[ScenarioType] = None,
    ):
        """初始化场景识别器

        Args:
            openai_client: OpenAI 客户端实例
            model: 使用的模型名称
            min_confidence_score: 最小置信度阈值，低于此阈值将返回默认场景或抛出异常
            default_scenario: 默认场景，当无法识别时返回
        """
        self.client = openai_client
        self.model = model
        self.min_confidence_score = min_confidence_score
        self.default_scenario = default_scenario

        # 获取所有场景枚举值及其描述
        self.scenario_map = {
            scenario.value: (scenario, getattr(ScenarioType, scenario.name).__doc__) for scenario in ScenarioType
        }

    def _build_prompt(self, user_request: str) -> str:
        """构建场景识别的 prompt

        Args:
            user_request: 用户请求文本

        Returns:
            构建的 prompt
        """
        scenarios_json = json.dumps(
            [
                {"scenario_id": key, "name": value[0].name, "description": value[1] if value[1] else key}
                for key, value in self.scenario_map.items()
            ],
            ensure_ascii=False,
            indent=2,
        )

        return f"""你是一个场景分类器，负责将用户请求分类到预定义的场景类别中。
请根据用户的请求内容，从以下场景列表中选择最匹配的一个或多个场景：

{scenarios_json}

用户请求: {user_request}

请分析用户请求并以以下JSON格式返回，不要有任何其他解释:
{{
  "scenarios": [
    {{
      "scenario_id": "场景ID",
      "confidence": 0.9  // 置信度，0.0-1.0
    }}
  ],
  "reasoning": "选择这些场景的简短理由"
}}

如果有多个相关场景，请按照置信度从高到低排序，最多返回3个场景。"""

    async def identify_scenario(self, user_request: str) -> Tuple[ScenarioType, float, List[Dict]]:
        """识别用户请求的场景类型

        Args:
            user_request: 用户请求文本

        Returns:
            元组(场景类型, 置信度, 所有识别出的场景列表)

        Raises:
            ScenarioIdentificationError: 场景识别失败或置信度不足
        """
        try:
            prompt = self._build_prompt(user_request)

            # 调用大模型
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "你是一个精确的场景分类器。"},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.2,  # 使用较低的温度以获得更确定的结果
            )

            # 解析结果
            try:
                content = response.choices[0].message.content
                result = json.loads(content)

                if not result.get("scenarios") or len(result["scenarios"]) == 0:
                    raise ValueError("No scenarios identified")

                # 取置信度最高的场景
                top_scenario = result["scenarios"][0]
                scenario_id = top_scenario["scenario_id"]
                confidence = top_scenario["confidence"]

                if confidence < self.min_confidence_score:
                    logger.warning(
                        f"Low confidence scenario identification: {scenario_id} with confidence {confidence}"
                    )
                    if self.default_scenario:
                        return self.default_scenario, 0.0, result["scenarios"]
                    else:
                        raise ScenarioIdentificationError(
                            f"Confidence too low ({confidence}) for identified scenario: {scenario_id}"
                        )

                # 将 scenario_id 转换为 ScenarioType 枚举
                if scenario_id in self.scenario_map:
                    return self.scenario_map[scenario_id][0], confidence, result["scenarios"]
                else:
                    logger.error(f"Unknown scenario type: {scenario_id}")
                    if self.default_scenario:
                        return self.default_scenario, 0.0, result["scenarios"]
                    else:
                        raise ScenarioIdentificationError(f"Unknown scenario type: {scenario_id}")

            except (json.JSONDecodeError, KeyError, IndexError, ValueError) as e:
                logger.error(f"Failed to parse scenario identification result: {e!s}")
                if self.default_scenario:
                    return self.default_scenario, 0.0, []
                else:
                    raise ScenarioIdentificationError(f"Failed to parse scenario identification result: {e!s}")

        except Exception as e:
            logger.error(f"Scenario identification error: {e!s}")
            if self.default_scenario:
                return self.default_scenario, 0.0, []
            else:
                raise ScenarioIdentificationError(f"Scenario identification error: {e!s}")


class AzureScenarioIdentifier(ScenarioIdentifier):
    """使用 Azure OpenAI 进行场景识别"""

    def __init__(
        self,
        api_key: str,
        endpoint: str,
        deployment: str,
        min_confidence_score: float = 0.7,
        default_scenario: Optional[ScenarioType] = None,
    ):
        """初始化 Azure OpenAI 场景识别器

        Args:
            api_key: Azure OpenAI API 密钥
            endpoint: Azure OpenAI 端点 URL
            deployment: 部署名称
            min_confidence_score: 最小置信度阈值
            default_scenario: 默认场景
        """
        # 创建 Azure OpenAI 客户端
        client = AsyncOpenAI(
            api_key=api_key,
            base_url=endpoint,
        )

        # 在 Azure 中，model 参数需要使用部署名称
        super().__init__(
            openai_client=client,
            model=deployment,
            min_confidence_score=min_confidence_score,
            default_scenario=default_scenario,
        )
