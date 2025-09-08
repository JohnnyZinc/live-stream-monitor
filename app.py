from flask import Flask, render_template, request, jsonify
import re
import requests
import json
import os
import hashlib
import time
from tools.platform_factory import PlatformFactory

app = Flask(__name__)

# 数据存储路径
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
CACHE_DIR = os.path.join(DATA_DIR, 'cache')
ROOMS_FILE = os.path.join(DATA_DIR, 'rooms_data.json')
GROUPS_FILE = os.path.join(DATA_DIR, 'groups_data.json')
REFRESH_SETTINGS_FILE = os.path.join(DATA_DIR, 'refresh_settings.json')

# 抖音API配置文件路径
DOUYIN_CONFIG_FILE = os.path.join(DATA_DIR, 'douyin_config.json')

# 确保数据目录存在
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(CACHE_DIR, exist_ok=True)

def load_saved_rooms():
    """从文件中加载保存的直播间URL列表"""
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

def load_groups():
    """从文件中加载分组数据"""
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
    save_groups(default_groups)
    return default_groups

def load_douyin_config():
    """从文件中加载抖音API配置"""
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
    save_douyin_config(default_config)
    return default_config


def load_refresh_settings():
    """从文件中加载刷新频率设置"""
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
    save_refresh_settings(default_settings)
    return default_settings


def save_refresh_settings(settings):
    """保存刷新频率设置到文件"""
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

