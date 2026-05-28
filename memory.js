/**
 * Memory Manager Module
 * Управление памятью и оптимизация
 */


class MemoryManager {
    constructor() {
        this.usedMemory = 0;
        this.totalMemory = 0;
        this.gcThreshold = 100 * 1024 * 1024; // 100MB
        this.lastGC = 0;
        this.gcInterval = 30000; // 30 сек
        this.pool = new Map();
        this.cache = new Map();
        this.maxCacheSize = 100;
        this.performanceWarnings = [];
    }
    
    init() {
        this.measureMemory();
        this.startMonitoring();
    }
    
    measureMemory() {
        if (performance.memory) {
            this.usedMemory = performance.memory.usedJSHeapSize;
            this.totalMemory = performance.memory.jsHeapSizeLimit;
        }
    }
    
    startMonitoring() {
        setInterval(() => {
            this.measureMemory();
            this.checkMemoryPressure();
        }, 5000);
    }
    
    checkMemoryPressure() {
        if (this.usedMemory > this.gcThreshold) {
            this.garbageCollect();
        }
        
        if (this.usedMemory > this.totalMemory * 0.9) {
            this.performanceWarnings.push('Критический уровень памяти!');
            this.emergencyCleanup();
        }
    }
    
    garbageCollect() {
        const now = Date.now();
        if (now - this.lastGC < this.gcInterval) return;
        
        // Очистка кэша
        this.clearCache();
        
        // Очистка старых данных
        if (energyHistory.length > 50) {
            energyHistory = energyHistory.slice(-50);
        }
        
        if (predictionData.length > 20) {
            predictionData = predictionData.slice(-20);
        }
        
        this.lastGC = now;
        this.measureMemory();
        
        console.log('🧹 GC: очистка памяти, использовано:', (this.usedMemory / 1024 / 1024).toFixed(2), 'MB');
    }
    
    clearCache() {
        // Удаление старых записей
        const now = Date.now();
        for (const [key, value] of this.cache) {
            if (now - value.timestamp > 60000) {
                this.cache.delete(key);
            }
        }
        
        // Ограничение размера кэша
        while (this.cache.size > this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
    }
    
    emergencyCleanup() {
        // Экстренная очистка при нехватке памяти
        particles = particles.slice(0, Math.floor(particles.length * 0.7));
        stars = stars.slice(0, Math.floor(stars.length * 0.7));
        
        this.clearCache();
        energyHistory = [];
        predictionData = [];
        
        showToast('⚠️ Экстренная очистка памяти', 'warning');
    }
    
    cacheData(key, data, ttl = 60000) {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
    }
    
    getCachedData(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        if (Date.now() - cached.timestamp > cached.ttl) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }
    
    allocate(size) {
        this.pool.set(Date.now(), new Array(size).fill(0));
    }
    
    release(key) {
        this.pool.delete(key);
    }
    
    getStats() {
        return {
            used: (this.usedMemory / 1024 / 1024).toFixed(2) + ' MB',
            total: (this.totalMemory / 1024 / 1024).toFixed(2) + ' MB',
            cacheSize: this.cache.size,
            poolSize: this.pool.size,
            warnings: this.performanceWarnings.length
        };
    }
    
    update() {
        this.measureMemory();
    }
}

window.memoryManager = new MemoryManager();