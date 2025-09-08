// 缓存管理模块
class CacheManager {
    static saveToCache(data) {
        try {
            localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify(data));
            localStorage.setItem(CONFIG.CACHE_TIMESTAMP, Date.now().toString());
        } catch (e) {
            console.warn('缓存保存失败:', e);
        }
    }
    
    static loadFromCache() {
        try {
            const cached = localStorage.getItem(CONFIG.CACHE_KEY);
            const timestamp = localStorage.getItem(CONFIG.CACHE_TIMESTAMP);
            
            if (cached && timestamp) {
                const age = Date.now() - parseInt(timestamp);
                if (age < CONFIG.CACHE_DURATION) {
                    return JSON.parse(cached);
                }
            }
        } catch (e) {
            console.log('缓存加载失败', e);
        }
        return null;
    }
    
    static clearCache() {
        try {
            localStorage.removeItem(CONFIG.CACHE_KEY);
            localStorage.removeItem(CONFIG.CACHE_TIMESTAMP);
        } catch (e) {
            console.warn('缓存清除失败:', e);
        }
    }
    
    static isCacheValid() {
        try {
            const timestamp = localStorage.getItem(CONFIG.CACHE_TIMESTAMP);
            if (timestamp) {
                const age = Date.now() - parseInt(timestamp);
                return age < CONFIG.CACHE_DURATION;
            }
        } catch (e) {
            console.warn('缓存验证失败:', e);
        }
        return false;
    }
}