// 设置和配置模块
class SettingsManager {
    // 显示用户信息模态框
    static showUserInfoModal() {
        // 获取当前用户名
        const username = document.getElementById('currentUsername').textContent;
        document.getElementById('userInfoUsername').value = username;
        
        // 设置默认头像
        const avatarElement = document.getElementById('userInfoAvatar');
        avatarElement.src = CONFIG.IMAGES.defaultAvatar;
        avatarElement.onerror = function() {
            this.src = CONFIG.IMAGES.defaultAvatar;
        };
        
        // 清空密码字段
        document.getElementById('userInfoNewPassword').value = '';
        document.getElementById('userInfoConfirmPassword').value = '';
        
        // 保存触发元素的引用，以便在模态框关闭后返回焦点
        const triggerElement = document.activeElement;
        
        const modalElement = document.getElementById('userInfoModal');
        const modal = new bootstrap.Modal(modalElement);
        
        // 在模态框隐藏后将焦点返回到触发元素
        modalElement.addEventListener('hidden.bs.modal', function () {
            if (triggerElement && typeof triggerElement.focus === 'function') {
                setTimeout(() => {
                    triggerElement.focus();
                }, 0);
            }
        }, { once: true });
        
        modal.show();
    }
    
    // 更换用户头像
    static changeUserAvatar() {
        // 这里可以实现头像上传功能
        alert('头像更换功能开发中...');
    }
    
