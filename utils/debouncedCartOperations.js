import { removeItemFromCart, saveCart, updateCartItem } from '../services/api/cart';
import logger from './logger';

/**
 * Simple cart operations manager - direct API calls without debouncing
 * Provides immediate, consistent cart operations
 */
class SimpleCartManager {
  constructor() {
    // Track ongoing operations to prevent duplicates
    this.ongoingOperations = new Set();
  }

  /**
   * Updates item quantity with immediate UI update and background sync
   * @param {string} itemId - The item ID
   * @param {Object} item - The item object
   * @param {number} quantity - New quantity
   * @param {number} measurementUnit - Measurement unit
   * @param {boolean} isLoggedIn - User authentication status
   * @param {Function} onOptimisticUpdate - Callback for immediate UI update
   * @param {Function} onError - Callback for error handling and rollback
   */
  async updateQuantity(itemId, item, quantity, measurementUnit, isLoggedIn, onOptimisticUpdate, onError) {
    // Prevent duplicate operations
    if (this.ongoingOperations.has(itemId)) {
      logger.cart('Operation already in progress, skipping', { itemId });
      return { success: false, reason: 'duplicate_operation' };
    }

    this.ongoingOperations.add(itemId);
    
    // Immediate UI update
    if (onOptimisticUpdate) {
      onOptimisticUpdate(itemId, quantity);
    }
    
    try {
      logger.cart('Updating item quantity in background', {
        itemId,
        quantity,
        measurementUnit
      });

      const result = await updateCartItem(
        item,
        quantity,
        isLoggedIn,
        measurementUnit
      );

      logger.success('Item quantity updated successfully', { itemId, quantity }, 'CART');
      return { success: true, result };
      
    } catch (error) {
      logger.cart('Failed to update item quantity', {
        itemId,
        error: error.message
      }, 'ERROR');
      
      // Call error handler for rollback
      if (onError) {
        onError(itemId, error);
      }
      
      throw error;
    } finally {
      this.ongoingOperations.delete(itemId);
    }
  }

  /**
   * Removes item with immediate UI update and background sync
   * @param {string} itemId - The item ID to remove
   * @param {boolean} isLoggedIn - User authentication status
   * @param {Function} onOptimisticUpdate - Callback for immediate UI update
   * @param {Function} onError - Callback for error handling and rollback
   */
  async removeItem(itemId, isLoggedIn, onOptimisticUpdate, onError) {
    // Prevent duplicate operations
    if (this.ongoingOperations.has(itemId)) {
      logger.cart('Remove operation already in progress, skipping', { itemId });
      return { success: false, reason: 'duplicate_operation' };
    }

    this.ongoingOperations.add(itemId);
    
    // Immediate UI update
    if (onOptimisticUpdate) {
      onOptimisticUpdate(itemId);
    }
    
    try {
      logger.cart('Removing item from cart in background', { itemId });

      const result = await removeItemFromCart(itemId, isLoggedIn);
      
      logger.success('Item removed successfully', { itemId }, 'CART');
      return { success: true, result };
      
    } catch (error) {
      logger.cart('Failed to remove item', {
        itemId,
        error: error.message
      }, 'ERROR');
      
      // Call error handler for rollback
      if (onError) {
        onError(itemId, error);
      }
      
      throw error;
    } finally {
      this.ongoingOperations.delete(itemId);
    }
  }

  /**
   * Executes batch save for bulk operations (AI results, etc.)
   * @param {Array} cartItems - Array of cart items to save
   * @param {boolean} isLoggedIn - User authentication status
   */
  async batchSave(cartItems, isLoggedIn) {
    try {
      logger.cart('Executing batch save', {
        itemCount: cartItems.length
      });

      const result = await saveCart(cartItems, isLoggedIn);
      
      logger.success('Batch save completed', {
        itemCount: cartItems.length
      }, 'CART');
      
      return result;
      
    } catch (error) {
      logger.cart('Batch save failed', {
        itemCount: cartItems.length,
        error: error.message
      }, 'ERROR');
      
      throw error;
    }
  }

  /**
   * Check if an operation is ongoing for a specific item
   * @param {string} itemId - The item ID to check
   * @returns {boolean} True if operation is ongoing
   */
  isOperationOngoing(itemId) {
    return this.ongoingOperations.has(itemId);
  }

  /**
   * Get count of ongoing operations
   * @returns {number} Number of ongoing operations
   */
  getOngoingCount() {
    return this.ongoingOperations.size;
  }

  /**
   * Cancel all ongoing operations (for cleanup)
   */
  cancelAll() {
    this.ongoingOperations.clear();
    logger.cart('All operations cancelled');
  }
}

// Export singleton instance
export const simpleCartManager = new SimpleCartManager();

// Export class for testing or multiple instances
export { SimpleCartManager };

// Keep legacy export for compatibility during transition
export const debouncedCartManager = simpleCartManager;
