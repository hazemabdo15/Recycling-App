import itemsData from "../../data/items.json";
import coldStartHandler, { isColdStartError } from "../../utils/coldStartHandler";
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
        const result = await coldStartHandler.executeWithRetry(
          'categories-all',
          async () => {
            const response = await fetch(`${API_ENDPOINTS.CATEGORIES}&role=${role}`);
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            logger.api("Categories fetched from API", { count: data.length });
            return data;
          },
          {
            maxRetries: 3,
            onColdStartDetected: () => {
              console.log('[Categories API] Cold start detected for getAllCategories, warming up server...');
            },
            onRetry: (attempt, delay, isColdStartError) => {
              console.log(`[Categories API] Retry attempt ${attempt} for getAllCategories, delay: ${delay}ms, cold start: ${isColdStartError}`);
            },
            fallbackData: {
              success: false,
              data: fallbackCategories,
              message: 'Server is temporarily unavailable. Using cached data.'
            }
          }
        );

        if (result?.success !== false) {
          return result;
        } else {
          // Handle fallback data
          logger.api(
            "Using fallback categories data",
            {
              fallbackCount: result.data?.length || fallbackCategories.length,
            },
            "WARN"
          );
          return result;
        }
      } catch (error) {
        logger.api(
          "Failed to fetch categories, using fallback",
          {
            error: error.message,
            fallbackCount: fallbackCategories.length,
          },
          "WARN"
        );
        return { 
          success: false,
          data: fallbackCategories,
          message: isColdStartError(error)
            ? 'Server is not responding. Please try again in a few minutes.'
            : 'Failed to load categories'
        };
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
        
        const result = await coldStartHandler.executeWithRetry(
          'categories-all-items',
          async () => {
            const response = await fetch(`${API_ENDPOINTS.ALL_ITEMS}&role=${role}`);
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            logger.api("All items fetched from API", {
              count: data.data?.length || data.items?.length || 0,
            });
            return data;
          },
          {
            maxRetries: 3,
            onColdStartDetected: () => {
              console.log('[Categories API] Cold start detected for getAllItems, warming up server...');
            },
            onRetry: (attempt, delay, isColdStartError) => {
              console.log(`[Categories API] Retry attempt ${attempt} for getAllItems, delay: ${delay}ms, cold start: ${isColdStartError}`);
            },
            fallbackData: {
              success: false,
              data: { items: generateFallbackItems() },
              message: 'Server is temporarily unavailable. Using cached data.'
            }
          }
        );

        if (result?.success !== false) {
          return result;
        } else {
          // Handle fallback data
          const fallbackItems = result.data?.items || generateFallbackItems();
          logger.api(
            "Using fallback items data",
            {
              fallbackCount: fallbackItems.length,
            },
            "WARN"
          );
          return result;
        }
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
        return { 
          success: false,
          data: { items: fallbackItems },
          message: isColdStartError(error)
            ? 'Server is not responding. Please try again in a few minutes.'
            : 'Failed to load items'
        };
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
        
        const result = await coldStartHandler.executeWithRetry(
          `category-items-${categoryName}`,
          async () => {
            const response = await fetch(`${API_ENDPOINTS.CATEGORY_ITEMS(categoryName)}&role=${role}`);
            
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
          },
          {
            maxRetries: 3,
            onColdStartDetected: () => {
              console.log(`[Categories API] Cold start detected for getCategoryItems (${categoryName}), warming up server...`);
            },
            onRetry: (attempt, delay, isColdStartError) => {
              console.log(`[Categories API] Retry attempt ${attempt} for getCategoryItems (${categoryName}), delay: ${delay}ms, cold start: ${isColdStartError}`);
            },
            fallbackData: {
              success: false,
              data: [],
              message: 'Server is temporarily unavailable. Please try again in a few moments.'
            }
          }
        );

        if (result?.success !== false) {
          return result;
        } else {
          // Handle fallback data - generate filtered fallback items
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
            "Using fallback category items data",
            {
              categoryName,
              fallbackCount: fallbackItems.length,
            },
            "WARN"
          );

          return { 
            success: false,
            data: fallbackItems.slice(0, 10),
            message: result.message
          };
        }
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

        return { 
          success: false,
          data: fallbackItems.slice(0, 10),
          message: isColdStartError(error)
            ? 'Server is not responding. Please try again in a few minutes.'
            : 'Failed to load category items'
        };
      }
    }, "categories-get-items");
  },
};