    // 保存用户信息
    static async saveUserInfo() {
        const newPassword = document.getElementById('userInfoNewPassword').value;
        const confirmPassword = document.getElementById('userInfoConfirmPassword').value;
        
        // 验证密码
        if (newPassword && newPassword.length < 6) {
            alert('密码长度至少为6位');
            return;
        }
        
        if (newPassword && newPassword !== confirmPassword) {
            alert('两次输入的密码不一致');
            return;
        }
        
        try {
            if (newPassword) {
                // 调用API修改密码
                const response = await APIManager.updatePassword(newPassword);
                if (!response.success) {
                    throw new Error(response.error || '密码修改失败');
                }
            }
            
            // 关闭模态框
            const modal = bootstrap.Modal.getInstance(document.getElementById('userInfoModal'));
            modal.hide();
            
            // 显示保存成功提示
            const toast = document.createElement('div');
            toast.className = 'toast success';
            toast.style.cssText = `
                position: fixed;
                top: 70px;
                right: 20px;
                z-index: 9999;
                pointer-events: none;
                animation: slideIn 0.3s ease-in-out;
            `;
            toast.innerHTML = `
                <div class="alert alert-success mb-0" role="alert">
                    ${newPassword ? '密码修改成功' : '用户信息已保存'}
                </div>
            `;
            
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        } catch (error) {
            // 显示保存失败提示
            const toast = document.createElement('div');
            toast.className = 'toast error';
            toast.style.cssText = `
                position: fixed;
                top: 70px;
                right: 20px;
                z-index: 9999;
                pointer-events: none;
                animation: slideIn 0.3s ease-in-out;
            `;
            toast.innerHTML = `
                <div class="alert alert-danger mb-0" role="alert">
                    保存失败: ${error.message}
                </div>
            `;
            
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        }
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
                alert('刷新频率必须是正整数');
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
            const toast = document.createElement('div');
            toast.className = 'toast success';
            toast.style.cssText = `
                position: fixed;
                top: 70px;
                right: 20px;
                z-index: 9999;
                pointer-events: none;
                animation: slideIn 0.3s ease-in-out;
            `;
            toast.innerHTML = `
                <div class="alert alert-success mb-0" role="alert">
                    设置已保存
                </div>
            `;
            
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        } catch (error) {
            // 显示保存失败提示
            const toast = document.createElement('div');
            toast.className = 'toast error';
            toast.style.cssText = `
                position: fixed;
                top: 70px;
                right: 20px;
                z-index: 9999;
                pointer-events: none;
                animation: slideIn 0.3s ease-in-out;
            `;
            toast.innerHTML = `
                <div class="alert alert-danger mb-0" role="alert">
                    保存失败: ${error.message}
                </div>
            `;
            
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        }
    }
    
    // 显示API设置模态框（保留原函数以兼容现有功能）
    static showApiSettingsModal() {
        // 从本地存储加载API地址
        const savedApiUrl = localStorage.getItem('douyin_api_url') || '';
        document.getElementById('douyinApiUrl').value = savedApiUrl;
        
        const modal = new bootstrap.Modal(document.getElementById('apiSettingsModal'));
        modal.show();
    }
    
    // 保存API设置
    static async saveApiSettings() {
        const apiUrl = document.getElementById('douyinApiUrl').value.trim();
        
        try {
            // 保存到服务器
            const response = await APIManager.saveDouyinConfig(apiUrl);
            if (!response.success) {
                throw new Error(response.error || '保存失败');
            }
            
            // 保存到本地存储
            if (apiUrl) {
                localStorage.setItem('douyin_api_url', apiUrl);
            } else {
                localStorage.removeItem('douyin_api_url');
            }
            
            // 关闭模态框
            const modal = bootstrap.Modal.getInstance(document.getElementById('apiSettingsModal'));
            modal.hide();
            
            // 显示保存成功提示
            const toast = document.createElement('div');
            toast.className = 'toast success';
            toast.style.cssText = `
                position: fixed;
                top: 70px;
                right: 20px;
                z-index: 9999;
                pointer-events: none;
                animation: slideIn 0.3s ease-in-out;
            `;
            toast.innerHTML = `
                <div class="alert alert-success mb-0" role="alert">
                    API设置已保存
                </div>
            `;
            
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        } catch (error) {
            // 显示保存失败提示
            const toast = document.createElement('div');
            toast.className = 'toast error';
            toast.style.cssText = `
                position: fixed;
                top: 70px;
                right: 20px;
                z-index: 9999;
                pointer-events: none;
                animation: slideIn 0.3s ease-in-out;
            `;
            toast.innerHTML = `
                <div class="alert alert-danger mb-0" role="alert">
                    保存失败: ${error.message}
                </div>
            `;
            
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        }
    }
    
    // 显示刷新频率设置模态框
    static async showRefreshSettingsModal() {
        try {
            // 从服务器加载当前设置
            const response = await APIManager.getRefreshSettings();
            if (response.success) {
                document.getElementById('refreshInterval').value = response.settings.refresh_interval;
            } else {
                console.warn("加载刷新频率设置失败:", response.error);
                // 使用默认值10分钟
                document.getElementById('refreshInterval').value = 10;
            }
        } catch (error) {
            console.warn("加载刷新频率设置出错:", error);
            // 使用默认值10分钟
            document.getElementById('refreshInterval').value = 10;
        }
        
        const modal = new bootstrap.Modal(document.getElementById('refreshSettingsModal'));
        modal.show();
    }
    
    // 保存刷新频率设置
    static async saveRefreshSettings() {
        const intervalInput = document.getElementById('refreshInterval');
        const intervalValue = intervalInput.value.trim();
        
        // 输入验证
        if (!intervalValue) {
            alert('请输入刷新频率');
            return;
        }
        
        const interval = parseInt(intervalValue);
        if (isNaN(interval) || interval <= 0) {
            alert('刷新频率必须是正整数');
            return;
        }
        
        try {
            // 保存到服务器
            const response = await APIManager.saveRefreshSettings(interval);
            if (!response.success) {
                throw new Error(response.error || '保存失败');
            }
            
            // 更新定时服务中的刷新频率
            await timerService.setRefreshInterval(interval);
            
            // 关闭模态框
            const modal = bootstrap.Modal.getInstance(document.getElementById('refreshSettingsModal'));
            modal.hide();
            
            // 显示保存成功提示
            const toast = document.createElement('div');
            toast.className = 'toast success';
            toast.style.cssText = `
                position: fixed;
                top: 70px;
                right: 20px;
                z-index: 9999;
                pointer-events: none;
                animation: slideIn 0.3s ease-in-out;
            `;
            toast.innerHTML = `
                <div class="alert alert-success mb-0" role="alert">
                    刷新频率已设置为 ${interval} 分钟
                </div>
            `;
            
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        } catch (error) {
            // 显示保存失败提示
            const toast = document.createElement('div');
            toast.className = 'toast error';
            toast.style.cssText = `
                position: fixed;
                top: 70px;
                right: 20px;
                z-index: 9999;
                pointer-events: none;
                animation: slideIn 0.3s ease-in-out;
            `;
            toast.innerHTML = `
                <div class="alert alert-danger mb-0" role="alert">
                    保存失败: ${error.message}
                </div>
            `;
            
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        }
    }
}

// 将SettingsManager类添加到全局作用域
window.SettingsManager = SettingsManager;