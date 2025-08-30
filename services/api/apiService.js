import { router } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import { showGlobalToast } from "../../components/common/GlobalToast";
import i18next from "../../localization/i18n";
import { clearSession } from "../../utils/authUtils";
import { API_CONFIG, BASE_URLS } from "./config";
let notifyTokenExpired = null;

const getNotifyTokenExpired = () => {
  if (!notifyTokenExpired) {
    try {
      const authContextModule = require("../../context/AuthContext");
      notifyTokenExpired = authContextModule.notifyTokenExpired;
    } catch (_error) {}
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
      this.accessToken = await SecureStore.getItemAsync('accessToken');
      this.isInitialized = true;
    } catch (_error) {
      // console.error('API Service initialization failed:', _error);
    }
  }

  async setAccessToken(token) {
    this.accessToken = token;
    if (token) {
      // Only set to SecureStore directly to avoid circular calls
      try {
        await SecureStore.setItemAsync('accessToken', token);
        console.log(`[API] Access token saved to SecureStore`);
      } catch (error) {
        console.error('[API] Failed to save token to SecureStore:', error);
      }

      this.tokenCache.clear();
      this.lastTokenCheck = 0;
    } else {
      try {
        await SecureStore.deleteItemAsync('accessToken');
        console.log(`[API] Access token removed from SecureStore`);
      } catch (error) {
        console.error('[API] Failed to remove token from SecureStore:', error);
      }
    }
  }

  async clearTokens() {
    this.accessToken = null;
    this.tokenCache.clear();
    this.lastTokenCheck = 0;
    await clearSession();

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

    await clearSession();
  }

  isTokenExpired(token) {
    if (!token) return true;

    const now = Date.now();
    const cacheKey = token.substring(0, 50);
    const cached = this.tokenCache.get(cacheKey);

    if (cached && now - cached.timestamp < 5000) {
      return cached.expired;
    }

    try {
      if (token.startsWith("mock.")) {
        const parts = token.split(".");
        if (parts.length >= 2) {
          const payload = JSON.parse(atob(parts[1]));
          const currentTime = Math.floor(Date.now() / 1000);
          const isExpired = currentTime >= payload.exp;

          this.tokenCache.set(cacheKey, { expired: isExpired, timestamp: now });
          return isExpired;
        }
        return false;
      }

      const parts = token.split(".");
      if (parts.length !== 3) return true;

      const base64Payload = parts[1];
      const paddedPayload =
        base64Payload + "=".repeat((4 - (base64Payload.length % 4)) % 4);
      const decoded = atob(paddedPayload);
      const payload = JSON.parse(decoded);
      const currentTime = Math.floor(Date.now() / 1000);
      const willExpireSoon = currentTime >= payload.exp - 30;

      this.tokenCache.set(cacheKey, {
        expired: willExpireSoon,
        timestamp: now,
      });
      return willExpireSoon;
    } catch (_error) {
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
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log(
          "[Auth] Token refresh successful new Access token :",
          data.accessToken
        );
        await this.setAccessToken(data.accessToken);
        this.processQueue(null, data.accessToken);
        return data.accessToken;
      } else {
        this.processQueue(new Error("Token refresh failed"), null);
        await this.clearTokens();
        return null;
      }
    } catch (_error) {
      this.processQueue(_error, null);
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

    // Support for FormData retry: if options.body is a function, call it to get the body
    const getBody = () => {
      if (typeof options.body === 'function') {
        return options.body();
      }
      return options.body;
    };

    try {
      const url = endpoint.startsWith("http")
        ? endpoint
        : `${this.baseURL}${endpoint}`;
      const headers = {
        "Content-Type": "application/json",
        ...options.headers,
      };

      if (this.accessToken) {
        headers.Authorization = `Bearer ${this.accessToken}`;
      }

      let body = getBody();
      if (body instanceof FormData) {
        delete headers["Content-Type"];
      }

      const requestOptions = {
        ...options,
        headers,
        credentials: "include",
        signal: controller.signal,
        body,
      };

      let response = await fetch(url, requestOptions);

      if (
        response.status === 401 &&
        this.accessToken &&
        !endpoint.includes("/auth/refresh")
      ) {
        console.log(`[API] 401 detected for ${endpoint}, attempting refresh...`);
        const newToken = await this.refreshToken();
        if (newToken) {
          console.log(`[API] Refresh successful, retrying ${endpoint} with new token`);
          // Create fresh headers with new token
          const refreshedHeaders = {
            ...headers,
            Authorization: `Bearer ${newToken}`
          };
          // Recreate body for retry
          const retryBody = getBody();
          let retryOptions = {
            ...requestOptions,
            headers: refreshedHeaders,
            body: retryBody,
          };
          response = await fetch(url, retryOptions);
          console.log(`[API] Retry response status: ${response.status}`);
        } else {
          console.log(`[API] Refresh failed, logging out user`);
          // Show toast and redirect to login
          const message = i18next.t ? i18next.t('toast.auth.sessionExpired') : "Session expired, please log in again.";
          showGlobalToast(message, 1200);
          if (getNotifyTokenExpired()) getNotifyTokenExpired()();
          // Use expo-router to redirect
          setTimeout(() => {
            try {
              router.replace("/login");
            } catch (_e) {}
          }, 1000);
          throw new Error("Session expired");
        }
      }

      const contentType = response.headers.get("content-type");
      let data;

      if (contentType && contentType.includes("application/json")) {
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
      if (error.name !== "AbortError") {
        if (
          error.message &&
          error.message.includes("Category with ID") &&
          error.message.includes("not found")
        ) {
          console.log(
            `[API] ${endpoint}: Known category validation error detected - error handled by enhanced verification system`
          );
        } else {
          // Avoid noisy error logs for expected authentication failures like invalid credentials
          const isAuthFailure = error.status === 401;
          if (isAuthFailure && !this.accessToken) {
            // Login attempt failed - don't treat as session expiration or clear tokens.
            console.warn(`[API] ${endpoint}: ${error.message}`);
          } else {
            console.error(`[API] ${endpoint}:`, error.message);
          }
        }
      }

      // Only treat 401 as session expiration when we had an access token (user was authenticated).
      if (error.message === "Session expired" || (error.status === 401 && this.accessToken)) {
        await this.clearTokens();
        const message = i18next.t ? i18next.t('toast.auth.sessionExpired') : "Session expired, please log in again.";
        showGlobalToast(message, 1200);
        if (getNotifyTokenExpired()) getNotifyTokenExpired()();
        setTimeout(() => {
          try {
            router.replace("/login");
          } catch (_e) {}
        }, 1000);
      }

      throw error;
    } finally {
      this.clearRequestTimeout(requestId);
      this.pendingRequests.delete(requestId);
    }
  }

  async get(endpoint, options = {}) {
    return this.apiCall(endpoint, { method: "GET", ...options });
  }

  async post(endpoint, data, options = {}) {
    // If data is a function (for FormData), pass as is, else wrap as needed
    const isFormData = data instanceof FormData;
    const body = isFormData
      ? () => {
          // Always return a new FormData instance for retry
          const fd = new FormData();
          for (let [key, value] of data.entries()) {
            fd.append(key, value);
          }
          return fd;
        }
      : JSON.stringify(data);
    return this.apiCall(endpoint, {
      method: "POST",
      body,
      ...options,
    });
  }

  async put(endpoint, data, options = {}) {
    const isFormData = data instanceof FormData;
    const body = isFormData
      ? () => {
          const fd = new FormData();
          for (let [key, value] of data.entries()) {
            fd.append(key, value);
          }
          return fd;
        }
      : JSON.stringify(data);
    return this.apiCall(endpoint, {
      method: "PUT",
      body,
      ...options,
    });
  }

  async patch(endpoint, data, options = {}) {
    return this.apiCall(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
      ...options,
    });
  }

  async delete(endpoint, options = {}) {
    return this.apiCall(endpoint, { method: "DELETE", ...options });
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
      } catch (_error) {
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
      const payload = JSON.parse(atob(this.accessToken.split(".")[1]));
      const exp = payload.exp * 1000;
      const now = Date.now();
      const timeUntilExpiry = exp - now;
      const REFRESH_THRESHOLD = 5 * 60 * 1000;

      return timeUntilExpiry <= REFRESH_THRESHOLD && timeUntilExpiry > 0;
    } catch (_error) {
      return false;
    }
  }

  async refreshIfNeeded() {
    if (this.shouldRefreshToken()) {
      try {
        await this.refreshToken();
        return true;
      } catch (_error) {
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
