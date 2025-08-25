interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  accessCount: number;
  lastAccessed: number;
  version: string;
}

interface CacheConfig {
  maxMemoryEntries: number;
  defaultTTL: number;
  maxStorageSize: number; // Max localStorage size in bytes
  compressionEnabled: boolean;
}

export class CacheManager {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private config: CacheConfig = {
    maxMemoryEntries: 1000,
    defaultTTL: 30 * 60 * 1000, // 30 minutes
    maxStorageSize: 50 * 1024 * 1024, // 50MB
    compressionEnabled: true,
  };

  private readonly CACHE_VERSION = '1.0.0';
  private readonly STORAGE_PREFIX = 'autodrops_cache_';

  constructor(config?: Partial<CacheConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    this.initializeCache();
  }

  private initializeCache() {
    // Clean up old cache versions
    this.cleanupOldVersions();
    
    // Set up periodic cleanup
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private generateCacheKey(type: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {} as Record<string, any>);
    
    return `${type}_${JSON.stringify(sortedParams)}`;
  }

  private compress(data: string): string {
    if (!this.config.compressionEnabled) return data;
    
    // Simple compression - in production, use a proper compression library
    try {
      return btoa(encodeURIComponent(data));
    } catch {
      return data;
    }
  }

  private decompress(data: string): string {
    if (!this.config.compressionEnabled) return data;
    
    try {
      return decodeURIComponent(atob(data));
    } catch {
      return data;
    }
  }

  private saveToStorage(key: string, entry: CacheEntry<any>): void {
    try {
      const serialized = JSON.stringify(entry);
      const compressed = this.compress(serialized);
      const storageKey = this.STORAGE_PREFIX + key;
      
      // Check storage size limit
      const currentSize = this.getStorageSize();
      const entrySize = new Blob([compressed]).size;
      
      if (currentSize + entrySize > this.config.maxStorageSize) {
        this.cleanupStorage();
      }
      
      localStorage.setItem(storageKey, compressed);
      console.log(`💾 Cached to storage: ${key} (${entrySize} bytes)`);
    } catch (error) {
      console.warn('⚠️ Failed to save to localStorage:', error);
    }
  }

  private loadFromStorage(key: string): CacheEntry<any> | null {
    try {
      const storageKey = this.STORAGE_PREFIX + key;
      const compressed = localStorage.getItem(storageKey);
      
      if (!compressed) return null;
      
      const serialized = this.decompress(compressed);
      const entry = JSON.parse(serialized) as CacheEntry<any>;
      
      // Check if entry is expired
      if (Date.now() - entry.timestamp > entry.ttl) {
        localStorage.removeItem(storageKey);
        return null;
      }
      
      // Update access stats
      entry.accessCount++;
      entry.lastAccessed = Date.now();
      
      return entry;
    } catch (error) {
      console.warn('⚠️ Failed to load from localStorage:', error);
      return null;
    }
  }

