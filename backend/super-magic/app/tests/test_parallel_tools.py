"""
测试 Agent 类中的并行工具调用功能
"""

import asyncio
import time
from typing import Dict, List, Any

from app.core.context.agent_context import AgentContext
from app.core.context.tool_context import ToolContext
from app.core.entity.tool.tool_result import ToolResult
from app.core.chat_history import ToolCall, FunctionCall
from app.magic.agent import Agent
from app.tools.core.base_tool import BaseTool
from app.tools.core.tool_decorator import tool
from app.tools.core.base_tool_params import BaseToolParams
from pydantic import BaseModel, Field

# 定义工具参数模型
class SlowToolParams(BaseToolParams):
    sleep_time: float = Field(2.0, description="休眠时间（秒）")
    return_error: bool = Field(False, description="是否返回错误结果")

class EchoToolParams(BaseToolParams):
    message: str = Field("", description="要回显的消息")
    sleep_time: float = Field(0.5, description="休眠时间（秒）")

# 模拟耗时的工具
@tool("test_slow_tool", "测试用的耗时工具")
class SlowTool(BaseTool[SlowToolParams]):
    """测试用的耗时工具"""
    
    params_class = SlowToolParams
    
    async def execute(self, tool_context: ToolContext, params: SlowToolParams) -> ToolResult:
        """
        模拟一个耗时的工具调用
        
        Args:
            tool_context: 工具上下文
            params: 工具参数
        
        Returns:
            工具执行结果
        """
        start_time = time.time()
        print(f"开始执行耗时工具，将休眠 {params.sleep_time} 秒")
        
        # 模拟耗时操作
        await asyncio.sleep(params.sleep_time)
        
        end_time = time.time()
        duration = end_time - start_time
        
        if params.return_error:
            return ToolResult(
                content=f"工具执行出错（模拟错误）",
                ok=False,
                tool_call_id=tool_context.tool_call_id,
                execution_time=duration
            )
        else:
            return ToolResult(
                content=f"工具执行成功，休眠了 {params.sleep_time} 秒，实际耗时 {duration:.2f} 秒",
                ok=True,
                tool_call_id=tool_context.tool_call_id,
                execution_time=duration
            )

@tool("test_echo_tool", "测试用的回显工具")
class EchoTool(BaseTool[EchoToolParams]):
    """测试用的回显工具"""
    
    params_class = EchoToolParams
    
    async def execute(self, tool_context: ToolContext, params: EchoToolParams) -> ToolResult:
        """
        简单回显消息的工具
        
        Args:
            tool_context: 工具上下文
            params: 工具参数
        
        Returns:
            工具执行结果
        """
        start_time = time.time()
        
        # 短暂的延迟
        await asyncio.sleep(params.sleep_time)
        
        end_time = time.time()
        duration = end_time - start_time
        
        return ToolResult(
            content=f"回显消息: {params.message}",
            ok=True,
            tool_call_id=tool_context.tool_call_id,
            execution_time=duration
        )


async def test_sequential_vs_parallel():
    """
    测试顺序执行与并行执行的性能差异
    """
    print(f"开始测试: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 创建 Agent 实例
    agent_context = AgentContext()
    agent = Agent("test_agent", agent_context=agent_context)
    
    # 准备模拟的工具调用数据
    tool_calls = []
    for i in range(1, 4):
        function_call = FunctionCall(
            name="test_slow_tool",
            arguments=f'{{"sleep_time": {i}, "return_error": false}}'
        )
        tool_call = ToolCall(
            id=f"call_{i}",
            type="function",
            function=function_call
        )
        tool_calls.append(tool_call)
    
    # 1. 测试顺序执行模式
    agent.enable_parallel_tool_calls = False
    print("\n=== 顺序执行测试 ===")
    start_time = time.time()
    results = await agent._execute_tool_calls(tool_calls, None)
    sequential_duration = time.time() - start_time
    
    print(f"顺序执行完成，总耗时: {sequential_duration:.2f}秒")
    for i, result in enumerate(results):
        print(f"任务 {i+1} 结果: {result.content}")
    
    # 2. 测试并行执行模式
    agent.enable_parallel_tool_calls = True
    agent.parallel_tool_calls_timeout = None  # 不设置超时
    print("\n=== 并行执行测试 ===")
    start_time = time.time()
    results = await agent._execute_tool_calls(tool_calls, None)
    parallel_duration = time.time() - start_time
    
    print(f"并行执行完成，总耗时: {parallel_duration:.2f}秒")
    for i, result in enumerate(results):
        print(f"任务 {i+1} 结果: {result.content}")
    
    # 性能对比
    print("\n=== 性能对比 ===")
    print(f"顺序执行总耗时: {sequential_duration:.2f}秒")
    print(f"并行执行总耗时: {parallel_duration:.2f}秒")
    if parallel_duration > 0:
        speedup = sequential_duration / parallel_duration
        print(f"性能提升: {speedup:.2f}倍")
    else:
        print("无法计算性能提升（并行执行时间为0）")
    
    # 3. 测试并行执行与超时功能
    print("\n=== 超时功能测试 ===")
    # 添加一个超长时间的任务
    long_function_call = FunctionCall(
        name="test_slow_tool",
        arguments='{"sleep_time": 10, "return_error": false}'
    )
    long_tool_call = ToolCall(
        id="call_long",
        type="function",
        function=long_function_call
    )
    tool_calls.append(long_tool_call)
    
    # 设置2秒的超时时间
    agent.parallel_tool_calls_timeout = 2.0
    print(f"设置 {agent.parallel_tool_calls_timeout} 秒超时，添加了一个需要10秒的任务")
    
    start_time = time.time()
    try:
        results = await agent._execute_tool_calls(tool_calls, None)
        timeout_duration = time.time() - start_time
        
        print(f"执行完成，总耗时: {timeout_duration:.2f}秒")
        for i, result in enumerate(results):
            print(f"任务 {i+1} 结果: {result.content}")
    except Exception as e:
        timeout_duration = time.time() - start_time
        print(f"执行出错: {e}")
        print(f"出错时总耗时: {timeout_duration:.2f}秒")
    
    print(f"\n测试结束时间: {time.strftime('%Y-%m-%d %H:%M:%S')}")


if __name__ == "__main__":
    asyncio.run(test_sequential_vs_parallel()) 