class VectorStoreError(Exception):
    """向量数据库基础异常类"""

    pass


class ConnectionError(VectorStoreError):
    """连接错误"""

    pass


class CollectionError(VectorStoreError):
    """集合操作错误"""

    pass


class DocumentError(VectorStoreError):
    """文档操作错误"""

    pass


class ConfigurationError(VectorStoreError):
    """配置错误"""

    pass


class SearchError(VectorStoreError):
    """搜索操作错误"""

    pass


class ValidationError(VectorStoreError):
    """数据验证错误"""

    pass
