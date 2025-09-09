// 工具函数模块
class Utils {
    // 显示提示框
    static showToast(message, type = 'info') {
        // 映射类型到新的CSS类名
        const typeClassMap = {
            'success': 'toast-success',
            'danger': 'toast-error',
            'info': 'toast-info'
        };
        
        const toast = document.createElement('div');
        toast.className = `toast ${typeClassMap[type] || 'toast-info'}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // 3秒后自动移除
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 3000);
    }
    // 初始化主题切换功能
    static initThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        const themeIcon = themeToggle.querySelector('i');
        
        // 检查本地存储中的主题设置
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // 设置当前主题
        let currentTheme;
        if (savedTheme) {
            currentTheme = savedTheme;
        } else {
            currentTheme = systemPrefersDark ? 'dark' : 'light';
        }
        
        // 应用主题
        document.documentElement.setAttribute('data-theme', currentTheme);
        themeIcon.className = currentTheme === 'dark' ? 'bi bi-sun' : 'bi bi-moon';
        
        // 主题切换事件
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            // 应用新主题
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            // 更新图标
            themeIcon.className = newTheme === 'dark' ? 'bi bi-sun' : 'bi bi-moon';
            
            // 同步更新用户头像按钮的样式
            this.updateUserButtonTheme(newTheme);
        });
        
        // 初始化用户头像按钮样式
        this.updateUserButtonTheme(currentTheme);
    }
    
    // 更新用户头像按钮的主题样式
    static updateUserButtonTheme(theme) {
        const userMenuButton = document.getElementById('userMenuDropdown');
        if (userMenuButton) {
            // 根据主题更新按钮样式
            userMenuButton.style.backgroundColor = theme === 'dark' ? 'var(--button-light)' : 'var(--button-light)';
            userMenuButton.style.color = theme === 'dark' ? 'var(--button-dark)' : 'var(--button-dark)';
            userMenuButton.style.borderColor = theme === 'dark' ? 'var(--border-color)' : 'var(--border-color)';
        }
    }
    
    // 加载抖音API配置
    static async loadDouyinConfig() {
        try {
            const response = await APIManager.getDouyinConfig();
            if (response.success) {
                const config = response.config;
                // 如果有配置，更新本地存储
                if (config.api_url) {
                    localStorage.setItem('douyin_api_url', config.api_url);
                }
            }
        } catch (error) {
            console.error('加载抖音API配置失败:', error);
        }
    }
    
    // 初始化定时更新服务
    static async initTimerService() {
        // 加载刷新频率设置
        await timerService.loadRefreshSettings();
        
        // 检查本地存储的开关状态
        const isSwitchOn = timerService.loadSwitchState();
        
        // 如果开关是打开的，启动定时更新服务
        if (isSwitchOn) {
            timerService.start();
        }
        
        // 监听页面关闭事件，停止定时器
        window.addEventListener('beforeunload', () => {
            timerService.stop();
        });
        
        // 添加更新监听器，用于更新UI
        timerService.addUpdateListener((data) => {
            console.log("定时更新完成:", data);
            // 可以在这里处理更新后的UI反馈
            
            // 如果当前在系统分组中，更新分组信息
            const currentGroup = stateManager.getCurrentGroup();
            if (currentGroup === "直播中" || currentGroup === "未开播") {
                RoomOperations.updateRoomGroupsIfNeeded();
            }
        });
    }
    
    // 切换定时更新开关
    static toggleAutoUpdate() {
        const isRunning = timerService.toggle();
        
        // 更新UI状态
        const toggleBtn = document.getElementById('autoUpdateToggle');
        if (toggleBtn) {
            // 保持统一样式，只更新图标和文本
            if (isRunning) {
                toggleBtn.innerHTML = '<i class="bi bi-pause-circle me-2"></i><span>停止自动更新</span>';
            } else {
                toggleBtn.innerHTML = '<i class="bi bi-play-circle me-2"></i><span>启动自动更新</span>';
            }
            // 保持dropdown-item样式不变
            toggleBtn.className = 'dropdown-item d-flex align-items-center';
        }
        
        // 显示状态提示
        const statusText = document.getElementById('autoUpdateStatus');
        if (statusText) {
            statusText.textContent = isRunning ? '自动更新已启动' : '自动更新已停止';
            statusText.className = isRunning ? 'text-success' : 'text-muted';
        }
        
        // 显示提示框
        this.showToast(isRunning ? '自动更新已启动' : '自动更新已停止', isRunning ? 'success' : 'info');
    }
    
    // 手动触发更新
    static async manualUpdate() {
        const updateBtn = document.getElementById('manualUpdateBtn');
        const refreshIndicator = document.getElementById('refreshIndicator');
        if (updateBtn) {
            updateBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 更新中...';
            updateBtn.disabled = true;
        }
        // 显示刷新指示器
        if (refreshIndicator) {
            refreshIndicator.classList.remove('d-none');
        }
        
        try {
            // 显示开始更新提示
            this.showToast('开始手动更新直播间信息...', 'info');
            
            // 检查RoomOperations是否已定义
            if (typeof RoomOperations !== 'undefined' && typeof RoomOperations.updateRoomsInBackground === 'function') {
                await RoomOperations.updateRoomsInBackground();
            } else {
                // 如果RoomOperations未定义，使用timerService作为后备方案
                if (typeof timerService !== 'undefined' && typeof timerService.updateAllRooms === 'function') {
                    await timerService.updateAllRooms();
                } else {
                    throw new Error('更新服务未定义');
                }
            }
            
            // 显示更新成功提示
            this.showToast('直播间信息更新完成', 'success');
        } catch (error) {
            console.error('手动更新失败:', error);
            
            // 显示更新失败提示
            this.showToast(`更新失败: ${error.message}`, 'danger');
        } finally {
            if (updateBtn) {
                updateBtn.innerHTML = '<i class="bi bi-arrow-clockwise me-2"></i><span>立即手动更新</span>';
                updateBtn.disabled = false;
            }
            // 隐藏刷新指示器
            if (refreshIndicator) {
                refreshIndicator.classList.add('d-none');
            }
        }
    }
}

// 将Utils类添加到全局作用域
window.Utils = Utils;