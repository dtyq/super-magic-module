from unittest.mock import Mock

import pytest

from ..prompt import (
    ContextPrompt,
    Prompt,
    PromptMetadata,
    PromptType,
    PromptVectorizer,
    SystemPrompt,
    TaskPrompt,
    TemplatePrompt,
)
from ..rag import (
    ContextAnalyzer,
    ContextType,
    PromptComposer,
    RAGEngine,
    RetrievalResult,
    TaskType,
    VectorSimilarityRetrieval,
)


# 测试数据
def create_test_prompt(
    prompt_id: str, prompt_type: PromptType, name: str = "Test Prompt", content: str = "This is a test prompt content"
) -> Prompt:
    prompt_cls = {
        PromptType.TASK: TaskPrompt,
        PromptType.SYSTEM: SystemPrompt,
        PromptType.CONTEXT: ContextPrompt,
        PromptType.TEMPLATE: TemplatePrompt,
    }.get(prompt_type, Prompt)

    kwargs = {
        "id": prompt_id,
        "name": name,
        "description": f"Test {prompt_type.value} prompt",
        "type": prompt_type,
        "content": content,
        "vector": [0.1] * 128,
        "metadata": PromptMetadata(tags=["test", prompt_type.value], category=["test"]),
    }

    # 添加类型特有的参数
    if prompt_type == PromptType.TASK:
        kwargs["task_type"] = "test_task"
    elif prompt_type == PromptType.CONTEXT:
        kwargs["context_type"] = "test_context"
    elif prompt_type == PromptType.TEMPLATE:
        kwargs["template_variables"] = ["query", "context"]
    elif prompt_type == PromptType.SYSTEM:
        kwargs["system_role"] = "test_role"

    return prompt_cls(**kwargs)


def create_test_retrieval_result(prompt: Prompt, score: float = 0.8) -> RetrievalResult:
    return RetrievalResult(prompt=prompt, score=score, metadata={"test": True})


@pytest.fixture
def mock_vectorizer():
    vectorizer = Mock()
    vectorizer.vectorize = Mock(return_value=[0.1] * 128)
    vectorizer.batch_vectorize = Mock(return_value=[[0.1] * 128 for _ in range(3)])
    return vectorizer


@pytest.fixture
def prompt_vectorizer(mock_vectorizer):
    vectorizer = PromptVectorizer(mock_vectorizer)
    return vectorizer


@pytest.fixture
def mock_storage():
    storage = Mock()
    storage.initialize = Mock()
    storage.search = Mock()
    storage.get = Mock()
    storage.update = Mock()
    return storage


@pytest.mark.asyncio
async def test_context_analyzer():
    # 创建上下文分析器
    analyzer = ContextAnalyzer()

    # 测试任务类型分析
    query = "请帮我修复这段代码中的bug"
    task_types = analyzer.analyze_task_type(query)
    assert task_types[TaskType.BUG_FIX] > 0.1

    # 测试上下文类型分析
    context = "这是一段Python代码，它有一个语法错误"
    context_types = analyzer.analyze_context_type(query, context)
    assert context_types[ContextType.CODE] > 0.1
    assert context_types[ContextType.ERROR_MESSAGE] > 0.1

    # 测试相关性调整
    prompts = [
        create_test_prompt("1", PromptType.TASK),
        create_test_prompt("2", PromptType.CONTEXT),
        create_test_prompt("3", PromptType.SYSTEM),
    ]

    results = [create_test_retrieval_result(p) for p in prompts]

    adjusted_results = analyzer.adjust_relevance(
        results,
        {TaskType.BUG_FIX: 0.8, TaskType.CODE_REVIEW: 0.2},
        {ContextType.CODE: 0.7, ContextType.ERROR_MESSAGE: 0.3},
    )

    # 检查调整后的分数
    assert len(adjusted_results) == len(results)
    for result in adjusted_results:
        assert "adjusted" in result.metadata
        assert "original_score" in result.metadata
        assert "multiplier" in result.metadata


@pytest.mark.asyncio
async def test_prompt_composer():
    # 创建组合器
    composer = PromptComposer()

    # 创建测试 Prompt
    system_prompt = create_test_prompt("1", PromptType.SYSTEM, content="You are a helpful assistant.")
    context_prompt = create_test_prompt("2", PromptType.CONTEXT, content="This is a context.")
    task_prompt = create_test_prompt("3", PromptType.TASK, content="Please help with this task.")
    template_prompt = create_test_prompt("4", PromptType.TEMPLATE, content="Query: ${query}\nContext: ${context}")

    # 创建检索结果
    results = [
        create_test_retrieval_result(system_prompt),
        create_test_retrieval_result(context_prompt),
        create_test_retrieval_result(task_prompt),
        create_test_retrieval_result(template_prompt),
    ]

    # 测试组合
    composed = composer.compose(
        prompts=results, query="What is the capital of France?", context="We are talking about geography."
    )

    # 验证结果
    assert "content" in composed
    assert "estimated_tokens" in composed
    assert "used_prompts" in composed
    assert "variables" in composed

    # 检查是否包含所有 Prompt 的内容
    assert "You are a helpful assistant" in composed["content"]
    assert "This is a context" in composed["content"]
    assert "Please help with this task" in composed["content"]


@pytest.mark.asyncio
async def test_vector_similarity_retrieval(mock_storage, prompt_vectorizer):
    # 创建检索策略
    retrieval = VectorSimilarityRetrieval(prompt_storage=mock_storage, prompt_vectorizer=prompt_vectorizer)

    # 模拟存储服务返回值
    prompts = [
        create_test_prompt("1", PromptType.SYSTEM),
        create_test_prompt("2", PromptType.TASK),
        create_test_prompt("3", PromptType.CONTEXT),
    ]
    mock_storage.search.return_value = prompts

    # 测试检索
    results = await retrieval.retrieve(query="Test query", limit=3)

    # 验证结果
    assert len(results) == 3
    for i, result in enumerate(results):
        assert result.prompt.id == prompts[i].id
        assert result.score > 0


@pytest.mark.asyncio
async def test_rag_engine(mock_storage, prompt_vectorizer):
    # 创建 RAG 引擎
    engine = RAGEngine(prompt_storage=mock_storage, prompt_vectorizer=prompt_vectorizer)

    # 模拟检索结果
    prompts = [
        create_test_prompt("1", PromptType.SYSTEM),
        create_test_prompt("2", PromptType.TASK),
        create_test_prompt("3", PromptType.CONTEXT),
    ]
    results = [create_test_retrieval_result(p) for p in prompts]

    # 替换检索策略的 retrieve 方法
    engine.retrieval_strategy.retrieve = Mock(return_value=results)

    # 测试生成 Prompt
    result = await engine.generate_prompt(query="Test query", context="Test context")

    # 验证结果
    assert "content" in result
    assert "analytics" in result
    assert "task_types" in result["analytics"]
    assert "context_types" in result["analytics"]
    assert "retrieval_results" in result["analytics"]
    assert "top_results" in result["analytics"]

    # 测试无结果情况
    engine.retrieval_strategy.retrieve = Mock(return_value=[])
    result = await engine.generate_prompt(query="No results query")
    assert "content" in result
    assert result["content"] == "No results query"

    # 测试提示使用统计更新
    mock_prompt = Mock()
    mock_storage.get.return_value = mock_prompt
    await engine.update_prompt_usage(prompt_ids=["1", "2", "3"], success=True, latency=0.5)
    assert mock_prompt.update_usage_stats.call_count == 3
    assert mock_storage.update.call_count == 3
