import asyncio
import os

from dotenv import load_dotenv

from .base import QdrantConfig, VectorStoreFactory
from .prompt import (
    ContextPrompt,
    OpenAIVectorizer,
    PromptMetadata,
    PromptStorage,
    PromptType,
    PromptVectorizer,
    SystemPrompt,
    TaskPrompt,
    TemplatePrompt,
)
from .providers import QdrantVectorStore
from .rag import RAGEngine


async def create_example_prompts(prompt_storage):
    """创建示例 Prompt"""

    # 系统 Prompt
    system_prompt = SystemPrompt(
        name="Python 开发助手",
        description="专注于 Python 开发的助手角色",
        content=(
            "你是一个专注于 Python 开发的 AI 助手。你擅长编写清晰、简洁、高效的 Python 代码。"
            "你会遵循 PEP 8 代码风格，使用类型提示，编写详细的文档字符串。"
            "你会建议最佳实践，包括适当的错误处理、性能优化和测试策略。"
        ),
        type=PromptType.SYSTEM,
        system_role="python_developer",
        capabilities=["code_generation", "debugging", "code_explanation", "best_practices"],
        constraints=["only_python", "follow_pep8"],
        metadata=PromptMetadata(tags=["python", "development", "coding"], category=["programming"]),
    )

    # 任务型 Prompt
    task_prompt = TaskPrompt(
        name="优化 Python 代码",
        description="优化 Python 代码性能的任务",
        content=(
            "请分析以下 Python 代码，找出性能瓶颈并提供优化建议。"
            "关注以下几个方面：\n"
            "1. 算法复杂度\n"
            "2. 数据结构选择\n"
            "3. 内存使用\n"
            "4. 并行计算机会\n"
            "5. 标准库优化\n\n"
            "请提供优化后的代码实现，并解释你的优化思路。"
        ),
        type=PromptType.TASK,
        task_type="code_optimization",
        expected_input={"code": "string", "context": "string"},
        expected_output={"optimized_code": "string", "explanation": "string"},
        metadata=PromptMetadata(tags=["optimization", "performance", "python"], category=["code_improvement"]),
    )

    # 上下文型 Prompt
    context_prompt = ContextPrompt(
        name="Python 库上下文",
        description="Python 常用库的上下文信息",
        content=(
            "以下是常用 Python 库的主要功能和用途：\n\n"
            "- NumPy：用于科学计算，提供多维数组支持和数学函数\n"
            "- Pandas：用于数据分析，提供数据结构和数据分析工具\n"
            "- Matplotlib：用于数据可视化，创建静态、交互式和动画图表\n"
            "- Requests：用于 HTTP 请求，简化网络请求操作\n"
            "- SQLAlchemy：SQL 工具包和 ORM，用于数据库操作\n"
            "- FastAPI：现代、高性能的 Web 框架，用于构建 API\n"
            "- Pytest：单元测试框架，简化测试流程\n"
        ),
        type=PromptType.CONTEXT,
        context_type="library_reference",
        required_fields=["library_name"],
        optional_fields=["version", "specific_function"],
        metadata=PromptMetadata(tags=["libraries", "reference", "python"], category=["documentation"]),
    )

    # 模板型 Prompt
    template_prompt = TemplatePrompt(
        name="Python 代码生成模板",
        description="生成 Python 代码的模板",
        content=(
            "# 任务需求\n${query}\n\n"
            "# 上下文信息\n${context}\n\n"
            "# Python 代码实现\n"
            "```python\n"
            "# 这里将生成 Python 代码\n"
            "# 根据用户的查询和上下文\n"
            "```\n\n"
            "# 实现说明\n"
            "以上代码的实现思路是：\n"
            "1. 首先分析需求\n"
            "2. 设计解决方案\n"
            "3. 实现代码\n"
            "4. 优化和测试"
        ),
        type=PromptType.TEMPLATE,
        template_variables=["query", "context", "language"],
        default_values={"language": "python"},
        metadata=PromptMetadata(tags=["template", "code_generation", "python"], category=["automation"]),
    )

    # 保存 Prompt
    prompts = [system_prompt, task_prompt, context_prompt, template_prompt]
    await prompt_storage.save(prompts)

    return prompts


async def main():
    # 加载环境变量
    load_dotenv(override=True)

    # 创建 Qdrant 配置
    qdrant_config = QdrantConfig.from_env()

    # 注册和创建 Qdrant 向量存储
    VectorStoreFactory.register("qdrant", QdrantVectorStore)
    vector_store = await VectorStoreFactory.create(qdrant_config)

    # 创建向量化器
    openai_vectorizer = OpenAIVectorizer(
        api_key=os.getenv("OPENAI_API_KEY"),
        api_base=os.getenv("OPENAI_API_BASE_URL"),
        model=os.getenv("OPENAI_MODEL", "text-embedding-3-small"),
    )
    prompt_vectorizer = PromptVectorizer(openai_vectorizer)

    # 创建 Prompt 存储
    prompt_storage = PromptStorage(vector_store=vector_store, vectorizer=prompt_vectorizer)

    # 初始化存储
    await prompt_storage.initialize()

    # 创建示例 Prompt
    prompts = await create_example_prompts(prompt_storage)
    print(f"创建了 {len(prompts)} 个示例 Prompt")

    # 创建 RAG 引擎
    rag_engine = RAGEngine(prompt_storage=prompt_storage, prompt_vectorizer=prompt_vectorizer)

    # 初始化 RAG 引擎
    await rag_engine.initialize()

    # 测试动态 Prompt 生成
    test_queries = [
        "如何优化 Python 列表推导式的性能?",
        "编写一个 Flask API 用于用户认证",
        "解释一下 Python 的装饰器是如何工作的?",
    ]

    for query in test_queries:
        print(f"\n\n===== 查询: {query} =====")
        result = await rag_engine.generate_prompt(query)

        print("\n== 分析结果 ==")
        print(f"检索到 {result['analytics']['retrieval_results']} 个相关 Prompt")
        print("任务类型分析:")
        for task_type, score in result["analytics"]["task_types"].items():
            if score > 0.1:
                print(f"  - {task_type}: {score:.2f}")

        print("\n== 生成的 Prompt ==")
        print(result["content"][:500] + "..." if len(result["content"]) > 500 else result["content"])

        # 模拟使用 Prompt 并更新统计信息
        if "used_prompts" in result:
            prompt_ids = []
            for prompt_type, ids in result["used_prompts"].items():
                prompt_ids.extend(ids)

            if prompt_ids:
                await rag_engine.update_prompt_usage(prompt_ids=prompt_ids, success=True, latency=1.0)
                print(f"\n已更新 {len(prompt_ids)} 个 Prompt 的使用统计")

    # 关闭向量存储连接
    await vector_store.close()
    print("\n示例运行完成")


if __name__ == "__main__":
    asyncio.run(main())
