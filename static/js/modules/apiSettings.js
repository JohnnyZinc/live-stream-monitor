// API设置管理模块
class ApiSettingsManager {
    // 显示API设置模态框
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
            Utils.showToast('API设置已保存', 'success');
        } catch (error) {
            // 显示保存失败提示
            Utils.showToast(`保存失败: ${error.message}`, 'danger');
        }
    }
}

// 将ApiSettingsManager类添加到全局作用域
window.ApiSettingsManager = ApiSettingsManager;