"""
抖音直播间状态检测工具
"""

import requests
import re
import json
import os
from urllib.parse import urlparse

class DouyinChecker:
    PLATFORM_NAME = "抖音"
    BASE_URL = "https://live.douyin.com"
    
    @classmethod
    def extract_room_id(cls, url):
        """从抖音URL提取webcast_id
        支持格式：https://live.douyin.com/任意字符?参数=值
        或 https://live.douyin.com/任意字符串
        """
        parsed_url = urlparse(url)
        if 'douyin.com' not in parsed_url.netloc:
            raise ValueError(f"域名不是douyin.com: {url}")
        
        # 优先从完整路径提取
        # 匹配从 live.douyin.com/ 开始，到第一个 ? 或 # 或结束符之前的所有内容
        pattern = r'live\.douyin\.com/([^?#]+)'
        match = re.search(pattern, url)
        
        if match:
            webcast_id = match.group(1)
            # 去除末尾的斜杠
            webcast_id = webcast_id.rstrip('/')
            # 去除空字符串
            if webcast_id:
                return webcast_id
        
        # 备用方案：兼容旧的数字格式
        path = parsed_url.path.strip('/')
        if path:
            return path
        
        raise ValueError(f"无法从链接中提取webcast_id: {url}")
    
    @classmethod
    def check_live_status(cls, webcast_id, api_url=None):
        """检查直播间状态"""
        # 如果没有提供API地址，则使用默认地址
        if not api_url:
            # 从环境变量或默认值获取API地址
            api_url = os.getenv('DOUYIN_API_URL', 'https://douyin.wtf')
        
        params = {'webcast_id': str(webcast_id)}
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': 'https://v.douyin.com/',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Connection': 'keep-alive'
        }
        
        try:
            response = requests.get(api_url, params=params, headers=headers, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            if not data or 'data' not in data:
                return False, "API响应格式错误"
            
            # 解析数据结构
            live_data = data.get('data', {})
            if 'data' not in live_data:
                return False, "数据格式错误"
            
            room_data = live_data['data']
            rooms = room_data.get('data', [])
            
            if not rooms or not isinstance(rooms, list):
                return False, "没有找到房间数据"
            
            room_info = rooms[0]
            status = room_info.get('status', 0)
            
            # 抖音状态映射：2为直播中
            is_live = status == 2
            status_text = "直播中" if is_live else "未开播"
            
            return is_live, status_text
            
        except Exception as e:
            raise Exception(f"检查直播状态失败: {e}")
    
    
    @classmethod
    def get_room_info(cls, webcast_id, api_url=None):
        """获取直播间详细信息"""
        # 如果没有提供API地址，则使用默认地址
        if not api_url:
            # 从环境变量或默认值获取API地址
            api_url = os.getenv('DOUYIN_API_URL', 'https://douyin.wtf')
        
        params = {'webcast_id': str(webcast_id)}
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': 'https://v.douyin.com/',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Connection': 'keep-alive'
        }
        
        try:
            response = requests.get(api_url, params=params, headers=headers, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            if not data or 'data' not in data:
                raise Exception("API响应格式错误")
            
            # 解析数据结构
            live_data = data.get('data', {})
            if 'data' not in live_data:
                raise Exception("数据格式错误")
            
            room_data = live_data['data']
            rooms = room_data.get('data', [])
            
            if not rooms or not isinstance(rooms, list) or len(rooms) == 0:
                raise Exception("没有找到房间数据")
            
            room_info = rooms[0]
            user_info = room_data.get('user', {})
            
            # 提取所需信息
            status = room_info.get('status', 0)
            title = room_info.get('title', '未知标题')
            
            # 获取封面信息
            cover = ''
            if 'cover' in room_info and room_info['cover']:
                cover = room_info['cover']
                if isinstance(cover, dict) and 'url_list' in cover:
                    cover = cover['url_list'][0] if cover['url_list'] else ''
                elif isinstance(cover, list):
                    cover = cover[0]
            
            # 主播昵称
            nickname = user_info.get('nickname', '未知主播')
            
            # 主播头像
            avatar_thumb = ''
            avatar_info = user_info.get('avatar_thumb', {})
            if avatar_info and 'url_list' in avatar_info:
                avatar_urls = avatar_info['url_list']
                avatar_thumb = avatar_urls[0] if avatar_urls else ''
            
            # 获取人气值
            like_count = room_info.get('like_count', 0)
            
            return {
                'platform': cls.PLATFORM_NAME,
                'title': title,
                'anchor': nickname,
                'url': f'{cls.BASE_URL}/{webcast_id}',
                'avatar': avatar_thumb,
                'cover': cover,
                'popular_num': like_count
            }
            
        except Exception as e:
            # 返回占位信息
            return {
                'platform': cls.PLATFORM_NAME,
                'title': '',
                'anchor': '',
                'url': f'{cls.BASE_URL}/{webcast_id}',
                'avatar': '',
                'cover': '',
                'popular_num': 0,
                'fetch_status': 'failed'
            }
    
