// 房间管理模块
class RoomManager {
    constructor(stateManager, roomRenderer) {
        this.stateManager = stateManager;
        this.roomRenderer = roomRenderer;
    }
    
    // 加载房间数据
    async loadRooms() {
        try {
            const urls = await APIManager.getRooms();
            
            if (urls.length === 0) {
                this.roomRenderer.renderRooms([]);
                return;
            }
            
            // 先尝试从服务端缓存加载
            try {
                const cacheData = await APIManager.loadCachedRooms();
                
                if (cacheData.success && cacheData.rooms.length > 0) {
                    console.log("使用服务端缓存数据", cacheData.rooms.length, "个直播间");
                    this.stateManager.setRooms(cacheData.rooms);
                    this.roomRenderer.renderRooms(cacheData.rooms);
                }
            } catch (error) {
                console.log("缓存加载失败，使用实时数据");
            }
            
        } catch (error) {
            console.error("加载失败:", error);
            Utils.showToast("加载失败，请重试", "danger");
        }
    }
    
        
    
    
    
    // 添加房间
    async addRoom(roomUrl) {
        if (!roomUrl || !roomUrl.includes('://')) {
            alert('请输入完整的直播间URL地址');
            return;
        }
        
        try {
            const finalUrl = roomUrl;
            const data = await APIManager.addRoom(finalUrl);
            
            if (data.success) {
                const urls = data.urls;
                
                // 获取新添加房间的信息
                if (urls.length > this.stateManager.getRooms().length) {
                    const newUrl = urls[urls.length - 1];
                    await this.loadRoomInfo(newUrl);
                }
                
                const modal = bootstrap.Modal.getInstance(document.getElementById('addModal'));
                modal.hide();
                document.getElementById('modalRoomUrl').value = '';
            } else {
                alert(data.error);
            }
            
        } catch (error) {
            alert('添加失败: ' + error.message);
        }
    }
    
    // 加载单个房间信息
    async loadRoomInfo(roomUrl) {
        try {
            const data = await APIManager.getRoomInfo(roomUrl);
            
            if (data.success) {
                this.stateManager.addRoom(data);
            }
        } catch (error) {
            console.error('获取直播间信息失败:', error);
        }
    }
    
    // 删除房间
    async deleteRoom(urlToRemove) {
        try {
            const data = await APIManager.removeRoom(urlToRemove);
            
            if (data.success) {
                this.stateManager.removeRoom(urlToRemove);
                Utils.showToast('已取消关注', 'success');
            }
        } catch (error) {
            alert('删除失败: ' + error.message);
        }
    }
}