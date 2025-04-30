"""
翻译工具类

此模块提供工具名称和动作的多语言翻译功能
"""

import json
import os
from pathlib import Path
from typing import Dict, Optional


class ToolTranslator:
    """
    工具翻译器，提供工具名称和操作的中英文翻译功能

    支持通过环境变量配置语言(zh或en)
    主要功能:
    1. 提供工具名称的多语言翻译
    2. 提供工具动作的多语言翻译
    3. 支持从文件加载翻译
    4. 支持注册新的翻译
    """

    # 默认语言
    DEFAULT_LANGUAGE = "zh"

    # 支持的语言列表
    SUPPORTED_LANGUAGES = ["zh", "en"]

    # 环境变量名称
    ENV_LANGUAGE = "TOOL_LANGUAGE"

    # 工具名称翻译字典 - 结构为 {tool_name: {lang_code: translated_name}}
    _translations: Dict[str, Dict[str, str]] = {
        # 搜索工具
        # 移除 "google_search": {"zh": "谷歌搜索", "en": "Google Search"},
        "bing_search": {"zh": "必应搜索", "en": "Bing Search"},
        # 浏览器工具
        "use_browser": {"zh": "浏览网页", "en": "Browse Website"},
        # Python执行工具
        "python_execute": {"zh": "执行Python代码", "en": "Execute Python Code"},
        # 文件操作工具
        "file_save": {"zh": "保存文件", "en": "Save File"},
        "file_read": {"zh": "读取文件", "en": "Read File"},
        "file_saver": {"zh": "文件保存器", "en": "File Saver"},
        # 目录工具
        "make_directory": {"zh": "创建目录", "en": "Create Directory"},
        # 编辑工具
        "edit_file": {"zh": "编辑文件", "en": "Edit File"},
        # 终止工具
        "terminate": {"zh": "终止任务", "en": "Terminate Task"},
        # 删除文件
        "delete_file": {"zh": "删除文件", "en": "Delete File"},
        # 调用代理
        "call_agent": {"zh": "调用代理", "en": "Call Agent"},
        "finish_task": {"zh": "完成任务", "en": "Finish Task"},
        "read_file": {"zh": "读取文件", "en": "Read File"},
        "shell_exec": {"zh": "脚本执行", "en": "Execute Shell Command"},
        "get_text": {"zh": " 精读内容", "en": "Read Content"},
        "get_markdown_text": {"zh": "精读内容", "en": "Read Content"},
        "get_html": {"zh": "精读网页", "en": "Read HTML"},
    }

    # 工具操作翻译字典 - 结构为 {action: {lang_code: translated_action}}
    _action_translations: Dict[str, Dict[str, str]] = {
        "edit": {"zh": "编辑", "en": "edit"},
        "save": {"zh": "保存", "en": "save"},
        "read": {"zh": "读取", "en": "read"},
        "create": {"zh": "创建", "en": "create"},
        "search": {"zh": "搜索", "en": "search"},
        "browse": {"zh": "浏览", "en": "browse"},
        "execute": {"zh": "执行", "en": "execute"},
        "use": {"zh": "使用", "en": "use"},
        "delete": {"zh": "删除", "en": "delete"},
        "call": {"zh": "调用", "en": "call"},
        "compress": {"zh": "压缩", "en": "compress"},
        "terminate": {"zh": "终止", "en": "terminate"},
    }

    # 备注格式模板
    _remark_templates = {"zh": "{tool_name}：{target_file}", "en": "{tool_name}: {target_file}"}

    @classmethod
    def get_language(cls) -> str:
        """
        获取当前设置的语言

        从环境变量获取语言设置，如果未设置或设置的语言不支持，则使用默认语言

        Returns:
            str: 语言代码
        """
        language = os.environ.get(cls.ENV_LANGUAGE, cls.DEFAULT_LANGUAGE)
        if language not in cls.SUPPORTED_LANGUAGES:
            language = cls.DEFAULT_LANGUAGE
        return language

    @classmethod
    def translate(cls, name: str, type: str = "tool", language: Optional[str] = None) -> str:
        """
        核心翻译方法，根据名称和类型获取翻译

        Args:
            name: 需要翻译的名称
            type: 翻译类型，可选值: "tool"(工具名称) 或 "action"(工具动作)
            language: 语言代码，如果未提供则使用环境变量或默认语言

        Returns:
            str: 翻译后的名称，如果没有对应翻译则返回原名称
        """
        if language is None:
            language = cls.get_language()

        # 根据类型选择不同的翻译字典
        if type == "tool":
            translations = cls._translations
        elif type == "action":
            translations = cls._action_translations
        else:
            return name

        # 查找并返回翻译
        if name in translations:
            return translations[name].get(language, name)

        return name

    @classmethod
    def translate_tool_name(cls, tool_name: str, language: Optional[str] = None) -> str:
        """
        翻译工具名称

        Args:
            tool_name: 工具名称
            language: 语言代码，如果未提供则使用环境变量或默认语言

        Returns:
            str: 翻译后的工具名称
        """
        return cls.translate(tool_name, "tool", language)

    @classmethod
    def translate_action(cls, action: str, language: Optional[str] = None) -> str:
        """
        翻译工具动作

        Args:
            action: 工具动作
            language: 语言代码，如果未提供则使用环境变量或默认语言

        Returns:
            str: 翻译后的工具动作
        """
        return cls.translate(action, "action", language)

    @classmethod
    def format_tool_remark(cls, tool_name: str, target_file: str = "", language: Optional[str] = None) -> str:
        """
        格式化工具备注

        Args:
            tool_name: 工具名称
            target_file: 目标文件路径（可选）
            language: 语言代码，如果未提供则使用环境变量或默认语言

        Returns:
            str: 格式化后的工具备注
        """
        if language is None:
            language = cls.get_language()

        translated_name = cls.translate_tool_name(tool_name, language)

        if target_file:
            template = cls._remark_templates.get(language, "{tool_name}: {target_file}")
            return template.format(tool_name=translated_name, target_file=target_file)

        return translated_name

    @classmethod
    def register_translation(cls, tool_name: str, zh_name: str, en_name: str) -> None:
        """
        注册新的工具翻译

        Args:
            tool_name: 工具名称
            zh_name: 中文翻译
            en_name: 英文翻译
        """
        cls._translations[tool_name] = {"zh": zh_name, "en": en_name}

    @classmethod
    def register_action_translation(cls, action: str, zh_action: str, en_action: str) -> None:
        """
        注册新的动作翻译

        Args:
            action: 动作名称
            zh_action: 中文翻译
            en_action: 英文翻译
        """
        cls._action_translations[action] = {"zh": zh_action, "en": en_action}

    @classmethod
    def init_from_file(cls, filename=None):
        """
        从文件初始化翻译

        Args:
            filename: 翻译文件路径，如果未提供则使用默认路径

        Returns:
            bool: 是否成功初始化
        """
        # 如果未指定文件，则使用默认路径
        if filename is None:
            # 尝试获取当前文件所在目录
            try:
                current_file = Path(__file__).resolve()
                filename = current_file.parent / "translations.json"
            except:
                return False

        # 检查文件是否存在
        if not os.path.exists(filename):
            return False

        try:
            # 读取并解析数据
            with open(filename, "r", encoding="utf-8") as f:
                data = json.load(f)

            # 导入工具翻译
            if "tools" in data:
                for name, trans in data["tools"].items():
                    if "zh" in trans and "en" in trans:
                        cls.register_translation(name, trans["zh"], trans["en"])

            # 导入动作翻译
            if "actions" in data:
                for action, trans in data["actions"].items():
                    if "zh" in trans and "en" in trans:
                        cls.register_action_translation(action, trans["zh"], trans["en"])

            return True
        except Exception as e:
            print(f"初始化翻译失败: {e!s}")
            return False


# 在模块加载时尝试初始化翻译
ToolTranslator.init_from_file()


# 向后兼容，保留简单接口
def translate_tool_name(tool_name: str, language: Optional[str] = None) -> str:
    """兼容旧版API的工具名称翻译函数"""
    return ToolTranslator.translate_tool_name(tool_name, language)
