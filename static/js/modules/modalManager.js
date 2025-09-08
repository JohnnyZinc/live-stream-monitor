// 模态框管理模块
class ModalManager {
    constructor() {
        this.addModal = null;
    }
    
    // 初始化模态框
    init() {
        this.addModal = new bootstrap.Modal(document.getElementById('addModal'));
    }
    
    // 显示添加模态框
    showAddModal() {
        if (!this.addModal) {
            this.init();
        }
        this.addModal.show();
        document.getElementById('modalRoomUrl').value = '';
    }
    
    // 隐藏添加模态框
    hideAddModal() {
        if (this.addModal) {
            this.addModal.hide();
        }
    }
    
    // 绑定回车键事件
    bindEnterKey(roomManager) {
        const roomUrlInput = document.getElementById('modalRoomUrl');
        if (roomUrlInput) {
            roomUrlInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    roomManager.addRoom(this.value.trim());
                }
            });
        }
    }
}