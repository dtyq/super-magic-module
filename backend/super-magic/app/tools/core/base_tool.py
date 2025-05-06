"""工具基类模块

定义所有工具的基础类，提供共同功能和接口
"""

import time
from abc import ABC, abstractmethod
from typing import Any, Dict, Generic, Optional, Type, TypeVar, Union

from pydantic import ConfigDict, ValidationError

from app.core.context.tool_context import ToolContext
from app.core.entity.message.server_message import ToolDetail
from app.core.entity.tool.tool_result import ToolResult
from app.logger import get_logger
from app.tools.core.base_tool_params import BaseToolParams
from app.utils.snowflake_service import SnowflakeService

# 定义参数类型变量
T = TypeVar('T', bound=BaseToolParams)


class BaseTool(ABC, Generic[T]):
    """工具基类

    所有工具的基类，定义共同接口和功能
    """
    # 工具元数据
    name: str = ""
    description: str = ""

    # 参数模型类型（由子类指定）
    params_class: Type[T] = None

    # 配置项
    model_config = ConfigDict(arbitrary_types_allowed=True)

    def __init__(self, **data):
        """初始化工具"""
        # 如果没有在初始化参数中提供name和description，使用类属性
        if 'name' not in data and hasattr(self.__class__, 'name'):
            data['name'] = self.__class__.name
        if 'description' not in data and hasattr(self.__class__, 'description'):
            data['description'] = self.__class__.description

        # 设置实例属性
        for key, value in data.items():
            setattr(self, key, value)

    @abstractmethod
    async def execute(self, tool_context: ToolContext, params: T) -> ToolResult:
        """执行工具

        Args:
            tool_context: 工具上下文
            params: 工具参数

        Returns:
            ToolResult: 工具执行结果
        """
        pass

    async def __call__(self, tool_context: ToolContext, **kwargs) -> ToolResult:
        """执行工具

        这是工具调用的主要入口点，支持通过参数字典调用工具

        此方法会自动完成以下工作：
        1. 参数验证和转换：将传入的字典参数转换为工具需要的Pydantic模型
        2. 性能计时：记录工具执行时间
        3. 结果处理：确保结果包含必要字段
        4. 错误处理：通过自定义错误消息机制提供更友好的错误提示

        Args:
            tool_context: 工具上下文
            **kwargs: 参数字典

        Returns:
            ToolResult: 工具执行结果
        """
        start_time = time.time()

        logger = get_logger(__name__)

        # 没有参数模型类型的工具是无效的
        if not self.params_class:
            error_msg = f"工具 {self.name} 没有定义参数模型类型"
            logger.error(error_msg)
            return ToolResult(
                error=error_msg,
                name=self.name
            )

        # 尝试根据参数字典创建参数模型实例
        try:
            params = self.params_class(**kwargs)
        except ValidationError as e:
            # 参数验证失败处理
            error_details = e.errors()
            logger.debug(f"验证错误详情: {error_details}")

            # 检查是否有自定义错误消息
            # 此处实现了错误回调机制，允许工具参数类为特定字段和错误类型提供自定义错误消息
            for err in error_details:
                if err.get("loc"):
                    field_name = err.get("loc")[0]
                    error_type = err.get("type")

                    # 调用参数类的自定义错误消息方法
                    custom_error = self.params_class.get_custom_error_message(field_name, error_type)
                    if custom_error:
                        logger.info(f"使用自定义错误消息: field={field_name}, type={error_type}")
                        return ToolResult(
                            error=custom_error,
                            name=self.name
                        )

            # 如果没有自定义错误消息，使用友好的错误处理逻辑
            # 判断错误类型并生成相应的友好错误消息
            pretty_error_msg = self._generate_friendly_validation_error(error_details, self.name)
            return ToolResult(
                error=pretty_error_msg,
                name=self.name
            )
        except Exception as e:
            # 其他类型的异常
            logger.error(f"参数验证失败: {e!s}")
            pretty_error = f"工具 '{self.name}' 的参数验证失败，请检查输入参数的格式是否正确"
            result = ToolResult(
                error=pretty_error,
                name=self.name
            )
            return result

        # 执行工具
        try:
            result = await self.execute(tool_context, params)
        except Exception as e:
            logger.error(f"工具 {self.name} 执行出错: {e}", exc_info=True)
            # 捕获执行错误并返回错误结果
            result = ToolResult(
                error=f"工具执行失败: {e!s}",
                name=self.name
            )

        # 设置执行时间和名称
        execution_time = time.time() - start_time
        result.execution_time = execution_time
        result.name = self.name

        # 设置解释说明（如果有）
        explanation = params.explanation if hasattr(params, 'explanation') else None
        if explanation:
            result.explanation = explanation

        return result

    def _generate_friendly_validation_error(self, error_details, tool_name: str) -> str:
        """生成友好的验证错误消息

        Args:
            error_details: pydantic验证错误详情
            tool_name: 工具名称

        Returns:
            str: 友好的错误消息
        """
        logger = get_logger(__name__)

        # 检查是否有必填字段缺失的错误
        missing_fields = []
        type_errors = []
        other_errors = []

        for err in error_details:
            err_type = err.get("type", "")
            field_path = ".".join(str(loc) for loc in err.get("loc", []))

            if err_type == "missing":
                missing_fields.append(field_path)
            elif "type" in err_type:  # 类型错误，如type_error
                # 获取预期类型
                expected_type = "有效值"
                if "expected_type" in err.get("ctx", {}):
                    expected_type = err["ctx"]["expected_type"]
                elif "expected" in err.get("ctx", {}):
                    expected_type = err["ctx"]["expected"]

                # 获取实际值的类型
                received_type = "无效类型"
                if "input_type" in err.get("ctx", {}):
                    received_type = err["ctx"]["input_type"]
                elif "received" in err.get("ctx", {}):
                    received_type = str(type(err["ctx"]["received"]).__name__)

                error_msg = f"参数 '{field_path}' 应为 {expected_type} 类型，而不是 {received_type}"
                type_errors.append(error_msg)
            else:
                # 其他类型的错误
                msg = err.get("msg", "未知错误")
                other_errors.append(f"参数 '{field_path}': {msg}")

        # 构建友好的错误消息
        pretty_msg_parts = []

        if missing_fields:
            fields_str = "、".join(missing_fields)
            pretty_msg_parts.append(f"缺少必填参数：{fields_str}")

        if type_errors:
            pretty_msg_parts.append("类型错误：" + "；".join(type_errors))

        if other_errors:
            pretty_msg_parts.append("验证错误：" + "；".join(other_errors))

        if not pretty_msg_parts:
            # 如果没有解析出具体错误，提供一个通用的错误消息
            return f"工具 '{tool_name}' 的参数验证失败，请检查输入格式是否正确"

        return "工具调用失败！" + "；".join(pretty_msg_parts) + "，请确保参数传递正确，检查是否为语法正确的 JSON 对象，同时也有可能是输出的内容超出长度限制导致，请减少单次要输出的内容。"

    def _clean_schema_properties(self, properties: Dict[str, Any]):
        """递归清理 Pydantic 生成的 schema properties，移除 default 和 additionalProperties"""
        if not isinstance(properties, dict):
            return

        properties_to_remove = [] # 用于记录需要移除的顶层属性（如果清理后变为空字典）

        for prop_name, prop_schema in list(properties.items()): # 使用 list 复制键进行迭代，允许修改字典
            if not isinstance(prop_schema, dict):
                continue

            # 移除 default 和 additionalProperties
            prop_schema.pop('default', None)
            prop_schema.pop('additionalProperties', None)

            # 递归处理嵌套的 properties
            if 'properties' in prop_schema:
                self._clean_schema_properties(prop_schema['properties'])
                # 如果清理后 properties 为空，也移除它（可选，取决于API是否允许空properties）
                # if not prop_schema['properties']:
                #     prop_schema.pop('properties')


            # 递归处理嵌套的 items (用于数组)
            if 'items' in prop_schema and isinstance(prop_schema['items'], dict):
                 # 同样移除 items 内部的 default 和 additionalProperties
                prop_schema['items'].pop('default', None)
                prop_schema['items'].pop('additionalProperties', None)
                 # 如果 items 内部还有 properties 或 items，继续递归
                if 'properties' in prop_schema['items']:
                     self._clean_schema_properties(prop_schema['items']['properties'])
                     # if not prop_schema['items']['properties']:
                     #    prop_schema['items'].pop('properties')

                if 'items' in prop_schema['items']: # 处理嵌套数组
                    self._clean_schema_properties(prop_schema['items']) # 传递整个 items 字典进行清理

            # 如果清理后 prop_schema 变为空字典，标记以便后续移除（可选）
            # if not prop_schema:
            #    properties_to_remove.append(prop_name)


        # 移除那些清理后变为空字典的顶层属性（可选）
        # for prop_name in properties_to_remove:
        #    properties.pop(prop_name)


    def _remove_title_recursive(self, schema_obj: Any):
        """递归移除 schema 对象（字典或列表）中的 title 字段"""
        if isinstance(schema_obj, dict):
            schema_obj.pop('title', None) # 移除当前字典的 title
            for key, value in schema_obj.items():
                self._remove_title_recursive(value) # 递归处理值
        elif isinstance(schema_obj, list):
            for item in schema_obj:
                self._remove_title_recursive(item) # 递归处理列表项


    def to_param(self) -> Dict:
        """转换工具为函数调用格式

        Returns:
            Dict: 函数调用格式的工具描述
        """
        logger = get_logger(__name__)

        # 注意：移除了这里的 "additionalProperties": False
        parameters = {
            "type": "object",
            "properties": {},
            "required": [],
            # "additionalProperties": False # <-- 移除此行
        }

        if self.params_class:
            try:
                # 直接使用 Pydantic 生成的完整 schema
                schema = self.params_class.model_json_schema()

                # 只需要 properties 和 required
                if 'properties' in schema:
                    parameters['properties'] = schema['properties']
                    # 清理 properties，移除 default 和 additionalProperties
                    self._clean_schema_properties(parameters['properties'])
                    # 递归移除 title 字段
                    self._remove_title_recursive(parameters['properties'])


                if 'required' in schema:
                    parameters['required'] = schema['required']
                else:
                    # 如果原始 schema 没有 required，则默认所有非 Optional 字段为必填
                    # (Pydantic 3+ 行为，model_json_schema 默认会生成 required)
                    # 为保险起见，如果没生成，可以手动添加
                    if 'properties' in parameters: # 检查 parameters 而不是 schema
                         parameters['required'] = list(parameters['properties'].keys())


                # 确保 explanation 字段必填 (如果存在且非 Optional)
                if 'explanation' in parameters.get('properties', {}) and 'explanation' not in parameters['required']:
                     is_optional = False
                     explanation_field = self.params_class.model_fields.get('explanation')
                     if explanation_field and getattr(explanation_field, 'annotation', None):
                         from typing import get_args, get_origin  # 移动导入到需要的地方
                         origin = get_origin(explanation_field.annotation)
                         if origin is Union:
                             args = get_args(explanation_field.annotation)
                             if type(None) in args:
                                 is_optional = True
                         # Handle Optional[T] syntax introduced in Python 3.10
                         elif origin is Optional:
                            is_optional = True

                     if not is_optional:
                        # 只有在 properties 中确实存在 explanation 时才添加
                        if 'explanation' in parameters.get('properties', {}):
                           parameters['required'].append('explanation')


            except Exception as e:
                logger.error(f"生成工具参数模式时出错: {e!s}", exc_info=True) # 添加 exc_info=True

        # 如果清理后 properties 为空，也移除它
        if not parameters['properties']:
            parameters.pop('properties')
            # 如果 properties 为空，required 也应该为空
            parameters.pop('required', None)


        # 如果 parameters 只剩下 'type': 'object' 且为空，则整个 parameters 字段可以省略
        # 但 OpenAI 可能需要一个空的 parameters 对象，所以保留 {"type": "object"} 可能更安全
        # if parameters == {"type": "object"}:
        #    # 根据目标 API 的要求决定是否返回空字典或特定的空对象表示
        #    pass


        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": parameters,
                # "strict": True, # 移除 strict，因为它可能不被支持或需要放在不同位置
            },
        }

    def generate_message_id(self) -> str:
        """生成消息ID

        使用默认方式生成
        """
        # 使用雪花算法生成ID
        snowflake = SnowflakeService.create_default()
        return str(snowflake.get_id())

    def get_prompt_hint(self) -> str:
        """
        获取工具想要附加到主 Prompt 的提示信息。

        子类可以覆盖此方法以提供特定于工具的上下文或指令，
        这些信息将在 Agent 初始化时被追加到基础 Prompt 中。

        Returns:
            str: 要追加到 Prompt 的提示字符串，默认为空。
        """
        return ""

    async def get_tool_detail(self, tool_context: ToolContext, result: ToolResult, arguments: Dict[str, Any] = None) -> Optional[ToolDetail]:
        """
        根据工具执行结果获取对应的ToolDetail

        每个工具类可以重写此方法，提供适合该工具的ToolDetail
        可以返回None表示没有需要展示的工具详情

        Args:
            tool_context: 工具上下文
            result: 工具执行的结果
            arguments: 其他额外参数字典，用于构建特定类型的详情

        Returns:
            Optional[ToolDetail]: 工具详情对象，可能为None
        """
        # 默认实现：返回None
        return None

    async def get_before_tool_call_friendly_content(self, tool_context: ToolContext, arguments: Dict[str, Any] = None) -> str:
        """获取工具调用前的友好内容"""
        return arguments["explanation"]

    async def get_after_tool_call_friendly_content(self, tool_context: ToolContext, result: ToolResult, execution_time: float, arguments: Dict[str, Any] = None) -> str:
        """
        获取工具调用后的友好内容

        Args:
            tool_context: 工具上下文
            result: 工具执行结果
            execution_time: 执行耗时
            arguments: 执行参数

        Returns:
            str: 友好的执行结果消息
        """
        return ""

    async def get_after_tool_call_friendly_action_and_remark(self, tool_name: str, tool_context: ToolContext, result: ToolResult, execution_time: float, arguments: Dict[str, Any] = None) -> Dict:
        """
        获取工具调用后的友好动作和备注

        Args:
            tool_name: 工具名称
            tool_context: 工具上下文
            result: 工具执行结果
            execution_time: 执行耗时
            arguments: 执行参数

        Returns:
            Dict: 包含action和remark的字典
        """
        return {
            "action": "",
            "remark": ""
        }
