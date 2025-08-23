import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useStock } from "../context/StockContext";
import { categoriesAPI } from "../services/api";
import networkUtils from "../utils/networkUtils";
export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasFailedOnce, setHasFailedOnce] = useState(false);
  const { user } = useAuth();
  const { updateBulkStock } = useStock();

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await categoriesAPI.getAllCategories(user?.role || "customer");
      console.log("[useAPI] Fetched categories:", data);
      const categoriesData = data.data || [];
      setCategories(categoriesData);
      
      // Extract and update stock quantities from category items
      const stockUpdates = {};
      categoriesData.forEach(category => {
        if (category.items && Array.isArray(category.items)) {
          category.items.forEach(item => {
            if (item._id && typeof item.quantity === 'number') {
              stockUpdates[item._id] = item.quantity;
            }
          });
        }
      });
      
      if (Object.keys(stockUpdates).length > 0) {
        console.log('🔄 [useCategories] Updating stock context with fresh API data:', Object.keys(stockUpdates).length, 'items');
        updateBulkStock(stockUpdates);
      }
      
      setError(null);
      setHasFailedOnce(false);
    } catch (err) {
      setError(err.message);
      setHasFailedOnce(true);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [user?.role, updateBulkStock]);

  // Initial fetch
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Network monitoring for auto-retry
  useEffect(() => {
    const handleNetworkChange = (isOnline) => {
      console.log('[useCategories] Network status changed:', isOnline);
      // Only retry if we previously failed and now have connection
      if (isOnline && hasFailedOnce && !loading) {
        console.log('[useCategories] Auto-retrying categories fetch after reconnection');
        fetchCategories();
      }
    };

    // Start monitoring network status
    networkUtils.startMonitoring();
    const unsubscribe = networkUtils.addListener(handleNetworkChange);

    return () => {
      unsubscribe();
    };
  }, [hasFailedOnce, loading, fetchCategories]);

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
  };
};
export const useAllItems = () => {
  const { user } = useAuth();
  const { updateBulkStock } = useStock();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasFailedOnce, setHasFailedOnce] = useState(false);

  const fetchAllItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await categoriesAPI.getAllItems(user?.role || "customer");

      const itemsArray = data.data?.items || data.items;
      const processedItems = Array.isArray(itemsArray) ? itemsArray : [];
      setItems(processedItems);
      
      // Update stock context with fresh stock data from API
      if (processedItems.length > 0) {
        const stockUpdates = {};
        processedItems.forEach(item => {
          if (item._id && typeof item.quantity === 'number') {
            stockUpdates[item._id] = item.quantity;
          }
        });
        
        if (Object.keys(stockUpdates).length > 0) {
          console.log('🔄 [useAllItems] Updating stock context with fresh API data:', Object.keys(stockUpdates).length, 'items');
          updateBulkStock(stockUpdates);
        }
      }
      
      setError(null);
      setHasFailedOnce(false);
    } catch (err) {
      setError(err.message);
      setHasFailedOnce(true);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user?.role, updateBulkStock]);

  // Initial fetch
  useEffect(() => {
    fetchAllItems();
  }, [fetchAllItems]);

  // Network monitoring for auto-retry
  useEffect(() => {
    const handleNetworkChange = (isOnline) => {
      console.log('[useAllItems] Network status changed:', isOnline);
      // Only retry if we previously failed and now have connection
      if (isOnline && hasFailedOnce && !loading) {
        console.log('[useAllItems] Auto-retrying all items fetch after reconnection');
        fetchAllItems();
      }
    };

    // Start monitoring network status
    networkUtils.startMonitoring();
    const unsubscribe = networkUtils.addListener(handleNetworkChange);

    return () => {
      unsubscribe();
    };
  }, [hasFailedOnce, loading, fetchAllItems]);

  return {
    items,
    loading,
    error,
    refetch: fetchAllItems,
  };
};
export const useCategoryItems = (categoryName) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasFailedOnce, setHasFailedOnce] = useState(false);
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
        itemsData.forEach(item => {
          if (item._id && typeof item.quantity === 'number') {
            stockUpdates[item._id] = item.quantity;
          }
        });
        
        if (Object.keys(stockUpdates).length > 0) {
          console.log('🔄 [useCategoryItems] Updating stock context with fresh API data:', Object.keys(stockUpdates).length, 'items');
          updateBulkStock(stockUpdates);
        }
      }
      
      setError(null);
      setHasFailedOnce(false);
    } catch (err) {
      setError(err.message);
      setHasFailedOnce(true);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [categoryName, user?.role, updateBulkStock]);

  // Initial fetch
  useEffect(() => {
    fetchCategoryItems();
  }, [fetchCategoryItems]);

  // Network monitoring for auto-retry
  useEffect(() => {
    const handleNetworkChange = (isOnline) => {
      console.log('[useCategoryItems] Network status changed:', isOnline);
      // Only retry if we previously failed and now have connection
      if (isOnline && hasFailedOnce && !loading && categoryName) {
        console.log('[useCategoryItems] Auto-retrying category items fetch after reconnection');
        fetchCategoryItems();
      }
    };

    // Start monitoring network status
    networkUtils.startMonitoring();
    const unsubscribe = networkUtils.addListener(handleNetworkChange);

    return () => {
      unsubscribe();
    };
  }, [hasFailedOnce, loading, categoryName, fetchCategoryItems]);

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
