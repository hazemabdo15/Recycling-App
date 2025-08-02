import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, BASE_URLS } from './config';

let notifyTokenExpired = null;

const getNotifyTokenExpired = () => {
  if (!notifyTokenExpired) {
    try {
      const authContextModule = require('../../context/AuthContext');
      notifyTokenExpired = authContextModule.notifyTokenExpired;
    } catch (error) {

    }
  }
  return notifyTokenExpired;
};

class OptimizedAPIService {
  constructor() {
    this.baseURL = BASE_URLS.API;
    this.accessToken = null;
    this.isRefreshing = false;
    this.failedQueue = [];
    this.isInitialized = false;

    this.tokenCache = new Map();
    this.requestCache = new Map();
    this.lastTokenCheck = 0;
    this.pendingRequests = new Map();

    this.abortController = new AbortController();
    this.requestTimeouts = new Map();
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      this.accessToken = await AsyncStorage.getItem('accessToken');
      this.isInitialized = true;
    } catch (error) {
      console.error('API Service initialization failed:', error);
    }
  }

  async setAccessToken(token) {
    this.accessToken = token;
    if (token) {
      await AsyncStorage.setItem('accessToken', token);

      this.tokenCache.clear();
      this.lastTokenCheck = 0;
    } else {
      await AsyncStorage.removeItem('accessToken');
    }
  }

  async clearTokens() {
    this.accessToken = null;
    this.tokenCache.clear();
    this.lastTokenCheck = 0;
    await AsyncStorage.multiRemove(['accessToken', 'user']);

    const notify = getNotifyTokenExpired();
    if (notify) notify();
  }

  async resetAuthState() {
    this.accessToken = null;
    this.isRefreshing = false;
    this.failedQueue = [];
    this.isInitialized = false;
    this.tokenCache.clear();
    this.lastTokenCheck = 0;

    this.abortController.abort();
    this.abortController = new AbortController();
    this.clearAllTimeouts();
    
    await AsyncStorage.multiRemove(['accessToken', 'user']);
  }

  isTokenExpired(token) {
    if (!token) return true;

    const now = Date.now();
    const cacheKey = token.substring(0, 50);
    const cached = this.tokenCache.get(cacheKey);
    
    if (cached && (now - cached.timestamp) < 5000) {
      return cached.expired;
    }

    try {
      if (token.startsWith('mock.')) {
        const parts = token.split('.');
        if (parts.length >= 2) {
          const payload = JSON.parse(atob(parts[1]));
          const currentTime = Math.floor(Date.now() / 1000);
          const isExpired = currentTime >= payload.exp;

          this.tokenCache.set(cacheKey, { expired: isExpired, timestamp: now });
          return isExpired;
        }
        return false;
      }

      const parts = token.split('.');
      if (parts.length !== 3) return true;
      
      const base64Payload = parts[1];
      const paddedPayload = base64Payload + '='.repeat((4 - base64Payload.length % 4) % 4);
      const decoded = atob(paddedPayload);
      const payload = JSON.parse(decoded);
      const currentTime = Math.floor(Date.now() / 1000);
      const willExpireSoon = currentTime >= (payload.exp - 30);

      this.tokenCache.set(cacheKey, { expired: willExpireSoon, timestamp: now });
      return willExpireSoon;
    } catch (error) {

      this.tokenCache.set(cacheKey, { expired: true, timestamp: now });
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        await this.setAccessToken(data.accessToken);
        this.processQueue(null, data.accessToken);
        return data.accessToken;
      } else {
        this.processQueue(new Error('Token refresh failed'), null);
        await this.clearTokens();
        return null;
      }
    } catch (error) {
      this.processQueue(error, null);
      await this.clearTokens();
      return null;
    } finally {
      this.isRefreshing = false;
    }
  }

  createRequestTimeout(requestId, timeout = API_CONFIG.timeout) {
    const timeoutId = setTimeout(() => {
      const controller = this.pendingRequests.get(requestId);
      if (controller) {
        controller.abort();
        this.pendingRequests.delete(requestId);
      }
    }, timeout);

    this.requestTimeouts.set(requestId, timeoutId);
    return timeoutId;
  }

  clearRequestTimeout(requestId) {
    const timeoutId = this.requestTimeouts.get(requestId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.requestTimeouts.delete(requestId);
    }
  }

  clearAllTimeouts() {
    for (const timeoutId of this.requestTimeouts.values()) {
      clearTimeout(timeoutId);
    }
    this.requestTimeouts.clear();
  }

  async apiCall(endpoint, options = {}) {
    await this.initialize();

    const requestId = `${endpoint}-${Date.now()}-${Math.random()}`;
    const controller = new AbortController();
    this.pendingRequests.set(requestId, controller);

    const timeout = options.timeout || API_CONFIG.timeout;
    this.createRequestTimeout(requestId, timeout);

    try {
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
        credentials: 'include',
        signal: controller.signal
      };

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

      if (error.name !== 'AbortError') {

        if (error.message && error.message.includes('Category with ID') && error.message.includes('not found')) {
          console.log(`[API] ${endpoint}: Known category validation error detected - error handled by enhanced verification system`);
        } else {
          console.error(`[API] ${endpoint}:`, error.message);
        }
      }

      if (error.message === 'Session expired' || error.status === 401) {
        await this.clearTokens();
      }
      
      throw error;
    } finally {

      this.clearRequestTimeout(requestId);
      this.pendingRequests.delete(requestId);
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
    
    if (!this.accessToken) return false;
    
    const isExpired = this.isTokenExpired(this.accessToken);
    if (isExpired) {
      try {
        const newToken = await this.refreshToken();
        return !!newToken;
      } catch (error) {
        return false;
      }
    }
    
    return true;
  }

  isAuthenticatedSync() {
    return this.accessToken && !this.isTokenExpired(this.accessToken);
  }

  shouldRefreshToken() {
    if (!this.accessToken) return false;
    
    try {
      const payload = JSON.parse(atob(this.accessToken.split('.')[1]));
      const exp = payload.exp * 1000;
      const now = Date.now();
      const timeUntilExpiry = exp - now;
      const REFRESH_THRESHOLD = 5 * 60 * 1000;
      
      return timeUntilExpiry <= REFRESH_THRESHOLD && timeUntilExpiry > 0;
    } catch (error) {
      return false;
    }
  }

  async refreshIfNeeded() {
    if (this.shouldRefreshToken()) {
      try {
        await this.refreshToken();
        return true;
      } catch (error) {
        return false;
      }
    }
    return true;
  }

  destroy() {
    this.abortController.abort();
    this.clearAllTimeouts();
    this.tokenCache.clear();
    this.pendingRequests.clear();
  }
}

const optimizedApiService = new OptimizedAPIService();
export default optimizedApiService;
