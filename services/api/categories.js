import itemsData from "../../data/items.json";
import apiCache from "../../utils/apiCache";
import logger from "../../utils/logger";
import { measureApiCall } from "../../utils/performanceMonitor";
import { API_ENDPOINTS } from "./config";

const fallbackCategories = [
  { _id: "1", name: "Paper", arname: "ورق", image: "paper.png" },
  { _id: "2", name: "Plastic", arname: "بلاستيك", image: "plastic.png" },
  { _id: "3", name: "Metal", arname: "معدن", image: "metal.png" },
  { _id: "4", name: "Glass", arname: "زجاج", image: "glass.png" },
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
      const cacheKey = apiCache.generateKey(`categories-${role}`);
      const cached = apiCache.get(cacheKey);
      if (cached) {
        logger.debug("Categories retrieved from cache", {
          count: cached.length,
        });
        return cached;
      }

      try {
        console.log(
          "[Categories API] Fetching categories for role:",
          JSON.stringify({ role })
        );
        const response = await fetch(
          `${API_ENDPOINTS.CATEGORIES}&role=${role}`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        apiCache.set(cacheKey, data, 10 * 60 * 1000); // Cache for 10 minutes

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
        return fallbackCategories;
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
        const response = await fetch(`${API_ENDPOINTS.ALL_ITEMS}&role=${role}`);
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
        return { items: fallbackItems };
      }
    }, "categories-get-all-items");
  },

  getCategoryItems: async (role = "customer", categoryName) => {
    return measureApiCall(async () => {
      try {
        const response = await fetch(
          `${API_ENDPOINTS.CATEGORY_ITEMS(categoryName)}&role=${role}`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        logger.api("Category items fetched from API", {
          categoryName,
          count: data.length || 0,
        });
        console.log("[Categories API] Fetched category items:", data);
        return data;
      } catch (error) {
        const fallbackItems = generateFallbackItems().filter(
          (item) =>
            item.name.toLowerCase().includes(categoryName.toLowerCase()) ||
            (categoryName.toLowerCase().includes("paper") &&
              item.measurement_unit === "KG")
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

        return fallbackItems.slice(0, 10);
      }
    }, "categories-get-items");
  },
};
