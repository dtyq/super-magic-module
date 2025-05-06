#!/usr/bin/env python
"""
YFinance 工具测试脚本
用于测试 YFinance 工具的各种功能和查询类型
"""

import asyncio
import json
import sys
import os
import uuid
from typing import Dict, Any

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.core.context.tool_context import ToolContext
from app.core.context.base_context import BaseContext
from app.core.entity.event.event_context import EventContext
from app.tools.yfinance_tool import YFinance, YFinanceParams

# 创建一个模拟的 AgentContext 用于测试
class MockAgentContext(BaseContext):
    def __init__(self):
        super().__init__()
        self._metadata = {}
        self.workspace_dir = os.path.abspath(os.path.dirname(__file__))
        self._event_context = EventContext()
    
    def get_task_id(self):
        return "mock_task_id"
    
    def get_workspace_dir(self):
        return self.workspace_dir

# 创建测试用的工具上下文
mock_agent_context = MockAgentContext()
mock_tool_context = ToolContext(
    agent_context=mock_agent_context,
    tool_call_id="mock_tool_call_id",
    tool_name="yfinance",
    arguments={}
)

async def test_stock_history():
    """测试获取股票历史价格数据"""
    print("\n=== 测试获取股票历史价格数据 ===")
    
    # 创建参数
    params = YFinanceParams(
        ticker="AAPL",
        query_type="history",
        period="1mo",
        interval="1d",
        limit=5,
        explanation="用于测试获取苹果公司的历史股价数据"
    )
    
    # 执行查询
    tool = YFinance()
    result = await tool.execute(mock_tool_context, params)
    
    # 打印结果
    print(f"查询结果状态: {'成功' if result.ok else '失败'}")
    if result.ok:
        data = json.loads(result.content)
        print(f"数据消息: {data['message']}")
        print(f"数据条数: {len(data['data'])}")
        print("样本数据:")
        print(json.dumps(data['data'][0], indent=2, ensure_ascii=False))
    else:
        print(f"错误: {result.content}")
    
    return result.ok

async def test_company_info():
    """测试获取公司基本信息"""
    print("\n=== 测试获取公司基本信息 ===")
    
    # 创建参数
    params = YFinanceParams(
        ticker="MSFT",
        query_type="info",
        explanation="用于测试获取微软公司的基本信息"
    )
    
    # 执行查询
    tool = YFinance()
    result = await tool.execute(mock_tool_context, params)
    
    # 打印结果
    print(f"查询结果状态: {'成功' if result.ok else '失败'}")
    if result.ok:
        data = json.loads(result.content)
        print(f"数据消息: {data['message']}")
        print("重要字段:")
        for key in ['shortName', 'sector', 'industry', 'marketCap', 'currency']:
            if key in data['data']:
                print(f"  {key}: {data['data'][key]}")
    else:
        print(f"错误: {result.content}")
    
    return result.ok

async def test_dividends():
    """测试获取股息数据"""
    print("\n=== 测试获取股息数据 ===")
    
    # 创建参数
    params = YFinanceParams(
        ticker="AAPL",
        query_type="dividends",
        limit=3,
        explanation="用于测试获取苹果公司的股息数据"
    )
    
    # 执行查询
    tool = YFinance()
    result = await tool.execute(mock_tool_context, params)
    
    # 打印结果
    print(f"查询结果状态: {'成功' if result.ok else '失败'}")
    if result.ok:
        data = json.loads(result.content)
        print(f"数据消息: {data['message']}")
        print(f"数据条数: {len(data['data'])}")
        print("样本数据:")
        print(json.dumps(data['data'][0] if data['data'] else {}, indent=2, ensure_ascii=False))
    else:
        print(f"错误: {result.content}")
    
    return result.ok

async def test_financial_data():
    """测试获取财务数据"""
    print("\n=== 测试获取财务数据 ===")
    
    # 创建参数
    params = YFinanceParams(
        ticker="GOOG",
        query_type="balance_sheet",
        explanation="用于测试获取谷歌公司的资产负债表"
    )
    
    # 执行查询
    tool = YFinance()
    result = await tool.execute(mock_tool_context, params)
    
    # 打印结果
    print(f"查询结果状态: {'成功' if result.ok else '失败'}")
    if result.ok:
        data = json.loads(result.content)
        print(f"数据消息: {data['message']}")
        print("数据结构:")
        # 只显示第一层键名
        print(f"  财务报表项目数: {len(data['data'])}")
        print(f"  部分项目: {list(data['data'].keys())[:5]}")
    else:
        print(f"错误: {result.content}")
    
    return result.ok

async def test_news():
    """测试获取新闻数据"""
    print("\n=== 测试获取新闻数据 ===")
    
    # 创建参数
    params = YFinanceParams(
        ticker="TSLA",
        query_type="news",
        limit=3,
        explanation="用于测试获取特斯拉公司的相关新闻"
    )
    
    # 执行查询
    tool = YFinance()
    result = await tool.execute(mock_tool_context, params)
    
    # 打印结果
    print(f"查询结果状态: {'成功' if result.ok else '失败'}")
    if result.ok:
        data = json.loads(result.content)
        print(f"数据消息: {data['message']}")
        print(f"新闻条数: {len(data['data'])}")
        if data['data']:
            print("第一条新闻标题:", data['data'][0]['title'])
            print("发布商:", data['data'][0]['publisher'])
    else:
        print(f"错误: {result.content}")
    
    return result.ok

