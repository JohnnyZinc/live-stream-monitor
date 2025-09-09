from flask import Blueprint, render_template, request, jsonify, session
from tools.user_manager import (
    login_required, admin_required, authenticate_user, 
    load_users, load_admin_config, create_user
)

# 创建蓝图
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    """用户登录"""
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

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    """用户注册"""
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

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """用户登出"""
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

@auth_bp.route('/get_current_user', methods=['GET'])
def get_current_user():
    """获取当前登录用户信息"""
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

@auth_bp.route('/check_registration_allowed', methods=['GET'])
def check_registration_allowed():
    """检查是否允许注册"""
    admin_config = load_admin_config()
    return jsonify({
        'success': True,
        'allowed': admin_config.get('allow_registration', True)
    })

@auth_bp.route('/check_auth_status', methods=['GET'])
def check_auth_status():
    """检查认证状态"""
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