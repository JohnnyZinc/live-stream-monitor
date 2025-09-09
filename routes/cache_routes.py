from flask import Blueprint, request, jsonify, session
from tools.data_handler import (
    load_saved_rooms
)
from tools.cache_manager import (
    load_cached_data, clear_old_cache
)
from tools.group_manager import (
    update_room_groups
)

# 创建蓝图
cache_bp = Blueprint('cache', __name__)

@cache_bp.route('/load_cached_rooms')
def load_cached_rooms():
    """加载所有保存房间的缓存数据"""
    try:
        user_id = session.get('user_id', 'admin')
        urls = load_saved_rooms(user_id)
        cached_rooms = []
        
        for url in urls:
            cached_data = load_cached_data(url, user_id)
            if cached_data:
                cached_rooms.append(cached_data)
        
        # 更新分组信息
        update_room_groups(cached_rooms, user_id)
        
        return jsonify({
            'success': True,
            'rooms': cached_rooms,
            'count': len(cached_rooms)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)})

@cache_bp.route('/clear_cache', methods=['POST'])
def clear_all_cache():
    """清理所有缓存"""
    try:
        user_id = session.get('user_id', 'admin')
        clear_old_cache(user_id)
        return jsonify({'success': True, 'message': '缓存已清理'})
    except Exception as e:
        return jsonify({'error': str(e)})