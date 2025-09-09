# 聚合直播 - 多平台直播监控工具

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.11+-blue.svg)
![Flask](https://img.shields.io/badge/flask-2.3.2+-green.svg)
![Docker](https://img.shields.io/badge/docker-ready-blue.svg)

一个基于 Flask 的多平台直播监控工具，支持斗鱼、虎牙、哔哩哔哩、抖音等主流直播平台的直播间状态监控和聚合展示。

## ✨ 主要特性

- 🎯 **多平台支持** - 支持斗鱼、虎牙、哔哩哔哩、抖音四大直播平台
- 🔄 **实时监控** - 自动检测直播间开播状态，支持手动和自动刷新
- 👥 **用户管理** - 完整的用户注册、登录和权限管理系统
- 📁 **分组管理** - 支持创建自定义分组，灵活管理直播间
- 🎨 **响应式设计** - 适配桌面和移动设备，支持深色/浅色主题切换
- 🌍 **国际化** - 支持中英文界面切换
- 💾 **数据持久化** - 本地存储用户数据和配置信息
- 🐳 **Docker支持** - 完整的容器化部署方案
- ⚡ **高性能** - 智能缓存机制，减少不必要的网络请求

## 🏗️ 技术架构

### 后端技术栈
- **框架**: Flask 2.3.2
- **语言**: Python 3.11+
- **HTTP库**: Requests 2.31.0
- **架构模式**: 蓝图(Blueprint)模块化设计

### 前端技术栈
- **框架**: Bootstrap 5.3.0
- **图标**: Bootstrap Icons
- **语言**: 原生 JavaScript (ES6+)
- **构建**: 无构建工具，原生开发

### 项目结构
```
live_collection/
├── app.py                    # Flask应用入口
├── requirements.txt          # Python依赖
├── Dockerfile               # Docker镜像配置
├── docker-compose.yml       # 容器编排配置
├── .dockerignore           # Docker构建忽略文件
├── DOCKER_DEPLOYMENT.md    # Docker部署说明
├── CLAUDE.md               # 项目开发指南
├── routes/                 # 路由模块
│   ├── auth_routes.py      # 用户认证路由
│   ├── room_management_routes.py  # 房间管理路由
│   ├── group_routes.py     # 分组管理路由
│   ├── admin_routes.py     # 管理员路由
│   ├── config_routes.py    # 配置管理路由
│   ├── batch_update_routes.py     # 批量更新路由
│   └── cache_routes.py     # 缓存管理路由
├── tools/                  # 工具模块
│   ├── platform_factory.py       # 平台检测工厂
│   ├── douyu_checker.py          # 斗鱼检测器
│   ├── huya_checker.py           # 虎牙检测器
│   ├── bilibili_checker.py       # 哔哩哔哩检测器
│   ├── douyin_checker.py         # 抖音检测器
│   ├── cache_manager.py          # 缓存管理
│   ├── data_handler.py           # 数据处理
│   ├── group_manager.py          # 分组管理
│   ├── user_manager.py           # 用户管理
│   ├── config_manager.py         # 配置管理
│   └── utils.py                  # 工具函数
├── templates/              # HTML模板
│   ├── index.html          # 主页面
│   ├── login.html          # 登录页面
│   └── modals/             # 模态框模板
├── static/                 # 静态资源
│   ├── css/               # 样式文件
│   ├── js/                # JavaScript文件
│   │   ├── modules/       # 模块化JS组件
│   │   └── i18n/          # 国际化文件
│   └── images/            # 图片资源
└── data/                  # 数据存储
    ├── cache/             # 缓存数据
    └── users/             # 用户数据
```

## 🚀 快速开始

### 本地开发环境

1. **克隆项目**
```bash
git clone <repository-url>
cd live_collection
```

2. **安装依赖**
```bash
pip install -r requirements.txt
```

3. **启动应用**
```bash
python app.py
```

4. **访问应用**
打开浏览器访问 `http://localhost:5000`

### Docker容器部署

1. **使用Docker Compose**
```bash
docker-compose up -d
```

2. **访问应用**
打开浏览器访问 `http://localhost:5000`

详细部署说明请参考 [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)

## 📱 功能特性详解

### 支持的直播平台

| 平台 | 域名 | 检测方式 | 状态 |
|------|------|----------|------|
| 斗鱼 | douyu.com | $ROOM.show_status参数 | ✅ |
| 虎牙 | huya.com | 页面API检测 | ✅ |
| 哔哩哔哩 | live.bilibili.com | 官方API | ✅ |
| 抖音 | live.douyin.com | 第三方API | ✅ |

### 核心功能

#### 1. 直播间管理
- ✅ 添加/删除直播间
- ✅ 批量更新直播间状态
- ✅ 实时显示直播状态
- ✅ 观众数、关注数显示
- ✅ 一键跳转到直播间

#### 2. 分组管理
- ✅ 创建自定义分组
- ✅ 将直播间分配到不同分组
- ✅ 快速切换分组视图
- ✅ 默认分组：全部关注、直播中、未开播、特别关注

#### 3. 用户系统
- ✅ 用户注册/登录
- ✅ 管理员控制台
- ✅ 用户权限管理
- ✅ 个人资料管理

#### 4. 系统设置
- ✅ 自动更新设置
- ✅ 刷新频率配置
- ✅ 深色/浅色主题切换
- ✅ 多语言支持
- ✅ 抖音API配置

## 🎨 界面展示

### 主题配色方案

#### 浅色主题
- **主色**: `#7B24FF` (品牌紫)
- **强调色**: `#FF2D9A` (活力粉)
- **状态色**: `#FC4444` (直播红)
- **背景色**: `#F8F9FA` (柔和白)
- **文本色**: `#1A1D24` (深灰黑)

#### 深色主题
- **主色**: `#A26EFF` (亮紫)
- **强调色**: `#FF69B4` (亮粉)
- **状态色**: `#FF5252` (亮红)
- **背景色**: `#121418` (深蓝黑)
- **文本色**: `#D1D5DB` (浅灰)

## 🔧 配置说明

### 环境变量
```bash
FLASK_ENV=production          # 运行环境
FLASK_APP=app.py             # 应用入口
SECRET_KEY=your-secret-key   # 应用密钥
```

### 抖音API配置
抖音直播间检测需要配置第三方API，默认使用 `https://douyin.wtf`，可在设置中修改。

### 数据存储
- **用户数据**: `data/users/` 目录
- **房间数据**: `data/rooms_data.json`
- **分组数据**: `data/groups_data.json`
- **配置数据**: `data/douyin_config.json`
- **缓存数据**: `data/cache/` 目录

## 📋 API接口

### 房间管理
- `POST /add_room` - 添加直播间
- `POST /remove_room` - 删除直播间
- `GET /get_room_info` - 获取房间信息
- `POST /incremental_update_room` - 更新单个房间
- `POST /batch_update_rooms` - 批量更新所有房间

### 分组管理
- `GET /get_groups` - 获取所有分组
- `POST /create_group` - 创建新分组
- `POST /delete_group` - 删除分组

### 用户管理
- `POST /register` - 用户注册
- `POST /login` - 用户登录
- `POST /logout` - 用户退出
- `GET /get_user_info` - 获取用户信息

### 缓存管理
- `GET /get_cached_rooms` - 获取缓存的房间信息
- `POST /clear_cache` - 清理缓存

## 🛠️ 开发指南

### 添加新平台
1. 在 `tools/` 目录创建新的检查器类
2. 继承基础检查器接口
3. 实现 `extract_room_id()` 和 `check_live_status()` 方法
4. 在 `platform_factory.py` 中注册新平台

### 代码规范
- 使用 Python 3.11+ 语法
- 遵循 PEP 8 编码规范
- 使用类型注解
- 编写详细的文档字符串

### 测试
```bash
# 运行Flask应用
python app.py

# 测试单个平台检测器
python -m tools.douyu_checker
```

## 🐛 故障排除

### 常见问题
1. **端口冲突**: 确保5000端口未被占用
2. **权限问题**: 检查data目录权限
3. **API限制**: 某些平台可能有访问频率限制
4. **缓存过期**: 手动清理缓存数据

### 调试模式
```bash
# 启用调试模式
export FLASK_ENV=development
python app.py
```

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🤝 贡献指南

1. Fork 本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 创建 Issue
- 发送邮件
- 提交 Pull Request

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者和用户！

---

**聚合直播** - 让直播监控更简单 🎥