  private getStorageSize(): number {
    let totalSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.STORAGE_PREFIX)) {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += new Blob([value]).size;
        }
      }
    }
    return totalSize;
  }

  private cleanupStorage(): void {
    console.log('🧹 Cleaning up localStorage cache...');
    
    const entries: Array<{ key: string; lastAccessed: number; size: number }> = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.STORAGE_PREFIX)) {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            const decompressed = this.decompress(value);
            const entry = JSON.parse(decompressed) as CacheEntry<any>;
            entries.push({
              key,
              lastAccessed: entry.lastAccessed,
              size: new Blob([value]).size,
            });
          } catch {
            // Remove corrupted entries
            localStorage.removeItem(key);
          }
        }
      }
    }
    
    // Sort by last accessed (oldest first) and remove until we're under limit
    entries.sort((a, b) => a.lastAccessed - b.lastAccessed);
    
    let currentSize = this.getStorageSize();
    const targetSize = this.config.maxStorageSize * 0.8; // 80% of max
    
    for (const entry of entries) {
      if (currentSize <= targetSize) break;
      
      localStorage.removeItem(entry.key);
      currentSize -= entry.size;
      console.log(`🗑️ Removed old cache entry: ${entry.key}`);
    }
  }

  private cleanupOldVersions(): void {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.STORAGE_PREFIX)) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            const decompressed = this.decompress(value);
            const entry = JSON.parse(decompressed) as CacheEntry<any>;
            if (entry.version !== this.CACHE_VERSION) {
              localStorage.removeItem(key);
              console.log(`🗑️ Removed old cache version: ${key}`);
            }
          }
        } catch {
          localStorage.removeItem(key!);
        }
      }
    }
  }

  private cleanup(): void {
    // Clean memory cache
    const now = Date.now();
    let removedCount = 0;
    
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.memoryCache.delete(key);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      console.log(`🧹 Cleaned up ${removedCount} expired memory cache entries`);
    }
    
    // Enforce memory cache size limit
    if (this.memoryCache.size > this.config.maxMemoryEntries) {
      const entries = Array.from(this.memoryCache.entries());
      entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
      
      const toRemove = this.memoryCache.size - this.config.maxMemoryEntries;
      for (let i = 0; i < toRemove; i++) {
        this.memoryCache.delete(entries[i][0]);
      }
      
      console.log(`🧹 Removed ${toRemove} old memory cache entries`);
    }
  }

  set<T>(type: string, params: Record<string, any>, data: T, customTTL?: number): void {
    const key = this.generateCacheKey(type, params);
    const ttl = customTTL || this.config.defaultTTL;
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 1,
      lastAccessed: Date.now(),
      version: this.CACHE_VERSION,
    };

    // Store in memory cache
    this.memoryCache.set(key, entry);
    
    // Store in localStorage for persistence
    this.saveToStorage(key, entry);
    
    console.log(`✅ Cached: ${type} (TTL: ${ttl / 1000}s)`);
  }

  get<T>(type: string, params: Record<string, any>): T | null {
    const key = this.generateCacheKey(type, params);
    
    // Check memory cache first (fastest)
    let entry = this.memoryCache.get(key);
    
    if (entry) {
      // Check if expired
      if (Date.now() - entry.timestamp > entry.ttl) {
        this.memoryCache.delete(key);
        entry = undefined;
      } else {
        // Update access stats
        entry.accessCount++;
        entry.lastAccessed = Date.now();
        console.log(`🎯 Memory cache hit: ${type}`);
        return entry.data as T;
      }
    }
    
    // Check localStorage (slower but persistent)
    if (!entry) {
      const storageEntry = this.loadFromStorage(key);
      if (storageEntry) {
        // Restore to memory cache
        this.memoryCache.set(key, storageEntry);
        console.log(`💾 Storage cache hit: ${type}`);
        return storageEntry.data as T;
      }
    }
    
    console.log(`❌ Cache miss: ${type}`);
    return null;
  }

  invalidate(type: string, params?: Record<string, any>): void {
    if (params) {
      // Invalidate specific entry
      const key = this.generateCacheKey(type, params);
      this.memoryCache.delete(key);
      localStorage.removeItem(this.STORAGE_PREFIX + key);
      console.log(`🗑️ Invalidated cache: ${type}`);
    } else {
      // Invalidate all entries of this type
      const pattern = `${type}_`;
      let removedCount = 0;
      
      // Clear from memory
      for (const key of this.memoryCache.keys()) {
        if (key.startsWith(pattern)) {
          this.memoryCache.delete(key);
          removedCount++;
        }
      }
      
      // Clear from storage
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.STORAGE_PREFIX + pattern)) {
          localStorage.removeItem(key);
          removedCount++;
        }
      }
      
      console.log(`🗑️ Invalidated ${removedCount} cache entries for type: ${type}`);
    }
  }

  getCacheStats(): { memoryEntries: number; storageEntries: number; storageSize: number } {
    let storageEntries = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.STORAGE_PREFIX)) {
        storageEntries++;
      }
    }
    
    return {
      memoryEntries: this.memoryCache.size,
      storageEntries,
      storageSize: this.getStorageSize(),
    };
  }

  clearAll(): void {
    this.memoryCache.clear();
    
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
    
    console.log('🧹 Cleared all cache data');
  }
}

// Create singleton instance
export const cacheManager = new CacheManager({
  maxMemoryEntries: 500,
  defaultTTL: 60 * 60 * 1000, // 1 hour for search results
  maxStorageSize: 100 * 1024 * 1024, // 100MB
  compressionEnabled: true,
});

// Cache TTL configurations for different data types
export const CACHE_CONFIGS = {
  SEARCH_RESULTS: 60 * 60 * 1000, // 1 hour
  PRODUCT_DETAILS: 24 * 60 * 60 * 1000, // 24 hours
  CATEGORIES: 7 * 24 * 60 * 60 * 1000, // 7 days
  REVIEWS: 12 * 60 * 60 * 1000, // 12 hours
  USER_PREFERENCES: 30 * 24 * 60 * 60 * 1000, // 30 days
}; 