// 用户管理模块
class UserManagement {
    static currentUsers = [];
    
    // 加载用户数据
    static async loadUsers() {
        try {
            const response = await APIManager.adminGetUsers();
            if (response.success) {
                this.currentUsers = response.users;
                return response.users;
            }
        } catch (error) {
            console.error('加载用户数据失败:', error);
            // 使用Toast通知替换alert
            Utils.showToast('加载用户数据失败', 'danger');
        }
        return [];
    }
    
    // 显示创建用户模态框
    static showCreateUserModal() {
        // 关闭管理员模态框
        const adminModal = bootstrap.Modal.getInstance(document.getElementById('adminModal'));
        if (adminModal) {
            adminModal.hide();
        }
        
        // 清空表单
        document.getElementById('newUsername').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('newConfirmPassword').value = '';
        document.getElementById('newUserIsAdmin').checked = false;
        
        // 显示创建用户模态框
        setTimeout(() => {
            const modal = new bootstrap.Modal(document.getElementById('createUserModal'));
            modal.show();
        }, 300);
    }
    
    // 创建新用户
    static async createNewUser() {
        const username = document.getElementById('newUsername').value.trim();
        const password = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('newConfirmPassword').value;
        const isAdmin = document.getElementById('newUserIsAdmin').checked;
        
        if (!username || !password || !confirmPassword) {
            // 使用Toast通知替换alert
            Utils.showToast('请填写所有必填项', 'danger');
            return;
        }
        
        if (password.length < 6) {
            // 使用Toast通知替换alert
            Utils.showToast('密码长度至少为6位', 'danger');
            return;
        }
        
        if (password !== confirmPassword) {
            // 使用Toast通知替换alert
            Utils.showToast('两次输入的密码不一致', 'danger');
            return;
        }
        
        try {
            const response = await APIManager.adminCreateUser(username, password, isAdmin);
            if (response.success) {
                // 使用Toast通知替换alert
                Utils.showToast('用户创建成功');
                bootstrap.Modal.getInstance(document.getElementById('createUserModal')).hide();
                
                // 重新加载管理员数据
                if (typeof AdminManager !== 'undefined') {
                    await AdminManager.loadAdminData();
                }
            }
        } catch (error) {
            // 使用Toast通知替换alert
            Utils.showToast('创建用户失败: ' + error.message, 'danger');
        }
    }
    
    // 编辑用户
    static editUser(username) {
        // 查找用户信息
        const user = this.currentUsers.find(u => u.username === username);
        if (!user) return;
        
        // 填充编辑表单
        document.getElementById('editUsername').value = username;
        document.getElementById('editPassword').value = '';
        document.getElementById('editIsAdmin').checked = user.is_admin;
        
        // 关闭管理员模态框
        const adminModal = bootstrap.Modal.getInstance(document.getElementById('adminModal'));
        if (adminModal) {
            adminModal.hide();
        }
        
        // 显示编辑用户模态框
        setTimeout(() => {
            const modal = new bootstrap.Modal(document.getElementById('editUserModal'));
            modal.show();
        }, 300);
    }
    
    // 保存用户权限
    static async saveUserPermissions() {
        const username = document.getElementById('editUsername').value;
        const newPassword = document.getElementById('editPassword').value;
        const isAdmin = document.getElementById('editIsAdmin').checked;
        
        if (!username) {
            // 使用Toast通知替换alert
            Utils.showToast('用户名不能为空', 'danger');
            return;
        }
        
        if (newPassword && newPassword.length < 6) {
            // 使用Toast通知替换alert
            Utils.showToast('密码长度至少为6位', 'danger');
            return;
        }
        
        try {
            // 调用API更新用户信息
            const response = await APIManager.adminUpdateUser(username, newPassword, isAdmin);
            
            // 关闭模态框
            bootstrap.Modal.getInstance(document.getElementById('editUserModal')).hide();
            
            // 使用Toast通知替换alert
            Utils.showToast('用户权限更新成功');
            
            // 重新加载管理员数据
            if (typeof AdminManager !== 'undefined') {
                await AdminManager.loadAdminData();
            }
        } catch (error) {
            // 使用Toast通知替换alert
            Utils.showToast('更新用户权限失败: ' + error.message, 'danger');
        }
    }
    
    // 删除用户
    static deleteUser(username) {
        // 使用自定义确认模态框替换原生confirm
        if (typeof AuthManager !== 'undefined') {
            AuthManager.showConfirmModal(`确定要删除用户 "${username}" 吗？`, () => {
                APIManager.adminDeleteUser(username).then(() => {
                    // 使用Toast通知替换alert
                    Utils.showToast('用户删除成功');
                    if (typeof AdminManager !== 'undefined') {
                        AdminManager.loadAdminData();
                    }
                }).catch(error => {
                    // 使用Toast通知替换alert
                    Utils.showToast('删除用户失败: ' + error.message, 'danger');
                });
            });
        } else {
            // Fallback到原生confirm
            if (!confirm(`确定要删除用户 "${username}" 吗？`)) {
                return;
            }
            
            APIManager.adminDeleteUser(username).then(() => {
                // 使用Toast通知替换alert
                Utils.showToast('用户删除成功');
                if (typeof AdminManager !== 'undefined') {
                    AdminManager.loadAdminData();
                }
            }).catch(error => {
                // 使用Toast通知替换alert
                Utils.showToast('删除用户失败: ' + error.message, 'danger');
            });
        }
    }
    
    // 更新用户列表UI
    static updateUserListUI(users, currentUsername) {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        users.forEach(user => {
            const row = document.createElement('tr');
            
            const usernameCell = document.createElement('td');
            usernameCell.textContent = user.username;
            
            const roleCell = document.createElement('td');
            const roleBadge = document.createElement('span');
            roleBadge.className = `badge ${user.is_admin ? 'bg-danger' : 'bg-secondary'} ms-2`;
            roleBadge.textContent = user.is_admin ? '管理员' : '普通用户';
            roleCell.appendChild(roleBadge);
            
            const createdCell = document.createElement('td');
            const createdDate = new Date(user.created_at * 1000);
            createdCell.textContent = createdDate.toLocaleDateString();
            
            const actionsCell = document.createElement('td');
            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-sm btn-outline-primary me-1';
            editBtn.innerHTML = '<i class="bi bi-pencil"></i>';
            editBtn.onclick = () => this.editUser(user.username);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-sm btn-outline-danger me-1';
            deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
            deleteBtn.onclick = () => this.deleteUser(user.username);
            
            // 不能删除当前用户或超级管理员
            if (user.username === currentUsername || user.username === 'admin') {
                deleteBtn.disabled = true;
                deleteBtn.title = user.username === 'admin' ? '不能删除超级管理员' : '不能删除当前用户';
            }
            
            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(deleteBtn);
            
            row.appendChild(usernameCell);
            row.appendChild(roleCell);
            row.appendChild(createdCell);
            row.appendChild(actionsCell);
            
            tbody.appendChild(row);
        });
    }
}

// 将UserManagement类添加到全局作用域
window.UserManagement = UserManagement;