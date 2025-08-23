import React from 'react';
import { API_BASE_URL } from '../services/api/config';

/**
 * Simple network connectivity checker
 * Since the app doesn't use @react-native-netinfo, we'll use fetch with timeout
 */
class NetworkUtils {
  constructor() {
    this.isOnline = true;
    this.listeners = new Set();
    this.checkInterval = null;
    this.lastCheckTime = 0;
    this.checkFrequency = 30000; // Check every 30 seconds
  }

  /**
   * Check if the device has internet connectivity
   * @returns {Promise<boolean>}
   */
  async checkConnectivity() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache'
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.log('[NetworkUtils] Connectivity check failed:', error.message);
      return false;
    }
  }

  /**
   * Start monitoring network connectivity
   */
  startMonitoring() {
    if (this.checkInterval) {
      return;
    }

    // Initial check
    this.checkConnectivity().then(isOnline => {
      this.updateConnectionStatus(isOnline);
    });

    // Periodic checks
    this.checkInterval = setInterval(async () => {
      const now = Date.now();
      if (now - this.lastCheckTime < this.checkFrequency) {
        return;
      }

      this.lastCheckTime = now;
      const isOnline = await this.checkConnectivity();
      this.updateConnectionStatus(isOnline);
    }, this.checkFrequency);
  }

  /**
   * Stop monitoring network connectivity
   */
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Update connection status and notify listeners
   * @param {boolean} isOnline 
   */
  updateConnectionStatus(isOnline) {
    const wasOnline = this.isOnline;
    this.isOnline = isOnline;

    if (wasOnline !== isOnline) {
      console.log(`[NetworkUtils] Connection status changed: ${isOnline ? 'online' : 'offline'}`);
      this.notifyListeners(isOnline);
    }
  }

  /**
   * Add a listener for connection status changes
   * @param {Function} listener - Callback function that receives isOnline boolean
   */
  addListener(listener) {
    this.listeners.add(listener);
    
    // Return a function to remove the listener
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of connection status change
   * @param {boolean} isOnline 
   */
  notifyListeners(isOnline) {
    this.listeners.forEach(listener => {
      try {
        listener(isOnline);
      } catch (error) {
        console.error('[NetworkUtils] Error calling listener:', error);
      }
    });
  }

  /**
   * Get current connection status
   * @returns {boolean}
   */
  getConnectionStatus() {
    return this.isOnline;
  }

  /**
   * Force a connectivity check
   * @returns {Promise<boolean>}
   */
  async forceCheck() {
    const isOnline = await this.checkConnectivity();
    this.updateConnectionStatus(isOnline);
    return isOnline;
  }
}

// Create a singleton instance
const networkUtils = new NetworkUtils();

export default networkUtils;

// Hook for React components
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = React.useState(networkUtils.getConnectionStatus());

  React.useEffect(() => {
    const unsubscribe = networkUtils.addListener(setIsOnline);
    
    // Start monitoring if not already started
    networkUtils.startMonitoring();
    
    return unsubscribe;
  }, []);

  return isOnline;
};
