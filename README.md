# 直播间监控应用

这是一个用于监控多个直播平台（斗鱼、虎牙、哔哩哔哩、抖音）直播间状态的Flask应用。

## 功能特点

- 支持多个直播平台的直播间监控
- 实时获取直播间状态（开播/未开播）
- 获取直播间详细信息（标题、主播、封面等）
- 分组管理直播间
- 缓存机制优化性能

## 技术栈

- 后端：Python + Flask
- 前端：HTML + CSS + JavaScript
- 数据存储：JSON文件

## 安装与运行

1. 克隆项目代码
2. 安装依赖：
   ```
   pip install -r requirements.txt
   ```
3. 运行应用：
   ```
   python app.py
   ```
4. 在浏览器中访问 `http://localhost:5000`

## 项目结构

```
live_collection/
├── app.py              # 主应用文件
├── requirements.txt    # Python依赖
├── README.md           # 项目说明文档
├── CLAUDE.md           # Claude Code指导文件
├── ToDo.md             # 待办事项列表
├── data/               # 数据存储目录
│   ├── rooms_data.json     # 房间数据
│   ├── groups_data.json    # 分组数据
│   ├── douyin_config.json  # 抖音配置
│   └── cache/              # 缓存目录
├── tools/              # 平台检测工具
│   ├── platform_factory.py  # 平台工厂类
│   ├── douyu_checker.py    # 斗鱼检测器
│   ├── huya_checker.py     # 虎牙检测器
│   ├── bilibili_checker.py # 哔哩哔哩检测器
│   └── douyin_checker.py   # 抖音检测器
├── static/             # 静态资源目录
│   ├── css/            # 样式文件
│   ├── js/             # JavaScript文件
│   └── images/         # 图片资源
└── templates/          # 模板文件
    └── index.html      # 主页面模板
```

## 配置说明

### 抖音API配置
在使用抖音直播间监控功能时，需要配置第三方API地址：
1. 在应用界面中找到"抖音API配置"选项
2. 输入可用的抖音API地址（如：https://douyin.wtf）

## 使用说明

1. 在首页输入直播间链接或房间号添加监控
2. 系统会自动获取直播间信息并显示在页面上
3. 可以通过分组功能对直播间进行分类管理
4. 应用会定期自动刷新直播间状态

## 开发计划

请查看 [ToDo.md](ToDo.md) 文件了解当前的开发计划和待办事项。