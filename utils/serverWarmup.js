/**
 * Server Warm-up Utility
 * Helps wake up cold start servers proactively
 */

import { API_BASE_URL } from '../services/api/config';

class ServerWarmup {
  constructor() {
    this.warmupAttempts = new Map();
    this.isWarming = false;
    this.lastWarmupTime = 0;
    this.warmupCooldown = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Attempt to warm up the server proactively
   * @returns {Promise<boolean>}
   */
  async warmupServer() {
    const now = Date.now();
    
    // Don't warm up too frequently
    if (now - this.lastWarmupTime < this.warmupCooldown) {
      console.log('[ServerWarmup] Skipping warmup, too soon since last attempt');
      return false;
    }

    if (this.isWarming) {
      console.log('[ServerWarmup] Warmup already in progress');
      return false;
    }

    this.isWarming = true;
    this.lastWarmupTime = now;

    try {
      console.log('[ServerWarmup] Attempting server warmup...');
      
      // Make a simple request to wake up the server
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'X-Warmup-Request': 'true'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log('[ServerWarmup] Server warmup successful');
        return true;
      } else {
        console.log('[ServerWarmup] Server responded but not healthy');
        return false;
      }
    } catch (error) {
      console.log('[ServerWarmup] Warmup failed:', error.message);
      return false;
    } finally {
      this.isWarming = false;
    }
  }

  /**
   * Check if server is likely cold and needs warmup
   * @param {Error} error 
   * @returns {boolean}
   */
  isLikelyColdStart(error) {
    const indicators = [
      'ECONNREFUSED',
      'ETIMEDOUT', 
      'Request timeout',
      'Network request failed',
      '503',
      '502',
      '504'
    ];
    
    const errorMessage = error?.message || '';
    const statusCode = error?.response?.status?.toString() || '';
    
    return indicators.some(indicator => 
      errorMessage.includes(indicator) || statusCode === indicator
    );
  }

  /**
   * Get warmup status
   * @returns {Object}
   */
  getStatus() {
    return {
      isWarming: this.isWarming,
      lastWarmupTime: this.lastWarmupTime,
      canWarmup: (Date.now() - this.lastWarmupTime) >= this.warmupCooldown
    };
  }
}

// Create singleton
const serverWarmup = new ServerWarmup();

export default serverWarmup;

// Utility function for easy use
export const warmupServer = () => serverWarmup.warmupServer();
export const isLikelyColdStart = (error) => serverWarmup.isLikelyColdStart(error);
