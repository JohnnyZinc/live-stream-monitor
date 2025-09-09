from flask import Blueprint, request, jsonify, session
from tools.user_manager import (
    admin_required, load_users, save_users, create_user, get_user_data_path
)
import os
import shutil

# 创建蓝图
admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/admin/users')
@admin_required
def admin_get_users():
    """获取所有用户列表"""
    try:
        from tools.user_manager import load_admin_config
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

@admin_bp.route('/admin/users', methods=['POST'])
@admin_required
def admin_create_user():
    """创建新用户"""
    try:
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

@admin_bp.route('/admin/users/<username>', methods=['PUT'])
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

@admin_bp.route('/admin/users/<username>', methods=['DELETE'])
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
        user_dir = get_user_data_path(username)
        if os.path.exists(user_dir):
            try:
                shutil.rmtree(user_dir)
            except Exception as e:
                print(f"删除用户目录失败: {e}")
        
        return jsonify({'success': True, 'message': '用户删除成功'})
    except Exception as e:
        return jsonify({'error': str(e)})

@admin_bp.route('/admin/config', methods=['POST'])
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