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
    
    # 如果新数据正常，但某些字段为空，则保留原有数据中的对应字段
    merged_data = old_data.copy() if old_data else {}
    merged_data.update(new_data)  # 先合并所有新数据
    
    # 定义关键字段，当这些字段在新数据中为空时，保留旧数据
    critical_fields = ['title', 'anchor', 'avatar', 'cover', 'popular_num']
    
    for field in critical_fields:
        # 如果新数据中的关键字段为空，但旧数据中有值，则保留旧数据
        if field in merged_data and not merged_data[field] and old_data and old_data.get(field):
            merged_data[field] = old_data[field]
    
    return merged_data