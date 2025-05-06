"""
测试聊天历史压缩功能的模块
"""
import asyncio
import logging
import os
import sys
import tempfile
from typing import List

# 确保可以导入应用模块
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.core.chat_history import (AssistantMessage, ChatHistory, CompressionConfig, SystemMessage, 
                                  TokenUsageInfo, ToolCall, ToolMessage, UserMessage)

# 配置日志
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def generate_test_history() -> ChatHistory:
    """
    生成一个测试用的聊天历史对象
    
    Returns:
        ChatHistory: 包含测试数据的聊天历史对象
    """
    # 创建临时目录作为聊天历史存储位置
    temp_dir = tempfile.mkdtemp()
    logger.info(f"创建临时目录: {temp_dir}")
    
    # 创建一个配置了压缩功能的聊天历史对象
    compression_config = CompressionConfig(
        enable_compression=True,
        token_threshold=1000,  # 设置较低的阈值以方便测试
        message_threshold=10,  # 同样设置较低的阈值
        preserve_recent_turns=2  # 保留最后2条消息
    )
    
    chat_history = ChatHistory(
        agent_name="test_agent",
        agent_id="test_compression",
        chat_history_dir=temp_dir,
        compression_config=compression_config
    )
    
    # 添加测试消息
    chat_history.append_system_message("你是一个测试助手，用于测试聊天历史压缩功能。")
    
    # 添加一组普通对话
    chat_history.append_user_message("你好，我想了解一下Python的异步编程。")
    chat_history.append_assistant_message(
        "Python异步编程使用asyncio库，主要基于协程和事件循环。关键概念包括:\n"
        "1. 协程(coroutine)：使用async/await语法定义的函数\n"
        "2. 事件循环(event loop)：管理和执行异步任务\n"
        "3. Future对象：表示异步操作的最终结果\n"
        "4. Task对象：包装协程，在事件循环中调度执行\n\n"
        "基本用法示例:\n```python\n"
        "import asyncio\n\n"
        "async def main():\n"
        "    print('Hello')\n"
        "    await asyncio.sleep(1)\n"
        "    print('World')\n\n"
        "asyncio.run(main())\n```",
        token_usage_data={"prompt_tokens": 50, "completion_tokens": 250}
    )
    
    # 添加一些包含工具调用的消息
    chat_history.append_user_message("能帮我找到项目中所有使用async函数的Python文件吗？")
    
    # 使用工具调用创建助手消息
    function_call = {
        "name": "search_files",
        "arguments": '{"pattern": "async def", "file_type": "py"}'
    }
    tool_call = {
        "id": "call_01",
        "type": "function",
        "function": function_call
    }
    
    chat_history.append_assistant_message(
        "我会帮你搜索所有使用async函数的Python文件。",
        tool_calls_data=[tool_call],
        token_usage_data={"prompt_tokens": 80, "completion_tokens": 120}
    )
    
    # 添加工具结果消息
    tool_result = (
        "搜索完成，找到7个包含async def的Python文件:\n\n"
        "1. app/services/file_service.py: 5处匹配\n"
        "2. app/api/routes.py: 8处匹配\n"
        "3. app/database/connection.py: 3处匹配\n"
        "4. app/workers/task_processor.py: 12处匹配\n"
        "5. app/clients/api_client.py: 6处匹配\n"
        "6. app/utils/async_helpers.py: 15处匹配\n"
        "7. tests/test_async.py: 10处匹配\n\n"
        "主要使用了aiohttp和asyncpg库进行异步操作。"
    )
    chat_history.append_tool_message(
        content=tool_result,
        tool_call_id="call_01"
    )
    
    # 继续对话
    chat_history.append_user_message("这太好了！能帮我解释一下database/connection.py中异步连接池的实现吗？")
    chat_history.append_assistant_message(
        "在database/connection.py中，异步连接池通常使用asyncpg实现。典型实现包括:\n\n"
        "1. 连接池初始化:\n```python\n"
        "async def init_db():\n"
        "    pool = await asyncpg.create_pool(\n"
        "        host=DB_HOST,\n"
        "        database=DB_NAME,\n"
        "        user=DB_USER,\n"
        "        password=DB_PASSWORD,\n"
        "        min_size=5,\n"
        "        max_size=20\n"
        "    )\n"
        "    return pool\n```\n\n"
        "2. 获取连接执行查询:\n```python\n"
        "async def fetch_data(query, *args):\n"
        "    async with pool.acquire() as conn:\n"
        "        return await conn.fetch(query, *args)\n```\n\n"
        "3. 事务处理:\n```python\n"
        "async def run_transaction(callback):\n"
        "    async with pool.acquire() as conn:\n"
        "        async with conn.transaction():\n"
        "            return await callback(conn)\n```\n\n"
        "这种实现允许高效处理并发数据库操作，避免阻塞主线程。",
        token_usage_data={"prompt_tokens": 120, "completion_tokens": 350}
    )
    
    # 添加更多对话以达到压缩阈值
    for i in range(5):
        chat_history.append_user_message(f"测试问题 {i+1}: 这是一个用于测试的消息，目的是增加消息数量以触发压缩机制。")
        chat_history.append_assistant_message(
            f"测试回答 {i+1}: 这是对测试问题的回答。我正在提供足够长的内容，以确保消息数量和token数量都能够超过压缩阈值。"
            f"这样我们就可以测试压缩功能是否正常工作。这是第{i+1}轮测试对话。",
            token_usage_data={"prompt_tokens": 50, "completion_tokens": 100}
        )
    
    logger.info(f"创建了测试聊天历史，共{chat_history.count}条消息，{chat_history.tokens_count}个tokens")
    return chat_history

