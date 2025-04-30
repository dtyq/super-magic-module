"""
小红书工具包

此包提供访问小红书平台数据的工具集，基于TikHub API实现。
包含获取小红书文章详情等功能。

主要功能:
- 获取小红书文章详情
- 搜索小红书文章

最后更新: 2024-06-14
"""

from app.tools.rednote.fetch_rednote_note import FetchRednoteNote
from app.tools.rednote.search_rednote_notes import SearchRednoteNotes
from app.tools.rednote.base_rednote import BaseRednote

__all__ = ["FetchRednoteNote", "SearchRednoteNotes", "BaseRednote"] 