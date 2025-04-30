# -*- coding: utf-8 -*-
"""
测试聊天历史模型和聊天历史类的导入和基本功能
"""

import os
import tempfile
import unittest
from uuid import uuid4

from app.core.chat_history_models import (
    TokenUsageInfo, CompressionConfig, CompressionInfo,
    SystemMessage, UserMessage, AssistantMessage, ToolMessage
)
from app.core.chat_history import ChatHistory


class TestChatHistoryModels(unittest.TestCase):
    """测试聊天历史模型的基本功能"""

    def test_token_usage_info(self):
        """测试Token使用信息类"""
        # 创建对象
        token_info = TokenUsageInfo(
            prompt_tokens=100,
            completion_tokens=50
        )
        
        # 检查属性
        self.assertEqual(token_info.prompt_tokens, 100)
        self.assertEqual(token_info.completion_tokens, 50)
        
        # 测试is_empty方法
        self.assertFalse(token_info.is_empty())
        
        # 测试空对象
        empty_token_info = TokenUsageInfo()
        self.assertTrue(empty_token_info.is_empty())

    def test_compression_config(self):
        """测试压缩配置类"""
        # 创建默认配置
        config = CompressionConfig()
        
        # 检查默认值
        self.assertTrue(config.enable_compression)
        self.assertEqual(config.token_threshold, 3000)
        
        # 创建自定义配置
        custom_config = CompressionConfig(
            enable_compression=False,
            token_threshold=5000
        )
        
        # 检查自定义值
        self.assertFalse(custom_config.enable_compression)
        self.assertEqual(custom_config.token_threshold, 5000)


class TestChatHistory(unittest.TestCase):
    """测试ChatHistory类的基本功能"""
    
    def setUp(self):
        """设置测试环境"""
        self.temp_dir = tempfile.mkdtemp()
        self.agent_name = "test_agent"
        self.agent_id = str(uuid4())
        self.chat_history = ChatHistory(
            agent_name=self.agent_name,
            agent_id=self.agent_id,
            chat_history_dir=self.temp_dir
        )
    
    def tearDown(self):
        """清理测试环境"""
        import shutil
        shutil.rmtree(self.temp_dir)
    
    def test_append_messages(self):
        """测试添加各种类型的消息"""
        # 添加系统消息
        self.chat_history.append_system_message("这是系统消息")
        
        # 添加用户消息
        self.chat_history.append_user_message("这是用户消息")
        
        # 添加助手消息
        self.chat_history.append_assistant_message("这是助手消息")
        
        # 确认消息数量
        self.assertEqual(len(self.chat_history.messages), 3)
        
        # 检查消息类型
        self.assertIsInstance(self.chat_history.messages[0], SystemMessage)
        self.assertIsInstance(self.chat_history.messages[1], UserMessage)
        self.assertIsInstance(self.chat_history.messages[2], AssistantMessage)
    
    def test_save_and_load(self):
        """测试保存和加载功能"""
        # 添加测试消息
        self.chat_history.append_system_message("系统指令")
        self.chat_history.append_user_message("用户问题")
        
        # 保存聊天历史
        self.chat_history.save()
        
        # 创建新的ChatHistory实例加载历史
        new_chat_history = ChatHistory(
            agent_name=self.agent_name,
            agent_id=self.agent_id,
            chat_history_dir=self.temp_dir
        )
        
        # 验证加载的消息
        self.assertEqual(len(new_chat_history.messages), 2)
        self.assertEqual(new_chat_history.messages[0].content, "系统指令")
        self.assertEqual(new_chat_history.messages[1].content, "用户问题")


if __name__ == "__main__":
    unittest.main() 