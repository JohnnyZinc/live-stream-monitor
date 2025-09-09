// 分组管理模块
class GroupManager {
    // 加载分组数据
    static async loadGroups() {
        try {
            const response = await APIManager.getGroups();
            if (response.success) {
                stateManager.setGroups(response.groups);
                GroupUI.updateGroupMenu();
            }
        } catch (error) {
            console.error('加载分组失败:', error);
        }
    }
    
    // 选择分组
    static selectGroup(groupName) {
        stateManager.setCurrentGroup(groupName);
        // 触发页面更新
        const currentGroupRooms = stateManager.getCurrentGroupRooms();
        roomRenderer.renderRooms(currentGroupRooms);
    }
    
    // 创建新分组
    static async createNewGroup() {
        const groupNameInput = document.getElementById('newGroupName');
        const groupName = groupNameInput.value.trim();
        
        if (!groupName) {
            // 使用Toast通知替换alert
            Utils.showToast(i18n.t('modals.createGroup.emptyName'), 'danger');
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
                    GroupUI.showGroupAssignmentModal(roomUrl);
                }
            } else {
                // 使用Toast通知替换alert
                Utils.showToast(response.error || i18n.t('modals.createGroup.createFailed'), 'danger');
            }
        } catch (error) {
            // 使用Toast通知替换alert
            Utils.showToast(i18n.t('modals.createGroup.createFailed') + ': ' + error.message, 'danger');
        }
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
            Utils.showToast(i18n.t('modals.groupAssignment.saveFailed') + ': ' + error.message, 'danger');
        }
    }
    
    // 显示创建分组模态框（委托给GroupUI）
    static showCreateGroupModal() {
        GroupUI.showCreateGroupModal();
    }
    
    // 显示分组设置模态框（委托给GroupUI）
    static showGroupAssignmentModal(roomUrl) {
        GroupUI.showGroupAssignmentModal(roomUrl);
    }
    
    // 从分组设置界面显示创建分组模态框（委托给GroupUI）
    static showCreateGroupModalFromAssignment() {
        GroupUI.showCreateGroupModalFromAssignment();
    }
    
    // 更新分组菜单（委托给GroupUI）
    static updateGroupMenu() {
        GroupUI.updateGroupMenu();
    }
}

// 将GroupManager类添加到全局作用域
window.GroupManager = GroupManager;