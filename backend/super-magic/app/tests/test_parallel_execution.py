"""
测试 Parallel 类在工具调用场景中的应用
"""

import asyncio
import time
from typing import Dict, Any, List

from app.utils.parallel import Parallel


# 模拟一个工具执行函数
async def execute_tool(tool_name: str, sleep_time: float, return_error: bool = False) -> Dict[str, Any]:
    """
    模拟工具执行的异步函数
    
    Args:
        tool_name: 工具名称
        sleep_time: 休眠时间（秒）
        return_error: 是否返回错误结果
        
    Returns:
        执行结果字典
    """
    print(f"开始执行工具 {tool_name}，将休眠 {sleep_time} 秒")
    start_time = time.time()
    
    # 模拟耗时操作
    await asyncio.sleep(sleep_time)
    
    end_time = time.time()
    duration = end_time - start_time
    
    if return_error:
        result = {
            "tool_name": tool_name,
            "status": "error",
            "error": "模拟的工具执行错误",
            "duration": duration,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "ok": False
        }
    else:
        result = {
            "tool_name": tool_name,
            "status": "success",
            "content": f"工具 {tool_name} 执行成功，休眠了 {sleep_time} 秒，实际耗时 {duration:.2f} 秒",
            "duration": duration,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "ok": True
        }
    
    print(f"完成执行工具 {tool_name}，耗时: {duration:.2f}秒")
    return result


async def test_sequential_execution():
    """
    测试顺序执行工具调用
    """
    print("\n=== 顺序执行测试 ===")
    start_time = time.time()
    
    # 顺序执行三个工具调用
    result1 = await execute_tool("工具1", 1.0)
    result2 = await execute_tool("工具2", 2.0)
    result3 = await execute_tool("工具3", 3.0)
    
    end_time = time.time()
    total_duration = end_time - start_time
    
    results = [result1, result2, result3]
    
    print(f"\n顺序执行完成，总耗时: {total_duration:.2f}秒")
    for i, result in enumerate(results):
        print(f"工具 {i+1} 结果: {result['content'] if 'content' in result else result['error']}")
    
    return total_duration, results


async def test_parallel_execution():
    """
    测试使用 Parallel 类并行执行工具调用
    """
    print("\n=== 并行执行测试 ===")
    start_time = time.time()
    
    # 创建 Parallel 实例
    parallel = Parallel()
    
    # 添加三个不同参数的任务
    parallel.add(execute_tool, "工具1", 1.0)
    parallel.add(execute_tool, "工具2", 2.0)
    parallel.add(execute_tool, "工具3", 3.0)
    
    # 并行执行所有任务
    results = await parallel.run()
    
    end_time = time.time()
    total_duration = end_time - start_time
    
    print(f"\n并行执行完成，总耗时: {total_duration:.2f}秒")
    for i, result in enumerate(results):
        print(f"工具 {i+1} 结果: {result['content'] if 'content' in result else result['error']}")
    
    return total_duration, results


async def test_parallel_with_errors():
    """
    测试并行执行时处理错误
    """
    print("\n=== 并行执行错误处理测试 ===")
    start_time = time.time()
    
    # 创建 Parallel 实例
    parallel = Parallel()
    
    # 添加一些任务，其中一些会返回错误
    parallel.add(execute_tool, "正常工具1", 1.0, False)
    parallel.add(execute_tool, "错误工具", 0.5, True)  # 这个会返回错误
    parallel.add(execute_tool, "正常工具2", 2.0, False)
    
    # 并行执行所有任务
    results = await parallel.run()
    
    end_time = time.time()
    total_duration = end_time - start_time
    
    print(f"\n并行执行完成，总耗时: {total_duration:.2f}秒")
    for i, result in enumerate(results):
        if result["ok"]:
            print(f"工具 {i+1} 成功: {result['content']}")
        else:
            print(f"工具 {i+1} 失败: {result['error']}")
    
    return total_duration, results


async def test_parallel_with_timeout():
    """
    测试并行执行时的超时功能
    """
    print("\n=== 并行执行超时测试 ===")
    
    # 创建带有超时的 Parallel 实例（2秒超时）
    parallel = Parallel(timeout=2.0)
    print(f"设置超时时间: 2.0秒")
    
    # 添加几个任务，其中一个会超时
    parallel.add(execute_tool, "快速工具1", 0.5)
    parallel.add(execute_tool, "慢速工具", 5.0)  # 这个会超时
    parallel.add(execute_tool, "快速工具2", 1.0)
    
    start_time = time.time()
    
    try:
        # 并行执行所有任务（预期会超时）
        results = await parallel.run()
        
        end_time = time.time()
        duration = end_time - start_time
        
        print(f"执行完成（未超时），总耗时: {duration:.2f}秒")
        for i, result in enumerate(results):
            if result["ok"]:
                print(f"工具 {i+1} 结果: {result['content']}")
            else:
                print(f"工具 {i+1} 错误: {result['error']}")
                
    except asyncio.TimeoutError as e:
        end_time = time.time()
        duration = end_time - start_time
        
        print(f"执行超时: {e}")
        print(f"超时时总耗时: {duration:.2f}秒")


async def main():
    """
    主测试函数
    """
    print(f"测试开始时间: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 1. 测试顺序执行
    seq_time, _ = await test_sequential_execution()
    
    # 2. 测试并行执行
    par_time, _ = await test_parallel_execution()
    
    # 3. 测试并行执行中的错误处理
    await test_parallel_with_errors()
    
    # 4. 测试超时功能
    await test_parallel_with_timeout()
    
    # 5. 性能对比
    print("\n=== 性能对比 ===")
    print(f"顺序执行总耗时: {seq_time:.2f}秒")
    print(f"并行执行总耗时: {par_time:.2f}秒")
    speedup = seq_time / par_time if par_time > 0 else 0
    print(f"性能提升: {speedup:.2f}倍")
    
    print(f"\n测试结束时间: {time.strftime('%Y-%m-%d %H:%M:%S')}")


if __name__ == "__main__":
    asyncio.run(main()) 