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
        
        // 定义系统分组的显示顺序和对应的翻译键
        const systemGroups = [
            { name: "全部关注", key: "modals.groups.all" },
            { name: "特别关注", key: "modals.groups.special" },
            { name: "直播中", key: "modals.groups.live" },
            { name: "未开播", key: "modals.groups.offline" }
        ];
        
        // 先添加指定顺序的系统分组
        systemGroups.forEach(group => {
            if (groups[group.name]) {
                const displayName = i18n.t(group.key);
                const li = document.createElement('li');
                li.innerHTML = `<a class="dropdown-item ${currentGroup === group.name ? 'active' : ''}" 
                                  href="#" onclick="GroupManager.selectGroup('${group.name}')">${displayName}</a>`;
                groupMenu.appendChild(li);
            }
        });
        
        // 再添加其他自定义分组
        Object.keys(groups).forEach(groupName => {
            // 跳过已添加的系统分组
            const isSystemGroup = systemGroups.some(group => group.name === groupName);
            if (!isSystemGroup) {
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
        createLi.innerHTML = '<a class="dropdown-item" href="#" onclick="GroupManager.showCreateGroupModal()"><i class="bi bi-plus-circle"></i> ' + i18n.t('modals.addRoom.title') + '</a>';
        groupMenu.appendChild(createLi);
        
        // 更新当前分组显示
        const groupKeyMap = {
            "全部关注": "modals.groups.all",
            "直播中": "modals.groups.live",
            "未开播": "modals.groups.offline",
            "特别关注": "modals.groups.special"
        };
        const translationKey = groupKeyMap[currentGroup] || "navigation.home";
        document.getElementById('currentGroupName').textContent = i18n.t(translationKey);
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
        const systemGroups = [
            { name: "特别关注", key: "modals.groups.special" }
        ];
        
        // 先添加指定顺序的系统分组
        systemGroups.forEach(group => {
            if (groups[group.name] && (groups[group.name].type === 'system' || group.name === '特别关注')) {
                const isChecked = groups[group.name].rooms.includes(roomUrl);
                const displayName = i18n.t(group.key);
                checkboxesHtml += `
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" 
                               id="group_${group.name}" 
                               value="${group.name}" 
                               ${isChecked ? 'checked' : ''}>
                        <label class="form-check-label" for="group_${group.name}">
                            ${displayName}
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