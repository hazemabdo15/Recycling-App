import { API_ENDPOINTS } from './config';
import itemsData from '../../data/items.json';

const fallbackCategories = [
  { _id: '1', name: 'Paper', arname: 'ورق', image: 'paper.png' },
  { _id: '2', name: 'Plastic', arname: 'بلاستيك', image: 'plastic.png' },
  { _id: '3', name: 'Metal', arname: 'معدن', image: 'metal.png' },
  { _id: '4', name: 'Glass', arname: 'زجاج', image: 'glass.png' }
];

const generateFallbackItems = () => {
  const items = [];
  let id = 1;
  for (const [name, details] of Object.entries(itemsData)) {
    items.push({
      _id: id.toString(),
      name,
      arname: details.arname,
      measurement_unit: details.unit,
      points: Math.floor(Math.random() * 100) + 50,
      price: Math.floor(Math.random() * 20) + 5,
      image: `${name.toLowerCase().replace(/\s+/g, '-')}.png`,
      categoryId: Math.floor(Math.random() * 4) + 1
    });
    id++;
  }
  return items;
};

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
      console.warn('Error fetching categories, using fallback data:', error.message);
      return fallbackCategories;
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
      console.warn('Error fetching all items, using fallback data:', error.message);
      return { items: generateFallbackItems() };
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
      console.warn(`Error fetching items for category ${categoryName}, using fallback data:`, error.message);
      const fallbackItems = generateFallbackItems().filter(item => 
        item.name.toLowerCase().includes(categoryName.toLowerCase()) ||
        categoryName.toLowerCase().includes('paper') && item.measurement_unit === 'KG'
      );
      return fallbackItems.slice(0, 10);
    }
  },
};