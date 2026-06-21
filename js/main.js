// 全局变量
let fileList = [];
let historyRecords = JSON.parse(localStorage.getItem('hashHistory')) || [];

// DOM 加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化核心功能
    initTabs();
    initAlgorithmSelector();
    initFileUploads();
    initListFunctions();
    initHistory();
    initCopyButtons();
    
    // 初始化清空历史按钮
    document.getElementById('clear-history').addEventListener('click', clearAllHistory);
});

/**
 * 初始化文件上传功能
 */
function initFileUploads() {
    // 文件1上传
    setupFileUpload('file1');
    
    // 文件2上传
    setupFileUpload('file2');
    
    // 列表添加文件
    document.getElementById('add-file').addEventListener('click', () => {
        document.getElementById('list-file-input').click();
    });
    
    document.getElementById('list-file-input').addEventListener('change', function(e) {
        const files = e.target.files;
        if (files.length > 0) {
            processFiles(files);
        }
    });
}

/**
 * 设置文件上传相关事件
 */
function setupFileUpload(fileId) {
    const dropArea = document.getElementById(`${fileId}-drop-area`);
    const fileInput = document.getElementById(`${fileId}-input`);
    const selectButton = document.getElementById(`${fileId}-select`);
    
    // 点击按钮选择文件
    selectButton.addEventListener('click', () => fileInput.click());
    
    // 文件选择事件
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            processSingleFile(file, fileId);
        }
    });
    
    // 拖放事件
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => highlight(dropArea), false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => unhighlight(dropArea), false);
    });
    
    dropArea.addEventListener('drop', function(e) {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        if (file) {
            processSingleFile(file, fileId);
        }
    });
}

/**
 * 处理单个文件
 */
async function processSingleFile(file, fileId) {
    // 显示文件信息区域
    const fileInfo = document.getElementById(`${fileId}-info`);
    fileInfo.classList.remove('hidden');
    
    // 设置文件名和大小
    document.getElementById(`${fileId}-name`).textContent = file.name;
    document.getElementById(`${fileId}-size`).textContent = formatFileSize(file.size);
    
    // 重置进度条
    const progressBar = document.getElementById(`${fileId}-progress`);
    const progressText = document.getElementById(`${fileId}-progress-text`);
    progressBar.style.width = '0%';
    progressText.textContent = '0%';
    
    // 清空哈希值
    document.getElementById(`${fileId}-hash`).textContent = '';
    
    // 计算哈希值
    hashCalculator.calculateFileHash(file, async (hash, progress) => {
        // 更新进度
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `${progress}%`;
        
        // 计算完成
        if (progress === 100 && hash) {
            document.getElementById(`${fileId}-hash`).textContent = hash;
            
            // 添加到历史记录
            addToHistory(file.name, file.size, hash, hashCalculator.currentAlgorithm);
            
            // 检查是否可以对比
            checkComparisonReady();
        }
    });
}

/**
 * 处理多个文件（列表模式）
 */
function processFiles(files) {
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // 检查是否已存在
        const exists = fileList.some(item => item.name === file.name && item.size === file.size);
        if (exists) continue;
        
        const fileItem = {
            id: Date.now() + i,
            name: file.name,
            size: file.size,
            sizeFormatted: formatFileSize(file.size),
            hash: '',
            progress: 0,
            algorithm: hashCalculator.currentAlgorithm
        };
        
        fileList.push(fileItem);
        renderFileList();
        
        // 计算哈希值
        hashCalculator.calculateFileHash(file, (hash, progress) => {
            const index = fileList.findIndex(item => item.id === fileItem.id);
            if (index !== -1) {
                fileList[index].progress = progress;
                if (progress === 100 && hash) {
                    fileList[index].hash = hash;
                    addToHistory(file.name, file.size, hash, hashCalculator.currentAlgorithm);
                }
                renderFileList();
            }
        });
    }
}

/**
 * 检查是否可以对比两个文件的哈希值
 */
function checkComparisonReady() {
    const file1Hash = document.getElementById('file1-hash').textContent;
    const file2Hash = document.getElementById('file2-hash').textContent;
    
    if (file1Hash && file2Hash) {
        const resultSection = document.getElementById('comparison-result');
        const resultContent = document.getElementById('result-content');
        
        resultSection.classList.remove('hidden');
        
        if (file1Hash === file2Hash) {
            // 哈希值相同
            resultContent.className = 'p-6 rounded-lg text-center text-xl font-medium min-h-[100px] flex items-center justify-center result-match';
            resultContent.innerHTML = `
                <div class="flex flex-col items-center">
                    <i class="fa fa-check-circle text-4xl mb-3"></i>
                    <p>两个文件的${hashCalculator.getAlgorithmDisplayName()}值相同</p>
                    <p class="text-sm text-success/80 mt-2">确认是同一个文件</p>
                </div>
            `;
        } else {
            // 哈希值不同
            resultContent.className = 'p-6 rounded-lg text-center text-xl font-medium min-h-[100px] flex items-center justify-center result-mismatch';
            resultContent.innerHTML = `
                <div class="flex flex-col items-center">
                    <i class="fa fa-times-circle text-4xl mb-3"></i>
                    <p>两个文件的${hashCalculator.getAlgorithmDisplayName()}值不同</p>
                    <p class="text-sm text-danger/80 mt-2">不是同一个文件</p>
                </div>
            `;
        }
    }
}

/**
 * 初始化文件列表功能
 */
