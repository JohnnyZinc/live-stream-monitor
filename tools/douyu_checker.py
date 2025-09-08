"""
斗鱼直播间状态检测工具
基于$ROOM.show_status参数判断直播间是否正在直播
"""

import requests
import re
import json
from urllib.parse import urlparse

class DouyuChecker:
    PLATFORM_NAME = "斗鱼"
    BASE_URL = "https://www.douyu.com"
    
    @classmethod
    def extract_room_id(cls, url):
        """从斗鱼页面获取真实房间号"""
        # 检查域名是否为douyu.com
        parsed_url = urlparse(url)
        if 'douyu.com' not in parsed_url.netloc:
            raise ValueError(f"域名不是douyu.com: {url}")
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': url
        }
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            # 从页面HTML中查找$ROOM.room_id
            room_id_patterns = [
                r'\$ROOM\.room_id\s*=\s*(\d+)',
                r'room_id["\']:\s*(\d+)',
                r'"room_id":\s*(\d+)'
            ]
            
            html_content = response.text
            
            for pattern in room_id_patterns:
                match = re.search(pattern, html_content)
                if match:
                    return match.group(1)
            
            # 备选方案：从URL路径中提取
            path = parsed_url.path.strip('/')
            if path and path.isdigit():
                return path
            
            raise ValueError(f"无法从页面获取房间ID: {url}")
            
        except requests.RequestException as e:
            raise ConnectionError(f"网络请求失败: {e}")
    
    @classmethod
    def check_live_status(cls, room_id):
        """检查直播间状态"""
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': f'{cls.BASE_URL}/{room_id}'
        }
        
        try:
            url = f'{cls.BASE_URL}/{room_id}'
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            # 查找$ROOM.show_status的值
            status_patterns = [
                r'\$ROOM\.show_status\s*=\s*(\d+)',
                r'show_status[=:]\s*(\d+)',
                r'"show_status":\s*(\d+)'
            ]
            
            html_content = response.text
            
            for pattern in status_patterns:
                match = re.search(pattern, html_content)
                if match:
                    status_code = int(match.group(1))
                    is_live = status_code == 1
                    return is_live, status_code
            
            # 如果没找到show_status，尝试其他方式
            if '"online"' in html_content and '"room_status"' in html_content:
                online_match = re.search(r'"online":\s*(\d+)', html_content)
                status_match = re.search(r'"room_status":\s*(\d+)', html_content)
                
                if status_match:
                    status_code = int(status_match.group(1))
                    is_live = status_code == 1
                    return is_live, status_code
                    
            raise ValueError("无法从页面获取直播状态")
            
        except requests.RequestException as e:
            raise ConnectionError(f"网络请求失败: {e}")
    
    @classmethod
    def get_room_info(cls, room_id):
        """获取直播间详细信息"""
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': f'{cls.BASE_URL}/{room_id}'
        }
        
        def clean_url(url):
            """清理URL中的转义字符"""
            if not url:
                return ""
            cleaned = url.replace('\\/', '/')
            cleaned = re.sub(r'\\(["\\])', r'\1', cleaned)
            return cleaned
        
        try:
            url = f'{cls.BASE_URL}/{room_id}'
            response = requests.get(url, headers=headers, timeout=10)
            text = response.text
            
            # 提取直播间标题
            title_pattern = r'<h3 class="Title-header[^>]*>([^<]+)</h3>'
            title_match = re.search(title_pattern, text)
            title = title_match.group(1).strip() if title_match else "未知"
            
            # 提取主播名字
            name_pattern = r'<h2 class="Title-anchorNameH2[^>]*>([^<]+)</h2>'
            name_match = re.search(name_pattern, text)
            anchor_name = name_match.group(1).strip() if name_match else "未知"
            
            # 提取头像链接
            avatar_patterns = [
                r'\$ROOM\.owner_avatar\s*=\s*["\']([^"\']+)["\']',
                r'owner_avatar["\']:\s*["\']([^"\']+)["\']',
                r'"owner_avatar":"([^"]+)"'
            ]
            avatar_url = ""
            for pattern in avatar_patterns:
                match = re.search(pattern, text)
                if match:
                    avatar_url = clean_url(match.group(1))
                    break
            
            # 提取封面链接
            cover_patterns = [
                r'\$ROOM\.coverSrc\s*=\s*["\']([^"\']+)["\']',
                r'coverSrc["\']:\s*["\']([^"\']+)["\']',
                r'"coverSrc":"([^"]+)"'
            ]
            cover_url = ""
            for pattern in cover_patterns:
                match = re.search(pattern, text)
                if match:
                    cover_url = clean_url(match.group(1))
                    break
            
            # 提取人气值
            hot_pattern = r'"hot":"([^"]+)"'
            hot_match = re.search(hot_pattern, text)
            hot_value = hot_match.group(1) if hot_match else "0"
            
            return {
                'platform': cls.PLATFORM_NAME,
                'title': title,
                'anchor': anchor_name,
                'url': url,
                'avatar': avatar_url,
                'cover': cover_url,
                'popular_num': hot_value
            }
            
        except Exception as e:
            return {
                'platform': cls.PLATFORM_NAME,
                'title': '',
                'anchor': '',
                'url': f'{cls.BASE_URL}/{room_id}',
                'avatar': '',
                'cover': '',
                'popular_num': '0',
                'fetch_status': 'failed'
            }