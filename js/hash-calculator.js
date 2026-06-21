/**
 * 哈希计算工具类
 * 支持 MD5、SHA1、SHA256、SM3 算法
 */
class HashCalculator {
    constructor() {
        this.currentAlgorithm = 'md5';
    }

    /**
     * 设置当前使用的算法
     * @param {string} algorithm - md5/sha1/sha256/sm3
     */
    setAlgorithm(algorithm) {
        this.currentAlgorithm = algorithm;
    }

    /**
     * 计算文件的哈希值
     * @param {File} file - 要计算的文件
     * @param {Function} callback - 进度回调函数 (hash, progress)
     */
    calculateFileHash(file, callback) {
        const chunkSize = 2 * 1024 * 1024; // 2MB 块大小
        const chunks = Math.ceil(file.size / chunkSize);
        let currentChunk = 0;
        
        // 根据算法选择不同的计算方式
        let hasher;
        if (this.currentAlgorithm === 'md5') {
            hasher = new SparkMD5.ArrayBuffer();
        }

        const fileReader = new FileReader();
        
        fileReader.onload = (e) => {
            try {
                const arrayBuffer = e.target.result;
                
                // 根据不同算法计算
                if (this.currentAlgorithm === 'md5') {
                    hasher.append(arrayBuffer);
                }
                
                currentChunk++;
                const progress = Math.floor((currentChunk / chunks) * 100);
                
                // 进度更新
                callback('', progress);
                
                if (currentChunk < chunks) {
                    this.loadNextChunk(file, fileReader, currentChunk, chunkSize);
                } else {
                    // 计算完成，获取最终哈希值
                    let hash = '';
                    switch (this.currentAlgorithm) {
                        case 'md5':
                            hash = hasher.end();
                            break;
                        case 'sha1':
                            this.calculateSHA1(file).then(result => callback(result, 100));
                            return;
                        case 'sha256':
                            this.calculateSHA256(file).then(result => callback(result, 100));
                            return;
                        case 'sm3':
                            this.calculateSM3(file).then(result => callback(result, 100));
                            return;
                    }
                    callback(hash.toLowerCase(), 100);
                }
            } catch (error) {
                console.error('哈希计算失败:', error);
                callback('', 0);
                showToast('哈希计算失败', 'error');
            }
        };
        
        fileReader.onerror = () => {
            console.error('文件读取失败');
            callback('', 0);
            showToast('文件读取失败', 'error');
        };
        
        this.loadNextChunk(file, fileReader, currentChunk, chunkSize);
    }

    /**
     * 加载下一个文件块
     */
    loadNextChunk(file, fileReader, currentChunk, chunkSize) {
        const start = currentChunk * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);
        
        fileReader.readAsArrayBuffer(chunk);
    }

    /**
     * 计算 SHA1 哈希值
     */
    calculateSHA1(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const wordArray = CryptoJS.lib.WordArray.create(e.target.result);
                const hash = CryptoJS.SHA1(wordArray);
                resolve(hash.toString(CryptoJS.enc.Hex));
            };
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * 计算 SHA256 哈希值
     */
    calculateSHA256(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const wordArray = CryptoJS.lib.WordArray.create(e.target.result);
                const hash = CryptoJS.SHA256(wordArray);
                resolve(hash.toString(CryptoJS.enc.Hex));
            };
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * 计算 SM3 哈希值
     */
    calculateSM3(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const arrayBuffer = e.target.result;
                const uint8Array = new Uint8Array(arrayBuffer);
                const hash = sm3(uint8Array);
                resolve(hash);
            };
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * 获取算法的显示名称
     */
    getAlgorithmDisplayName(algorithm = this.currentAlgorithm) {
        const names = {
            'md5': 'MD5',
            'sha1': 'SHA-1',
            'sha256': 'SHA-256',
            'sm3': 'SM3'
        };
        return names[algorithm] || 'MD5';
    }
}

// 全局实例
const hashCalculator = new HashCalculator();