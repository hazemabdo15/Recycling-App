

import { getApiConfig, isDevelopment } from '../../config/env';
import logger from '../../utils/logger';

const apiConfig = getApiConfig();
export const API_BASE_URL = apiConfig.baseUrl;

if (isDevelopment()) {
  logger.info('API Configuration loaded', {
    baseUrl: API_BASE_URL,
    timeout: apiConfig.timeout,
    retries: apiConfig.retries
  }, 'API');
}

export const BASE_URLS = {
  API: `${API_BASE_URL}/api`,
  CART: `${API_BASE_URL}/api/cart`,
};

export const API_ENDPOINTS = {

  HEALTH: `${API_BASE_URL}/health`,

  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER_INIT: `${API_BASE_URL}/api/auth/initiateSignup`,
    REGISTER_VERIFY_OTP: `${API_BASE_URL}/api/auth/verifyOtp`,
    REGISTER_CREATE_USER: `${API_BASE_URL}/api/auth/register`,
    REFRESH: `${API_BASE_URL}/api/auth/refresh`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout`,
    FORGOT_PASSWORD: `${API_BASE_URL}/api/auth/forgotPassword`,
    RESET_PASSWORD: `${API_BASE_URL}/api/auth/resetPassword`,
  },

  CATEGORIES: `${API_BASE_URL}/api/categories?skip=0&limit=100`,
  ALL_ITEMS: `${API_BASE_URL}/api/categories/get-items?all=true`,
  CATEGORY_ITEMS: (categoryName) => `${API_BASE_URL}/api/categories/get-items/${categoryName}?skip=0&limit=100`,
  CART: `${API_BASE_URL}/api/cart`,
  ADDRESSES: `${API_BASE_URL}/api/addresses`,
  ORDERS: `${API_BASE_URL}/api/orders`,
  NOTIFICATIONS: `${API_BASE_URL}/api/notifications`,

  ANALYTICS: {
    ORDER_ANALYTICS: `${API_BASE_URL}/api/orders/analytics`,
    TOP_CITIES: `${API_BASE_URL}/api/orders/analytics/top-cities`,
    TOP_MATERIALS: `${API_BASE_URL}/api/top-materials-recycled`,
    TOP_USERS: `${API_BASE_URL}/api/top-users-points`,
  },

  PAYMENTS: {
    CREATE_SESSION: (userId) => `${API_BASE_URL}/api/users/${userId}/create-checkout-session`,
  }
};

export const API_CONFIG = {
  timeout: apiConfig.timeout,
  retries: apiConfig.retries,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  credentials: 'include',
};

export const TOKEN_CONFIG = {
  ACCESS_TOKEN_KEY: 'accessToken',
  REFRESH_TOKEN_KEY: 'refreshToken',
  USER_KEY: 'user',
  REFRESH_TOKEN_EXPIRES: 7 * 24 * 60 * 60 * 1000,
  ACCESS_TOKEN_EXPIRES: 15 * 60 * 1000,
  REFRESH_THRESHOLD: 5 * 60 * 1000,
};

export const INTERCEPTOR_CONFIG = {
  request: {
    timeout: apiConfig.timeout,
    retryDelay: 1000,
    maxRetries: apiConfig.retries,
  },
  response: {
    successCodes: [200, 201, 202, 204],
    retryableCodes: [408, 429, 500, 502, 503, 504],
    authErrorCodes: [401, 403],
  }
};

export const getEndpointUrl = (endpoint) => {
  if (typeof endpoint === 'function') {
    logger.warn('Dynamic endpoint function called without parameters', { endpoint: endpoint.toString() }, 'API');
    return null;
  }
  return endpoint;
};

export const validateEndpoint = (url) => {
  try {
    new URL(url);
    return true;
  } catch (_error) {
    logger.error('Invalid endpoint URL', { url }, 'API');
    return false;
  }
};

export const NETWORK_CONFIG = {
  timeout: apiConfig.timeout,
  retryAttempts: apiConfig.retries,
  retryDelay: 1000,
  offlineRetryDelay: 5000,
  connectionCheckUrl: `${API_BASE_URL}/health`,
};

export default {
  API_BASE_URL,
  BASE_URLS,
  API_ENDPOINTS,
  API_CONFIG,
  TOKEN_CONFIG,
  INTERCEPTOR_CONFIG,
  NETWORK_CONFIG,
};
