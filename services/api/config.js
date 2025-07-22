
const API_BASE_URL = 'http://192.168.0.165:5000';
export const API_ENDPOINTS = {
  CATEGORIES: `${API_BASE_URL}/api/categories`,
  ALL_ITEMS: `${API_BASE_URL}/api/categories/get-items`,
  CATEGORY_ITEMS: (categoryName) => `${API_BASE_URL}/api/categories/get-items/${categoryName}`,
};
export const API_CONFIG = {
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
};