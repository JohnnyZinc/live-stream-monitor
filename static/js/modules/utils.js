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
        
        // 使用预定义的toast模板
        const toastTemplate = document.getElementById('toastTemplate');
        if (!toastTemplate) {
            console.error('Toast template not found');
            return;
        }
        
        // 克隆模板创建新的toast
        const toast = toastTemplate.cloneNode(true);
        toast.id = ''; // 移除id以避免重复
        toast.classList.remove('d-none'); // 显示toast
        
        // 设置消息内容
        const toastBody = toast.querySelector('#toastBody');
        if (toastBody) {
            // 如果消息是翻译键，则进行翻译
            const translatedMessage = typeof message === 'string' && message.startsWith('toasts.') 
                ? i18n.t(message) 
                : message;
            toastBody.textContent = translatedMessage;
        }
        
        // 设置类型样式
        const typeClass = typeClassMap[type] || 'toast-info';
        toast.classList.add(typeClass);
        
        // 添加进入动画类
        toast.classList.add('toast-enter');
        
        // 添加到toast容器的第一个位置，实现新通知在底部的效果
        const toastContainer = document.querySelector('.toast-container');
        if (toastContainer) {
            // 如果容器中有其他toast，添加到第一个位置
            if (toastContainer.firstChild) {
                toastContainer.insertBefore(toast, toastContainer.firstChild);
            } else {
                // 如果容器为空，直接添加
                toastContainer.appendChild(toast);
            }
        } else {
            document.body.appendChild(toast);
        }
        
        // 初始化Bootstrap toast
        const bsToast = new bootstrap.Toast(toast, {
            delay: 3000,
            autohide: true
        });
        
        // 添加悬停事件监听器：鼠标悬停时暂停自动隐藏
        let hideTimeout;
        toast.addEventListener('mouseenter', function () {
            // 暂停自动隐藏
            bsToast._clearTimeout();
            if (hideTimeout) {
                clearTimeout(hideTimeout);
            }
        });
        
        // 添加鼠标离开事件监听器：鼠标离开时恢复自动隐藏
        toast.addEventListener('mouseleave', function () {
            // 恢复自动隐藏
            hideTimeout = setTimeout(function () {
                // 添加退出动画类
                toast.classList.add('toast-exit');
                // 动画结束后隐藏toast
                setTimeout(function () {
                    bsToast.hide();
                }, 300);
            }, 3000);
        });
        
        // 添加点击事件监听器：点击时立即隐藏
        toast.addEventListener('click', function () {
            // 添加退出动画类
            toast.classList.add('toast-exit');
            // 动画结束后隐藏toast
            setTimeout(function () {
                bsToast.hide();
            }, 300);
        });
        
        // 监听隐藏事件，移除元素
        toast.addEventListener('hidden.bs.toast', function () {
            toast.remove();
        });
        
        // 显示toast
        bsToast.show();
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
                toggleBtn.innerHTML = `<i class="bi bi-pause-circle me-2"></i><span>${i18n.t('buttons.stopAutoUpdate')}</span>`;
            } else {
                toggleBtn.innerHTML = `<i class="bi bi-play-circle me-2"></i><span>${i18n.t('buttons.startAutoUpdate')}</span>`;
            }
            // 保持dropdown-item样式不变
            toggleBtn.className = 'dropdown-item d-flex align-items-center';
        }
        
        // 显示状态提示
        const statusText = document.getElementById('autoUpdateStatus');
        if (statusText) {
            statusText.textContent = isRunning ? i18n.t('buttons.startAutoUpdate') : i18n.t('buttons.stopAutoUpdate');
            statusText.className = isRunning ? 'text-success' : 'text-muted';
        }
        
        // 显示提示框
        this.showToast(isRunning ? 'toasts.updateStarted' : 'toasts.updateCompleted', isRunning ? 'success' : 'info');
    }
    
    // 手动触发更新
    static async manualUpdate() {
        const updateBtn = document.getElementById('manualUpdateBtn');
        const refreshIndicator = document.getElementById('refreshIndicator');
        if (updateBtn) {
            updateBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> ${i18n.t('common.loading')}`;
            updateBtn.disabled = true;
        }
        // 显示刷新指示器
        if (refreshIndicator) {
            refreshIndicator.classList.remove('d-none');
        }
        
        try {
            // 显示开始更新提示
            this.showToast('toasts.updateStarted', 'info');
            
            // 检查RoomOperations是否已定义
            if (typeof RoomOperations !== 'undefined' && typeof RoomOperations.updateRoomsInBackground === 'function') {
                await RoomOperations.updateRoomsInBackground();
            } else {
                // 如果RoomOperations未定义，使用timerService作为后备方案
                if (typeof timerService !== 'undefined' && typeof timerService.updateAllRooms === 'function') {
                    await timerService.updateAllRooms();
                } else {
                    throw new Error(i18n.t('common.error'));
                }
            }
            
            // 显示更新成功提示
            this.showToast('toasts.updateCompleted', 'success');
        } catch (error) {
            console.error('手动更新失败:', error);
            
            // 显示更新失败提示
            this.showToast(`更新失败: ${error.message}`, 'danger');
        } finally {
            if (updateBtn) {
                updateBtn.innerHTML = `<i class="bi bi-arrow-clockwise me-2"></i><span>${i18n.t('buttons.manualUpdate')}</span>`;
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