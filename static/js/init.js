// 创建核心实例
const roomRenderer = new RoomRenderer('roomContainer', 'emptyState');
const roomManager = new RoomManager(stateManager, roomRenderer);
const modalManager = new ModalManager();

// 添加登出按钮事件监听器
document.addEventListener('DOMContentLoaded', function() {
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', function(event) {
            event.preventDefault();
            if (typeof AuthManager !== 'undefined') {
                AuthManager.logout();
            } else {
                console.error('AuthManager is not defined');
                // Fallback: clear local storage and redirect to login
                localStorage.removeItem(CONFIG.CACHE_KEY);
                localStorage.removeItem(CONFIG.CACHE_TIMESTAMP);
                window.location.href = '/login';
            }
        });
    }
});

// 状态变化监听
stateManager.addListener((rooms) => {
    // 更新房间显示
    const currentGroupRooms = stateManager.getCurrentGroupRooms();
    roomRenderer.renderRooms(currentGroupRooms);
    
    // 更新分组菜单
    GroupManager.updateGroupMenu();
});

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', async () => {
    // 初始化用户认证（必须在最前面）
    AuthManager.initUserAuth();
    
    // 初始化主题切换
    Utils.initThemeToggle();
    
    // 初始化模态框管理器
    modalManager.init();
    modalManager.bindEnterKey(roomManager);
    
    // 添加登出按钮事件监听器
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', function(event) {
            event.preventDefault();
            if (typeof AuthManager !== 'undefined') {
                AuthManager.logout();
            } else {
                console.error('AuthManager is not defined');
                // Fallback: clear local storage and redirect to login
                localStorage.removeItem(CONFIG.CACHE_KEY);
                localStorage.removeItem(CONFIG.CACHE_TIMESTAMP);
                window.location.href = '/login';
            }
        });
    }
    
    // 加载分组数据
    GroupManager.loadGroups();
    
    // 加载抖音API配置
    Utils.loadDouyinConfig();
    
    // 优先使用缓存数据
    const cached = CacheManager.loadFromCache();
    if (cached && cached.length > 0) {
        stateManager.setRooms(cached);
        const currentGroupRooms = stateManager.getCurrentGroupRooms();
        roomRenderer.renderRooms(currentGroupRooms);
    }
    
    // 异步加载真实数据
    setTimeout(() => {
        roomManager.loadRooms();
    }, 300);
    
    // 页面加载完成后触发一次后台更新
    setTimeout(() => {
        RoomOperations.updateRoomsInBackground();
    }, 1000);
    
    // 初始化定时更新服务
    await Utils.initTimerService();
});