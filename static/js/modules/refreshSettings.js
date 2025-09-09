// 刷新频率设置模块
class RefreshSettingsManager {
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
            // 使用Toast通知替换alert
            Utils.showToast('请输入刷新频率', 'danger');
            return;
        }
        
        const interval = parseInt(intervalValue);
        if (isNaN(interval) || interval <= 0) {
            // 使用Toast通知替换alert
            Utils.showToast('刷新频率必须是正整数', 'danger');
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
            Utils.showToast(`刷新频率已设置为 ${interval} 分钟`, 'success');
        } catch (error) {
            // 显示保存失败提示
            Utils.showToast(`保存失败: ${error.message}`, 'danger');
        }
    }
}

// 将RefreshSettingsManager类添加到全局作用域
window.RefreshSettingsManager = RefreshSettingsManager;