function initListFunctions() {
    renderFileList();
}

/**
 * 渲染文件列表
 */
function renderFileList() {
    const emptyList = document.getElementById('empty-list');
    const filesList = document.getElementById('files-list');
    const tableBody = document.getElementById('files-table-body');
    
    if (fileList.length === 0) {
        emptyList.classList.remove('hidden');
        filesList.classList.add('hidden');
        return;
    }
    
    emptyList.classList.add('hidden');
    filesList.classList.remove('hidden');
    tableBody.innerHTML = '';
    
    // 添加文件行
    fileList.forEach(file => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td class="px-6 py-4 font-medium text-gray-900 truncate max-w-xs">${file.name}</td>
            <td class="px-6 py-4 text-gray-500">${file.sizeFormatted}</td>
            <td class="px-6 py-4 font-mono text-sm break-all">
                ${file.hash || `
                    <div class="flex items-center">
                        <div class="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                            <div class="bg-primary h-2.5 rounded-full" style="width: ${file.progress}%"></div>
                        </div>
                        <span class="text-xs text-gray-500">${file.progress}%</span>
                    </div>
                `}
            </td>
            <td class="px-6 py-4 text-center">
                ${file.hash ? `
                    <button class="copy-hash text-primary hover:text-primary/80 p-1" data-hash="${file.hash}">
                        <i class="fa fa-copy"></i> 复制
                    </button>
                ` : ''}
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // 绑定复制事件
    document.querySelectorAll('.copy-hash').forEach(btn => {
        btn.addEventListener('click', function() {
            copyToClipboard(this.dataset.hash);
        });
    });
}

/**
 * 添加到历史记录
 */
function addToHistory(filename, size, hash, algorithm) {
    // 检查是否已存在相同记录
    const exists = historyRecords.some(record => 
        record.name === filename && 
        record.size === size && 
        record.hash === hash &&
        record.algorithm === algorithm
    );
    
    if (!exists) {
        const record = {
            id: Date.now(),
            name: filename,
            size: size,
            sizeFormatted: formatFileSize(size),
            hash: hash,
            algorithm: algorithm,
            timestamp: new Date().toLocaleString()
        };
        
        historyRecords.unshift(record);
        
        // 限制历史记录数量
        if (historyRecords.length > 100) {
            historyRecords = historyRecords.slice(0, 100);
        }
        
        // 保存到localStorage
        localStorage.setItem('hashHistory', JSON.stringify(historyRecords));
        
        // 重新渲染历史记录
        renderHistory();
    }
}

/**
 * 初始化历史记录
 */
function initHistory() {
    renderHistory();
}

/**
 * 渲染历史记录
 */
function renderHistory() {
    const emptyHistory = document.getElementById('empty-history');
    const historyList = document.getElementById('history-list');
    const tableBody = document.getElementById('history-table-body');
    
    if (historyRecords.length === 0) {
        emptyHistory.classList.remove('hidden');
        historyList.classList.add('hidden');
        return;
    }
    
    emptyHistory.classList.add('hidden');
    historyList.classList.remove('hidden');
    tableBody.innerHTML = '';
    
    // 添加历史记录行
    historyRecords.forEach(record => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td class="px-6 py-4 font-medium text-gray-900 truncate max-w-xs">${record.name}</td>
            <td class="px-6 py-4 text-gray-500">${record.sizeFormatted}</td>
            <td class="px-6 py-4 font-mono text-sm break-all">
                ${record.hash}
                <span class="text-xs text-gray-400 ml-2">(${hashCalculator.getAlgorithmDisplayName(record.algorithm)})</span>
            </td>
            <td class="px-6 py-4 text-gray-500 text-sm">${record.timestamp}</td>
            <td class="px-6 py-4 text-center">
                <div class="flex justify-center space-x-2">
                    <button class="copy-hash text-primary hover:text-primary/80 p-1" data-hash="${record.hash}">
                        <i class="fa fa-copy"></i>
                    </button>
                    <button class="delete-history text-danger hover:text-danger/80 p-1" data-id="${record.id}">
                        <i class="fa fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // 绑定事件
    document.querySelectorAll('.copy-hash').forEach(btn => {
        btn.addEventListener('click', function() {
            copyToClipboard(this.dataset.hash);
        });
    });
    
    document.querySelectorAll('.delete-history').forEach(btn => {
        btn.addEventListener('click', function() {
            deleteHistoryRecord(parseInt(this.dataset.id));
        });
    });
}

/**
 * 删除单条历史记录
 */
function deleteHistoryRecord(id) {
    historyRecords = historyRecords.filter(record => record.id !== id);
    localStorage.setItem('hashHistory', JSON.stringify(historyRecords));
    renderHistory();
    showToast('记录已删除', 'success');
}

/**
 * 清空所有历史记录
 */
function clearAllHistory() {
    if (confirm('确定要清空所有历史记录吗？此操作不可恢复！')) {
        historyRecords = [];
        localStorage.removeItem('hashHistory');
        renderHistory();
        showToast('所有历史记录已清空', 'success');
    }
}

/**
 * 初始化复制按钮
 */
function initCopyButtons() {
    document.getElementById('copy-file1-hash').addEventListener('click', function() {
        const hash = document.getElementById('file1-hash').textContent;
        copyToClipboard(hash);
    });
    
    document.getElementById('copy-file2-hash').addEventListener('click', function() {
        const hash = document.getElementById('file2-hash').textContent;
        copyToClipboard(hash);
    });
}