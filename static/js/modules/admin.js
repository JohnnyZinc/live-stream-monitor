// 管理员功能模块
class AdminManager {
    static currentUsers = [];
    static currentAdminConfig = {};
    
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
                this.currentUsers = response.users;
                this.currentAdminConfig = response.admin_config;
                
                // 更新UI
                this.updateAdminUI();
            }
        } catch (error) {
            console.error('加载管理员数据失败:', error);
            alert('加载管理员数据失败');
        }
    }
    
    // 更新管理员UI
    static updateAdminUI() {
        // 更新注册控制开关
        const registrationSwitch = document.getElementById('allowRegistrationSwitch');
        registrationSwitch.checked = this.currentAdminConfig.allow_registration || false;
        
        // 更新用户列表
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = '';
        
        this.currentUsers.forEach(user => {
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
            if (user.username === document.getElementById('currentUsername').textContent || 
                user.username === 'admin') {
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
    
    // 显示创建用户模态框
    static showCreateUserModal() {
        // 关闭管理员模态框
        const adminModal = bootstrap.Modal.getInstance(document.getElementById('adminModal'));
        adminModal.hide();
        
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
            alert('请填写所有必填项');
            return;
        }
        
        if (password.length < 6) {
            alert('密码长度至少为6位');
            return;
        }
        
        if (password !== confirmPassword) {
            alert('两次输入的密码不一致');
            return;
        }
        
        try {
            const response = await APIManager.adminCreateUser(username, password, isAdmin);
            if (response.success) {
                alert('用户创建成功');
                bootstrap.Modal.getInstance(document.getElementById('createUserModal')).hide();
                
                // 重新加载管理员数据
                this.loadAdminData();
            }
        } catch (error) {
            alert('创建用户失败: ' + error.message);
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
        adminModal.hide();
        
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
            alert('用户名不能为空');
            return;
        }
        
        if (newPassword && newPassword.length < 6) {
            alert('密码长度至少为6位');
            return;
        }
        
        try {
            // 调用API更新用户信息
            const response = await APIManager.adminUpdateUser(username, newPassword, isAdmin);
            
            // 关闭模态框
            bootstrap.Modal.getInstance(document.getElementById('editUserModal')).hide();
            
            alert('用户权限更新成功');
            
            // 重新加载管理员数据
            this.loadAdminData();
        } catch (error) {
            alert('更新用户权限失败: ' + error.message);
        }
    }
    
    // 删除用户
    static deleteUser(username) {
        if (!confirm(`确定要删除用户 "${username}" 吗？`)) {
            return;
        }
        
        APIManager.adminDeleteUser(username).then(() => {
            alert('用户删除成功');
            this.loadAdminData();
        }).catch(error => {
            alert('删除用户失败: ' + error.message);
        });
    }
    
    // 保存管理员配置
    static async saveAdminConfig() {
        const allowRegistration = document.getElementById('allowRegistrationSwitch').checked;
        
        try {
            const response = await APIManager.adminUpdateConfig(allowRegistration);
            if (response.success) {
                alert('配置保存成功');
            }
        } catch (error) {
            alert('保存配置失败: ' + error.message);
        }
    }
}

// 将AdminManager类添加到全局作用域
window.AdminManager = AdminManager;