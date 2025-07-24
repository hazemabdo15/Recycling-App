import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URLS } from './config';

// Avoid circular dependency - get notifyTokenExpired function dynamically
let notifyTokenExpired = null;

const getNotifyTokenExpired = () => {
  if (!notifyTokenExpired) {
    try {
      const authContextModule = require('../../context/AuthContext');
      notifyTokenExpired = authContextModule.notifyTokenExpired;
    } catch (error) {
      console.warn('[APIService] Could not import notifyTokenExpired:', error.message);
    }
  }
  return notifyTokenExpired;
};

/**
 * Enhanced API Service with proper JWT token handling and automatic refresh
 * Follows the backend API specification for dual-token system
 */
class APIService {
  constructor() {
    this.baseURL = BASE_URLS.API;
    this.accessToken = null;
    this.isRefreshing = false;
    this.failedQueue = [];
    this.isInitialized = false; // Add initialization flag
  }

  /**
   * Initialize tokens from storage and refresh if needed
   */
  async initialize() {
    if (this.isInitialized) {
      return; // Prevent multiple initializations
    }
    
    try {
      this.accessToken = await AsyncStorage.getItem('accessToken');
      console.log('[APIService] Initializing...', this.accessToken ? 'Token found' : 'No token');
      
      if (this.accessToken) {
        // Check if token needs refresh proactively on startup
        await this.refreshIfNeeded();
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize API service:', error);
    }
  }

  /**
   * Set new access token and store it
   */
  async setAccessToken(token) {
    this.accessToken = token;
    if (token) {
      await AsyncStorage.setItem('accessToken', token);
    } else {
      await AsyncStorage.removeItem('accessToken');
    }
  }

  /**
   * Clear all tokens on logout
   */
  async clearTokens() {
    this.accessToken = null;
    await AsyncStorage.multiRemove(['accessToken', 'user']);
    
    // Notify AuthContext that tokens have been cleared
    const notify = getNotifyTokenExpired();
    if (notify) {
      notify();
    }
  }

  /**
   * Get current access token (async - loads from storage if needed)
   */
  async getAccessToken() {
    if (!this.accessToken) {
      await this.initialize();
    }
    return this.accessToken;
  }

  /**
   * Check if JWT token is expired
   */
  isTokenExpired(token) {
    try {
      console.log('[APIService] Checking token expiration for:', token ? 'token present' : 'no token');
      
      if (!token) {
        console.log('[APIService] No token provided');
        return true;
      }
      
      // Handle mock tokens for development
      if (token.startsWith('mock.')) {
        console.log('[APIService] Processing mock token');
        const parts = token.split('.');
        if (parts.length >= 2) {
          const payload = JSON.parse(atob(parts[1]));
          const currentTime = Math.floor(Date.now() / 1000);
          const isExpired = currentTime >= payload.exp;
          console.log('[APIService] Mock token - current time:', currentTime, 'expires:', payload.exp, 'expired:', isExpired);
          return isExpired;
        }
        console.log('[APIService] Mock token format issue, treating as valid');
        return false;
      }
      
      // Handle real JWT tokens
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.log('[APIService] Invalid JWT format');
        return true;
      }
      
      const base64Payload = parts[1];
      const paddedPayload = base64Payload + '='.repeat((4 - base64Payload.length % 4) % 4);
      
      // Decode JWT payload
      const decoded = atob(paddedPayload);
      const payload = JSON.parse(decoded);
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Check if token expires in the next 30 seconds (proactive refresh)
      const willExpireSoon = currentTime >= (payload.exp - 30);
      
      // Only log if status changed or first check
      if (!this._lastTokenStatus || this._lastTokenStatus.expired !== willExpireSoon) {
        console.log('[APIService] JWT token - current time:', currentTime, 'expires:', payload.exp, 'will expire soon:', willExpireSoon);
        this._lastTokenStatus = { expired: willExpireSoon, timestamp: Date.now() };
      }
      
      return willExpireSoon;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }

  /**
   * Process failed requests after token refresh
   */
  processQueue(error, token = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    
    this.failedQueue = [];
  }

  /**
   * Refresh access token using refresh token cookie
   */
  async refreshToken() {
    if (this.isRefreshing) {
      // If already refreshing, queue this request
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // Important: Send refresh token cookie
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        await this.setAccessToken(data.accessToken);
        this.processQueue(null, data.accessToken);
        
        return data.accessToken;
      } else {
        const errorText = await response.text();
        console.warn('[API] Token refresh failed:', response.status, errorText);
        this.processQueue(new Error('Token refresh failed'), null);
        await this.clearTokens();
        return null;
      }
    } catch (error) {
      console.error('[API] Token refresh error:', error);
      this.processQueue(error, null);
      await this.clearTokens();
      return null;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Make authenticated API call with automatic token refresh
   */
  async apiCall(endpoint, options = {}) {
    await this.initialize();

    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Add authorization header if we have a token
    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    const requestOptions = {
      ...options,
      headers,
      credentials: 'include' // Important for refresh token cookies
    };

    try {
      let response = await fetch(url, requestOptions);

      // If access token expired, try to refresh
      if (response.status === 401 && this.accessToken && !endpoint.includes('/auth/refresh')) {
        const newToken = await this.refreshToken();
        if (newToken) {
          // Retry the original request with new token
          headers.Authorization = `Bearer ${newToken}`;
          response = await fetch(url, {
            ...requestOptions,
            headers
          });
        } else {
          throw new Error('Session expired');
        }
      }

      // Parse response
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const error = new Error(data?.message || `HTTP ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (error) {
      console.error(`[API] Error - ${endpoint}:`, error.message);
      
      // If it's a session expired error, clear tokens
      if (error.message === 'Session expired' || error.status === 401) {
        await this.clearTokens();
      }
      
      throw error;
    }
  }

  /**
   * Helper methods for common HTTP verbs
   */
  async get(endpoint, options = {}) {
    return this.apiCall(endpoint, { method: 'GET', ...options });
  }

  async post(endpoint, data, options = {}) {
    return this.apiCall(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    });
  }

  async put(endpoint, data, options = {}) {
    return this.apiCall(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options
    });
  }

  async patch(endpoint, data, options = {}) {
    return this.apiCall(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
      ...options
    });
  }

  async delete(endpoint, options = {}) {
    return this.apiCall(endpoint, { method: 'DELETE', ...options });
  }

  /**
   * Check if user is authenticated, attempting refresh if token is expired
   */
  async isAuthenticated() {
    // Make sure token is loaded from storage
    if (!this.accessToken) {
      await this.initialize();
    }
    
    if (!this.accessToken) {
      return false;
    }
    
    const isExpired = this.isTokenExpired(this.accessToken);
    
    // If token is expired, try to refresh it
    if (isExpired) {
      try {
        const newToken = await this.refreshToken();
        if (newToken) {
          return true;
        } else {
          return false;
        }
      } catch (error) {
        console.error('[APIService] Token refresh error during auth check:', error);
        return false;
      }
    }
    
    const result = this.accessToken && !isExpired;
    
    return result;
  }

  /**
   * Check if token needs refresh (within threshold of expiry)
   */
  shouldRefreshToken() {
    if (!this.accessToken) return false;
    
    try {
      const payload = JSON.parse(atob(this.accessToken.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      const timeUntilExpiry = exp - now;
      
      // Import TOKEN_CONFIG for refresh threshold
      const REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes in milliseconds
      
      return timeUntilExpiry <= REFRESH_THRESHOLD && timeUntilExpiry > 0;
    } catch (error) {
      console.error('[APIService] Error checking token refresh need:', error);
      return false;
    }
  }

  /**
   * Proactively refresh token if it's close to expiry
   */
  async refreshIfNeeded() {
    if (this.shouldRefreshToken()) {
      try {
        await this.refreshToken();
        return true;
      } catch (error) {
        console.error('[APIService] Proactive token refresh failed:', error);
        return false;
      }
    }
    return true; // No refresh needed
  }
  isAuthenticatedSync() {
    return this.accessToken && !this.isTokenExpired(this.accessToken);
  }
}

// Create singleton instance
const apiService = new APIService();
export default apiService;
