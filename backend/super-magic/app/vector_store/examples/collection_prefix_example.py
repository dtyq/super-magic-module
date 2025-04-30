import asyncio

from dotenv import load_dotenv

from ..base import QdrantConfig, VectorStoreFactory
from ..providers import QdrantVectorStore


async def main():
    """演示 Qdrant 集合前缀功能"""
    # 加载环境变量
    load_dotenv(override=True)

    # 创建 Qdrant 配置
    qdrant_config = QdrantConfig.from_env()
    print(f"使用集合前缀: {qdrant_config.collection_prefix}")

    # 注册和创建 Qdrant 向量存储
    VectorStoreFactory.register("qdrant", QdrantVectorStore)
    vector_store = await VectorStoreFactory.create(qdrant_config)

    try:
        # 初始化向量存储
        await vector_store.initialize()
        print("Qdrant 连接初始化成功")

        # 列出现有集合
        print("\n当前存在的集合:")
        collections = await vector_store.list_collections()
        for coll in collections:
            print(f"  - {coll}")

        # 创建一个测试集合
        test_collection_name = "prefix_test_collection"
        try:
            await vector_store.create_collection(collection_name=test_collection_name, vector_size=128)
            print(f"\n成功创建集合: {test_collection_name}")
            print(f"实际在 Qdrant 中的集合名称: {qdrant_config.collection_prefix}{test_collection_name}")
        except Exception as e:
            print(f"创建集合失败，可能已存在: {e!s}")

        # 列出所有集合（再次检查）
        print("\n创建后的集合列表:")
        collections = await vector_store.list_collections()
        for coll in collections:
            print(f"  - {coll}")

        # 删除测试集合
        try:
            await vector_store.delete_collection(test_collection_name)
            print(f"\n成功删除集合: {test_collection_name}")
        except Exception as e:
            print(f"删除集合失败: {e!s}")

        # 最后检查集合列表
        print("\n删除后的集合列表:")
        collections = await vector_store.list_collections()
        for coll in collections:
            print(f"  - {coll}")

    except Exception as e:
        print(f"发生错误: {e!s}")
    finally:
        # 关闭连接
        await vector_store.close()
        print("\n连接已关闭")


if __name__ == "__main__":
    asyncio.run(main())
