import { updateCartItem, removeItemFromCart, saveCart } from '../services/api/cart';
import logger from './logger';

/**
 * Manages debounced cart operations to optimize API calls
 * Handles rapid user interactions by batching them into single requests
 */
class DebouncedCartManager {
  constructor() {
    // Map of itemId -> operation details
    this.pendingOperations = new Map();
    // Map of itemId -> timer reference
    this.debounceTimers = new Map();
    // Default debounce delay
    this.debounceDelay = 800; // 800ms for good responsiveness
  }

  /**
   * Updates item quantity with debouncing
   * @param {string} itemId - The item ID
   * @param {Object} item - The item object
   * @param {number} quantity - New quantity
   * @param {number} measurementUnit - Measurement unit
   * @param {boolean} isLoggedIn - User authentication status
   * @param {Object} previousState - Previous cart state for rollback
   * @param {Function} onError - Error callback for rollback
   */
  updateQuantity(itemId, item, quantity, measurementUnit, isLoggedIn, previousState, onError) {
    // Clear existing timer
    if (this.debounceTimers.has(itemId)) {
      clearTimeout(this.debounceTimers.get(itemId));
    }

    // Store the latest operation
    this.pendingOperations.set(itemId, {
      type: 'update',
      item,
      quantity,
      measurementUnit,
      isLoggedIn,
      previousState,
      onError,
      timestamp: Date.now()
    });

    // Set new timer
    const timer = setTimeout(async () => {
      const operation = this.pendingOperations.get(itemId);
      if (operation) {
        try {
          logger.cart('Executing debounced update', {
            itemId,
            quantity: operation.quantity,
            delay: Date.now() - operation.timestamp
          });

          await updateCartItem(
            operation.item,
            operation.quantity,
            operation.isLoggedIn,
            operation.measurementUnit
          );

          this.pendingOperations.delete(itemId);
          logger.success('Debounced update completed', { itemId }, 'CART');
          
        } catch (error) {
          logger.cart('Debounced update failed', {
            itemId,
            error: error.message
          }, 'ERROR');
          
          // Execute error callback for rollback
          if (operation.onError) {
            operation.onError(operation.previousState, error);
          }
          
          this.pendingOperations.delete(itemId);
        }
      }
      this.debounceTimers.delete(itemId);
    }, this.debounceDelay);

    this.debounceTimers.set(itemId, timer);
  }

  /**
   * Removes item with debouncing
   * @param {string} itemId - The item ID to remove
   * @param {boolean} isLoggedIn - User authentication status
   * @param {Object} previousState - Previous cart state for rollback
   * @param {Function} onError - Error callback for rollback
   */
  removeItem(itemId, isLoggedIn, previousState, onError) {
    // Clear existing timer
    if (this.debounceTimers.has(itemId)) {
      clearTimeout(this.debounceTimers.get(itemId));
    }

    // Store the remove operation
    this.pendingOperations.set(itemId, {
      type: 'remove',
      isLoggedIn,
      previousState,
      onError,
      timestamp: Date.now()
    });

    // Set new timer
    const timer = setTimeout(async () => {
      const operation = this.pendingOperations.get(itemId);
      if (operation) {
        try {
          logger.cart('Executing debounced remove', { itemId });

          await removeItemFromCart(itemId, operation.isLoggedIn);
          
          this.pendingOperations.delete(itemId);
          logger.success('Debounced remove completed', { itemId }, 'CART');
          
        } catch (error) {
          logger.cart('Debounced remove failed', {
            itemId,
            error: error.message
          }, 'ERROR');
          
          // Execute error callback for rollback
          if (operation.onError) {
            operation.onError(operation.previousState, error);
          }
          
          this.pendingOperations.delete(itemId);
        }
      }
      this.debounceTimers.delete(itemId);
    }, this.debounceDelay);

    this.debounceTimers.set(itemId, timer);
  }

  /**
   * Executes batch save for bulk operations (AI results, etc.)
   * @param {Array} cartItems - Array of cart items to save
   * @param {boolean} isLoggedIn - User authentication status
   * @param {Object} previousState - Previous cart state for rollback
   * @param {Function} onError - Error callback for rollback
   */
  async batchSave(cartItems, isLoggedIn, previousState, onError) {
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
      
      // Execute error callback for rollback
      if (onError) {
        onError(previousState, error);
      }
      
      throw error;
    }
  }

  /**
   * Force sync all pending operations
   * Useful for app state changes (background, foreground, etc.)
   */
  async syncAll() {
    const promises = Array.from(this.pendingOperations.entries()).map(
      ([itemId, operation]) => this.executeOperation(itemId, operation)
    );
    
    const results = await Promise.allSettled(promises);
    
    // Clear all operations and timers
    this.pendingOperations.clear();
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();

    // Log results
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    logger.cart('Sync all completed', {
      successful,
      failed,
      total: results.length
    });

    return results;
  }

  /**
   * Execute a pending operation
   * @param {string} itemId - The item ID
   * @param {Object} operation - The operation details
   */
  async executeOperation(itemId, operation) {
    try {
      switch (operation.type) {
        case 'update':
          return await updateCartItem(
            operation.item,
            operation.quantity,
            operation.isLoggedIn,
            operation.measurementUnit
          );
        case 'remove':
          return await removeItemFromCart(itemId, operation.isLoggedIn);
        default:
          throw new Error(`Unknown operation type: ${operation.type}`);
      }
    } catch (error) {
      // Execute error callback for rollback
      if (operation.onError) {
        operation.onError(operation.previousState, error);
      }
      throw error;
    }
  }

  /**
   * Cancel a pending operation for a specific item
   * @param {string} itemId - The item ID
   */
  cancelOperation(itemId) {
    if (this.debounceTimers.has(itemId)) {
      clearTimeout(this.debounceTimers.get(itemId));
      this.debounceTimers.delete(itemId);
    }
    
    if (this.pendingOperations.has(itemId)) {
      this.pendingOperations.delete(itemId);
    }
    
    logger.cart('Operation cancelled', { itemId });
  }

  /**
   * Check if there are pending operations
   * @returns {boolean} True if there are pending operations
   */
  hasPendingOperations() {
    return this.pendingOperations.size > 0;
  }

  /**
   * Get count of pending operations
   * @returns {number} Number of pending operations
   */
  getPendingCount() {
    return this.pendingOperations.size;
  }

  /**
   * Set custom debounce delay
   * @param {number} delay - Delay in milliseconds
   */
  setDebounceDelay(delay) {
    this.debounceDelay = delay;
  }
}

// Export singleton instance
export const debouncedCartManager = new DebouncedCartManager();

// Export class for testing or multiple instances
export { DebouncedCartManager };
