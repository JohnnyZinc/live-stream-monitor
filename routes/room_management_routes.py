from flask import Blueprint, request, jsonify, session
from tools.platform_factory import PlatformFactory
from tools.data_handler import (
    load_saved_rooms, save_rooms_data, get_user_rooms_file
)
from tools.cache_manager import (
    load_cached_data, save_cached_data
)
from tools.config_manager import (
    load_douyin_config
)

# 创建蓝图
room_management_bp = Blueprint('room_management', __name__)

@room_management_bp.route('/add_room', methods=['POST'])
@room_management_bp.route('/remove_room', methods=['POST'])
def manage_room():
    """添加或移除直播间"""
    try:
        data = request.get_json()
        room_input = data.get('room_url', '').strip()
        
        if not room_input:
            return jsonify({'error': '请输入房间链接或号码'})
        
        # 获取平台检测器
        checker_class = PlatformFactory.get_platform_checker(room_input)
        
        # 提取房间ID
        room_id = checker_class.extract_room_id(room_input)
        
        # 构建标准URL
        base_url = getattr(checker_class, 'BASE_URL', 'https://unknown.com')
        room_url = f'{base_url}/{room_id}'
        
        # 加载现有数据
        user_id = session.get('user_id', 'admin')
        urls = load_saved_rooms(user_id)
        
        # 根据请求路径决定是添加还是移除
        if request.path == '/add_room':
            if room_url not in urls:
                urls.append(room_url)
                save_rooms_data(urls, user_id)
            
            # 返回当前URL列表
            return jsonify({
                'success': True,
                'urls': urls
            })
        else:  # /remove_room
            if room_url in urls:
                urls.remove(room_url)
                save_rooms_data(urls, user_id)
            
            return jsonify({
                'success': True,
                'urls': urls
            })
            
    except Exception as e:
        return jsonify({'error': str(e)})

@room_management_bp.route('/get_room_info')
def get_room_info_route():
    """获取单个直播间的实时信息"""
    try:
        url = request.args.get('url')
        if not url:
            return jsonify({'error': '请提供URL'})
            
        user_id = session.get('user_id', 'admin')
        # 先从缓存加载数据
        cached_data = load_cached_data(url, user_id)
        if cached_data and request.args.get('use_cache', 'false') != 'false':
            cached_data['from_cache'] = True
            return jsonify(cached_data)
        
        # 获取平台检测器
        checker_class = PlatformFactory.get_platform_checker(url)
        
        # 提取房间ID
        room_id = checker_class.extract_room_id(url)
        
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
        
        # 保存到缓存
        save_cached_data(url, result, user_id)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)})

@room_management_bp.route('/get_rooms')
def get_rooms():
    """获取保存的直播间URL列表"""
    user_id = session.get('user_id', 'admin')
    urls = load_saved_rooms(user_id)
    return jsonify(urls)