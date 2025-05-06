"""
演示如何使用 Parallel 类的示例
"""

import asyncio
import random
import time
from app.utils.parallel import Parallel

# 模拟异步任务的函数
async def fetch_data(url: str, delay: float = 1.0) -> dict:
    """模拟从URL获取数据"""
    print(f"开始获取数据: {url}")
    await asyncio.sleep(delay)  # 模拟网络延迟
    print(f"完成获取数据: {url}")
    return {"url": url, "data": f"数据来自 {url}", "timestamp": time.time()}

async def process_item(item_id: int, processing_time: float = 0.5) -> dict:
    """模拟处理单个项目"""
    print(f"开始处理项目: {item_id}")
    await asyncio.sleep(processing_time)  # 模拟处理时间
    print(f"完成处理项目: {item_id}")
    return {"item_id": item_id, "status": "processed", "timestamp": time.time()}

# 带有异常的任务
async def failing_task(name: str) -> str:
    """一个会失败的任务"""
    print(f"开始执行任务: {name}")
    await asyncio.sleep(0.3)
    if random.random() < 0.5:  # 50%概率失败
        raise ValueError(f"任务 {name} 失败了")
    return f"任务 {name} 成功完成"

# 超时任务
async def long_task(duration: float = 3.0) -> str:
    """一个耗时较长的任务"""
    print(f"开始长时间任务: {duration}秒")
    await asyncio.sleep(duration)
    print(f"完成长时间任务")
    return "长时间任务完成"

async def main():
    print("=== 基本使用示例 ===")
    # 创建一个 Parallel 实例
    parallel = Parallel()
    
    # 添加多个任务
    parallel.add(fetch_data, "https://api.example.com/data1", 1.0)
    parallel.add(fetch_data, "https://api.example.com/data2", 0.5)
    parallel.add(process_item, 1, 0.8)
    parallel.add(process_item, 2, 0.3)
    
    # 执行所有任务并等待结果
    results = await parallel.run()
    
    # 处理结果
    print("\n结果:")
    for i, result in enumerate(results):
        print(f"任务 {i+1} 结果: {result}")
    
    print("\n=== 错误处理示例 ===")
    parallel = Parallel()
    
    # 添加可能会失败的任务
    parallel.add(fetch_data, "https://api.example.com/data3", 0.2)
    parallel.add(failing_task, "Task A")
    parallel.add(failing_task, "Task B")
    parallel.add(process_item, 3, 0.5)
    
    # 执行所有任务
    results = await parallel.run()
    
    # 处理结果和错误
    print("\n结果和错误:")
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            print(f"任务 {i+1} 失败: {type(result).__name__}: {result}")
        else:
            print(f"任务 {i+1} 成功: {result}")
    
    print("\n=== 超时控制示例 ===")
    # 创建带有超时的 Parallel 实例
    parallel = Parallel(timeout=2.0)  # 2秒超时
    
    # 添加一些任务，其中一些会超时
    parallel.add(fetch_data, "https://api.example.com/data4", 0.5)
    parallel.add(long_task, 4.0)  # 这个任务会超时
    parallel.add(process_item, 4, 0.5)
    
    try:
        # 执行所有任务，可能会抛出 TimeoutError
        results = await parallel.run()
        print("\n所有任务已完成")
    except asyncio.TimeoutError as e:
        print(f"\n超时错误: {e}")
    
    print("\n=== 分开启动和等待示例 ===")
    parallel = Parallel()
    
    # 添加任务
    parallel.add(fetch_data, "https://api.example.com/data5", 1.0)
    parallel.add(process_item, 5, 0.7)
    
    # 先启动任务
    parallel.start()
    print("任务已启动，现在可以做其他事情...")
    
    # 模拟做其他工作
    await asyncio.sleep(0.5)
    print("做了一些其他工作...")
    
    # 然后等待结果
    results = await parallel.wait()
    print("\n所有任务完成:")
    for i, result in enumerate(results):
        print(f"任务 {i+1} 结果: {result}")
    
    print("\n=== 静态方法使用示例 ===")
    # 使用静态方法一次性执行多个函数
    urls = ["https://api.example.com/data6", "https://api.example.com/data7"]
    delays = [0.5, 0.8]
    
    # 相同函数不同参数
    results = await Parallel.execute(
        [fetch_data, fetch_data],
        [urls[0], 0.5], [urls[1], 0.8]
    )
    
    print("\n静态方法结果:")
    for i, result in enumerate(results):
        print(f"任务 {i+1} 结果: {result}")

if __name__ == "__main__":
    asyncio.run(main()) 