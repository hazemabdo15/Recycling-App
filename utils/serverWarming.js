/**
 * Server Warming Utility
 * Proactively warms up the server to prevent cold start issues
 */

import { categoriesAPI } from '../services/api';
import logger from './logger';

class ServerWarmer {
  constructor() {
    this.warmingInProgress = new Set();
    this.lastWarmTime = new Map();
    this.warmingCooldown = 5 * 60 * 1000; // 5 minutes cooldown between warming attempts
  }

  /**
   * Check if endpoint needs warming (hasn't been warmed recently)
   * @param {string} endpoint 
   * @returns {boolean}
   */
  needsWarming(endpoint) {
    const lastWarm = this.lastWarmTime.get(endpoint) || 0;
    return Date.now() - lastWarm > this.warmingCooldown;
  }

  /**
   * Warm up a specific endpoint
   * @param {string} endpoint 
   * @param {Function} warmingFunction 
   * @param {Object} options 
   */
  async warmEndpoint(endpoint, warmingFunction, options = {}) {
    const { 
      silent = true, 
      timeout = 10000,
      skipIfRecent = true 
    } = options;

    // Skip if already warming
    if (this.warmingInProgress.has(endpoint)) {
      if (!silent) {
        console.log(`[ServerWarmer] Already warming ${endpoint}, skipping...`);
      }
      return;
    }

    // Skip if warmed recently
    if (skipIfRecent && !this.needsWarming(endpoint)) {
      if (!silent) {
        console.log(`[ServerWarmer] ${endpoint} warmed recently, skipping...`);
      }
      return;
    }

    this.warmingInProgress.add(endpoint);
    
    try {
      if (!silent) {
        console.log(`[ServerWarmer] Warming up ${endpoint}...`);
      }

      // Set a timeout for the warming request
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Warming timeout')), timeout);
      });

      await Promise.race([
        warmingFunction(),
        timeoutPromise
      ]);

      this.lastWarmTime.set(endpoint, Date.now());
      
      if (!silent) {
        console.log(`[ServerWarmer] ✅ Successfully warmed ${endpoint}`);
      }
      
      logger.debug(`Server warming completed for ${endpoint}`);
      
    } catch (error) {
      if (!silent) {
        console.log(`[ServerWarmer] ⚠️ Failed to warm ${endpoint}:`, error.message);
      }
      
      // Don't log warming failures as errors since they're expected during cold starts
      logger.debug(`Server warming failed for ${endpoint}: ${error.message}`);
    } finally {
      this.warmingInProgress.delete(endpoint);
    }
  }

  /**
   * Warm up all critical endpoints
   * @param {Object} options 
   */
  async warmAllEndpoints(options = {}) {
    const { role = 'customer', silent = true } = options;

    if (!silent) {
      console.log('[ServerWarmer] Starting comprehensive server warming...');
    }

    const warmingPromises = [
      // Categories endpoint
      this.warmEndpoint(
        'categories',
        () => categoriesAPI.getAllCategories(role),
        { ...options, silent }
      ),
      
      // All items endpoint  
      this.warmEndpoint(
        'all-items',
        () => categoriesAPI.getAllItems(role),
        { ...options, silent }
      ),
    ];

    try {
      await Promise.allSettled(warmingPromises);
      
      if (!silent) {
        console.log('[ServerWarmer] ✅ Server warming completed');
      }
    } catch (error) {
      if (!silent) {
        console.log('[ServerWarmer] ⚠️ Some warming requests failed:', error.message);
      }
    }
  }

  /**
   * Smart warming - only warm if needed
   * @param {Object} options 
   */
  async smartWarm(options = {}) {
    const criticalEndpoints = ['categories', 'all-items'];
    
    // Check if any critical endpoint needs warming
    const needsWarming = criticalEndpoints.some(endpoint => this.needsWarming(endpoint));
    
    if (needsWarming) {
      await this.warmAllEndpoints({ ...options, skipIfRecent: true });
    }
  }

  /**
   * Get warming status for all endpoints
   */
  getWarmingStatus() {
    return {
      inProgress: Array.from(this.warmingInProgress),
      lastWarmTimes: Object.fromEntries(this.lastWarmTime),
      needsWarming: ['categories', 'all-items'].filter(endpoint => this.needsWarming(endpoint))
    };
  }

  /**
   * Clear warming history (force re-warming)
   */
  clearWarmingHistory() {
    this.lastWarmTime.clear();
    console.log('[ServerWarmer] Warming history cleared');
  }
}

// Create singleton instance
const serverWarmer = new ServerWarmer();

export default serverWarmer;

// Export utility functions
export const warmServer = (options) => serverWarmer.warmAllEndpoints(options);
export const smartWarmServer = (options) => serverWarmer.smartWarm(options);
export const getServerWarmingStatus = () => serverWarmer.getWarmingStatus();
