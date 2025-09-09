// 房间渲染模块
class RoomRenderer {
    constructor(containerId, emptyStateId) {
        this.container = document.getElementById(containerId);
        this.emptyState = document.getElementById(emptyStateId);
    }
    
    // 渲染房间列表
    renderRooms(rooms) {
        // 当没有房间时，给容器添加empty类以居中空状态
        if (rooms.length === 0) {
            this.container.classList.add('empty');
            // 清空容器内容，只保留空状态元素
            this.container.innerHTML = '';
            this.container.appendChild(this.emptyState);
            // 确保空状态显示并应用翻译
            this.emptyState.style.display = 'block';
            this.applyEmptyStateTranslations();
        } else {
            this.container.classList.remove('empty');
            // 隐藏空状态
            this.emptyState.style.display = 'none';
            
            // 按新的优先级规则排序：
            // 1. 直播状态优先（直播中 > 未开播）
            // 2. 特别关注分组优先（但未开播的特别关注不能在开播的非特别关注之前）
            // 3. 人气值高低（高人气 > 低人气）
            const sortedRooms = [...rooms].sort((a, b) => {
                // 首先按直播状态排序：直播中的房间优先
                if (a.is_live && !b.is_live) return -1;
                if (!a.is_live && b.is_live) return 1;
                
                // 如果直播状态相同，再检查是否是特别关注房间
                const groups = stateManager.getGroups();
                const aIsSpecial = groups["特别关注"] && 
                                  groups["特别关注"].rooms.includes(a.url);
                const bIsSpecial = groups["特别关注"] && 
                                  groups["特别关注"].rooms.includes(b.url);
                
                // 特别关注的房间优先（但仅在相同直播状态下）
                if (aIsSpecial && !bIsSpecial) return -1;
                if (!aIsSpecial && bIsSpecial) return 1;
                
                // 如果直播状态和特别关注分组都相同，按人气值排序
                const aPopularNum = parseInt(a.popular_num) || 0;
                const bPopularNum = parseInt(b.popular_num) || 0;
                
                if (aPopularNum > bPopularNum) return -1;
                if (aPopularNum < bPopularNum) return 1;
                
                // 人气值也相同时，保持原有顺序
                return 0;
            });
            
            // 渲染房间卡片
            this.container.innerHTML = sortedRooms.map(room => this.createRoomCard(room)).join('');
        }
    }
    
    // 应用空状态翻译
    applyEmptyStateTranslations() {
        const emptyStateTitle = document.getElementById('emptyStateTitle');
        const emptyStateDescription = document.getElementById('emptyStateDescription');
        
        if (emptyStateTitle) {
            emptyStateTitle.textContent = i18n.t('rooms.empty');
        }
        
        if (emptyStateDescription) {
            emptyStateDescription.textContent = i18n.t('rooms.emptyDescription');
        }
    }
    
    // 更新单个房间显示
    updateRoomCard(updatedRoom) {
        // 查找对应的房间卡片
        const roomCards = this.container.querySelectorAll('.room-card');
        for (let card of roomCards) {
            // 通过URL查找对应的卡片
            const anchorElement = card.querySelector('a');
            if (anchorElement && anchorElement.href === updatedRoom.url) {
                // 更新整个卡片
                card.outerHTML = this.createRoomCard(updatedRoom);
                break;
            }
        }
    }
    
    // 格式化人气值数字
    formatPopularNum(num) {
        if (num === undefined || num === null || num === '') return '';
        const number = parseInt(num);
        if (isNaN(number)) return '';
        if (number < 10000) return number.toString();
        return (number / 10000).toFixed(1) + '万';
    }

    // 创建房间卡片HTML
    createRoomCard(room) {
        // 检查是否获取失败
        const isFetchFailed = room.anchor === '获取失败' || room.title === '获取失败' || 
                             room.anchor === '抖音用户' || room.title === '抖音直播';
        
        // 获取格式化的人气值
        const popularNum = this.formatPopularNum(room.popular_num);
        
        return `
            <div class="room-card">
                <a href="${room.url}" target="_blank" style="text-decoration: none; color: inherit; display: block;">
                    <div class="cover-container" style="position: relative;">
                        <img src="${room.cover || CONFIG.IMAGES.defaultCover}" 
                             alt="直播间封面" 
                             class="cover-image"
                             referrerpolicy="no-referrer"
                             onerror="this.src='${CONFIG.IMAGES.defaultCover}'; this.style.filter='grayscale(100%)';">
                        ${!room.is_live ? 
                            '<div class="offline-overlay">未开播</div>' : 
                            ''
                        }
                        ${isFetchFailed ? 
                            '<span class="fetch-failed-badge" title="数据获取失败">!</span>' : 
                            ''
                        }
                    </div>
                </a>
                <div class="card-content" onclick="RoomOperations.showRoomOptionsDialog('${room.url}', '${room.anchor || '未知主播'}')">
                    <div class="card-header">
                        <div class="avatar-container">
                            <img src="${room.avatar || CONFIG.IMAGES.defaultAvatar}" 
                                 alt="主播头像" 
                                 class="avatar-left"
                                 referrerpolicy="no-referrer"
                                 onerror="this.src='${CONFIG.IMAGES.defaultAvatar}'; this.style.filter='grayscale(100%)';">
                        </div>
                        <div class="text-content">
                            <div class="anchor-info">
                                <img src="${getPlatformLogo(getPlatformFromUrl(room.url))}" 
                                     alt="${getPlatformName(getPlatformFromUrl(room.url))}" 
                                     class="platform-icon"
                                     title="${getPlatformName(getPlatformFromUrl(room.url))}">
                                <div class="anchor-name" title="${room.anchor || '未知主播'}">${room.anchor || '未知主播'}</div>
                            </div>
                            <div class="room-title" title="${room.title || '未知标题'}">${room.title || '未知标题'}</div>
                        </div>
                        ${popularNum ? 
                            `<div class="popular-num">
                                <i class="bi bi-fire"></i>
                                <span>${popularNum}</span>
                            </div>` : 
                            ''
                        }
                    </div>
                </div>
            </div>
        `;
    }
}