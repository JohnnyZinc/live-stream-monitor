# i18n 国际化系统使用说明

## 系统架构概述

本项目的国际化（i18n）系统基于JSON资源文件和JavaScript模块实现，支持多种语言的动态切换。

## 语言资源文件

### 文件结构
```
static/js/i18n/
├── en.json          # 英语
├── zh-CN.json       # 简体中文
├── zh-TW.json       # 繁体中文
└── ja.json          # 日语
```

### 资源文件格式
所有语言资源文件都采用JSON格式，结构如下：
```json
{
  "common": {
    "appTitle": "聚合直播",
    "loading": "加载中...",
    "save": "保存"
  },
  "navigation": {
    "home": "首页",
    "settings": "设置"
  }
}
```

## 核心模块

### i18n.js
位于 `static/js/modules/i18n.js`，是国际化系统的核心模块，提供以下功能：

1. **语言资源加载** - 动态加载JSON语言文件
2. **翻译功能** - `i18n.t(key)` 方法获取翻译文本
3. **语言切换** - `i18n.switchLanguage(lang)` 切换界面语言
4. **参数化翻译** - 支持带参数的翻译文本

### 使用方法

#### 基本翻译
```javascript
// 翻译简单文本
const title = i18n.t('common.appTitle');

// 带参数的翻译
const message = i18n.t('messages.welcome', {name: 'John'});
// 假设资源文件中定义: "welcome": "欢迎, {{name}}!"
```

#### 语言切换
```javascript
// 切换到英语
await i18n.switchLanguage('en');

// 获取当前语言
const currentLang = i18n.getCurrentLanguage();

// 获取支持的语言列表
const supportedLangs = i18n.getSupportedLanguages();
```

## 在HTML中使用翻译

### 静态文本翻译
在页面加载时，系统会自动翻译具有特定ID的元素：
- `#pageTitle` - 页面标题
- `#appTitle` - 应用标题
- `#emptyStateTitle` - 空状态标题
- `#emptyStateDescription` - 空状态描述

### 动态文本翻译
在JavaScript中可以使用以下方式应用翻译：

```javascript
// 更新按钮文本
document.getElementById('myButton').textContent = i18n.t('buttons.save');

// 更新输入框占位符
document.getElementById('searchInput').placeholder = i18n.t('common.searchPlaceholder');
```

## 添加新语言

1. 在 `static/js/i18n/` 目录下创建新的JSON文件，如 `fr.json`
2. 参照现有文件格式编写翻译内容
3. 在 `config.js` 的 `CONFIG.I18N.SUPPORTED_LANGUAGES` 数组中添加新语言代码
4. 在设置模态框的下拉菜单中添加新语言选项

## 最佳实践

### 资源键命名规范
- 使用小写字母和点号分隔
- 按功能模块组织，如 `common`, `navigation`, `buttons`
- 键名应具有描述性，避免过短或过长

### 处理长文本和HTML内容
对于较长的文本或包含HTML标记的内容，建议：
1. 将内容拆分为多个键
2. 在JavaScript中拼接内容
3. 或使用专门的富文本处理方法

### 错误处理
- 系统会自动提供回退语言
- 未翻译的键会显示原始键名作为提示
- 控制台会输出警告信息帮助识别缺失的翻译