// 状态管理模块
class StateManager {
    constructor() {
        this.rooms = [];
        this.cachedRooms = [];
        this.groups = {
            "全部关注": { type: "system", rooms: [] },
            "直播中": { type: "system", rooms: [] },
            "未开播": { type: "system", rooms: [] },
            "特别关注": { type: "system", rooms: [] }
        };
        this.currentGroup = "全部关注";
        this.listeners = [];
    }
    
    // 添加状态变化监听器
    addListener(callback) {
        this.listeners.push(callback);
    }
    
    // 通知状态变化
    notifyListeners() {
        this.listeners.forEach(callback => callback(this.rooms));
    }
    
    // 设置房间数据
    setRooms(rooms) {
        this.rooms = rooms;
        this.notifyListeners();
    }
    
    // 添加房间
    addRoom(room) {
        this.rooms.push(room);
        this.notifyListeners();
    }
    
    // 移除房间
    removeRoom(url) {
        this.rooms = this.rooms.filter(room => room.url !== url);
        this.notifyListeners();
    }
    
    // 更新单个房间数据
    updateRoom(updatedRoom) {
        const index = this.rooms.findIndex(room => room.url === updatedRoom.url);
        if (index !== -1) {
            this.rooms[index] = updatedRoom;
        } else {
            this.rooms.push(updatedRoom);
        }
        this.notifyListeners();
    }
    
    
    // 获取房间数据
    getRooms() {
        return this.rooms;
    }
    
    
    // 获取分组信息
    getGroups() {
        return this.groups;
    }
    
    // 设置分组信息
    setGroups(groups) {
        this.groups = groups;
        this.notifyListeners();
    }
    
    // 获取当前分组
    getCurrentGroup() {
        return this.currentGroup;
    }
    
    // 设置当前分组
    setCurrentGroup(groupName) {
        this.currentGroup = groupName;
        this.notifyListeners();
    }
    
    // 获取当前分组的房间
    getCurrentGroupRooms() {
        if (this.currentGroup === "全部关注") {
            return this.rooms;
        }
        
        const group = this.groups[this.currentGroup];
        if (!group) return [];
        
        // 根据分组类型返回不同的房间列表
        if (this.currentGroup === "直播中") {
            return this.rooms.filter(room => room.is_live);
        } else if (this.currentGroup === "未开播") {
            return this.rooms.filter(room => !room.is_live);
        } else {
            // 自定义分组和特别关注分组
            return this.rooms.filter(room => group.rooms.includes(room.url));
        }
    }
}

// 创建全局状态管理实例
const stateManager = new StateManager();