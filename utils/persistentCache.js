import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Persistent cache utility for storing data offline
 * Uses AsyncStorage for persistence across app sessions
 */
class PersistentCache {
  constructor() {
    this.memory = new Map();
    this.initialized = false;
  }

  /**
   * Initialize the cache by loading data from AsyncStorage
   */
  async initialize() {
    if (this.initialized) return;

    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('persistent_cache_'));
      
      if (cacheKeys.length > 0) {
        const cacheData = await AsyncStorage.multiGet(cacheKeys);
        
        for (const [key, value] of cacheData) {
          if (value) {
            try {
              const parsed = JSON.parse(value);
              const cacheKey = key.replace('persistent_cache_', '');
              this.memory.set(cacheKey, parsed);
            } catch (parseError) {
              console.warn('[PersistentCache] Failed to parse cached item:', key, parseError);
            }
          }
        }
      }
      
      this.initialized = true;
      console.log('[PersistentCache] Initialized with', this.memory.size, 'cached items');
    } catch (error) {
      console.error('[PersistentCache] Failed to initialize:', error);
      this.initialized = true; // Mark as initialized even if failed
    }
  }

  /**
   * Store data in cache with TTL
   * @param {string} key 
   * @param {any} data 
   * @param {number} ttl - Time to live in milliseconds (default: 24 hours)
   */
  async set(key, data, ttl = 24 * 60 * 60 * 1000) {
    await this.initialize();

    const cacheItem = {
      data,
      timestamp: Date.now(),
      ttl,
      expiresAt: Date.now() + ttl
    };

    this.memory.set(key, cacheItem);

    try {
      await AsyncStorage.setItem(
        `persistent_cache_${key}`, 
        JSON.stringify(cacheItem)
      );
      console.log('[PersistentCache] Stored item:', key);
    } catch (error) {
      console.error('[PersistentCache] Failed to store item:', key, error);
    }
  }

  /**
   * Get data from cache
   * @param {string} key 
   * @param {boolean} allowExpired - Return expired data if no fresh data available
   * @returns {any|null}
   */
  async get(key, allowExpired = false) {
    await this.initialize();

    const cacheItem = this.memory.get(key);
    if (!cacheItem) return null;

    const now = Date.now();
    const isExpired = now > cacheItem.expiresAt;

    if (!isExpired) {
      console.log('[PersistentCache] Cache hit (fresh):', key);
      return cacheItem.data;
    }

    if (allowExpired) {
      console.log('[PersistentCache] Cache hit (expired but allowed):', key);
      return cacheItem.data;
    }

    console.log('[PersistentCache] Cache miss (expired):', key);
    return null;
  }

  /**
   * Check if key exists in cache (regardless of expiration)
   * @param {string} key 
   * @returns {boolean}
   */
  async has(key) {
    await this.initialize();
    return this.memory.has(key);
  }

  /**
   * Remove item from cache
   * @param {string} key 
   */
  async remove(key) {
    await this.initialize();

    this.memory.delete(key);

    try {
      await AsyncStorage.removeItem(`persistent_cache_${key}`);
      console.log('[PersistentCache] Removed item:', key);
    } catch (error) {
      console.error('[PersistentCache] Failed to remove item:', key, error);
    }
  }

  /**
   * Clear all cached data
   */
  async clear() {
    await this.initialize();

    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('persistent_cache_'));
      
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
      
      this.memory.clear();
      console.log('[PersistentCache] Cleared all cache data');
    } catch (error) {
      console.error('[PersistentCache] Failed to clear cache:', error);
    }
  }

  /**
   * Get cache statistics
   * @returns {Object}
   */
  async getStats() {
    await this.initialize();

    const now = Date.now();
    let fresh = 0;
    let expired = 0;

    for (const [key, item] of this.memory.entries()) {
      if (now <= item.expiresAt) {
        fresh++;
      } else {
        expired++;
      }
    }

    return {
      total: this.memory.size,
      fresh,
      expired
    };
  }

  /**
   * Clear items matching a pattern
   * @param {string} pattern - Pattern to match against keys
   */
  async clearByPattern(pattern) {
    await this.initialize();

    const keysToRemove = [];
    for (const key of this.memory.keys()) {
      if (key.includes(pattern)) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) {
      await this.remove(key);
    }

    console.log('[PersistentCache] Cleared', keysToRemove.length, 'items matching pattern:', pattern);
    return keysToRemove.length;
  }

  /**
   * Clean up expired items
   */
  async cleanup() {
    await this.initialize();

    const now = Date.now();
    const expiredKeys = [];

    for (const [key, item] of this.memory.entries()) {
      if (now > item.expiresAt) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      await this.remove(key);
    }

    console.log('[PersistentCache] Cleaned up', expiredKeys.length, 'expired items');
    return expiredKeys.length;
  }
}

// Create singleton instance
const persistentCache = new PersistentCache();

export default persistentCache;
