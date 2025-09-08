"""
平台检测工厂类
根据URL的域名选择合适的检测工具
"""

from urllib.parse import urlparse
import re

from .douyu_checker import DouyuChecker
from .huya_checker import HuyaChecker
from .bilibili_checker import BilibiliChecker
from .douyin_checker import DouyinChecker

class PlatformFactory:
    
    # 支持的域名映射
    PLATFORM_MAPPINGS = {
        'douyu': DouyuChecker,
        'douyu.com': DouyuChecker,
        'www.douyu.com': DouyuChecker,
        'huya': HuyaChecker,
        'huya.com': HuyaChecker,
        'www.huya.com': HuyaChecker,
        'bilibili': BilibiliChecker,
        'bilibili.com': BilibiliChecker,
        'live.bilibili.com': BilibiliChecker,
        'douyin': DouyinChecker,
        'douyin.com': DouyinChecker,
        'live.douyin.com': DouyinChecker,
    }
    
    @classmethod
    def get_platform_checker(cls, url):
        """
        根据URL返回对应的平台检测器
        
        Args:
            url (str): 直播间URL
            
        Returns:
            class: 对应平台的检测器类
            
        Raises:
            ValueError: 如果平台不支持
        """
        if not url:
            raise ValueError("URL不能为空")
        
        try:
            # 解析URL
            parsed_url = urlparse(url)
            domain = parsed_url.netloc.lower()
            path = parsed_url.path.lower()
            
            # 检查域名
            for domain_key, checker_class in cls.PLATFORM_MAPPINGS.items():
                if domain_key in domain or domain.endswith(domain_key):
                    return checker_class
            
            # 特殊处理路径中的平台名称
            if 'douyu' in path:
                return DouyuChecker
            elif 'huya' in path:
                return HuyaChecker
            elif 'bilibili' in path or 'live.bilibili.com' in domain:
                return BilibiliChecker
            elif 'douyin' in path or 'live.douyin.com' in domain:
                return DouyinChecker
            
            raise ValueError(f"不支持的平台: {url} (支持的域名: douyu.com, huya.com, live.bilibili.com, live.douyin.com)")
            
        except Exception as e:
            if isinstance(e, ValueError):
                raise
            raise ValueError(f"无效的URL: {url}")
    
    @classmethod
    def get_supported_platforms(cls):
        """获取所有支持的平台列表"""
        return list(set([
            checker.PLATFORM_NAME 
            for checker in [DouyuChecker, HuyaChecker, BilibiliChecker, DouyinChecker]
        ]))
    
    @classmethod
    def detect_platform_from_url(cls, url):
        """
        从URL中提取平台名称
        
        Args:
            url (str): 直播间URL
            
        Returns:
            str: 平台名称
        """
        parsed_url = urlparse(url)
        domain = parsed_url.netloc.lower()
        
        if 'douyu.com' in domain:
            return '斗鱼'
        elif 'huya.com' in domain:
            return '虎牙'
        elif 'live.bilibili.com' in domain:
            return '哔哩哔哩'
        elif 'live.douyin.com' in domain:
            return '抖音'
        else:
            return '未知平台'
    
    @classmethod
    def is_url_supported(cls, url):
        """判断URL是否被支持"""
        try:
            cls.get_platform_checker(url)
            return True
        except ValueError:
            return False