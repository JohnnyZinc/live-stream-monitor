// 分组管理模块
class GroupManager {
    // 加载分组数据
    static async loadGroups() {
        try {
            const response = await APIManager.getGroups();
            if (response.success) {
                stateManager.setGroups(response.groups);
                this.updateGroupMenu();
            }
        } catch (error) {
            console.error('加载分组失败:', error);
        }
    }
    
    // 更新分组菜单
    static updateGroupMenu() {
        const groupMenu = document.getElementById('groupMenu');
        const groups = stateManager.getGroups();
        const currentGroup = stateManager.getCurrentGroup();
        
        if (!groupMenu) return;
        
        // 清空现有菜单项
        groupMenu.innerHTML = '';
        
        // 定义系统分组的显示顺序
        const systemGroupOrder = ["全部关注", "特别关注", "直播中", "未开播"];
        
        // 先添加指定顺序的系统分组
        systemGroupOrder.forEach(groupName => {
            if (groups[groupName]) {
                const li = document.createElement('li');
                li.innerHTML = `<a class="dropdown-item ${currentGroup === groupName ? 'active' : ''}" 
                                  href="#" onclick="GroupManager.selectGroup('${groupName}')">${groupName}</a>`;
                groupMenu.appendChild(li);
            }
        });
        
        // 再添加其他自定义分组
        Object.keys(groups).forEach(groupName => {
            // 跳过已添加的系统分组
            if (!systemGroupOrder.includes(groupName)) {
                const li = document.createElement('li');
                li.innerHTML = `<a class="dropdown-item ${currentGroup === groupName ? 'active' : ''}" 
                                  href="#" onclick="GroupManager.selectGroup('${groupName}')">${groupName}</a>`;
                groupMenu.appendChild(li);
            }
        });
        
        // 添加分隔线
        const divider = document.createElement('li');
        divider.innerHTML = '<hr class="dropdown-divider">';
        groupMenu.appendChild(divider);
        
        // 添加创建新分组选项
        const createLi = document.createElement('li');
        createLi.innerHTML = '<a class="dropdown-item" href="#" onclick="GroupManager.showCreateGroupModal()"><i class="bi bi-plus-circle"></i> 创建新分组</a>';
        groupMenu.appendChild(createLi);
        
        // 更新当前分组显示
        document.getElementById('currentGroupName').textContent = currentGroup;
    }
    
    // 选择分组
    static selectGroup(groupName) {
        stateManager.setCurrentGroup(groupName);
        // 触发页面更新
        const currentGroupRooms = stateManager.getCurrentGroupRooms();
        roomRenderer.renderRooms(currentGroupRooms);
    }
    
    // 显示创建分组模态框
    static showCreateGroupModal() {
        const modal = new bootstrap.Modal(document.getElementById('createGroupModal'));
        modal.show();
    }
    
    // 创建新分组
    static async createNewGroup() {
        const groupNameInput = document.getElementById('newGroupName');
        const groupName = groupNameInput.value.trim();
        
        if (!groupName) {
            // 使用Toast通知替换alert
            Utils.showToast('请输入分组名称', 'danger');
            return;
        }
        
        try {
            const response = await APIManager.createGroup(groupName);
            if (response.success) {
                stateManager.setGroups(response.groups);
                const modal = bootstrap.Modal.getInstance(document.getElementById('createGroupModal'));
                modal.hide();
                groupNameInput.value = '';
                
                // 如果是从分组设置界面创建的，需要更新分组复选框
                if (document.getElementById('groupAssignmentModal').classList.contains('show')) {
                    const roomUrl = document.getElementById('groupAssignmentRoomUrl').value;
                    this.showGroupAssignmentModal(roomUrl);
                }
            } else {
                // 使用Toast通知替换alert
                Utils.showToast(response.error || '创建分组失败', 'danger');
            }
        } catch (error) {
            // 使用Toast通知替换alert
            Utils.showToast('创建分组失败: ' + error.message, 'danger');
        }
    }
    
