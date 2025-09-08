import os
import json
import time
import hashlib
from flask import session
from .user_manager import get_current_user_id, get_user_data_path
from .data_handler import get_cache_key

def load_cached_data(url, user_id=None):
    """从缓存加载直播间的详细信息"""
    if user_id is None:
        user_id = get_current_user_id()
    
    # 使用用户特定的缓存目录
    user_dir = get_user_data_path(user_id)
    user_cache_dir = os.path.join(user_dir, 'cache')
    os.makedirs(user_cache_dir, exist_ok=True)
    
    cache_key = get_cache_key(url)
    cache_file = os.path.join(user_cache_dir, f"{cache_key}.json")
    
    if os.path.exists(cache_file):
        try:
            with open(cache_file, 'r', encoding='utf-8') as f:
                cache_data = json.load(f)
                # 检查缓存是否过期（24小时）
                if time.time() - cache_data.get('timestamp', 0) < 86400:
                    return cache_data.get('data')
        except Exception as e:
            print(f"加载缓存失败: {e}")
    return None

def save_cached_data(url, data, user_id=None):
    """保存直播间的详细信息到缓存"""
    if user_id is None:
        user_id = get_current_user_id()
    
    # 使用用户特定的缓存目录
    user_dir = get_user_data_path(user_id)
    user_cache_dir = os.path.join(user_dir, 'cache')
    os.makedirs(user_cache_dir, exist_ok=True)
    
    cache_key = get_cache_key(url)
    cache_file = os.path.join(user_cache_dir, f"{cache_key}.json")
    
    cache_data = {
        'url': url,
        'data': data,
        'timestamp': time.time()
    }
    
    try:
        with open(cache_file, 'w', encoding='utf-8') as f:
            json.dump(cache_data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"保存缓存失败: {e}")

def clear_old_cache(user_id=None):
    """清理过期缓存文件"""
    if user_id is None:
        user_id = get_current_user_id()
    
    # 使用用户特定的缓存目录
    user_dir = get_user_data_path(user_id)
    user_cache_dir = os.path.join(user_dir, 'cache')
    os.makedirs(user_cache_dir, exist_ok=True)
    
    try:
        for filename in os.listdir(user_cache_dir):
            if filename.endswith('.json'):
                file_path = os.path.join(user_cache_dir, filename)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        cache_data = json.load(f)
                        if time.time() - cache_data.get('timestamp', 0) >= 86400:
                            os.remove(file_path)
                except Exception:
                    # 如果文件损坏，直接删除
                    os.remove(file_path)
    except Exception as e:
        print(f"清理缓存失败: {e}")