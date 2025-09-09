// 房间操作模块
class RoomOperations {
    // 显示直播间选项对话框
    static showRoomOptionsDialog(roomUrl, anchorName) {
        document.getElementById('roomOptionsUrl').value = roomUrl;
        document.getElementById('roomOptionsAnchorName').value = anchorName;
        
        // 获取房间信息并设置模态框标题、头像和封面
        const rooms = stateManager.getRooms();
        const room = rooms.find(r => r.url === roomUrl);
        
        const titleElement = document.getElementById('roomOptionsTitle');
        const avatarElement = document.getElementById('roomOptionsAvatar');
        const coverElement = document.getElementById('roomOptionsCover');
        
        if (room) {
            titleElement.textContent = anchorName;  // 移除"的直播间"后缀
            avatarElement.src = room.avatar || CONFIG.IMAGES.defaultAvatar;
            avatarElement.onerror = function() {
                this.src = CONFIG.IMAGES.defaultAvatar;
                this.style.filter = 'grayscale(100%)';
            };
            
            // 设置封面
            if (coverElement) {
                coverElement.src = room.cover || CONFIG.IMAGES.defaultCover;
                coverElement.onerror = function() {
                    this.src = CONFIG.IMAGES.defaultCover;
                    this.style.filter = 'grayscale(100%)';
                };
            }
        } else {
            titleElement.textContent = anchorName;  // 移除"的直播间"后缀
            avatarElement.src = CONFIG.IMAGES.defaultAvatar;
            if (coverElement) {
                coverElement.src = CONFIG.IMAGES.defaultCover;
            }
        }
        
        const modal = new bootstrap.Modal(document.getElementById('roomOptionsModal'));
        modal.show();
    }
    
    // 从选项对话框打开分组设置
    static openGroupAssignmentFromOptions() {
        const roomUrl = document.getElementById('roomOptionsUrl').value;
        
        // 关闭当前对话框
        const modal = bootstrap.Modal.getInstance(document.getElementById('roomOptionsModal'));
        modal.hide();
        
        // 延迟显示分组设置对话框
        setTimeout(() => {
            GroupManager.showGroupAssignmentModal(roomUrl);
        }, 300);
    }
    
    // 从选项对话框删除房间
    static deleteRoomFromOptions() {
        const roomUrl = document.getElementById('roomOptionsUrl').value;
        const anchorName = document.getElementById('roomOptionsAnchorName').value;
        
        // 关闭当前对话框
        const modal = bootstrap.Modal.getInstance(document.getElementById('roomOptionsModal'));
        modal.hide();
        
        // 确认删除
        setTimeout(() => {
            // 使用自定义确认模态框替换原生confirm
            if (typeof AuthManager !== 'undefined') {
                AuthManager.showConfirmModal(i18n.t('modals.confirm.removeRoom', { anchorName: anchorName }), () => {
                    roomManager.deleteRoom(roomUrl);
                });
            } else {
                // Fallback到原生confirm
                if (confirm(i18n.t('modals.confirm.removeRoom', { anchorName: anchorName }))) {
                    roomManager.deleteRoom(roomUrl);
                }
            }
        }, 300);
    }
    
    // 确认删除房间
    static confirmDeleteRoom(roomUrl, anchorName) {
        // 使用自定义确认模态框替换原生confirm
        if (typeof AuthManager !== 'undefined') {
            AuthManager.showConfirmModal(i18n.t('modals.confirm.removeRoom', { anchorName: anchorName }), () => {
                roomManager.deleteRoom(roomUrl);
            });
        } else {
            // Fallback到原生confirm
            if (confirm(i18n.t('modals.confirm.removeRoom', { anchorName: anchorName }))) {
                roomManager.deleteRoom(roomUrl);
            }
        }
    }
    
    // 后台更新房间信息（混合模式）
    static async updateRoomsInBackground() {
        // 显示刷新指示器
        const refreshIndicator = document.getElementById('refreshIndicator');
        if (refreshIndicator) {
            refreshIndicator.classList.remove('d-none');
        }
        
        try {
            console.log("开始后台增量更新直播间信息...");
            
            // 首先获取需要更新的房间列表
            const response = await APIManager.incrementalUpdateAll();
            if (!response) {
                console.error("获取房间列表失败: 响应为空");
                return;
            }
            
            if (!response.success) {
                console.error("获取房间列表失败:", response.error);
                return;
            }
            
            // 检查是否没有需要更新的直播间
            if (response.message && response.message.includes('没有需要更新的直播间')) {
                console.log("没有需要更新的直播间");
                return;
            }
            
            const roomsToUpdate = response.rooms_to_update || [];
            if (!Array.isArray(roomsToUpdate)) {
                console.error("rooms_to_update 数据格式错误:", roomsToUpdate);
                return;
            }
            console.log("需要更新", roomsToUpdate.length, "个直播间");
            
            // 逐个更新房间信息
            let updatedCount = 0;
            let changedCount = 0;
            
            for (const roomUrl of roomsToUpdate) {
                try {
                    const updateResponse = await APIManager.incrementalUpdateRoom(roomUrl);
                    if (updateResponse.success) {
                        updatedCount++;
                        
                        // 更新状态管理器中的数据
                        stateManager.updateRoom(updateResponse.room_data);
                        
                        // 更新UI显示
                        roomRenderer.updateRoomCard(updateResponse.room_data);
                        
                        // 如果有变化，更新分组信息
                        if (updateResponse.has_changes) {
                            changedCount++;
                            // 更新分组信息
                            await this.updateRoomGroupsIfNeeded(updateResponse.room_data);
                        }
                        
                        console.log("已更新直播间:", updateResponse.room_data.anchor);
                    }
                } catch (error) {
                    console.error("更新直播间失败:", roomUrl, error);
                }
                
                // 添加小延迟避免请求过于频繁
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            console.log(`后台更新完成，共更新${updatedCount}个直播间，${changedCount}个有变化`);
            
            // 更新完成后保存缓存
            CacheManager.saveToCache(stateManager.getRooms());
            
        } catch (error) {
            console.error("后台更新出错:", error);
        } finally {
            // 隐藏刷新指示器
            if (refreshIndicator) {
                refreshIndicator.classList.add('d-none');
            }
        }
    }
    
    // 更新房间分组信息（如果需要）
    static async updateRoomGroupsIfNeeded(roomData) {
        try {
            // 获取当前分组
            const currentGroup = stateManager.getCurrentGroup();
            
            // 如果当前在"直播中"或"未开播"分组，需要更新分组信息
            if (currentGroup === "直播中" || currentGroup === "未开播") {
                const response = await APIManager.updateRoomGroups(stateManager.getRooms());
                if (response.success) {
                    stateManager.setGroups(response.groups);
                }
            }
        } catch (error) {
            console.error("更新分组信息失败:", error);
        }
    }
}

// 将RoomOperations类添加到全局作用域
window.RoomOperations = RoomOperations;