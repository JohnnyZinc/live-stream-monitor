from flask import Blueprint, request, jsonify, session
from tools.config_manager import (
    load_douyin_config, save_douyin_config, 
    load_refresh_settings, save_refresh_settings
)

# 创建蓝图
config_bp = Blueprint('config', __name__)

@config_bp.route('/get_douyin_config')
def get_douyin_config_route():
    """获取抖音API配置"""
    try:
        user_id = session.get('user_id', 'admin')
        config = load_douyin_config(user_id)
        return jsonify({
            'success': True,
            'config': config
        })
    except Exception as e:
        return jsonify({'error': str(e)})

@config_bp.route('/save_douyin_config', methods=['POST'])
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
        
        user_id = session.get('user_id', 'admin')
        save_douyin_config(config, user_id)
        
        return jsonify({
            'success': True,
            'config': config
        })
    except Exception as e:
        return jsonify({'error': str(e)})

@config_bp.route('/get_refresh_settings')
def get_refresh_settings():
    """获取刷新频率设置"""
    try:
        user_id = session.get('user_id', 'admin')
        settings = load_refresh_settings(user_id)
        return jsonify({
            'success': True,
            'settings': settings
        })
    except Exception as e:
        return jsonify({'error': str(e)})

@config_bp.route('/save_refresh_settings', methods=['POST'])
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
        
        user_id = session.get('user_id', 'admin')
        save_refresh_settings(settings, user_id)
        
        return jsonify({
            'success': True,
            'settings': settings
        })
    except Exception as e:
        return jsonify({'error': str(e)})