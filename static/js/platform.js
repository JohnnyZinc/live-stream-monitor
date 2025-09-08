// 平台识别工具函数

// 根据URL识别平台类型
function getPlatformFromUrl(url) {
    if (!url) return 'unknown';
    
    if (url.includes('douyu.com')) {
        return 'douyu';
    } else if (url.includes('huya.com')) {
        return 'huya';
    } else if (url.includes('bilibili.com')) {
        return 'bilibili';
    } else if (url.includes('douyin.com')) {
        return 'douyin';
    } else {
        return 'unknown';
    }
}

// 获取平台对应的logo图片路径
function getPlatformLogo(platform) {
    const logoMap = {
        'douyu': '/static/images/douyu_logo.png',
        'huya': '/static/images/huya_logo.png',
        'bilibili': '/static/images/bilibili_logo.png',
        'douyin': '/static/images/douyin_logo.png',
        'unknown': '/static/images/default-avatar.svg'
    };
    
    return logoMap[platform] || logoMap['unknown'];
}

// 获取平台显示名称
function getPlatformName(platform) {
    const nameMap = {
        'douyu': '斗鱼',
        'huya': '虎牙',
        'bilibili': '哔哩哔哩',
        'douyin': '抖音',
        'unknown': '未知平台'
    };
    
    return nameMap[platform] || nameMap['unknown'];
}