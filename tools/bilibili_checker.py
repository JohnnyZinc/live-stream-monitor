"""
哔哩哔哩直播间状态检测工具
"""

import requests
import re
import json
import uuid
import time
from urllib.parse import urlparse

class BilibiliChecker:
    PLATFORM_NAME = "哔哩哔哩"
    BASE_URL = "https://live.bilibili.com"
    
    @classmethod
    def extract_room_id(cls, url):
        """从B站URL提取房间号"""
        parsed_url = urlparse(url)
        if 'bilibili.com' not in parsed_url.netloc:
            raise ValueError(f"域名不是bilibili.com: {url}")
        
        # 提取房间号
        room_id_match = re.search(r'live\.bilibili\.com/(\d+)', url)
        if room_id_match:
            return room_id_match.group(1)
        
        # 备选方案：从URL路径中提取
        path = parsed_url.path.strip('/')
        if path and path.isdigit():
            return path
        
        raise ValueError(f"无法从链接中提取房间号: {url}")
    
    @classmethod
    def check_live_status(cls, room_id):
        """检查直播间状态"""
        api_url = f"https://api.live.bilibili.com/xlive/web-room/v1/index/getInfoByRoom?room_id={room_id}"
        
        # 生成随机设备ID和会话ID
        buvid3 = str(uuid.uuid4()).replace('-', '').upper()[:32]
        buvid4 = str(uuid.uuid4()).replace('-', '').upper()[:32]
        rpdid = f"|u-{int(time.time())}||t-{int(time.time())}"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': f'{cls.BASE_URL}/{room_id}',
            'Origin': 'https://live.bilibili.com',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Cookie': f'buvid3={buvid3}; buvid4={buvid4}; rpdid={rpdid};'
        }
        
        try:
            response = requests.get(api_url, headers=headers, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            if data.get('code') != 0:
                return False, data.get('message', 'API错误')
            
            # 获取直播状态
            room_info = data['data']['room_info']
            live_status = room_info['live_status']
            
            # 状态映射
            live_status_map = {0: "未开播", 1: "直播中", 2: "轮播中"}
            status_text = live_status_map.get(live_status, f"未知状态({live_status})")
            
            return live_status == 1, status_text
            
        except requests.RequestException as e:
            raise ConnectionError(f"网络请求失败: {e}")
        except Exception as e:
            raise Exception(f"检查直播状态失败: {e}")
    
    @classmethod
    def get_room_info(cls, room_id):
        """获取直播间详细信息"""
        api_url = f"https://api.live.bilibili.com/xlive/web-room/v1/index/getInfoByRoom?room_id={room_id}"
        
        # 生成随机设备ID和会话ID
        buvid3 = str(uuid.uuid4()).replace('-', '').upper()[:32]
        buvid4 = str(uuid.uuid4()).replace('-', '').upper()[:32]
        rpdid = f"|u-{int(time.time())}||t-{int(time.time())}"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': f'{cls.BASE_URL}/{room_id}',
            'Origin': 'https://live.bilibili.com',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Cookie': f'buvid3={buvid3}; buvid4={buvid4}; rpdid={rpdid};'
        }
        
        try:
            response = requests.get(api_url, headers=headers, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            if data.get('code') != 0:
                raise Exception(f"API返回错误: {data.get('message', 'Unknown error')}")
            
            # 提取数据
            room_info = data['data']['room_info']
            anchor_info = data['data']['anchor_info']['base_info']
            
            # 构建返回数据
            return {
                'platform': cls.PLATFORM_NAME,
                'title': room_info.get('title', '未知标题'),
                'anchor': anchor_info.get('uname', '未知主播'),
                'url': f'{cls.BASE_URL}/{room_id}',
                'avatar': anchor_info.get('face', ''),
                'cover': room_info.get('cover', ''),
                'popular_num': room_info.get('online', 0)
            }
            
        except Exception as e:
            # 返回失败信息但不让程序崩溃
            return {
                'platform': cls.PLATFORM_NAME,
                'title': '',
                'anchor': '',
                'url': f'{cls.BASE_URL}/{room_id}',
                'avatar': '',
                'cover': '',
                'popular_num': '',
                'fetch_status': 'failed'
            }