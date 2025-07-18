import { API_ENDPOINTS } from './config';

export const categoriesAPI = {
  getAllCategories: async () => {
    try {
      const response = await fetch(API_ENDPOINTS.CATEGORIES);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  getAllItems: async () => {
    try {
      const response = await fetch(API_ENDPOINTS.ALL_ITEMS);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching all items:', error);
      throw error;
    }
  },

  getCategoryItems: async (categoryName) => {
    try {
      const response = await fetch(API_ENDPOINTS.CATEGORY_ITEMS(categoryName));
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching items for category ${categoryName}:`, error);
      throw error;
    }
  },
};
