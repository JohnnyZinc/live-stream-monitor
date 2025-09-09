// 用户认证模块
class AuthManager {
    // 初始化用户认证
    static initUserAuth() {
        // 页面加载时检查用户认证状态
        this.checkUserAuthStatus();
    }
    
    // 检查用户认证状态
    static async checkUserAuthStatus() {
        try {
            const response = await APIManager.checkAuthStatus();
            if (response.authenticated) {
                // User is logged in, display username and admin menu
                this.updateUserUI(response.user_id, response.is_admin);
                // Set current user in config
                CONFIG.CURRENT_USER = response.user_id;
            } else {
                // User is not logged in, redirect to login page
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('Check auth status failed:', error);
            // If failed, also redirect to login page
            window.location.href = '/login';
        }
    }
    
    // 更新用户UI
    static updateUserUI(username, isAdmin) {
        // Update username display in dropdown menu
        document.getElementById('currentUsername').textContent = username;
        
        // If admin, display admin menu item
        if (isAdmin) {
            document.getElementById('adminMenuItem').style.display = 'block';
        }
    }
    
    // 退出登录
    static logout() {
        // 使用自定义确认模态框替换原生confirm
        this.showConfirmModal('确定要退出登录吗？', () => {
            APIManager.logout().then(response => {
                // 清除本地缓存
                localStorage.removeItem(CONFIG.CACHE_KEY);
                localStorage.removeItem(CONFIG.CACHE_TIMESTAMP);
                
                // 无论后端是否成功，都重定向到登录页面
                window.location.href = '/login';
            }).catch(error => {
                console.error('退出登录失败:', error);
                // 即使前端请求失败，也清除本地缓存并重定向到登录页面
                localStorage.removeItem(CONFIG.CACHE_KEY);
                localStorage.removeItem(CONFIG.CACHE_TIMESTAMP);
                window.location.href = '/login';
            });
        });
    }
    
    // 显示自定义确认模态框
    static showConfirmModal(message, onConfirm) {
        const modal = new bootstrap.Modal(document.getElementById('confirmModal'));
        const messageElement = document.getElementById('confirmMessage');
        const confirmButton = document.getElementById('confirmOkButton');
        
        // 设置确认消息
        messageElement.textContent = message;
        
        // 清除之前可能绑定的事件监听器
        const newConfirmButton = confirmButton.cloneNode(true);
        confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);
        
        // 绑定确认按钮事件
        newConfirmButton.addEventListener('click', () => {
            modal.hide();
            if (onConfirm) onConfirm();
        });
        
        // 显示模态框
        modal.show();
    }
}

// 将AuthManager类添加到全局作用域
window.AuthManager = AuthManager;