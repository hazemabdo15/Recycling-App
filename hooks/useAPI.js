import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useStock } from "../context/StockContext";
import { categoriesAPI } from "../services/api";
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
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const { updateBulkStock } = useStock();

  const fetchCategoryItems = useCallback(async () => {
    if (!categoryName) return;

    try {
      setLoading(true);
      setError(null);
      const data = await categoriesAPI.getCategoryItems(
        user?.role || "customer",
        categoryName
      );
      const itemsData = data.data || [];
      setItems(itemsData);

      // Update stock context with fresh stock data
      if (itemsData.length > 0) {
        const stockUpdates = {};
        itemsData.forEach((item) => {
          if (item._id && typeof item.quantity === "number") {
            stockUpdates[item._id] = item.quantity;
          }
        });

        if (Object.keys(stockUpdates).length > 0) {
          console.log(
            "🔄 [useCategoryItems] Updating stock context with fresh API data:",
            Object.keys(stockUpdates).length,
            "items"
          );
          updateBulkStock(stockUpdates);
        }
      }

      setError(null);
    } catch (err) {
      setError(err.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [categoryName, user?.role, updateBulkStock]);

  // Initial fetch
  useEffect(() => {
    fetchCategoryItems();
  }, [fetchCategoryItems]);

  const refetch = useCallback(async () => {
    await fetchCategoryItems();
  }, [fetchCategoryItems]);

  return {
    items,
    loading,
    error,
    refetch,
  };
};
