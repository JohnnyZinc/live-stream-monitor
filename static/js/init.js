// 创建核心实例
const roomRenderer = new RoomRenderer('roomContainer', 'emptyState');
const roomManager = new RoomManager(stateManager, roomRenderer);
const modalManager = new ModalManager();

// 应用翻译到页面元素
function applyTranslations() {
    // 更新页面标题
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        pageTitle.textContent = i18n.t('common.appTitle');
    }
    
    // 更新应用标题
    const appTitle = document.getElementById('appTitle');
    if (appTitle) {
        appTitle.textContent = i18n.t('common.appTitle');
    }
    
    // 更新加载中文本
    const loadingText = document.getElementById('loadingText');
    if (loadingText) {
        loadingText.textContent = i18n.t('common.loading');
    }
    
    // 更新导航菜单中的文本
    const autoUpdateToggle = document.getElementById('autoUpdateToggle');
    if (autoUpdateToggle) {
        const isRunning = timerService && timerService.isRunning && timerService.isRunning();
        if (isRunning) {
            autoUpdateToggle.innerHTML = `<i class="bi bi-pause-circle me-2"></i><span>${i18n.t('buttons.stopAutoUpdate')}</span>`;
        } else {
            autoUpdateToggle.innerHTML = `<i class="bi bi-play-circle me-2"></i><span>${i18n.t('buttons.startAutoUpdate')}</span>`;
        }
    }
    
    const manualUpdateBtn = document.getElementById('manualUpdateBtn');
    if (manualUpdateBtn) {
        manualUpdateBtn.innerHTML = `<i class="bi bi-arrow-clockwise me-2"></i><span>${i18n.t('buttons.manualUpdate')}</span>`;
    }
    
    const addRoomBtn = document.querySelector('button[onclick*="modalManager.showAddModal"]');
    if (addRoomBtn) {
        const span = addRoomBtn.querySelector('span');
        if (span) {
            span.textContent = i18n.t('buttons.addRoom');
        }
    }
    
    const settingsBtn = document.querySelector('button[onclick*="SettingsManager.showSettingsModal"]');
    if (settingsBtn) {
        const span = settingsBtn.querySelector('span');
        if (span) {
            span.textContent = i18n.t('navigation.settings');
        }
    }
    
    const adminBtn = document.querySelector('a[onclick*="AdminManager.showAdminModal"]');
    if (adminBtn) {
        const span = adminBtn.querySelector('span');
        if (span) {
            span.textContent = i18n.t('navigation.admin');
        }
    }
    
    const logoutBtn = document.getElementById('logoutButton');
    if (logoutBtn) {
        const span = logoutBtn.querySelector('span');
        if (span) {
            span.textContent = i18n.t('navigation.logout');
        }
    }
    
    // 更新空状态文本
    const emptyStateTitle = document.getElementById('emptyStateTitle');
    if (emptyStateTitle) {
        emptyStateTitle.textContent = i18n.t('rooms.empty');
    }
    
    const emptyStateDescription = document.getElementById('emptyStateDescription');
    if (emptyStateDescription) {
        emptyStateDescription.textContent = i18n.t('rooms.emptyDescription');
    }
    
    // 更新带有data-i18n属性的元素
    const i18nElements = document.querySelectorAll('[data-i18n]');
    i18nElements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = i18n.t(key);
        if (translation !== key) { // Only update if translation exists
            // Check if it's an input element with placeholder
            if (element.tagName === 'INPUT' && element.hasAttribute('placeholder')) {
                element.setAttribute('placeholder', translation);
            } else {
                // For other elements, update textContent
                element.textContent = translation;
            }
        }
    });
}

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
    // 初始化i18n模块
    await i18n.init();
    
    // 应用翻译到页面元素
    applyTranslations();
    
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
    
    // 监听语言切换事件
    window.addEventListener('languageChanged', function(event) {
        // 应用翻译到页面元素
        applyTranslations();
        
        // 重新渲染页面内容以应用新语言
        const currentGroupRooms = stateManager.getCurrentGroupRooms();
        roomRenderer.renderRooms(currentGroupRooms);
        
        // 更新分组菜单以应用新语言
        GroupManager.updateGroupMenu();
        
        // 更新当前分组显示名称
        const currentGroupName = document.getElementById('currentGroupName');
        if (currentGroupName) {
            const groupKeyMap = {
                "全部关注": "modals.groups.all",
                "直播中": "modals.groups.live",
                "未开播": "modals.groups.offline",
                "特别关注": "modals.groups.special"
            };
            const currentGroup = stateManager.getCurrentGroup();
            const translationKey = groupKeyMap[currentGroup] || "navigation.home";
            currentGroupName.textContent = i18n.t(translationKey);
        }
    });
});