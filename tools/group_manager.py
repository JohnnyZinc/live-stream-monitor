import os
import json
from flask import session
from .user_manager import get_current_user_id, get_user_data_path
from .data_handler import get_user_groups_file, load_saved_rooms

def load_groups(user_id=None):
    """从文件中加载分组数据"""
    if user_id is None:
        user_id = get_current_user_id()
    
    GROUPS_FILE = get_user_groups_file(user_id)
    
    if os.path.exists(GROUPS_FILE):
        try:
            with open(GROUPS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass
    
    # 默认分组
    default_groups = {
        "全部关注": {"type": "system", "rooms": []},
        "直播中": {"type": "system", "rooms": []},
        "未开播": {"type": "system", "rooms": []},
        "特别关注": {"type": "system", "rooms": []}
    }
    save_groups(default_groups, user_id)
    return default_groups

def save_groups(groups, user_id=None):
    """保存分组数据到文件"""
    if user_id is None:
        user_id = get_current_user_id()
    
    GROUPS_FILE = get_user_groups_file(user_id)
    
    try:
        with open(GROUPS_FILE, 'w', encoding='utf-8') as f:
            json.dump(groups, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"保存分组数据失败: {e}")

def update_room_groups(rooms_data, user_id=None):
    """根据房间状态更新分组"""
    if user_id is None:
        user_id = get_current_user_id()
    
    groups = load_groups(user_id)
    
    # 重置系统分组
    groups["直播中"]["rooms"] = []
    groups["未开播"]["rooms"] = []
    
    # 根据状态分配房间到相应分组
    for room in rooms_data:
        if room.get("is_live", False):
            groups["直播中"]["rooms"].append(room["url"])
        else:
            groups["未开播"]["rooms"].append(room["url"])
    
    save_groups(groups, user_id)
    return groups