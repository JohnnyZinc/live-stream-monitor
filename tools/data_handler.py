import os
import json
import hashlib
import time
from flask import session
from .user_manager import get_current_user_id, get_user_data_path

# 数据存储路径
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
CACHE_DIR = os.path.join(DATA_DIR, 'cache')

# 确保数据目录存在
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(CACHE_DIR, exist_ok=True)

def get_user_rooms_file(user_id=None):
    """获取用户房间数据文件路径"""
    if user_id is None:
        user_id = get_current_user_id()
    user_dir = get_user_data_path(user_id)
    return os.path.join(user_dir, 'rooms_data.json')

def get_user_groups_file(user_id=None):
    """获取用户分组数据文件路径"""
    if user_id is None:
        user_id = get_current_user_id()
    user_dir = get_user_data_path(user_id)
    return os.path.join(user_dir, 'groups_data.json')

def load_saved_rooms(user_id=None):
    """从文件中加载保存的直播间URL列表"""
    if user_id is None:
        user_id = get_current_user_id()
    
    ROOMS_FILE = get_user_rooms_file(user_id)
    
    if os.path.exists(ROOMS_FILE):
        try:
            with open(ROOMS_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                # 兼容旧格式和新格式
                if data and isinstance(data[0], dict) and 'url' in data[0]:
                    return [item['url'] for item in data]  # 迁移旧数据
                return data
        except Exception:
            return []
    return []

def save_rooms_data(urls, user_id=None):
    """保存直播间URL到文件"""
    if user_id is None:
        user_id = get_current_user_id()
    
    ROOMS_FILE = get_user_rooms_file(user_id)
    
    try:
        with open(ROOMS_FILE, 'w', encoding='utf-8') as f:
            json.dump(urls, f, ensure_ascii=False, indent=2)
        
        # 更新分组中的房间列表
        from .group_manager import load_groups, save_groups
        groups = load_groups(user_id)
        all_rooms_group = groups.get("全部关注", {"type": "system", "rooms": []})
        all_rooms_group["rooms"] = urls
        groups["全部关注"] = all_rooms_group
        save_groups(groups, user_id)
    except Exception as e:
        print(f"保存数据失败: {e}")

def get_cache_key(url):
    """根据URL生成缓存键"""
    return hashlib.md5(url.encode('utf-8')).hexdigest()