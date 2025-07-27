import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URLS } from './config';

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

class APIService {
  constructor() {
    this.baseURL = BASE_URLS.API;
    this.accessToken = null;
    this.isRefreshing = false;
    this.failedQueue = [];
    this.isInitialized = false;
  }

  
  async initialize() {
    if (this.isInitialized) {
      return;
    }
    
    try {
      this.accessToken = await AsyncStorage.getItem('accessToken');
      console.log('[APIService] Initializing...', this.accessToken ? 'Token found' : 'No token');
      
      if (this.accessToken) {

        await this.refreshIfNeeded();
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize API service:', error);
    }
  }

  
  async setAccessToken(token) {
    console.log('[APIService] setAccessToken called with:', token ? 'token provided' : 'no token');
    this.accessToken = token;
    if (token) {
      await AsyncStorage.setItem('accessToken', token);
      console.log('[APIService] Token stored in memory and AsyncStorage');
    } else {
      await AsyncStorage.removeItem('accessToken');
      console.log('[APIService] Token removed from memory and AsyncStorage');
    }
  }

  
  async clearTokens() {
    console.log('[APIService] clearTokens() called');
    console.log('[APIService] Stack trace:', new Error().stack);
    
    this.accessToken = null;
    await AsyncStorage.multiRemove(['accessToken', 'user']);

    const notify = getNotifyTokenExpired();
    if (notify) {
      console.log('[APIService] Calling notifyTokenExpired()');
      notify();
    }
  }

  // Reset all authentication state (used during logout)
  async resetAuthState() {
    console.log('[APIService] Resetting authentication state...');
    
    // Clear tokens and storage
    this.accessToken = null;
    this.isRefreshing = false;
    this.failedQueue = [];
    this.isInitialized = false;
    
    // Clear AsyncStorage
    await AsyncStorage.multiRemove(['accessToken', 'user']);
    
    console.log('[APIService] Authentication state reset complete');
  }

  
  async getAccessToken() {
    if (!this.accessToken) {
      await this.initialize();
    }
    return this.accessToken;
  }

  
  isTokenExpired(token) {
    try {
      console.log('[APIService] Checking token expiration for:', token ? 'token present' : 'no token');
      
      if (!token) {
        console.log('[APIService] No token provided');
        return true;
      }

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

      const parts = token.split('.');
      if (parts.length !== 3) {
        console.log('[APIService] Invalid JWT format');
        return true;
      }
      
      const base64Payload = parts[1];
      const paddedPayload = base64Payload + '='.repeat((4 - base64Payload.length % 4) % 4);

      const decoded = atob(paddedPayload);
      const payload = JSON.parse(decoded);
      const currentTime = Math.floor(Date.now() / 1000);

      const willExpireSoon = currentTime >= (payload.exp - 30);

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

  
  async refreshToken() {
    if (this.isRefreshing) {

      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
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

  
  async apiCall(endpoint, options = {}) {
    await this.initialize();

    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    const requestOptions = {
      ...options,
      headers,
      credentials: 'include'
    };

    try {
      let response = await fetch(url, requestOptions);

      if (response.status === 401 && this.accessToken && !endpoint.includes('/auth/refresh')) {
        const newToken = await this.refreshToken();
        if (newToken) {

          headers.Authorization = `Bearer ${newToken}`;
          response = await fetch(url, {
            ...requestOptions,
            headers
          });
        } else {
          throw new Error('Session expired');
        }
      }

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

      if (error.message === 'Session expired' || error.status === 401) {
        await this.clearTokens();
      }
      
      throw error;
    }
  }

  
  async get(endpoint, options = {}) {
    return this.apiCall(endpoint, { method: 'GET', ...options });
  }

  async post(endpoint, data, options = {}) {
    return this.apiCall(endpoint, {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
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

  
  async isAuthenticated() {

    if (!this.accessToken) {
      await this.initialize();
    }
    
    if (!this.accessToken) {
      return false;
    }
    
    const isExpired = this.isTokenExpired(this.accessToken);

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

  
  shouldRefreshToken() {
    if (!this.accessToken) {
      console.log('[APIService] shouldRefreshToken: No token available');
      return false;
    }
    
    try {
      const payload = JSON.parse(atob(this.accessToken.split('.')[1]));
      const exp = payload.exp * 1000;
      const now = Date.now();
      const timeUntilExpiry = exp - now;

      const REFRESH_THRESHOLD = 5 * 60 * 1000;
      
      const shouldRefresh = timeUntilExpiry <= REFRESH_THRESHOLD && timeUntilExpiry > 0;
      
      console.log('[APIService] shouldRefreshToken check:', {
        tokenExpiry: new Date(exp).toISOString(),
        currentTime: new Date(now).toISOString(),
        timeUntilExpiry: Math.round(timeUntilExpiry / 1000 / 60) + ' minutes',
        refreshThreshold: Math.round(REFRESH_THRESHOLD / 1000 / 60) + ' minutes',
        shouldRefresh
      });
      
      return shouldRefresh;
    } catch (error) {
      console.error('[APIService] Error checking token refresh need:', error);
      return false;
    }
  }

  
  async refreshIfNeeded() {
    console.log('[APIService] refreshIfNeeded called');
    
    if (this.shouldRefreshToken()) {
      console.log('[APIService] Token needs refresh, attempting refresh...');
      try {
        await this.refreshToken();
        console.log('[APIService] Token refresh successful');
        return true;
      } catch (error) {
        console.error('[APIService] Proactive token refresh failed:', error);
        return false;
      }
    }
    
    console.log('[APIService] Token refresh not needed');
    return true;
  }
  isAuthenticatedSync() {
    return this.accessToken && !this.isTokenExpired(this.accessToken);
  }
}

const apiService = new APIService();
export default apiService;
