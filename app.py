from flask import Flask, render_template
import os
from tools.cache_manager import clear_old_cache

# 导入蓝图
from routes.auth_routes import auth_bp
from routes.group_routes import group_bp
from routes.admin_routes import admin_bp
from routes.config_routes import config_bp
from routes.room_management_routes import room_management_bp
from routes.batch_update_routes import batch_update_bp
from routes.cache_routes import cache_bp

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'  # 在生产环境中应该使用环境变量

# 注册蓝图
app.register_blueprint(auth_bp)
app.register_blueprint(room_management_bp)
app.register_blueprint(group_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(config_bp)
app.register_blueprint(batch_update_bp)
app.register_blueprint(cache_bp)

@app.route('/')
def index():
    # 如果用户已登录，显示主页面
    from flask import session
    if 'user_id' in session:
        return render_template('index.html')
    else:
        # 如果用户未登录，显示登录页面
        return render_template('login.html')

if __name__ == '__main__':
    # 启动时清理过期缓存
    clear_old_cache('admin')  # 清理管理员缓存
    app.run(debug=True, host='127.0.0.1', port=5000)