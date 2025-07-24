import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URLS } from './config';

// Import function to notify AuthContext of token expiration
let notifyTokenExpired = null;
try {
  const authContextModule = require('../../context/AuthContext');
  notifyTokenExpired = authContextModule.notifyTokenExpired;
} catch (error) {
  console.warn('[APIService] Could not import notifyTokenExpired:', error.message);
}

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
  }

  /**
   * Initialize tokens from storage
   */
  async initialize() {
    try {
      this.accessToken = await AsyncStorage.getItem('accessToken');
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
    if (notifyTokenExpired) {
      notifyTokenExpired();
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
        return false; // Mock token format issue, but don't expire it
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
      console.log('[APIService] JWT token - current time:', currentTime, 'expires:', payload.exp, 'will expire soon:', willExpireSoon);
      
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
      console.log('[API] Attempting to refresh token...');
      
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // Important: Send refresh token cookie
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[API] Token refreshed successfully, new token:', data.accessToken ? 'present' : 'missing');
        
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
        console.log('[API] Access token expired, attempting refresh...');
        
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
   * Check if user is authenticated (async - loads token if needed)
   */
  async isAuthenticated() {
    console.log('[APIService] Checking authentication...');
    
    // Make sure token is loaded from storage
    if (!this.accessToken) {
      await this.initialize();
    }
    
    console.log('[APIService] accessToken:', this.accessToken ? 'present' : 'null');
    
    if (!this.accessToken) {
      console.log('[APIService] No access token found');
      return false;
    }
    
    const isExpired = this.isTokenExpired(this.accessToken);
    console.log('[APIService] Token expired:', isExpired);
    
    const result = this.accessToken && !isExpired;
    console.log('[APIService] Authentication result:', result);
    
    return result;
  }

  /**
   * Check if user is authenticated (sync - only checks loaded token)
   */
  isAuthenticatedSync() {
    return this.accessToken && !this.isTokenExpired(this.accessToken);
  }
}

// Create singleton instance
const apiService = new APIService();
export default apiService;
