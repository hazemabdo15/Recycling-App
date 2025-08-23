import itemsData from "../../data/items.json";
import logger from "../../utils/logger";
import { measureApiCall } from "../../utils/performanceMonitor";
import { extractNameFromMultilingual } from "../../utils/translationHelpers";
import { API_ENDPOINTS } from "./config";

const fallbackCategories = [
  { 
    _id: "1", 
    name: { en: "Paper", ar: "ورق" }, 
    image: "paper.png" 
  },
  { 
    _id: "2", 
    name: { en: "Plastic", ar: "بلاستيك" }, 
    image: "plastic.png" 
  },
  { 
    _id: "3", 
    name: { en: "Metal", ar: "معدن" }, 
    image: "metal.png" 
  },
  { 
    _id: "4", 
    name: { en: "Glass", ar: "زجاج" }, 
    image: "glass.png" 
  },
];

const generateFallbackItems = () => {
  const items = [];
  let id = 1;
  for (const [name, details] of Object.entries(itemsData)) {
    items.push({
      _id: id.toString(),
      name: { en: name, ar: details.arname },
      measurement_unit: details.unit,
      points: Math.floor(Math.random() * 100) + 50,
      price: Math.floor(Math.random() * 20) + 5,
      image: `${name.toLowerCase().replace(/\s+/g, "-")}.png`,
      categoryId: Math.floor(Math.random() * 4) + 1,
    });
    id++;
  }
  return items;
};

export const categoriesAPI = {
  getAllCategories: async (role = "customer") => {
    return measureApiCall(async () => {
      try {
        console.log(
          "[Categories API] Fetching categories for role:",
          JSON.stringify({ role })
        );
        
        // Add a timeout promise to prevent long loading times
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 5000);
        });
        
        const fetchPromise = fetch(`${API_ENDPOINTS.CATEGORIES}&role=${role}`);
        
        const response = await Promise.race([fetchPromise, timeoutPromise]);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        logger.api("Categories fetched from API", { count: data.length });
        return data;
      } catch (error) {
        logger.api(
          "Failed to fetch categories, using fallback",
          {
            error: error.message,
            fallbackCount: fallbackCategories.length,
          },
          "WARN"
        );
        return { data: fallbackCategories };
      }
    }, "categories-get-all");
  },

  getAllItems: async (role = "customer") => {
    return measureApiCall(async () => {
      try {
        logger.debug(
          "[Categories API] Fetching all items for role:",
          JSON.stringify({ role, endpoint: `${API_ENDPOINTS.ALL_ITEMS}?role=${role}` })
        );
        
        // Add a timeout promise to prevent long loading times
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 5000);
        });
        
        const fetchPromise = fetch(`${API_ENDPOINTS.ALL_ITEMS}&role=${role}`);
        
        const response = await Promise.race([fetchPromise, timeoutPromise]);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        logger.api("All items fetched from API", {
          count: data.data?.length || data.items?.length || 0,
        });
        return data;
      } catch (error) {
        const fallbackItems = generateFallbackItems();
        logger.api(
          "Failed to fetch all items, using fallback",
          {
            error: error.message,
            fallbackCount: fallbackItems.length,
          },
          "WARN"
        );
        return { data: { items: fallbackItems } };
      }
    }, "categories-get-all-items");
  },

  getCategoryItems: async (role = "customer", categoryName) => {
    return measureApiCall(async () => {
      try {
        logger.debug(
          "[Categories API] Fetching category items for:",
          JSON.stringify({ categoryName, role })
        );
        
        // Add a timeout promise to prevent long loading times
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 5000);
        });
        
        const fetchPromise = fetch(`${API_ENDPOINTS.CATEGORY_ITEMS(categoryName)}&role=${role}`);
        
        const response = await Promise.race([fetchPromise, timeoutPromise]);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        logger.api("Category items fetched from API", {
          categoryName,
          count: data.data?.length || data.length || 0,
        });
        console.log("[Categories API] Fetched category items:", data);
        return data;
      } catch (error) {
        const fallbackItems = generateFallbackItems().filter(
          (item) => {
            // Handle multilingual item names for filtering
            const itemNameEn = item.name?.en || item.name || '';
            const itemNameAr = item.name?.ar || '';
            
            // Safely extract category name from multilingual structure
            const categoryNameExtracted = extractNameFromMultilingual(categoryName, 'en');
            const categoryNameLower = categoryNameExtracted ? categoryNameExtracted.toLowerCase() : '';
            
            return itemNameEn.toLowerCase().includes(categoryNameLower) ||
                   itemNameAr.toLowerCase().includes(categoryNameLower) ||
                   (categoryNameLower.includes("paper") && item.measurement_unit === "KG");
          }
        );

        logger.api(
          "Failed to fetch category items, using fallback",
          {
            error: error.message,
            categoryName,
            fallbackCount: fallbackItems.length,
          },
          "WARN"
        );

        return { data: fallbackItems.slice(0, 10) };
      }
    }, "categories-get-items");
  },
};
