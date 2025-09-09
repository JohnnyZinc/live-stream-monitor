from flask import Blueprint, request, jsonify, session
from tools.group_manager import (
    load_groups, save_groups, update_room_groups
)

# 创建蓝图
group_bp = Blueprint('group', __name__)

@group_bp.route('/get_groups')
def get_groups():
    """获取所有分组信息"""
    try:
        user_id = session.get('user_id', 'admin')
        groups = load_groups(user_id)
        return jsonify({
            'success': True,
            'groups': groups
        })
    except Exception as e:
        return jsonify({'error': str(e)})

@group_bp.route('/create_group', methods=['POST'])
def create_group():
    """创建新分组"""
    try:
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

@group_bp.route('/update_group', methods=['POST'])
def update_group():
    """更新分组信息（添加/移除房间）"""
    try:
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

@group_bp.route('/delete_group', methods=['POST'])
def delete_group():
    """删除自定义分组"""
    try:
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