    // 显示分组设置模态框
    static showGroupAssignmentModal(roomUrl) {
        document.getElementById('groupAssignmentRoomUrl').value = roomUrl;
        
        const groups = stateManager.getGroups();
        const groupCheckboxes = document.getElementById('groupCheckboxes');
        
        // 生成分组复选框（排除系统分组）
        let checkboxesHtml = '';
        
        // 定义系统分组的显示顺序（在设置分组中只显示特别关注）
        const systemGroupOrder = ["特别关注"];
        
        // 先添加指定顺序的系统分组
        systemGroupOrder.forEach(groupName => {
            if (groups[groupName] && (groups[groupName].type === 'system' || groupName === '特别关注')) {
                const isChecked = groups[groupName].rooms.includes(roomUrl);
                checkboxesHtml += `
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" 
                               id="group_${groupName}" 
                               value="${groupName}" 
                               ${isChecked ? 'checked' : ''}>
                        <label class="form-check-label" for="group_${groupName}">
                            ${groupName}
                        </label>
                    </div>
                `;
            }
        });
        
        // 再添加其他自定义分组
        Object.keys(groups).forEach(groupName => {
            // 只显示自定义分组（跳过系统分组和已添加的特别关注）
            if (groups[groupName].type === 'custom') {
                const isChecked = groups[groupName].rooms.includes(roomUrl);
                checkboxesHtml += `
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" 
                               id="group_${groupName}" 
                               value="${groupName}" 
                               ${isChecked ? 'checked' : ''}>
                        <label class="form-check-label" for="group_${groupName}">
                            ${groupName}
                        </label>
                    </div>
                `;
            }
        });
        
        groupCheckboxes.innerHTML = checkboxesHtml;
        
        const modal = new bootstrap.Modal(document.getElementById('groupAssignmentModal'));
        modal.show();
    }
    
    // 从分组设置界面显示创建分组模态框
    static showCreateGroupModalFromAssignment() {
        const groupModal = bootstrap.Modal.getInstance(document.getElementById('groupAssignmentModal'));
        groupModal.hide();
        
        setTimeout(() => {
            this.showCreateGroupModal();
        }, 300);
    }
    
    // 保存分组设置
    static async saveGroupAssignment() {
        const roomUrl = document.getElementById('groupAssignmentRoomUrl').value;
        const groups = stateManager.getGroups();
        const checkboxes = document.querySelectorAll('#groupCheckboxes input[type="checkbox"]');
        
        try {
            // 收集需要更新的分组
            const updates = [];
            
            checkboxes.forEach(checkbox => {
                const groupName = checkbox.value;
                const isChecked = checkbox.checked;
                const isCurrentlyInGroup = groups[groupName].rooms.includes(roomUrl);
                
                // 如果状态发生变化，需要更新
                if (isChecked !== isCurrentlyInGroup) {
                    updates.push({
                        groupName: groupName,
                        action: isChecked ? 'add' : 'remove'
                    });
                }
            });
            
            // 依次执行更新操作
            for (const update of updates) {
                const response = await APIManager.updateGroup(update.groupName, roomUrl, update.action);
                if (!response.success) {
                    throw new Error(response.error || '更新分组失败');
                }
                // 更新本地状态
                if (update.action === 'add') {
                    if (!groups[update.groupName].rooms.includes(roomUrl)) {
                        groups[update.groupName].rooms.push(roomUrl);
                    }
                } else {
                    const index = groups[update.groupName].rooms.indexOf(roomUrl);
                    if (index > -1) {
                        groups[update.groupName].rooms.splice(index, 1);
                    }
                }
            }
            
            // 更新状态管理器
            stateManager.setGroups(groups);
            
            // 关闭模态框
            const modal = bootstrap.Modal.getInstance(document.getElementById('groupAssignmentModal'));
            modal.hide();
            
        } catch (error) {
            // 使用Toast通知替换alert
            Utils.showToast('保存分组设置失败: ' + error.message, 'danger');
        }
    }
}

// 将GroupManager类添加到全局作用域
window.GroupManager = GroupManager;