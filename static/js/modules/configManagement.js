// 配置管理模块
class ConfigManagement {
    static currentAdminConfig = {};
    
    // 加载配置数据
    static async loadConfig() {
        try {
            const response = await APIManager.adminGetUsers();
            if (response.success) {
                this.currentAdminConfig = response.admin_config || {};
                return response.admin_config;
            }
        } catch (error) {
            console.error('加载配置数据失败:', error);
            // 使用Toast通知替换alert
            Utils.showToast('加载配置数据失败', 'danger');
        }
        return {};
    }
    
    // 显示管理员模态框
    static showAdminModal() {
        // 加载用户列表和配置
        this.loadAdminData();
        
        const modal = new bootstrap.Modal(document.getElementById('adminModal'));
        modal.show();
    }
    
    // 加载管理员数据
    static async loadAdminData() {
        try {
            const response = await APIManager.adminGetUsers();
            if (response.success) {
                UserManagement.currentUsers = response.users || [];
                this.currentAdminConfig = response.admin_config || {};
                
                // 更新UI
                this.updateAdminUI();
            }
        } catch (error) {
            console.error('加载管理员数据失败:', error);
            // 使用Toast通知替换alert
            Utils.showToast('加载管理员数据失败', 'danger');
        }
    }
    
    // 更新管理员UI
    static updateAdminUI() {
        // 更新注册控制开关
        const registrationSwitch = document.getElementById('allowRegistrationSwitch');
        if (registrationSwitch) {
            registrationSwitch.checked = this.currentAdminConfig.allow_registration || false;
        }
        
        // 更新用户列表
        UserManagement.updateUserListUI(UserManagement.currentUsers, document.getElementById('currentUsername')?.textContent || '');
    }
    
    // 保存管理员配置
    static async saveAdminConfig() {
        const allowRegistration = document.getElementById('allowRegistrationSwitch')?.checked || false;
        
        try {
            const response = await APIManager.adminUpdateConfig(allowRegistration);
            if (response.success) {
                // 使用Toast通知替换alert
                Utils.showToast('配置保存成功');
            }
        } catch (error) {
            // 使用Toast通知替换alert
            Utils.showToast('保存配置失败: ' + error.message, 'danger');
        }
    }
}

// 将ConfigManagement类添加到全局作用域
window.ConfigManagement = ConfigManagement;