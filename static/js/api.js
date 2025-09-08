// API管理模块
class APIManager {
    static async fetchWithErrorHandling(url, options = {}) {
        try {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                throw new Error(`HTTP错误 ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            if (error.name === 'TypeError') {
                console.error('网络错误:', error);
                throw new Error('网络连接失败，请检查网络后重试');
            }
            throw error;
        }
    }
    
    static async getRooms() {
        return await this.fetchWithErrorHandling(CONFIG.API_ENDPOINTS.getRooms);
    }
    
    static async getRoomInfo(roomUrl, useCache = false) {
        const url = `${CONFIG.API_ENDPOINTS.getRoomInfo}?url=${encodeURIComponent(roomUrl)}&use_cache=${useCache}`;
        return await this.fetchWithErrorHandling(url);
    }
    
    static async addRoom(roomUrl) {
        return await this.fetchWithErrorHandling(CONFIG.API_ENDPOINTS.addRoom, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ room_url: roomUrl })
        });
    }
    
    static async removeRoom(roomUrl) {
        return await this.fetchWithErrorHandling(CONFIG.API_ENDPOINTS.removeRoom, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ room_url: roomUrl })
        });
    }
    
    static async loadCachedRooms() {
        try {
            const response = await this.fetchWithErrorHandling(CONFIG.API_ENDPOINTS.loadCachedRooms);
            return response;
        } catch (error) {
            console.log('服务端缓存加载失败:', error);
            return { success: false, rooms: [] };
        }
    }
    
    static async getGroups() {
        return await this.fetchWithErrorHandling(CONFIG.API_ENDPOINTS.getGroups);
    }
    
    static async createGroup(groupName) {
        return await this.fetchWithErrorHandling(CONFIG.API_ENDPOINTS.createGroup, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: groupName })
        });
    }
    
    static async updateGroup(groupName, roomUrl, action) {
        return await this.fetchWithErrorHandling(CONFIG.API_ENDPOINTS.updateGroup, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                group_name: groupName, 
                room_url: roomUrl, 
                action: action 
            })
        });
    }
    
    static async deleteGroup(groupName) {
        return await this.fetchWithErrorHandling(CONFIG.API_ENDPOINTS.deleteGroup, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: groupName })
        });
    }
    
    static async updateRoomGroups(rooms) {
        return await this.fetchWithErrorHandling(CONFIG.API_ENDPOINTS.updateRoomGroups, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ rooms: rooms })
        });
    }
    
    static async batchUpdateRooms() {
        return await this.fetchWithErrorHandling('/batch_update_rooms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
    }
    
    static async incrementalUpdateRoom(roomUrl) {
        return await this.fetchWithErrorHandling('/incremental_update_room', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ room_url: roomUrl })
        });
    }
    
    static async incrementalUpdateAll() {
        return await this.fetchWithErrorHandling('/incremental_update_all', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
    }
    
    static async getDouyinConfig() {
        return await this.fetchWithErrorHandling('/get_douyin_config');
    }
    
    static async saveDouyinConfig(apiUrl) {
        return await this.fetchWithErrorHandling('/save_douyin_config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ api_url: apiUrl })
        });
    }
}