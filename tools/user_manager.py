import os
import json
import time
from werkzeug.security import generate_password_hash, check_password_hash
from flask import session

# 数据存储路径
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
USERS_DIR = os.path.join(DATA_DIR, 'users')
ADMIN_CONFIG_FILE = os.path.join(USERS_DIR, 'admin_config.json')
USERS_FILE = os.path.join(USERS_DIR, 'users.json')

# 确保数据目录存在
os.makedirs(USERS_DIR, exist_ok=True)

# 初始化管理员账户
if not os.path.exists(ADMIN_CONFIG_FILE):
    default_admin_config = {
        "allow_registration": True,
        "admin_user_id": "admin"
    }
    with open(ADMIN_CONFIG_FILE, 'w', encoding='utf-8') as f:
        json.dump(default_admin_config, f, ensure_ascii=False, indent=2)

# 初始化用户文件
if not os.path.exists(USERS_FILE):
    default_users = {
        "admin": {
            "username": "admin",
            "password_hash": generate_password_hash("admin123"),
            "is_admin": True,
            "created_at": time.time()
        }
    }
    with open(USERS_FILE, 'w', encoding='utf-8') as f:
        json.dump(default_users, f, ensure_ascii=False, indent=2)

def get_user_data_path(user_id):
    """获取用户数据目录路径"""
    user_dir = os.path.join(USERS_DIR, user_id)
    os.makedirs(user_dir, exist_ok=True)
    return user_dir

def load_users():
    """加载用户数据"""
    if os.path.exists(USERS_FILE):
        try:
            with open(USERS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass
    return {}

def save_users(users):
    """保存用户数据"""
    try:
        with open(USERS_FILE, 'w', encoding='utf-8') as f:
            json.dump(users, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"保存用户数据失败: {e}")
        raise

def load_admin_config():
    """加载管理员配置"""
    if os.path.exists(ADMIN_CONFIG_FILE):
        try:
            with open(ADMIN_CONFIG_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass
    # 默认配置
    return {"allow_registration": True, "admin_user_id": "admin"}

def save_admin_config(config):
    """保存管理员配置"""
    try:
        with open(ADMIN_CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(config, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"保存管理员配置失败: {e}")
        raise

def create_user(username, password, is_admin=False):
    """创建新用户"""
    users = load_users()
    
    # 检查用户名是否已存在
    if username in users:
        raise ValueError("用户名已存在")
    
    # 创建用户
    user_data = {
        "username": username,
        "password_hash": generate_password_hash(password),
        "is_admin": is_admin,
        "created_at": time.time()
    }
    
    users[username] = user_data
    save_users(users)
    
    # 创建用户数据目录
    user_dir = get_user_data_path(username)
    os.makedirs(user_dir, exist_ok=True)
    
    return user_data

def authenticate_user(username, password):
    """验证用户身份"""
    users = load_users()
    user = users.get(username)
    
    if not user:
        return None
    
    if check_password_hash(user['password_hash'], password):
        return user
    
    return None

def get_current_user_id():
    """获取当前用户ID"""
    # 如果没有指定用户ID且用户已登录，使用当前用户ID
    if 'user_id' in session:
        return session['user_id']
    
    # 如果仍然没有用户ID，使用管理员ID
    return "admin"

def login_required(f):
    """登录验证装饰器"""
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            from flask import jsonify
            return jsonify({'error': '需要登录', 'redirect': '/login'}), 401
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    """管理员权限验证装饰器"""
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            from flask import jsonify
            return jsonify({'error': '需要登录', 'redirect': '/login'}), 401
        
        users = load_users()
        user = users.get(session['user_id'])
        
        if not user or not user.get('is_admin'):
            from flask import jsonify
            return jsonify({'error': '需要管理员权限'}), 403
        
        return f(*args, **kwargs)
    return decorated_function