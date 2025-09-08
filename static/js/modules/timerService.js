// 定时更新服务模块
class TimerService {
    constructor() {
        this.timerId = null;
        this.isRunning = false;
        this.updateInterval = 600000; // 默认600秒(10分钟)更新一次
        this.lastUpdateTime = 0;
        this.updateListeners = [];
    }

    // 从后端加载刷新设置
    async loadRefreshSettings() {
        try {
            const response = await APIManager.getRefreshSettings();
            if (response.success) {
                // 将分钟转换为毫秒
                this.updateInterval = response.settings.refresh_interval * 60 * 1000;
                console.log("已加载刷新频率设置:", response.settings.refresh_interval, "分钟");
                
                // 如果服务正在运行，重新启动以应用新的间隔
                if (this.isRunning) {
                    this.start();
                }
            } else {
                console.warn("加载刷新频率设置失败:", response.error);
            }
        } catch (error) {
            console.warn("加载刷新频率设置出错:", error);
        }
    }

    // 添加更新监听器
    addUpdateListener(callback) {
        this.updateListeners.push(callback);
    }

    // 通知更新
    notifyUpdate(data) {
        this.updateListeners.forEach(callback => callback(data));
    }

    // 启动定时更新服务
    start() {
        // 如果已经在运行，则先停止
        if (this.isRunning) {
            this.stop();
        }

        // 设置定时器
        this.timerId = setInterval(() => {
            this.updateAllRooms();
        }, this.updateInterval);

        this.isRunning = true;
        this.lastUpdateTime = Date.now();
        
        // 保存开关状态到本地存储
        this.saveSwitchState(true);
        
        console.log("定时更新服务已启动，间隔:", this.updateInterval, "ms");
    }

    // 停止定时更新服务
    stop() {
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
        this.isRunning = false;
        
        // 保存开关状态到本地存储
        this.saveSwitchState(false);
        
        console.log("定时更新服务已停止");
    }

    // 切换定时更新服务状态
    toggle() {
        if (this.isRunning) {
            this.stop();
        } else {
            this.start();
        }
        return this.isRunning;
    }

    // 检查开关状态
    isSwitchOn() {
        return this.isRunning;
    }

    // 保存开关状态到本地存储
    saveSwitchState(isOn) {
        try {
            localStorage.setItem('autoUpdateSwitch', JSON.stringify({
                isOn: isOn,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.warn('保存开关状态失败:', e);
        }
    }

    // 从本地存储加载开关状态
    loadSwitchState() {
        try {
            const state = localStorage.getItem('autoUpdateSwitch');
            if (state) {
                const parsed = JSON.parse(state);
                // 检查状态是否过期（例如超过1小时）
                if (Date.now() - parsed.timestamp < 3600000) {
                    return parsed.isOn;
                }
            }
        } catch (e) {
            console.warn('加载开关状态失败:', e);
        }
        return false; // 默认关闭
    }

    // 更新所有房间信息
    async updateAllRooms() {
        // 显示刷新指示器
        const refreshIndicator = document.getElementById('refreshIndicator');
        if (refreshIndicator) {
            refreshIndicator.classList.remove('d-none');
        }
        
        try {
            console.log("开始后台增量更新直播间信息...");
            
            // 首先获取需要更新的房间列表
            const response = await APIManager.incrementalUpdateAll();
            if (!response.success) {
                console.error("获取房间列表失败:", response.error);
                return;
            }
            
            const roomsToUpdate = response.rooms_to_update;
            console.log("需要更新", roomsToUpdate.length, "个直播间");
            
            // 逐个更新房间信息
            let updatedCount = 0;
            let changedCount = 0;
            const changedRooms = [];
            
            for (const roomUrl of roomsToUpdate) {
                try {
                    const updateResponse = await APIManager.incrementalUpdateRoom(roomUrl);
                    if (updateResponse.success) {
                        updatedCount++;
                        
                        // 更新状态管理器中的数据
                        stateManager.updateRoom(updateResponse.room_data);
                        
                        // 更新UI显示
                        roomRenderer.updateRoomCard(updateResponse.room_data);
                        
                        // 如果有变化，收集变化的房间
                        if (updateResponse.has_changes) {
                            changedCount++;
                            changedRooms.push(updateResponse.room_data);
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
            
            // 通知更新监听器
            this.notifyUpdate({
                total: updatedCount,
                changed: changedCount,
                changedRooms: changedRooms
            });
            
            // 更新完成后保存缓存
            CacheManager.saveToCache(stateManager.getRooms());
            
            this.lastUpdateTime = Date.now();
            
        } catch (error) {
            console.error("后台更新出错:", error);
        } finally {
            // 隐藏刷新指示器
            if (refreshIndicator) {
                refreshIndicator.classList.add('d-none');
            }
        }
    }

    // 设置更新间隔（分钟）
    async setRefreshInterval(minutes) {
        // 验证输入
        if (!Number.isInteger(minutes) || minutes <= 0) {
            throw new Error("刷新频率必须是正整数");
        }
        
        this.updateInterval = minutes * 60 * 1000; // 转换为毫秒
        
        // 保存到后端
        try {
            const response = await APIManager.saveRefreshSettings(minutes);
            if (!response.success) {
                throw new Error(response.error || "保存设置失败");
            }
        } catch (error) {
            console.error("保存刷新频率设置失败:", error);
            throw error;
        }
        
        // 如果正在运行，重新启动以应用新的间隔
        if (this.isRunning) {
            this.start();
        }
    }

    // 获取上次更新时间
    getLastUpdateTime() {
        return this.lastUpdateTime;
    }

    // 获取运行状态
    getStatus() {
        return {
            isRunning: this.isRunning,
            interval: this.updateInterval,
            lastUpdate: this.lastUpdateTime
        };
    }
}

// 创建全局定时服务实例
const timerService = new TimerService();