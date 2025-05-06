from app.core.config_manager import config


class FilebaseConfig:

    embedding_model_id: str = config.get("filebase.embedding_model_id", "openai-embedding")
    # 最大向量化并行处理数，防止过多并行请求导致API限流或性能问题
    max_vectorization_concurrency: int = config.get("filebase.max_vectorization_concurrency", 20)
    # 嵌入API调用失败时的最大重试次数
    max_embedding_retry_attempts: int = config.get("filebase.max_embedding_retry_attempts", 5)

    def __init__(self):
        self.collection_prefix = config.get("filebase.collection_prefix", "FILEBASE")
