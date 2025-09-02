import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocalization } from "../context/LocalizationContext";
import { useStock } from "../context/StockContext";
import { categoriesAPI } from "../services/api";
import { extractNameFromMultilingual } from "../utils/translationHelpers";
export const useCategories = () => {
  const { user } = useAuth();
  const { updateBulkStock } = useStock();

  // Use React Query for automatic deduplication and caching
  const categoriesQuery = useQuery({
    queryKey: ['categories', user?.role || 'customer'],
    queryFn: async () => {
      console.log('[useCategories] Fetching categories for role:', user?.role || 'customer');
      const data = await categoriesAPI.getAllCategories(user?.role || "customer");
      console.log("[useAPI] Fetched categories:", data);
      const categoriesData = data.data || [];

      // Extract and update stock quantities from category items
      const stockUpdates = {};
      categoriesData.forEach((category) => {
        if (category.items && Array.isArray(category.items)) {
          category.items.forEach((item) => {
            if (item._id && typeof item.quantity === "number") {
              stockUpdates[item._id] = item.quantity;
            }
          });
        }
      });

      if (Object.keys(stockUpdates).length > 0) {
        console.log(
          "🔄 [useCategories] Updating stock context with fresh API data:",
          Object.keys(stockUpdates).length,
          "items"
        );
        updateBulkStock(stockUpdates);
      }

      return categoriesData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 2,
    enabled: true,
  });

  return {
    categories: categoriesQuery.data || [],
    loading: categoriesQuery.isLoading,
    error: categoriesQuery.error?.message || null,
    refetch: categoriesQuery.refetch,
  };
};
export const useAllItems = () => {
  const { user } = useAuth();
  const { updateBulkStock } = useStock();

  // Use React Query for automatic deduplication and caching
  const itemsQuery = useQuery({
    queryKey: ['items', 'all', user?.role || 'customer'],
    queryFn: async () => {
      console.log('[useAllItems] 🚀 SINGLE FETCH for all items (role:', user?.role || 'customer', ')');
      const data = await categoriesAPI.getAllItems(user?.role || 'customer');

      const itemsArray = data.data?.items || data.items;
      const processedItems = Array.isArray(itemsArray) ? itemsArray : [];

      // Update stock context with fresh stock data from API
      if (processedItems.length > 0) {
        const stockUpdates = {};
        processedItems.forEach((item) => {
          if (item._id && typeof item.quantity === "number") {
            stockUpdates[item._id] = item.quantity;
          }
        });

        if (Object.keys(stockUpdates).length > 0) {
          console.log(
            "🔄 [useAllItems] Updating stock context with fresh API data:",
            Object.keys(stockUpdates).length,
            "items"
          );
          updateBulkStock(stockUpdates);
        }
      }

      console.log('[useAllItems] ✅ Fetch completed, processed', processedItems.length, 'items');
      return processedItems;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - data is considered fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch on component mount
    refetchOnReconnect: false,
    retry: 2,
    enabled: true, // Always enabled, but React Query will deduplicate
  });

  // Debug when this hook is called
  useEffect(() => {
    console.log('[useAllItems] 🔍 Hook called by component, query state:', {
      isLoading: itemsQuery.isLoading,
      isFetching: itemsQuery.isFetching,
      dataLength: itemsQuery.data?.length || 0,
      cacheStatus: itemsQuery.isStale ? 'stale' : 'fresh'
    });
  }, [itemsQuery.isLoading, itemsQuery.isFetching, itemsQuery.data?.length, itemsQuery.isStale]);

  return {
    items: itemsQuery.data || [],
    loading: itemsQuery.isLoading,
    error: itemsQuery.error?.message || null,
    refetch: itemsQuery.refetch,
  };
};
export const useCategoryItems = (categoryName) => {
  // Get all items from cache instead of making separate API calls
  const { items: allItems, loading: allItemsLoading, error: allItemsError, refetch: refetchAllItems } = useAllItems();
  const { currentLanguage } = useLocalization();

  // Filter items by category from cached data
  const items = useMemo(() => {
    if (!categoryName || !allItems) {
      return [];
    }

    console.log(`[useCategoryItems] 🔍 Filtering cached items for category: ${categoryName} from ${allItems?.length || 0} total items`);
    
    try {
      // Handle different data structures - check if data is wrapped in 'data' or 'items'
      const itemsArray = allItems.data || allItems.items || allItems;
      
      if (!itemsArray || itemsArray.length === 0) {
        console.log('[useCategoryItems] 📭 No items array available for filtering');
        return [];
      }
      
      const filtered = itemsArray.filter(item => {
        // Use categoryDisplayName first (it's already a string), 
        // or extract from multilingual categoryName object
        const itemCategory = item.categoryDisplayName || 
                           (item.categoryName && typeof item.categoryName === 'object' 
                             ? extractNameFromMultilingual(item.categoryName, currentLanguage)
                             : item.categoryName);
        
        const matches = itemCategory && itemCategory.toLowerCase() === categoryName.toLowerCase();
        
        if (matches) {
          console.log(`[useCategoryItems] 🎯 Item matched: ${item.displayName || item.name?.en || item.name} (category: ${itemCategory})`);
        }
        
        return matches;
      });
      
      console.log(`[useCategoryItems] ✅ Filtered ${filtered.length} items for category: ${categoryName}`);
      
      // Debug logging if no items found
      if (filtered.length === 0 && itemsArray.length > 0) {
        console.log('[useCategoryItems] 🔍 No items found. Sample items structure:', itemsArray.slice(0, 3).map(item => ({
          name: item.name,
          categoryName: item.categoryName,
          categoryDisplayName: item.categoryDisplayName,
          displayName: item.displayName,
          _id: item._id
        })));
      }
      
      return filtered;
    } catch (error) {
      console.error('[useCategoryItems] ⚠️ Error filtering items:', error.message, error);
      return [];
    }
  }, [allItems, categoryName, currentLanguage]);

  // Create a refetch function that refetches all items
  const refetch = useCallback(async () => {
    console.log('[useCategoryItems] 🔄 Refetching via useAllItems cache refresh');
    return refetchAllItems();
  }, [refetchAllItems]);

  return {
    items,
    loading: allItemsLoading,
    error: allItemsError?.message || null,
    refetch,
  };
};
