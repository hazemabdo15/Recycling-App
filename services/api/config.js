const API_BASE_URL = 'http://192.168.1.7:5000';

export const BASE_URLS = {
  API: `${API_BASE_URL}/api`,
  CART: `${API_BASE_URL}/api/cart`,
};

export const API_ENDPOINTS = {

  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER_INIT: `${API_BASE_URL}/api/auth/initiateSignup`,
    REGISTER_VERIFY: `${API_BASE_URL}/api/auth/verifyRegisterToken`,
    REFRESH: `${API_BASE_URL}/api/auth/refresh`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout`,
    FORGOT_PASSWORD: `${API_BASE_URL}/api/auth/forgotPassword`,
    RESET_PASSWORD: `${API_BASE_URL}/api/auth/resetPassword`,
  },

  CATEGORIES: `${API_BASE_URL}/api/categories`,
  ALL_ITEMS: `${API_BASE_URL}/api/categories/get-items`,
  CATEGORY_ITEMS: (categoryName) => `${API_BASE_URL}/api/categories/get-items/${categoryName}`,
  CART: `${API_BASE_URL}/api/cart`,
  ADDRESSES: `${API_BASE_URL}/api/addresses`,
  ORDERS: `${API_BASE_URL}/api/orders`,

  ANALYTICS: {
    ORDER_ANALYTICS: `${API_BASE_URL}/api/orders/analytics`,
    TOP_CITIES: `${API_BASE_URL}/api/orders/analytics/top-cities`,
    TOP_MATERIALS: `${API_BASE_URL}/api/top-materials-recycled`,
    TOP_USERS: `${API_BASE_URL}/api/top-users-points`,
  }
};

export const API_CONFIG = {
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
};

export const TOKEN_CONFIG = {
  ACCESS_TOKEN_KEY: 'accessToken',
  REFRESH_TOKEN_EXPIRES: 7 * 24 * 60 * 60 * 1000,
  ACCESS_TOKEN_EXPIRES: 15 * 60 * 1000,
  REFRESH_THRESHOLD: 5 * 60 * 1000,
};
