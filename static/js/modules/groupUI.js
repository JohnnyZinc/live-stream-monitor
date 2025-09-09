// 分组UI管理模块
class GroupUI {
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
    
    // 显示创建分组模态框
    static showCreateGroupModal() {
        const modal = new bootstrap.Modal(document.getElementById('createGroupModal'));
        modal.show();
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
            GroupManager.showCreateGroupModal();
        }, 300);
    }
}

// 将GroupUI类添加到全局作用域
window.GroupUI = GroupUI;