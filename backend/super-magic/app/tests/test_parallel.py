"""
测试 Parallel 类的性能，通过三个耗时任务展示并行执行的优势
"""

import asyncio
import time
from app.utils.parallel import Parallel


async def task_one() -> dict:
    """
    模拟任务一，延迟3秒后返回带时间戳的结果
    """
    print(f"任务一开始执行: {time.strftime('%H:%M:%S')}")
    start_time = time.time()
    
    # 模拟耗时操作
    await asyncio.sleep(3)
    
    end_time = time.time()
    result = {
        "task": "任务一",
        "start_time": start_time,
        "end_time": end_time,
        "duration": end_time - start_time,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    print(f"任务一执行完成: {time.strftime('%H:%M:%S')}, 耗时: {result['duration']:.2f}秒")
    return result


async def task_two() -> dict:
    """
    模拟任务二，延迟3秒后返回带时间戳的结果
    """
    print(f"任务二开始执行: {time.strftime('%H:%M:%S')}")
    start_time = time.time()
    
    # 模拟耗时操作
    await asyncio.sleep(3)
    
    end_time = time.time()
    result = {
        "task": "任务二",
        "start_time": start_time,
        "end_time": end_time,
        "duration": end_time - start_time,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    print(f"任务二执行完成: {time.strftime('%H:%M:%S')}, 耗时: {result['duration']:.2f}秒")
    return result


async def task_three() -> dict:
    """
    模拟任务三，延迟3秒后返回带时间戳的结果
    """
    print(f"任务三开始执行: {time.strftime('%H:%M:%S')}")
    start_time = time.time()
    
    # 模拟耗时操作
    await asyncio.sleep(3)
    
    end_time = time.time()
    result = {
        "task": "任务三",
        "start_time": start_time,
        "end_time": end_time,
        "duration": end_time - start_time,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    print(f"任务三执行完成: {time.strftime('%H:%M:%S')}, 耗时: {result['duration']:.2f}秒")
    return result


async def run_sequential():
    """
    顺序执行三个任务，并计算总耗时
    """
    print("\n=== 顺序执行测试 ===")
    total_start = time.time()
    
    result1 = await task_one()
    result2 = await task_two()
    result3 = await task_three()
    
    total_end = time.time()
    total_duration = total_end - total_start
    
    print(f"\n顺序执行总耗时: {total_duration:.2f}秒")
    print(f"任务一结果: {result1}")
    print(f"任务二结果: {result2}")
    print(f"任务三结果: {result3}")
    
    return total_duration


async def run_parallel():
    """
    并行执行三个任务，并计算总耗时
    """
    print("\n=== 并行执行测试 ===")
    total_start = time.time()
    
    # 创建 Parallel 实例
    parallel = Parallel()
    
    # 添加三个任务
    parallel.add(task_one)
    parallel.add(task_two)
    parallel.add(task_three)
    
    # 并行执行所有任务
    results = await parallel.run()
    
    total_end = time.time()
    total_duration = total_end - total_start
    
    print(f"\n并行执行总耗时: {total_duration:.2f}秒")
    for i, result in enumerate(results):
        print(f"任务 {i+1} 结果: {result}")
    
    return total_duration


async def main():
    """
    主函数，对比顺序执行和并行执行的性能差异
    """
    print(f"测试开始时间: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 顺序执行测试
    seq_time = await run_sequential()
    
    print("\n" + "-" * 50 + "\n")
    
    # 并行执行测试
    par_time = await run_parallel()
    
    # 性能对比
    print("\n=== 性能对比 ===")
    print(f"顺序执行总耗时: {seq_time:.2f}秒")
    print(f"并行执行总耗时: {par_time:.2f}秒")
    print(f"性能提升: {(seq_time / par_time):.2f}倍")
    
    print(f"\n测试结束时间: {time.strftime('%Y-%m-%d %H:%M:%S')}")


if __name__ == "__main__":
    asyncio.run(main()) 