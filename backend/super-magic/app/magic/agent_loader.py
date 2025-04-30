import re
from pathlib import Path
from typing import Any, Dict, Tuple

from app.logger import get_logger

logger = get_logger(__name__)


class AgentLoader:
    def __init__(self):
        self._agents = {}
        # 设置 agent 文件目录
        self._agent_dirs = Path(__file__).parent.parent.parent / "agents"

    def set_variables(self, prompt: str, variables: Dict[str, Any]):
        """设置变量"""
        """
        设置变量

        Args:
            prompt: 提示词
            variables: 变量
        """
        pattern = r"\{\{([^}]+)\}\}"

        def replace_var(match):
            var_name = match.group(1).strip()
            if var_name not in variables:
                return f"{{{{未定义的变量: {var_name}}}}}"
            return str(variables[var_name])

        return re.sub(pattern, replace_var, prompt)

    def load_agent(self, agent_name: str, variables: Dict[str, Any] = None) -> Tuple[Dict[str, Any], Dict[str, Any], Dict[str, Any], str]:
        """加载 agent"""
        """
        加载 agent 文件内容，并设置变量

        Args:
            agent_name: agent 名称
            variables: 变量，可选参数

        Returns:
            Tuple[Dict[str, Any], Dict[str, Any], Dict[str, Any], str]: 模型配置、工具配置、属性配置、提示词
        """
        # 确保 variables 不为 None
        if variables is None:
            variables = {}
            
        # 检查 agent_name 是否已经加载
        if agent_name in self._agents:
            agent_data = self._agents[agent_name]
            return agent_data["model_config"], agent_data["tools_config"], agent_data["attributes_config"], agent_data["prompt"]

        # 获取 agent 文件内容
        agent_file_content = self._get_agent_file_content(agent_name)
        # 解析 agent 文件内容
        tools_definition, model_definition, attributes_definition, prompt = self._parse_agent_file_content(agent_file_content)
        # 设置变量
        if variables:
            prompt = self.set_variables(prompt, variables)
        # 根据 agent_name 保存到 self._agents 中
        self._agents[agent_name] = {
            "model_definition": model_definition,
            "tools_definition": tools_definition,
            "attributes_config": attributes_definition,
            "prompt": prompt,
        }
        return model_definition, tools_definition, attributes_definition, prompt

    def _get_agent_file_content(self, agent_name: str):
        """获取 agent 文件内容"""
        """
        获取 agent 文件内容

        Args:
            agent_name: agent 名称

        Returns:
            str: agent 文件内容
        """
        # 获取 agent 文件路径
        agent_file = self._agent_dirs / f"{agent_name}.agent"
        # 检查 agent 文件是否存在
        if not agent_file.exists():
            raise FileNotFoundError(f"Agent 文件不存在: {agent_file}")
        # 读取 agent 文件内容
        with open(agent_file, "r", encoding="utf-8") as f:
            return f.read()

    def _parse_agent_file_content(self, agent_file_content: str) -> Tuple[Dict[str, Any], Dict[str, Any], Dict[str, Any], str]:
        """解析 agent 文件内容"""
        """
        解析 agent 文件内容

        Args:
            agent_file_content: agent 文件内容

        Returns:
            Tuple[Dict[str, Any], Dict[str, Any], Dict[str, Any], str]: 工具配置、模型配置、属性配置、提示词
        """
        # 初始化配置
        tools_config = {}
        model_config = {}
        attributes_config = {}
        prompt = ""

        # 解析 tools_config
        tools_pattern = r"<!--\s*tools:\s*([\w,\s\.-]+)\s*-->"
        match = re.search(tools_pattern, agent_file_content)
        if match:
            tools_str = match.group(1).strip()
            tools = {tool.strip(): {} for tool in tools_str.split(",") if tool.strip()}
            logger.debug(f"从 agent 文件中解析到工具配置: {tools}")
            tools_config = tools
        else:
            logger.error("未在 agent 文件中找到工具配置")
            raise ValueError("未在 agent 文件中找到工具配置")

        # 解析 model_config
        model_pattern = r"<!--\s*llm_model:\s*([\w,\s\.-]+)\s*-->"
        match = re.search(model_pattern, agent_file_content)
        if match:
            model_str = match.group(1).strip()
            models = {model.strip(): {} for model in model_str.split(",") if model.strip()}
            logger.debug(f"从 agent 文件中解析到模型配置: {models}")
            model_config = models
        else:
            logger.error("未在 agent 文件中找到模型配置")

        # 解析 attributes_config
        attributes_pattern = r"<!--\s*attributes:\s*([\w,\s\.-]+)\s*-->"
        match = re.search(attributes_pattern, agent_file_content)
        if match:
            attributes_str = match.group(1).strip()
            attributes = {attribute.strip(): True for attribute in attributes_str.split(",") if attribute.strip()}
            logger.debug(f"从 agent 文件中解析到属性配置: {attributes}")
            attributes_config = attributes
        else:
            logger.debug("未在 agent 文件中找到属性配置")

        # 解析 prompt
        prompt = re.sub(r"<!--(.*?)-->", "", agent_file_content, flags=re.DOTALL)
        prompt = prompt.strip()
        # logger.debug(f"从 agent 文件中解析到提示词: {prompt}")

        return tools_config, model_config, attributes_config, prompt
