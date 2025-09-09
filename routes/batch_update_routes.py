from flask import Blueprint, request, jsonify, session
from tools.platform_factory import PlatformFactory
from tools.data_handler import (
    load_saved_rooms
)
from tools.cache_manager import (
    load_cached_data, save_cached_data
)
from tools.group_manager import (
    update_room_groups
)
from tools.config_manager import (
    load_douyin_config
)
from tools.utils import (
    check_data_changes, merge_room_data
)

# 创建蓝图
batch_update_bp = Blueprint('batch_update', __name__)

@batch_update_bp.route('/batch_update_rooms', methods=['POST'])
def batch_update_rooms():
    """后台批量更新直播间信息"""
    try:
        # 获取所有保存的房间URL
        user_id = session.get('user_id', 'admin')
        urls = load_saved_rooms(user_id)
        
        if not urls:
            return jsonify({
                'success': True,
                'message': '没有需要更新的直播间',
                'updated_rooms': [],
                'changed_rooms': []
            })
        
        updated_rooms = []
        changed_rooms = []
        failed_rooms = []
        
        # 获取抖音API配置
        douyin_config = load_douyin_config(user_id)
        douyin_api_url_base = douyin_config.get('api_url', 'https://douyin.wtf')
        
        # 逐个更新房间信息
        for url in urls:
            try:
                # 获取平台检测器
                checker_class = PlatformFactory.get_platform_checker(url)
                
                # 提取房间ID
                room_id = checker_class.extract_room_id(url)
                
                # 获取抖音API配置（如果是抖音平台）
                douyin_api_url = None
                if checker_class.__name__ == 'DouyinChecker':
                    douyin_api_url = douyin_api_url_base + '/api/douyin/web/fetch_user_live_videos'
                
                # 获取房间信息
                if douyin_api_url:
                    room_info = checker_class.get_room_info(room_id, douyin_api_url)
                else:
                    room_info = checker_class.get_room_info(room_id)
                
                # 检查直播状态
                if douyin_api_url:
                    is_live, status_info = checker_class.check_live_status(room_id, douyin_api_url)
                else:
                    is_live, status_info = checker_class.check_live_status(room_id)
                
                platform = PlatformFactory.detect_platform_from_url(url)
                
                result = {
                    'success': True,
                    'platform': platform,
                    'room_id': room_id,
                    'anchor': room_info['anchor'],
                    'title': room_info['title'],
                    'url': room_info['url'],
                    'is_live': is_live,
                    'status_info': str(status_info),
                    'avatar': room_info['avatar'],
                    'cover': room_info['cover'],
                    'popular_num': room_info.get('popular_num', 0),
                    'from_cache': False
                }
                
                # 如果有fetch_status字段，添加到result中
                if 'fetch_status' in room_info:
                    result['fetch_status'] = room_info['fetch_status']
                
                # 合并数据，保留有效原有数据
                cached_data = load_cached_data(url, user_id)
                merged_result = merge_room_data(cached_data, result)
                
                # 检查数据是否发生变化
                if check_data_changes(cached_data, merged_result):
                    changed_rooms.append(merged_result)
                
                # 保存到缓存
                save_cached_data(url, merged_result, user_id)
                updated_rooms.append(merged_result)
                
            except Exception as e:
                print(f"更新直播间失败 {url}: {e}")
                failed_rooms.append({
                    'url': url,
                    'error': str(e)
                })
        
        return jsonify({
            'success': True,
            'message': f'更新完成，成功{len(updated_rooms)}个，失败{len(failed_rooms)}个',
            'updated_rooms': updated_rooms,
            'changed_rooms': changed_rooms,
            'failed_rooms': failed_rooms
        })
        
    except Exception as e:
        return jsonify({'error': str(e)})

@batch_update_bp.route('/incremental_update_room', methods=['POST'])
def incremental_update_room():
    """增量更新单个直播间信息"""
    try:
        user_id = session.get('user_id', 'admin')
        data = request.get_json()
        room_url = data.get('room_url')
        
        if not room_url:
            return jsonify({'error': '缺少房间URL参数'})
        
        # 获取平台检测器
        checker_class = PlatformFactory.get_platform_checker(room_url)
        
        # 提取房间ID
        room_id = checker_class.extract_room_id(room_url)
        
        # 获取抖音API配置（如果是抖音平台）
        douyin_api_url = None
        if checker_class.__name__ == 'DouyinChecker':
            douyin_config = load_douyin_config(user_id)
            douyin_api_url = douyin_config.get('api_url', 'https://douyin.wtf') + '/api/douyin/web/fetch_user_live_videos'
        
        # 获取房间信息
        if douyin_api_url:
            room_info = checker_class.get_room_info(room_id, douyin_api_url)
        else:
            room_info = checker_class.get_room_info(room_id)
        
        # 检查直播状态
        if douyin_api_url:
            is_live, status_info = checker_class.check_live_status(room_id, douyin_api_url)
        else:
            is_live, status_info = checker_class.check_live_status(room_id)
        
        platform = PlatformFactory.detect_platform_from_url(room_url)
        
        result = {
            'success': True,
            'platform': platform,
            'room_id': room_id,
            'anchor': room_info['anchor'],
            'title': room_info['title'],
            'url': room_info['url'],
            'is_live': is_live,
            'status_info': str(status_info),
            'avatar': room_info['avatar'],
            'cover': room_info['cover'],
            'popular_num': room_info.get('popular_num', 0),
            'from_cache': False
        }
        
        # 如果有fetch_status字段，添加到result中
        if 'fetch_status' in room_info:
            result['fetch_status'] = room_info['fetch_status']
        
        # 合并数据，保留有效原有数据
        cached_data = load_cached_data(room_url, user_id)
        merged_result = merge_room_data(cached_data, result)
        
        # 检查数据是否发生变化
        has_changes = check_data_changes(cached_data, merged_result)
        
        # 保存到缓存
        save_cached_data(room_url, merged_result, user_id)
        
        return jsonify({
            'success': True,
            'room_data': merged_result,
            'has_changes': has_changes
        })
        
    except Exception as e:
        return jsonify({'error': str(e)})

@batch_update_bp.route('/incremental_update_all', methods=['POST'])
def incremental_update_all():
    """增量更新所有直播间信息（逐个返回）"""
    try:
        # 获取所有保存的房间URL
        user_id = session.get('user_id', 'admin')
        urls = load_saved_rooms(user_id)
        
        if not urls:
            return jsonify({
                'success': True,
                'message': '没有需要更新的直播间'
            })
        
        # 返回一个可以逐个处理的响应
        return jsonify({
            'success': True,
            'rooms_to_update': urls
        })
        
    except Exception as e:
        return jsonify({'error': str(e)})