def save_douyin_config(config):
    """保存抖音API配置到文件"""
    try:
        with open(DOUYIN_CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(config, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"保存抖音API配置失败: {e}")

def save_groups(groups):
    """保存分组数据到文件"""
    try:
        with open(GROUPS_FILE, 'w', encoding='utf-8') as f:
            json.dump(groups, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"保存分组数据失败: {e}")

def save_rooms_data(urls):
    """保存直播间URL到文件"""
    try:
        with open(ROOMS_FILE, 'w', encoding='utf-8') as f:
            json.dump(urls, f, ensure_ascii=False, indent=2)
        
        # 更新分组中的房间列表
        groups = load_groups()
        all_rooms_group = groups.get("全部关注", {"type": "system", "rooms": []})
        all_rooms_group["rooms"] = urls
        groups["全部关注"] = all_rooms_group
        save_groups(groups)
    except Exception as e:
        print(f"保存数据失败: {e}")

def get_cache_key(url):
    """根据URL生成缓存键"""
    return hashlib.md5(url.encode('utf-8')).hexdigest()

def load_cached_data(url):
    """从缓存加载直播间的详细信息"""
    cache_key = get_cache_key(url)
    cache_file = os.path.join(CACHE_DIR, f"{cache_key}.json")
    
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

def save_cached_data(url, data):
    """保存直播间的详细信息到缓存"""
    cache_key = get_cache_key(url)
    cache_file = os.path.join(CACHE_DIR, f"{cache_key}.json")
    
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


def check_data_changes(old_data, new_data):
    """检查数据是否发生变化"""
    if not old_data or not new_data:
        return True
    
    # 定义需要检测变化的字段
    fields_to_check = ['is_live', 'title', 'cover', 'avatar', 'anchor']
    
    for field in fields_to_check:
        old_value = old_data.get(field)
        new_value = new_data.get(field)
        
        # 处理None值情况
        if old_value is None and new_value is None:
            continue
        elif old_value is None or new_value is None:
            # 如果新数据获取失败，不认为是变化
            if new_data.get('fetch_status') == 'failed' and new_value in ['', '获取失败', '抖音直播']:
                continue
            return True
        elif old_value != new_value:
            return True
    
    return False


def merge_room_data(old_data, new_data):
    """合并房间数据，保留有效原有数据"""
    if not new_data:
        return old_data or {}
    
    # 如果新数据获取失败，保留原有数据
    if new_data.get('fetch_status') == 'failed':
        merged_data = old_data.copy() if old_data else {}
        # 只更新明确有效的字段，保留原有有效数据
        for field in ['is_live', 'status_info']:
            if field in new_data and new_data[field] is not None:
                merged_data[field] = new_data[field]
        return merged_data
    
    # 如果新数据正常，直接返回新数据
    return new_data

def update_room_groups(rooms_data):
    """根据房间状态更新分组"""
    groups = load_groups()
    
    # 重置系统分组
    groups["直播中"]["rooms"] = []
    groups["未开播"]["rooms"] = []
    
    # 根据状态分配房间到相应分组
    for room in rooms_data:
        if room.get("is_live", False):
            groups["直播中"]["rooms"].append(room["url"])
        else:
            groups["未开播"]["rooms"].append(room["url"])
    
    save_groups(groups)
    return groups

def clear_old_cache():
    """清理过期缓存文件"""
    try:
        for filename in os.listdir(CACHE_DIR):
            if filename.endswith('.json'):
                file_path = os.path.join(CACHE_DIR, filename)
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

# 已移除旧的集成功能，现在使用tools.platform_factory的模块化实现

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/add_room', methods=['POST'])
def add_room():
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
        urls = load_saved_rooms()
        
        if room_url not in urls:
            urls.append(room_url)
            save_rooms_data(urls)
        
        # 返回当前URL列表
        return jsonify({
            'success': True,
            'urls': urls
        })
        
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/get_room_info')
def get_room_info_route():
    """获取单个直播间的实时信息"""
    try:
        url = request.args.get('url')
        if not url:
            return jsonify({'error': '请提供URL'})
            
        # 先从缓存加载数据
        cached_data = load_cached_data(url)
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
            douyin_config = load_douyin_config()
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
        save_cached_data(url, result)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/remove_room', methods=['POST'])
def remove_room():
    """移除直播间"""
    try:
        data = request.get_json()
        room_url = data.get('room_url', '').strip()
        
        urls = load_saved_rooms()
        if room_url in urls:
            urls.remove(room_url)
            save_rooms_data(urls)
        
        return jsonify({
            'success': True,
            'urls': urls
        })
        
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/get_rooms')
def get_rooms():
    """获取保存的直播间URL列表"""
    urls = load_saved_rooms()
    return jsonify(urls)

# 移除了旧的/check路由，仅保留/add_room用于卡片展示

@app.route('/load_cached_rooms')
def load_cached_rooms():
    """加载所有保存房间的缓存数据"""
    try:
        urls = load_saved_rooms()
        cached_rooms = []
        
        for url in urls:
            cached_data = load_cached_data(url)
            if cached_data:
                cached_rooms.append(cached_data)
        
        # 更新分组信息
        update_room_groups(cached_rooms)
        
        return jsonify({
            'success': True,
            'rooms': cached_rooms,
            'count': len(cached_rooms)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/clear_cache', methods=['POST'])
def clear_all_cache():
    """清理所有缓存"""
    try:
        clear_old_cache()
        return jsonify({'success': True, 'message': '缓存已清理'})
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/get_groups')
def get_groups():
    """获取所有分组信息"""
    try:
        groups = load_groups()
        return jsonify({
            'success': True,
            'groups': groups
        })
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/create_group', methods=['POST'])
def create_group():
    """创建新分组"""
    try:
        data = request.get_json()
        group_name = data.get('name', '').strip()
        
        if not group_name:
            return jsonify({'error': '分组名称不能为空'})
        
        groups = load_groups()
        
        # 检查分组是否已存在
        if group_name in groups:
            return jsonify({'error': '分组已存在'})
        
        # 创建新分组
        groups[group_name] = {
            'type': 'custom',
            'rooms': []
        }
        
        save_groups(groups)
        
        return jsonify({
            'success': True,
            'groups': groups
        })
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/update_group', methods=['POST'])
def update_group():
    """更新分组信息（添加/移除房间）"""
    try:
        data = request.get_json()
        group_name = data.get('group_name', '').strip()
        room_url = data.get('room_url', '').strip()
        action = data.get('action', '').strip()  # 'add' or 'remove'
        
        if not group_name or not room_url or not action:
            return jsonify({'error': '参数不完整'})
        
        groups = load_groups()
        
        # 检查分组是否存在
        if group_name not in groups:
            return jsonify({'error': '分组不存在'})
        
        # 检查是否是系统分组
        if groups[group_name]['type'] == 'system' and group_name in ['全部关注', '直播中', '未开播']:
            return jsonify({'error': '不能修改系统分组'})
        
        group = groups[group_name]
        
        if action == 'add':
            if room_url not in group['rooms']:
                group['rooms'].append(room_url)
        elif action == 'remove':
            if room_url in group['rooms']:
                group['rooms'].remove(room_url)
        else:
            return jsonify({'error': '无效的操作'})
        
        save_groups(groups)
        
        return jsonify({
            'success': True,
            'groups': groups
        })
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/delete_group', methods=['POST'])
def delete_group():
    """删除自定义分组"""
    try:
        data = request.get_json()
        group_name = data.get('name', '').strip()
        
        if not group_name:
            return jsonify({'error': '分组名称不能为空'})
        
        groups = load_groups()
        
        # 检查分组是否存在
        if group_name not in groups:
            return jsonify({'error': '分组不存在'})
        
        # 不能删除系统分组
        if groups[group_name]['type'] == 'system':
            return jsonify({'error': '不能删除系统分组'})
        
        # 删除分组
        del groups[group_name]
        
        save_groups(groups)
        
        return jsonify({
            'success': True,
            'groups': groups
        })
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/get_douyin_config')
def get_douyin_config():
    """获取抖音API配置"""
    try:
        config = load_douyin_config()
        return jsonify({
            'success': True,
            'config': config
        })
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/save_douyin_config', methods=['POST'])
def save_douyin_config_endpoint():
    """保存抖音API配置"""
    try:
        data = request.get_json()
        api_url = data.get('api_url', '').strip()
        
        if not api_url:
            return jsonify({'error': 'API地址不能为空'})
        
        config = {
            'api_url': api_url
        }
        
        save_douyin_config(config)
        
        return jsonify({
            'success': True,
            'config': config
        })
    except Exception as e:
        return jsonify({'error': str(e)})


@app.route('/get_refresh_settings')
def get_refresh_settings():
    """获取刷新频率设置"""
    try:
        settings = load_refresh_settings()
        return jsonify({
            'success': True,
            'settings': settings
        })
    except Exception as e:
        return jsonify({'error': str(e)})


@app.route('/save_refresh_settings', methods=['POST'])
def save_refresh_settings_endpoint():
    """保存刷新频率设置"""
    try:
        data = request.get_json()
        refresh_interval = data.get('refresh_interval')
        
        # 验证输入
        if refresh_interval is None:
            return jsonify({'error': '刷新频率不能为空'})
        
        if not isinstance(refresh_interval, int) or refresh_interval <= 0:
            return jsonify({'error': '刷新频率必须是正整数'})
        
        settings = {
            'refresh_interval': refresh_interval
        }
        
        save_refresh_settings(settings)
        
        return jsonify({
            'success': True,
            'settings': settings
        })
    except Exception as e:
        return jsonify({'error': str(e)})


@app.route('/batch_update_rooms', methods=['POST'])
def batch_update_rooms():
    """后台批量更新直播间信息"""
    try:
        # 获取所有保存的房间URL
        urls = load_saved_rooms()
        
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
        douyin_config = load_douyin_config()
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
                cached_data = load_cached_data(url)
                merged_result = merge_room_data(cached_data, result)
                
                # 检查数据是否发生变化
                if check_data_changes(cached_data, merged_result):
                    changed_rooms.append(merged_result)
                
                # 保存到缓存
                save_cached_data(url, merged_result)
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


@app.route('/incremental_update_room', methods=['POST'])
def incremental_update_room():
    """增量更新单个直播间信息"""
    try:
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
            douyin_config = load_douyin_config()
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
        cached_data = load_cached_data(room_url)
        merged_result = merge_room_data(cached_data, result)
        
        # 检查数据是否发生变化
        has_changes = check_data_changes(cached_data, merged_result)
        
        # 保存到缓存
        save_cached_data(room_url, merged_result)
        
        return jsonify({
            'success': True,
            'room_data': merged_result,
            'has_changes': has_changes
        })
        
    except Exception as e:
        return jsonify({'error': str(e)})


@app.route('/incremental_update_all', methods=['POST'])
def incremental_update_all():
    """增量更新所有直播间信息（逐个返回）"""
    try:
        # 获取所有保存的房间URL
        urls = load_saved_rooms()
        
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

if __name__ == '__main__':
    # 启动时清理过期缓存
    clear_old_cache()
    app.run(debug=True, host='0.0.0.0', port=5000)