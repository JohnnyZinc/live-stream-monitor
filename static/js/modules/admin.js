// 管理员功能模块 (简化版，作为协调器)
class AdminManager {
    // 显示管理员模态框
    static showAdminModal() {
        ConfigManagement.showAdminModal();
    }
    
    // 加载管理员数据
    static async loadAdminData() {
        await ConfigManagement.loadAdminData();
    }
    
    // 更新管理员UI
    static updateAdminUI() {
        ConfigManagement.updateAdminUI();
    }
    
    // 显示创建用户模态框
    static showCreateUserModal() {
        UserManagement.showCreateUserModal();
    }
    
    // 创建新用户
    static async createNewUser() {
        UserManagement.createNewUser();
    }
    
    // 编辑用户
    static editUser(username) {
        UserManagement.editUser(username);
    }
    
    // 保存用户权限
    static async saveUserPermissions() {
        UserManagement.saveUserPermissions();
    }
    
    // 删除用户
    static deleteUser(username) {
        UserManagement.deleteUser(username);
    }
    
    // 保存管理员配置
    static async saveAdminConfig() {
        ConfigManagement.saveAdminConfig();
    }
}

// 将AdminManager类添加到全局作用域
window.AdminManager = AdminManager;