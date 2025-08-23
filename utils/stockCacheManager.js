import apiCache from './apiCache';
import logger from './logger';
import persistentCache from './persistentCache';

/**
 * Stock Cache Manager
 * Manages cache invalidation when stock data changes
 * Ensures real-time stock updates are reflected across all cached data
 */
class StockCacheManager {
  constructor() {
    this.stockUpdateListeners = new Set();
    this.lastInvalidation = null;
  }

  /**
   * Add a listener for stock updates
   * @param {Function} listener - Function to call when stock updates
   */
  addStockUpdateListener(listener) {
    this.stockUpdateListeners.add(listener);
    return () => this.stockUpdateListeners.delete(listener);
  }

  /**
   * Notify all listeners of stock updates
   * @param {Object} stockUpdates - Stock updates { itemId: newQuantity }
   */
  notifyStockUpdate(stockUpdates) {
    this.lastInvalidation = Date.now();
    logger.debug('[Stock Cache Manager] Notifying stock update', {
      updatedItems: Object.keys(stockUpdates).length,
      items: Object.keys(stockUpdates)
    });

    this.stockUpdateListeners.forEach(listener => {
      try {
        listener(stockUpdates);
      } catch (error) {
        logger.error('[Stock Cache Manager] Error in stock update listener', { error: error.message });
      }
    });
  }

  /**
   * Invalidate all stock-related caches
   * This should be called when stock data changes to ensure fresh data
   */
  async invalidateStockCaches() {
    try {
      logger.debug('[Stock Cache Manager] Invalidating all stock-related caches');

      // Clear API cache for items and categories
      apiCache.clear();

      // Clear persistent cache for stock-related data
      const stockRelatedKeys = [
        'categories-customer',
        'categories-buyer', 
        'all-items-customer',
        'all-items-buyer',
        'category-items'
      ];

      for (const keyPattern of stockRelatedKeys) {
        await persistentCache.clearByPattern(keyPattern);
      }

      // Clear material verification cache
      if (global.materialVerificationCache) {
        global.materialVerificationCache.clear();
      }

      logger.debug('[Stock Cache Manager] Successfully invalidated stock caches');
      this.lastInvalidation = Date.now();
    } catch (error) {
      logger.error('[Stock Cache Manager] Failed to invalidate caches', { error: error.message });
    }
  }

  /**
   * Update cached items with fresh stock data
   * @param {Array} items - Items to update
   * @param {Object} stockQuantities - Current stock quantities { itemId: quantity }
   * @returns {Array} Updated items with fresh stock data
   */
  updateItemsWithFreshStock(items, stockQuantities) {
    if (!Array.isArray(items) || !stockQuantities) {
      return items;
    }

    return items.map(item => ({
      ...item,
      quantity: stockQuantities[item._id] ?? item.quantity ?? 0
    }));
  }

  /**
   * Check if caches need to be invalidated based on last update
   * @param {number} maxAge - Maximum age in milliseconds
   * @returns {boolean} True if caches should be invalidated
   */
  shouldInvalidateCaches(maxAge = 5 * 60 * 1000) { // 5 minutes default
    if (!this.lastInvalidation) return true;
    return (Date.now() - this.lastInvalidation) > maxAge;
  }

  /**
   * Get cache stats for debugging
   * @returns {Object} Cache statistics
   */
  async getCacheStats() {
    const apiStats = apiCache.getStats();
    const persistentStats = await persistentCache.getStats();

    return {
      apiCache: apiStats,
      persistentCache: persistentStats,
      lastInvalidation: this.lastInvalidation,
      stockListeners: this.stockUpdateListeners.size
    };
  }
}

// Singleton instance
const stockCacheManager = new StockCacheManager();

export default stockCacheManager;
