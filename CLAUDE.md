# CLAUDE.md

此文件为 Claude Code (claude.ai/code) 在此代码库中工作时提供指导。

## 项目概述

这是一个基于 Flask 的网络应用程序，用于监控多个平台（斗鱼、虎牙、哔哩哔哩、抖音）的直播房间。该应用程序允许用户添加、跟踪和监控他们喜爱的主播的直播状态。

## 架构

### 后端 (Python/Flask)
- 主应用程序：`app.py` - 处理所有 Flask 路由和核心逻辑
- `tools/` 目录中的模块化平台检查器：
  - `douyu_checker.py` - 斗鱼平台
  - `huya_checker.py` - 虎牙平台
  - `bilibili_checker.py` - 哔哩哔哩平台
  - `douyin_checker.py` - 抖音平台
  - `platform_factory.py` - 工厂模式，根据 URL 选择适当的检查器

### 前端 (HTML/CSS/JavaScript)
- 主页面：`templates/index.html`
- `static/` 目录中的静态资源：
  - `static/css/` 中的 CSS 文件
  - `static/js/` 中的 JavaScript 文件
  - `static/images/` 中的图片

### 数据存储
- `data/` 目录中的 JSON 文件：
  - `rooms_data.json` - 保存的房间 URL
  - `groups_data.json` - 用户定义的分组
  - `douyin_config.json` - 抖音 API 配置
  - `cache/` 目录 - 缓存的房间信息

## 常见开发任务

### 运行应用程序
```bash
python app.py
```

### 添加新平台
1. 在 `tools/` 中创建新的检查器类（复制现有检查器作为模板）
2. 在 `tools/platform_factory.py` 中添加平台映射
3. 实现所需方法：
   - `extract_room_id(url)` - 从 URL 中提取房间 ID
   - `check_live_status(room_id)` - 检查房间是否在直播
   - `get_room_info(room_id)` - 获取房间详细信息

### 主要 API 端点
- `/add_room` - 添加新房间
- `/get_room_info` - 获取特定房间的信息
- `/batch_update_rooms` - 后台更新所有房间
- `/incremental_update_room` - 更新单个房间
- `/get_groups` - 获取所有分组
- `/create_group` - 创建新分组

## 依赖项
- 后端：Flask, requests
- 前端：原生 JavaScript（无构建系统）