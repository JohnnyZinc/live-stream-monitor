"""
直播平台检测工具包
提供统一的接口来访问不同平台的内容
"""

from .platform_factory import PlatformFactory
from .douyu_checker import DouyuChecker
from .huya_checker import HuyaChecker

__all__ = ['PlatformFactory', 'DouyuChecker', 'HuyaChecker']