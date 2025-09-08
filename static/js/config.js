// 配置常量
const CONFIG = {
    // 缓存配置
    CACHE_KEY: 'live_rooms_cache',
    CACHE_TIMESTAMP: 'live_rooms_timestamp',
    CACHE_DURATION: 2 * 60 * 1000, // 2分钟缓存
    
    // API端点
    API_ENDPOINTS: {
        getRooms: '/get_rooms',
        addRoom: '/add_room',
        removeRoom: '/remove_room',
        getRoomInfo: '/get_room_info',
        loadCachedRooms: '/load_cached_rooms',
        getGroups: '/get_groups',
        updateGroup: '/update_group',
        createGroup: '/create_group',
        deleteGroup: '/delete_group',
        updateRoomGroups: '/update_room_groups',
        incrementalUpdateAll: 'http://127.0.0.1:5000/incremental_update_all',
        // 用户认证
        login: '/login',
        register: '/register',
        logout: '/logout',
        getCurrentUser: '/get_current_user',
        checkAuthStatus: '/check_auth_status',
        checkRegistrationAllowed: '/check_registration_allowed',
        // 管理员功能
        adminGetUsers: '/admin/users',
        adminCreateUser: '/admin/users',
        adminUpdateUser: '/admin/users',
        adminDeleteUser: '/admin/users',
        adminUpdateConfig: '/admin/config'
    },
    
    // 图片配置
    IMAGES: {
        defaultCover: '/static/images/default-cover.svg',
        defaultAvatar: '/static/images/default-avatar.svg'
    }
};

// 全局状态管理
let globalState = {
    rooms: [],
    cachedRooms: []
};