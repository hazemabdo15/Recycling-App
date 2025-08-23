/**
 * Cart Stock Sync Manager
 * 
 * Provides utilities for keeping cart synchronized with real-time stock
 * Handles periodic validation and sync operations
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartStockValidator } from '../services/cartStockValidator';
import logger from '../utils/logger';

const LAST_SYNC_KEY = '@cart_last_sync';
const SYNC_INTERVAL = 300000; // 5 minutes
const FORCE_SYNC_INTERVAL = 1800000; // 30 minutes

export class CartStockSyncManager {
  static intervals = new Map();
  static lastSyncTime = 0;

  /**
   * Start periodic cart synchronization for a session
   * @param {string} sessionId - Unique session identifier
   * @param {Object} syncOptions - Sync configuration
   */
  static startPeriodicSync(sessionId, syncOptions = {}) {
    const {
      intervalMs = SYNC_INTERVAL,
      getCartData,
      updateCartFunction,
      onSyncComplete,
      autoCorrect = true
    } = syncOptions;

    // Clear existing interval if any
    this.stopPeriodicSync(sessionId);

    logger.cart(`Starting periodic cart sync for session: ${sessionId}`);

    const interval = setInterval(async () => {
      try {
        await this.performSync({
          getCartData,
          updateCartFunction,
          autoCorrect,
          source: `periodicSync_${sessionId}`
        });

        if (onSyncComplete) {
          onSyncComplete({ success: true, sessionId });
        }
      } catch (error) {
        logger.error(`Periodic sync failed for session ${sessionId}:`, error);
        if (onSyncComplete) {
          onSyncComplete({ success: false, error: error.message, sessionId });
        }
      }
    }, intervalMs);

    this.intervals.set(sessionId, interval);
  }

  /**
   * Stop periodic synchronization for a session
   * @param {string} sessionId - Session identifier
   */
  static stopPeriodicSync(sessionId) {
    const interval = this.intervals.get(sessionId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(sessionId);
      logger.cart(`Stopped periodic sync for session: ${sessionId}`);
    }
  }

  /**
   * Stop all periodic sync operations
   */
  static stopAllPeriodicSync() {
    this.intervals.forEach((interval, sessionId) => {
      clearInterval(interval);
      logger.cart(`Stopped periodic sync for session: ${sessionId}`);
    });
    this.intervals.clear();
  }

  /**
   * Perform a single sync operation
   * @param {Object} syncOptions - Sync configuration
   */
  static async performSync(syncOptions = {}) {
    const {
      getCartData,
      updateCartFunction,
      autoCorrect = true,
      source = 'manualSync',
      showMessages = false
    } = syncOptions;

    if (!getCartData || !updateCartFunction) {
      throw new Error('Cart data getters and updaters are required for sync');
    }

    const now = Date.now();
    
    // Check if sync is needed
    const timeSinceLastSync = now - this.lastSyncTime;
    if (timeSinceLastSync < 30000) { // 30 seconds cooldown
      logger.cart('Sync skipped - too soon since last sync');
      return { skipped: true, reason: 'cooldown' };
    }

    try {
      // Get current cart data
      const { cartItems, cartItemDetails, stockQuantities } = await getCartData();

      if (!cartItems || Object.keys(cartItems).length === 0) {
        logger.cart('Sync skipped - cart is empty');
        return { skipped: true, reason: 'emptyCart' };
      }

      // Perform validation and correction
      const result = await CartStockValidator.validateAndCorrectCart(
        cartItems,
        cartItemDetails,
        stockQuantities,
        updateCartFunction,
        {
          autoCorrect,
          showMessages,
          source
        }
      );

      this.lastSyncTime = now;
      await AsyncStorage.setItem(LAST_SYNC_KEY, now.toString());

      return result;

    } catch (error) {
      logger.error('Cart sync operation failed:', error);
      throw error;
    }
  }

  /**
   * Check if a force sync is needed based on time elapsed
   */
  static async shouldForceSync() {
    try {
      const lastSync = await AsyncStorage.getItem(LAST_SYNC_KEY);
      if (!lastSync) return true;

      const timeSinceLastSync = Date.now() - parseInt(lastSync);
      return timeSinceLastSync > FORCE_SYNC_INTERVAL;
    } catch (error) {
      logger.warn('Failed to check last sync time:', error);
      return true; // Force sync if we can't determine last sync time
    }
  }

  /**
   * Get sync status information
   */
  static getSyncStatus() {
    return {
      activeSessions: this.intervals.size,
      sessionIds: Array.from(this.intervals.keys()),
      lastSyncTime: this.lastSyncTime,
      timeSinceLastSync: Date.now() - this.lastSyncTime
    };
  }
}

export default CartStockSyncManager;
