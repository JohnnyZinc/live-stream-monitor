// 用户信息管理模块
class UserProfileManager {
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
        // 使用Toast通知替换alert
        Utils.showToast('头像更换功能开发中...', 'info');
    }
    
    // 保存用户信息
    static async saveUserInfo() {
        const newPassword = document.getElementById('userInfoNewPassword').value;
        const confirmPassword = document.getElementById('userInfoConfirmPassword').value;
        
        // 验证密码
        if (newPassword && newPassword.length < 6) {
            // 使用Toast通知替换alert
            Utils.showToast('密码长度至少为6位', 'danger');
            return;
        }
        
        if (newPassword && newPassword !== confirmPassword) {
            // 使用Toast通知替换alert
            Utils.showToast('两次输入的密码不一致', 'danger');
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
            Utils.showToast(newPassword ? '密码修改成功' : '用户信息已保存', 'success');
        } catch (error) {
            // 显示保存失败提示
            Utils.showToast(`保存失败: ${error.message}`, 'danger');
        }
    }
}

// 将UserProfileManager类添加到全局作用域
window.UserProfileManager = UserProfileManager;