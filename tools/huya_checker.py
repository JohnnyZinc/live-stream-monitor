"""
虎牙直播间状态检测工具
基于TT_ROOM_DATA和TT_PROFILE_INFO变量判断直播间状态
"""

import requests
import re
import json
from urllib.parse import urlparse

class HuyaChecker:
    PLATFORM_NAME = "虎牙"
    BASE_URL = "https://www.huya.com"
    
    @classmethod
    def extract_room_id(cls, url):
        """从虎牙直播间URL对应的页面中提取房间号"""
        # 检查域名是否为huya.com
        try:
            parsed_url = urlparse(url)
            domain = parsed_url.netloc.lower()
            if not (domain == 'huya.com' or domain.endswith('.huya.com')):
                raise ValueError(f"域名不是huya.com: {url}")
        except Exception as e:
            raise ValueError(f"无效的URL: {url}")
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': url
        }
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            html_content = response.text
            
            # 从页面内容中提取真实房间号
            # 方法1: 从TT_PROFILE_INFO中提取profileRoom
            profile_info_match = re.search(r'var\s+TT_PROFILE_INFO\s*=\s*(\{.*?\});', html_content, re.DOTALL)
            if profile_info_match:
                try:
                    profile_info = json.loads(profile_info_match.group(1))
                    real_room_id = str(profile_info.get('profileRoom', ''))
                    if real_room_id:
                        return real_room_id
                except:
                    pass
            
            # 方法2: 如果无法从JSON获取，从URL路径中提取
            path = parsed_url.path.strip('/')
            if path and not path.startswith('?'):
                return path.split('/')[0]
                
            # 方法3: 从页面HTML中提取房间标识符
            room_id_match = re.search(r'data-roomid=["\']([^"\']+)["\']', html_content)
            if room_id_match:
                return room_id_match.group(1)
                
            # 方法4: 从window.HNF_GLOBAL变量中提取
            global_match = re.search(r'window\.HNF_GLOBAL\s*=\s*\{.*?roomId:\s*["\']([^"\']+)["\']', html_content, re.DOTALL)
            if global_match:
                return global_match.group(1)
                
            # 如果所有方法都失败，抛出错误
            raise ValueError(f"无法从页面提取房间号: {url}")
            
        except requests.RequestException as e:
            raise ConnectionError(f"获取页面失败: {e}")
    
    @classmethod
    def check_live_status(cls, room_id):
        """检查直播间状态，并返回真实房间号"""
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': f'{cls.BASE_URL}/{room_id}'
        }
        
        try:
            url = f'{cls.BASE_URL}/{room_id}'
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            html_content = response.text
            
            # 查找TT_ROOM_DATA变量
            room_data_match = re.search(r'var\s+TT_ROOM_DATA\s*=\s*(\{.*?\});', html_content, re.DOTALL)
            
            if not room_data_match:
                raise ValueError("无法获取直播间数据")
                
            # 解析TT_ROOM_DATA获取状态
            try:
                room_data = json.loads(room_data_match.group(1))
                state = room_data.get('state', '').upper()
                
                is_live = state == 'ON'
                return is_live, state
                
            except json.JSONDecodeError as e:
                raise ValueError(f"解析直播间数据失败: {e}")
            
        except requests.RequestException as e:
            raise ConnectionError(f"网络请求失败: {e}")
    
    @classmethod
    def get_room_info(cls, room_id):
        """获取直播间详细信息"""
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': f'{cls.BASE_URL}/{room_id}'
        }
        
        def clean_url(url):
            """清理URL中的转义字符"""
            if not url:
                return ""
            if url.startswith('//'):
                url = 'https:' + url
            # 去除转义字符
            cleaned = url.replace('\\/', '/')
            cleaned = re.sub(r'\\(["\\])', r'\1', cleaned)
            return cleaned
        
        try:
            url = f'{cls.BASE_URL}/{room_id}'
            response = requests.get(url, headers=headers, timeout=10)
            text = response.text
            
            # 查找TT_ROOM_DATA和TT_PROFILE_INFO变量
            room_data_match = re.search(r'var\s+TT_ROOM_DATA\s*=\s*(\{.*?\});', text, re.DOTALL)
            profile_info_match = re.search(r'var\s+TT_PROFILE_INFO\s*=\s*(\{.*?\});', text, re.DOTALL)
            
            title = "未知"
            anchor_name = "未知"
            avatar_url = ""
            cover_url = ""
            real_room_id = room_id  # 默认为输入的房间号
            
            # 解析TT_ROOM_DATA
            if room_data_match:
                try:
                    room_data = json.loads(room_data_match.group(1))
                    title = room_data.get('introduction', '未知')
                    cover_url = room_data.get('screenshot', '')
                    if not cover_url and 'screenshotUrl' in room_data:
                        cover_url = room_data['screenshotUrl']
                    # 获取人气值
                    total_count = str(room_data.get('totalCount', '0'))
                except:
                    total_count = '0'
            else:
                total_count = '0'
                    
            # 解析TT_PROFILE_INFO
            if profile_info_match:
                try:
                    profile_info = json.loads(profile_info_match.group(1))
                    anchor_name = profile_info.get('nick', '未知')
                    avatar_url = profile_info.get('avatar', '')
                    # 使用真实的房间号（profileRoom）
                    real_room_id = str(profile_info.get('profileRoom', room_id))
                except:
                    pass
            
            # 备选方案：从网页HTML中提取
            if title == "未知":
                # 尝试从meta标签提取标题
                title_match = re.search(r'<title>([^<]+)</title>', text, re.IGNORECASE)
                if title_match:
                    title = title_match.group(1).replace(' - 虎牙直播', '').strip()
                    
            if anchor_name == "未知":
                # 尝试从HTML中提取主播名
                h1_match = re.search(r'<h1[^>]*>\s*<span[^>]*>([^<]+)</span>', text)
                if h1_match:
                    anchor_name = h1_match.group(1).strip()
            
            # 使用真实房间号拼接链接
            real_url = f'{cls.BASE_URL}/{real_room_id}'
            
            return {
                'platform': cls.PLATFORM_NAME,
                'title': title,
                'anchor': anchor_name,
                'url': real_url,
                'avatar': clean_url(avatar_url),
                'cover': clean_url(cover_url),
                'popular_num': total_count
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