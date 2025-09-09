// 设置和配置模块
class SettingsManager {
    // 显示用户信息模态框
    static showUserInfoModal() {
        UserProfileManager.showUserInfoModal();
    }
    
    // 更换用户头像
    static changeUserAvatar() {
        UserProfileManager.changeUserAvatar();
    }
    
    // 保存用户信息
    static async saveUserInfo() {
        UserProfileManager.saveUserInfo();
    }
    
    // 显示设置模态框
    static showSettingsModal() {
        // 从本地存储加载API地址
        const savedApiUrl = localStorage.getItem('douyin_api_url') || '';
        document.getElementById('settingsDouyinApiUrl').value = savedApiUrl;
        
        // 从服务器加载刷新频率设置
        this.loadRefreshSettingsForModal();
        
        const modal = new bootstrap.Modal(document.getElementById('settingsModal'));
        modal.show();
    }
    
    // 加载刷新频率设置用于模态框
    static async loadRefreshSettingsForModal() {
        try {
            const response = await APIManager.getRefreshSettings();
            if (response.success) {
                document.getElementById('settingsRefreshInterval').value = response.settings.refresh_interval;
            } else {
                console.warn("加载刷新频率设置失败:", response.error);
                // 使用默认值10分钟
                document.getElementById('settingsRefreshInterval').value = 10;
            }
        } catch (error) {
            console.warn("加载刷新频率设置出错:", error);
            // 使用默认值10分钟
            document.getElementById('settingsRefreshInterval').value = 10;
        }
    }
    
    // 保存设置
    static async saveSettings() {
        const apiUrl = document.getElementById('settingsDouyinApiUrl').value.trim();
        const intervalInput = document.getElementById('settingsRefreshInterval');
        const intervalValue = intervalInput.value.trim();
        
        // 验证刷新频率
        let interval = null;
        if (intervalValue) {
            interval = parseInt(intervalValue);
            if (isNaN(interval) || interval <= 0) {
                // 使用Toast通知替换alert
                Utils.showToast('刷新频率必须是正整数', 'danger');
                return;
            }
        }
        
        try {
            // 保存API设置
            if (apiUrl) {
                const apiResponse = await APIManager.saveDouyinConfig(apiUrl);
                if (!apiResponse.success) {
                    throw new Error(apiResponse.error || 'API设置保存失败');
                }
                localStorage.setItem('douyin_api_url', apiUrl);
            } else {
                localStorage.removeItem('douyin_api_url');
            }
            
            // 保存刷新频率设置
            if (interval) {
                const refreshResponse = await APIManager.saveRefreshSettings(interval);
                if (!refreshResponse.success) {
                    throw new Error(refreshResponse.error || '刷新频率设置保存失败');
                }
                await timerService.setRefreshInterval(interval);
            }
            
            // 关闭模态框
            const modal = bootstrap.Modal.getInstance(document.getElementById('settingsModal'));
            modal.hide();
            
            // 显示保存成功提示
            Utils.showToast('设置已保存', 'success');
        } catch (error) {
            // 显示保存失败提示
            Utils.showToast(`保存失败: ${error.message}`, 'danger');
        }
    }
    
    // 显示API设置模态框（保留原函数以兼容现有功能）
    static showApiSettingsModal() {
        ApiSettingsManager.showApiSettingsModal();
    }
    
    // 保存API设置
    static async saveApiSettings() {
        ApiSettingsManager.saveApiSettings();
    }
    
    // 显示刷新频率设置模态框
    static async showRefreshSettingsModal() {
        RefreshSettingsManager.showRefreshSettingsModal();
    }
    
    // 保存刷新频率设置
    static async saveRefreshSettings() {
        RefreshSettingsManager.saveRefreshSettings();
    }
}

// 将SettingsManager类添加到全局作用域
window.SettingsManager = SettingsManager;