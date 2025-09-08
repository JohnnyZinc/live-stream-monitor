from flask import Flask, render_template, request, jsonify
import os
from tools.platform_factory import PlatformFactory
from tools.user_manager import (
    login_required, admin_required, get_current_user_id
)
from tools.data_handler import (
    load_saved_rooms, save_rooms_data, get_user_rooms_file
)
from tools.cache_manager import (
    load_cached_data, save_cached_data, clear_old_cache
)
from tools.group_manager import (
    load_groups, save_groups, update_room_groups
)
from tools.config_manager import (
    load_douyin_config, save_douyin_config, 
    load_refresh_settings, save_refresh_settings
)
from tools.utils import (
    check_data_changes, merge_room_data
)

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'  # 在生产环境中应该使用环境变量

@app.route('/')
def index():
    # 如果用户已登录，显示主页面
    from flask import session
    if 'user_id' in session:
        return render_template('index.html')
    else:
        # 如果用户未登录，显示登录页面
        return render_template('login.html')

# 用户认证路由
@app.route('/login', methods=['GET', 'POST'])
def login():
    """用户登录"""
    from flask import session
    from tools.user_manager import authenticate_user
    if request.method == 'GET':
        return render_template('login.html')
    
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '')
        
        if not username or not password:
            return jsonify({'error': '用户名和密码不能为空'})
        
        user = authenticate_user(username, password)
        if not user:
            return jsonify({'error': '用户名或密码错误'})
        
        # 设置session
        session['user_id'] = username
        session['is_admin'] = user.get('is_admin', False)
        
        return jsonify({
            'success': True,
            'user': {
                'username': username,
                'is_admin': user.get('is_admin', False)
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/register', methods=['GET', 'POST'])
def register():
    """用户注册"""
    from tools.user_manager import load_admin_config, create_user
    # 检查是否允许注册
    admin_config = load_admin_config()
    if not admin_config.get('allow_registration', True):
        return jsonify({'error': '当前不允许注册新用户'}), 403
    
    if request.method == 'GET':
        return render_template('register.html')
    
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '')
        confirm_password = data.get('confirm_password', '')
        
        if not username or not password:
            return jsonify({'error': '用户名和密码不能为空'})
        
        if password != confirm_password:
            return jsonify({'error': '两次输入的密码不一致'})
        
        if len(password) < 6:
            return jsonify({'error': '密码长度至少为6位'})
        
        create_user(username, password, is_admin=False)
        
        return jsonify({'success': True, 'message': '注册成功，请登录'})
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/logout', methods=['POST'])
def logout():
    """用户登出"""
    from flask import session
    try:
        # 清除session中的所有数据
        session.pop('user_id', None)
        session.pop('is_admin', None)
        session.clear()
        return jsonify({'success': True, 'message': '已退出登录'})
    except Exception as e:
        # 即使出现异常，也返回成功以确保前端能够正常重定向
        print(f"登出时出现异常: {str(e)}")
        return jsonify({'success': True, 'message': '已退出登录'})

@app.route('/get_current_user', methods=['GET'])
def get_current_user():
    """获取当前登录用户信息"""
    from flask import session
    from tools.user_manager import load_users
    if 'user_id' not in session:
        return jsonify({'error': '未登录'})
    
    users = load_users()
    user = users.get(session['user_id'])
    
    if not user:
        return jsonify({'error': '用户不存在'})
    
    return jsonify({
        'success': True,
        'user': {
            'username': user['username'],
            'is_admin': user.get('is_admin', False)
        }
    })

@app.route('/check_registration_allowed', methods=['GET'])
def check_registration_allowed():
    """检查是否允许注册"""
    from tools.user_manager import load_admin_config
    admin_config = load_admin_config()
    return jsonify({
        'success': True,
        'allowed': admin_config.get('allow_registration', True)
    })

@app.route('/check_auth_status', methods=['GET'])
def check_auth_status():
    """检查认证状态"""
    from flask import session
    if 'user_id' in session:
        return jsonify({
            'authenticated': True,
            'user_id': session['user_id'],
            'is_admin': session.get('is_admin', False)
        })
    else:
        return jsonify({
            'authenticated': False
        })

@app.route('/add_room', methods=['POST'])
@login_required
def add_room():
    try:
        from flask import session
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
        
        if room_url not in urls:
            urls.append(room_url)
            save_rooms_data(urls, user_id)
        
        # 返回当前URL列表
        return jsonify({
            'success': True,
            'urls': urls
        })
        
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/get_room_info')
@login_required
def get_room_info_route():
    """获取单个直播间的实时信息"""
    try:
        from flask import session
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

@app.route('/remove_room', methods=['POST'])
@login_required
def remove_room():
    """移除直播间"""
    try:
        from flask import session
        data = request.get_json()
        room_url = data.get('room_url', '').strip()
        
        user_id = session.get('user_id', 'admin')
        urls = load_saved_rooms(user_id)
        if room_url in urls:
            urls.remove(room_url)
            save_rooms_data(urls, user_id)
        
        return jsonify({
            'success': True,
            'urls': urls
        })
        
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/get_rooms')
@login_required
def get_rooms():
    """获取保存的直播间URL列表"""
    from flask import session
    user_id = session.get('user_id', 'admin')
    urls = load_saved_rooms(user_id)
    return jsonify(urls)

@app.route('/load_cached_rooms')
@login_required
def load_cached_rooms():
    """加载所有保存房间的缓存数据"""
    try:
        from flask import session
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

@app.route('/clear_cache', methods=['POST'])
@login_required
def clear_all_cache():
    """清理所有缓存"""
    try:
        from flask import session
        user_id = session.get('user_id', 'admin')
        clear_old_cache(user_id)
        return jsonify({'success': True, 'message': '缓存已清理'})
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/get_groups')
@login_required
def get_groups():
    """获取所有分组信息"""
    try:
        from flask import session
        user_id = session.get('user_id', 'admin')
        groups = load_groups(user_id)
        return jsonify({
            'success': True,
            'groups': groups
        })
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/create_group', methods=['POST'])
@login_required
def create_group():
    """创建新分组"""
    try:
        from flask import session
        data = request.get_json()
        group_name = data.get('name', '').strip()
        
        if not group_name:
            return jsonify({'error': '分组名称不能为空'})
        
        user_id = session.get('user_id', 'admin')
        groups = load_groups(user_id)
        
        # 检查分组是否已存在
        if group_name in groups:
            return jsonify({'error': '分组已存在'})
        
        # 创建新分组
        groups[group_name] = {
            'type': 'custom',
            'rooms': []
        }
        
        save_groups(groups, user_id)
        
        return jsonify({
            'success': True,
            'groups': groups
        })
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/update_group', methods=['POST'])
@login_required
def update_group():
    """更新分组信息（添加/移除房间）"""
    try:
        from flask import session
        data = request.get_json()
        group_name = data.get('group_name', '').strip()
        room_url = data.get('room_url', '').strip()
        action = data.get('action', '').strip()  # 'add' or 'remove'
        
        if not group_name or not room_url or not action:
            return jsonify({'error': '参数不完整'})
        
        user_id = session.get('user_id', 'admin')
        groups = load_groups(user_id)
        
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
        
        save_groups(groups, user_id)
        
        return jsonify({
            'success': True,
            'groups': groups
        })
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/delete_group', methods=['POST'])
@login_required
def delete_group():
    """删除自定义分组"""
    try:
        from flask import session
        data = request.get_json()
        group_name = data.get('name', '').strip()
        
        if not group_name:
            return jsonify({'error': '分组名称不能为空'})
        
        user_id = session.get('user_id', 'admin')
        groups = load_groups(user_id)
        
        # 检查分组是否存在
        if group_name not in groups:
            return jsonify({'error': '分组不存在'})
        
        # 不能删除系统分组
        if groups[group_name]['type'] == 'system':
            return jsonify({'error': '不能删除系统分组'})
        
        # 删除分组
        del groups[group_name]
        
        save_groups(groups, user_id)
        
        return jsonify({
            'success': True,
            'groups': groups
        })
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/get_douyin_config')
@login_required
def get_douyin_config_route():
    """获取抖音API配置"""
    try:
        from flask import session
        user_id = session.get('user_id', 'admin')
        config = load_douyin_config(user_id)
        return jsonify({
            'success': True,
            'config': config
        })
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/save_douyin_config', methods=['POST'])
@login_required
def save_douyin_config_endpoint():
    """保存抖音API配置"""
    try:
        from flask import session
        data = request.get_json()
        api_url = data.get('api_url', '').strip()
        
        if not api_url:
            return jsonify({'error': 'API地址不能为空'})
        
        config = {
            'api_url': api_url
        }
        
        user_id = session.get('user_id', 'admin')
        save_douyin_config(config, user_id)
        
        return jsonify({
            'success': True,
            'config': config
        })
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/get_refresh_settings')
@login_required
def get_refresh_settings():
    """获取刷新频率设置"""
    try:
        from flask import session
        user_id = session.get('user_id', 'admin')
        settings = load_refresh_settings(user_id)
        return jsonify({
            'success': True,
            'settings': settings
        })
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/save_refresh_settings', methods=['POST'])
@login_required
def save_refresh_settings_endpoint():
    """保存刷新频率设置"""
    try:
        from flask import session
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
        
        user_id = session.get('user_id', 'admin')
        save_refresh_settings(settings, user_id)
        
        return jsonify({
            'success': True,
            'settings': settings
        })
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/batch_update_rooms', methods=['POST'])
@login_required
def batch_update_rooms():
    """后台批量更新直播间信息"""
    try:
        from flask import session
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

@app.route('/incremental_update_room', methods=['POST'])
@login_required
def incremental_update_room():
    """增量更新单个直播间信息"""
    try:
        from flask import session
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

@app.route('/incremental_update_all', methods=['POST'])
@login_required
def incremental_update_all():
    """增量更新所有直播间信息（逐个返回）"""
    try:
        from flask import session
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

# 管理员功能路由
@app.route('/admin/users')
@admin_required
def admin_get_users():
    """获取所有用户列表"""
    try:
        from tools.user_manager import load_users, load_admin_config
        users = load_users()
        admin_config = load_admin_config()
        
        # 移除密码哈希等敏感信息
        users_list = []
        for username, user_data in users.items():
            users_list.append({
                'username': username,
                'is_admin': user_data.get('is_admin', False),
                'created_at': user_data.get('created_at')
            })
        
        return jsonify({
            'success': True,
            'users': users_list,
            'admin_config': admin_config
        })
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/admin/users', methods=['POST'])
@admin_required
def admin_create_user():
    """创建新用户"""
    try:
        from tools.user_manager import create_user
        data = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '')
        is_admin = data.get('is_admin', False)
        
        if not username or not password:
            return jsonify({'error': '用户名和密码不能为空'})
        
        if len(password) < 6:
            return jsonify({'error': '密码长度至少为6位'})
        
        create_user(username, password, is_admin)
        
        return jsonify({'success': True, 'message': '用户创建成功'})
    except ValueError as e:
        return jsonify({'error': str(e)})
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/admin/users/<username>', methods=['PUT'])
@admin_required
def admin_update_user(username):
    """更新用户信息"""
    try:
        from flask import session
        from tools.user_manager import load_users, save_users
        if username == 'admin' and session.get('user_id') != 'admin':
            return jsonify({'error': '无权修改管理员账户'})
        
        data = request.get_json()
        new_password = data.get('password', '')
        is_admin = data.get('is_admin')
        
        users = load_users()
        
        if username not in users:
            return jsonify({'error': '用户不存在'})
        
        # 更新密码（如果提供了新密码）
        if new_password:
            from werkzeug.security import generate_password_hash
            if len(new_password) < 6:
                return jsonify({'error': '密码长度至少为6位'})
            users[username]['password_hash'] = generate_password_hash(new_password)
        
        # 更新管理员权限（如果提供了is_admin）
        if is_admin is not None:
            # 只有管理员才能修改管理员权限
            users[username]['is_admin'] = is_admin
        
        save_users(users)
        
        return jsonify({'success': True, 'message': '用户信息更新成功'})
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/admin/users/<username>', methods=['DELETE'])
@admin_required
def admin_delete_user(username):
    """删除用户"""
    try:
        from flask import session
        from tools.user_manager import load_users, save_users, get_user_data_path
        if username == 'admin':
            return jsonify({'error': '不能删除超级管理员'})
        
        if username == session.get('user_id'):
            return jsonify({'error': '不能删除当前登录用户'})
        
        users = load_users()
        
        if username not in users:
            return jsonify({'error': '用户不存在'})
        
        # 删除用户
        del users[username]
        save_users(users)
        
        # 删除用户数据目录（可选）
        import shutil
        user_dir = get_user_data_path(username)
        if os.path.exists(user_dir):
            try:
                shutil.rmtree(user_dir)
            except Exception as e:
                print(f"删除用户目录失败: {e}")
        
        return jsonify({'success': True, 'message': '用户删除成功'})
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/admin/config', methods=['POST'])
@admin_required
def admin_update_config():
    """更新管理员配置"""
    try:
        from tools.user_manager import load_admin_config, save_admin_config
        data = request.get_json()
        allow_registration = data.get('allow_registration')
        
        if allow_registration is None:
            return jsonify({'error': '参数错误'})
        
        admin_config = load_admin_config()
        admin_config['allow_registration'] = allow_registration
        save_admin_config(admin_config)
        
        return jsonify({
            'success': True, 
            'message': '配置更新成功',
            'config': admin_config
        })
    except Exception as e:
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    # 启动时清理过期缓存
    clear_old_cache('admin')  # 清理管理员缓存
    app.run(debug=True, host='0.0.0.0', port=5000)