async def test_compression():
    """测试聊天历史压缩功能"""
    # 生成测试聊天历史
    chat_history = generate_test_history()
    
    # 确保压缩功能已启用
    chat_history.compression_config.enable_compression = True
    
    # 获取压缩前的信息
    pre_count = chat_history.count
    pre_tokens = chat_history.tokens_count
    
    logger.info(f"压缩前：{pre_count}条消息，预计{pre_tokens}个tokens")
    
    # 执行压缩
    logger.info("开始执行压缩...")
    result = await chat_history.compress_history()
    
    # 获取压缩后的信息
    post_count = chat_history.count
    post_tokens = chat_history.tokens_count
    
    # 分析结果
    if result:
        messages_reduced = pre_count - post_count
        tokens_reduced = pre_tokens - post_tokens
        tokens_reduction_percent = (tokens_reduced / pre_tokens) * 100 if pre_tokens > 0 else 0
        
        logger.info(f"压缩成功！消息数：{pre_count} -> {post_count}，减少了{messages_reduced}条")
        logger.info(f"Token数：{pre_tokens} -> {post_tokens}，减少了{tokens_reduced}个({tokens_reduction_percent:.1f}%)")
        
        # 查看压缩后的消息
        compressed_messages = [msg for msg in chat_history.messages if hasattr(msg, 'compression_info') and msg.compression_info]
        if compressed_messages:
            for i, msg in enumerate(compressed_messages):
                logger.info(f"压缩消息 {i+1}:")
                logger.info(f"  - 压缩率: {msg.compression_info.compression_ratio:.1%}")
                logger.info(f"  - 原始消息数: {msg.compression_info.original_message_count}")
                logger.info(f"  - 压缩时间: {msg.compression_info.compressed_at}")
                # 只显示内容的前100个字符
                content_preview = msg.content[:100] + "..." if len(msg.content) > 100 else msg.content
                logger.info(f"  - 内容预览: {content_preview}")
        else:
            logger.warning("未找到带有压缩信息的消息")
    else:
        logger.warning("压缩未执行或未成功")
    
    # 保存并返回处理后的聊天历史
    chat_history.save()
    return chat_history

def main():
    """主函数"""
    # 运行异步测试
    chat_history = asyncio.run(test_compression())
    
    # 输出最终状态
    logger.info(f"测试完成，最终状态：{chat_history.count}条消息，{chat_history.tokens_count}个tokens")
    logger.info(f"聊天历史文件位置: {chat_history._history_file_path}")

if __name__ == "__main__":
    main() 