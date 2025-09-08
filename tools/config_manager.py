import os
import json
from flask import session
from .user_manager import get_current_user_id, get_user_data_path

def get_douyin_config_file(user_id=None):
    """获取抖音配置文件路径"""
    if user_id is None:
        user_id = get_current_user_id()
    user_dir = get_user_data_path(user_id)
    return os.path.join(user_dir, 'douyin_config.json')

def get_refresh_settings_file(user_id=None):
    """获取刷新设置文件路径"""
    if user_id is None:
        user_id = get_current_user_id()
    user_dir = get_user_data_path(user_id)
    return os.path.join(user_dir, 'refresh_settings.json')

def load_douyin_config(user_id=None):
    """从文件中加载抖音API配置"""
    if user_id is None:
        user_id = get_current_user_id()
    
    DOUYIN_CONFIG_FILE = get_douyin_config_file(user_id)
    
    if os.path.exists(DOUYIN_CONFIG_FILE):
        try:
            with open(DOUYIN_CONFIG_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass
    
    # 默认配置
    default_config = {
        "api_url": "https://douyin.wtf"
    }
    save_douyin_config(default_config, user_id)
    return default_config

def save_douyin_config(config, user_id=None):
    """保存抖音API配置到文件"""
    if user_id is None:
        user_id = get_current_user_id()
    
    DOUYIN_CONFIG_FILE = get_douyin_config_file(user_id)
    
    try:
        with open(DOUYIN_CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(config, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"保存抖音API配置失败: {e}")

def load_refresh_settings(user_id=None):
    """从文件中加载刷新频率设置"""
    if user_id is None:
        user_id = get_current_user_id()
    
    REFRESH_SETTINGS_FILE = get_refresh_settings_file(user_id)
    
    if os.path.exists(REFRESH_SETTINGS_FILE):
        try:
            with open(REFRESH_SETTINGS_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                # 验证数据格式
                if isinstance(data, dict) and 'refresh_interval' in data:
                    interval = data['refresh_interval']
                    # 验证间隔是正整数（分钟）
                    if isinstance(interval, int) and interval > 0:
                        return data
        except Exception:
            pass
    
    # 默认设置（10分钟）
    default_settings = {
        "refresh_interval": 10  # 分钟
    }
    save_refresh_settings(default_settings, user_id)
    return default_settings

def save_refresh_settings(settings, user_id=None):
    """保存刷新频率设置到文件"""
    if user_id is None:
        user_id = get_current_user_id()
    
    REFRESH_SETTINGS_FILE = get_refresh_settings_file(user_id)
    
    try:
        # 验证设置格式
        if not isinstance(settings, dict) or 'refresh_interval' not in settings:
            raise ValueError("Invalid settings format")
        
        interval = settings['refresh_interval']
        # 验证间隔是正整数（分钟）
        if not isinstance(interval, int) or interval <= 0:
            raise ValueError("Refresh interval must be a positive integer")
        
        with open(REFRESH_SETTINGS_FILE, 'w', encoding='utf-8') as f:
            json.dump(settings, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"保存刷新频率设置失败: {e}")
        raise