async def test_market_status():
    """测试获取市场状态"""
    print("\n=== 测试获取市场状态 ===")
    
    # 创建参数
    params = YFinanceParams(
        ticker="^GSPC",  # 可以是任何有效股票代码
        query_type="market_status",
        explanation="用于测试获取市场状态信息"
    )
    
    # 执行查询
    tool = YFinance()
    result = await tool.execute(mock_tool_context, params)
    
    # 打印结果
    print(f"查询结果状态: {'成功' if result.ok else '失败'}")
    if result.ok:
        data = json.loads(result.content)
        print(f"数据消息: {data['message']}")
        print("指数信息:")
        for index, info in data['data'].items():
            print(f"  {info['name']}: {info['price']} ({'+' if info['change'] > 0 else ''}{info['change_percent']:.2f}%)")
    else:
        print(f"错误: {result.content}")
    
    return result.ok

async def test_chinese_stock():
    """测试获取中国股票信息"""
    print("\n=== 测试获取中国股票信息 ===")
    
    # 创建参数 - 贵州茅台
    params = YFinanceParams(
        ticker="600519.SS",
        query_type="info",
        explanation="用于测试获取贵州茅台的基本信息"
    )
    
    # 执行查询
    tool = YFinance()
    result = await tool.execute(mock_tool_context, params)
    
    # 打印结果
    print(f"查询结果状态: {'成功' if result.ok else '失败'}")
    if result.ok:
        data = json.loads(result.content)
        print(f"数据消息: {data['message']}")
        print("重要字段:")
        for key in ['shortName', 'sector', 'industry', 'marketCap', 'currency']:
            if key in data['data']:
                print(f"  {key}: {data['data'][key]}")
    else:
        print(f"错误: {result.content}")
    
    return result.ok

async def test_hk_stock():
    """测试获取香港股票信息"""
    print("\n=== 测试获取香港股票信息 ===")
    
    # 创建参数 - 阿里巴巴港股
    params = YFinanceParams(
        ticker="9988.HK",
        query_type="history",
        period="1mo",
        interval="1d",
        limit=3,
        explanation="用于测试获取阿里巴巴港股的历史价格数据"
    )
    
    # 执行查询
    tool = YFinance()
    result = await tool.execute(mock_tool_context, params)
    
    # 打印结果
    print(f"查询结果状态: {'成功' if result.ok else '失败'}")
    if result.ok:
        data = json.loads(result.content)
        print(f"数据消息: {data['message']}")
        print(f"数据条数: {len(data['data'])}")
        print("样本数据:")
        print(json.dumps(data['data'][0] if data['data'] else {}, indent=2, ensure_ascii=False))
    else:
        print(f"错误: {result.content}")
    
    return result.ok

async def test_invalid_ticker():
    """测试无效的股票代码"""
    print("\n=== 测试无效的股票代码 ===")
    
    # 创建参数 - 无效的股票代码
    params = YFinanceParams(
        ticker="INVALID_TICKER_SYMBOL",
        query_type="info",
        explanation="用于测试无效股票代码的错误处理"
    )
    
    # 执行查询
    tool = YFinance()
    result = await tool.execute(mock_tool_context, params)
    
    # 打印结果
    print(f"查询结果状态: {'成功' if result.ok else '失败'}")
    print(f"错误处理: {result.content}")
    
    # 此测试应该返回一个错误，所以期望 result.ok 为 False
    return not result.ok

async def run_all_tests():
    """运行所有测试"""
    tests = [
        ("股票历史价格数据", test_stock_history),
        ("公司基本信息", test_company_info),
        ("股息数据", test_dividends),
        ("财务数据", test_financial_data),
        ("新闻数据", test_news),
        ("市场状态", test_market_status),
        ("中国股票信息", test_chinese_stock),
        ("香港股票信息", test_hk_stock),
        ("无效股票代码处理", test_invalid_ticker),
    ]
    
    print("===== YFinance 工具测试开始 =====")
    
    results = []
    for name, test_func in tests:
        try:
            print(f"\n开始测试: {name}")
            success = await test_func()
            results.append((name, success, None))
        except Exception as e:
            print(f"测试出现异常: {e}")
            results.append((name, False, str(e)))
    
    print("\n===== 测试结果汇总 =====")
    success_count = 0
    for name, success, error in results:
        status = "✅ 通过" if success else "❌ 失败"
        print(f"{status} - {name}")
        if error:
            print(f"  错误: {error}")
        if success:
            success_count += 1
    
    print(f"\n总结: {success_count}/{len(tests)} 测试通过")
    print("===== YFinance 工具测试结束 =====")

if __name__ == "__main__":
    # 运行测试
    asyncio.run(run_all_tests()) 