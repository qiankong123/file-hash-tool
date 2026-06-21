/**
 * UI 工具函数
 */

/**
 * 格式化文件大小
 * @param {number} bytes - 文件字节数
 * @returns {string} 格式化后的大小字符串
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 复制文本到剪贴板
 * @param {string} text - 要复制的文本
 */
function copyToClipboard(text) {
    if (!text) return;
    
    navigator.clipboard.writeText(text)
        .then(() => {
            showToast('哈希值已复制到剪贴板', 'success');
        })
        .catch(err => {
            console.error('复制失败:', err);
            showToast('复制失败，请手动复制', 'error');
        });
}

/**
 * 显示提示框
 * @param {string} message - 提示信息
 * @param {string} type - success/error/info/warning
 */
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastIcon = document.getElementById('toast-icon');
    const toastMessage = document.getElementById('toast-message');
    
    // 清除之前的定时器
    if (toast.timer) clearTimeout(toast.timer);
    
    // 设置图标和样式
    let iconClass = '';
    let bgClass = '';
    
    switch (type) {
        case 'success':
            iconClass = 'fa-check-circle text-success';
            bgClass = 'bg-success text-white';
            break;
        case 'error':
            iconClass = 'fa-times-circle text-danger';
            bgClass = 'bg-danger text-white';
            break;
        case 'warning':
            iconClass = 'fa-exclamation-circle text-warning';
            bgClass = 'bg-warning text-white';
            break;
        default:
            iconClass = 'fa-info-circle text-primary';
            bgClass = 'bg-primary text-white';
    }
    
    // 更新内容
    toastIcon.className = iconClass;
    toastMessage.textContent = message;
    
    // 显示提示
    toast.className = `fixed bottom-6 right-6 p-4 rounded-lg shadow-xl transform translate-y-0 opacity-100 transition-all duration-300 z-50 flex items-center max-w-xs ${bgClass}`;
    
    // 3秒后隐藏
    toast.timer = setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 300);
    }, 3000);
}

/**
 * 阻止默认拖放行为
 */
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

/**
 * 高亮拖放区域
 */
function highlight(dropArea) {
    dropArea.classList.add('border-primary', 'bg-primary/10');
}

/**
 * 取消高亮拖放区域
 */
function unhighlight(dropArea) {
    dropArea.classList.remove('border-primary', 'bg-primary/10');
}

/**
 * 初始化标签切换
 */
function initTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // 移除所有激活状态
            tabs.forEach(t => t.classList.remove('active', 'border-primary', 'text-primary'));
            tabContents.forEach(content => content.classList.add('hidden'));
            
            // 设置当前标签为激活状态
            tab.classList.add('active', 'border-primary', 'text-primary');
            
            // 显示对应内容
            const target = document.querySelector(tab.dataset.tabsTarget);
            target.classList.remove('hidden');
            target.classList.add('active');
        });
    });
}

/**
 * 初始化算法选择器
 */
function initAlgorithmSelector() {
    const algorithmButtons = document.querySelectorAll('.algorithm-btn');
    
    algorithmButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // 移除所有激活状态
            algorithmButtons.forEach(b => b.classList.remove('active', 'bg-primary', 'text-white'));
            algorithmButtons.forEach(b => b.classList.add('bg-gray-200', 'text-gray-700'));
            
            // 设置当前算法为激活状态
            btn.classList.add('active', 'bg-primary', 'text-white');
            btn.classList.remove('bg-gray-200', 'text-gray-700');
            
            // 更新当前算法
            const algorithm = btn.dataset.algorithm;
            hashCalculator.setAlgorithm(algorithm);
            
            // 更新界面上的算法名称
            updateAlgorithmDisplayNames(algorithm);
            
            // 如果已有哈希值，提示需要重新计算
            const file1Hash = document.getElementById('file1-hash').textContent;
            const file2Hash = document.getElementById('file2-hash').textContent;
            if (file1Hash || file2Hash) {
                showToast(`已切换到${hashCalculator.getAlgorithmDisplayName()}算法，请重新上传文件计算`, 'warning');
            }
        });
    });
}

/**
 * 更新界面上显示的算法名称
 */
function updateAlgorithmDisplayNames(algorithm) {
    const displayName = hashCalculator.getAlgorithmDisplayName(algorithm);
    
    document.getElementById('file1-algorithm-name').textContent = displayName;
    document.getElementById('file2-algorithm-name').textContent = displayName;
    document.getElementById('list-algorithm-name').textContent = displayName;
    document.getElementById('history-algorithm-name').textContent = displayName;
}