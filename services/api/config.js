
const API_BASE_URL = 'http://192.168.1.11:5000';

// Base URLs for different services
export const BASE_URLS = {
  API: `${API_BASE_URL}/api`,
  CART: `${API_BASE_URL}/api/cart`,
};

// Specific API endpoints
export const API_ENDPOINTS = {
  CATEGORIES: `${API_BASE_URL}/api/categories`,
  ALL_ITEMS: `${API_BASE_URL}/api/categories/get-items`,
  CATEGORY_ITEMS: (categoryName) => `${API_BASE_URL}/api/categories/get-items/${categoryName}`,
  CART: BASE_URLS.CART,
};

export const API_CONFIG = {
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
};

// Export the base URL for cases where you need to construct custom endpoints
export { API_BASE_URL };
