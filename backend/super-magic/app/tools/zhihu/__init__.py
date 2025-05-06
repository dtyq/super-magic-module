"""
知乎工具包

此包提供访问知乎平台数据的工具集，基于TikHub API实现。
包含获取知乎文章详情等功能。

主要功能:
- 获取知乎文章详情
- 搜索知乎文章

最后更新: 2024-06-14
"""

from app.tools.zhihu.fetch_zhihu_article_detail import FetchZhihuArticleDetail
from app.tools.zhihu.search_zhihu_articles import SearchZhihuArticles
from app.tools.zhihu.base_zhihu import BaseZhihu

__all__ = ["FetchZhihuArticleDetail", "SearchZhihuArticles", "BaseZhihu"] 