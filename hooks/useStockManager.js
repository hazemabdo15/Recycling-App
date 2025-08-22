import { useCallback, useEffect, useState } from 'react';
import { useStock } from '../context/StockContext';

/**
 * Custom hook to manage stock quantities with real-time updates
 * Provides easy integration with components that need stock information
 */
export const useStockManager = () => {
  const {
    stockQuantities,
    isConnected,
    lastUpdated,
    getStockQuantity,
    updateLocalStock,
    updateBulkStock,
    isInStock,
    reconnect,
  } = useStock();

  // Track which items have been recently updated to show visual feedback
  const [recentlyUpdatedItems, setRecentlyUpdatedItems] = useState(new Set());

  // Clear recently updated items after a delay
  useEffect(() => {
    if (recentlyUpdatedItems.size > 0) {
      const timer = setTimeout(() => {
        setRecentlyUpdatedItems(new Set());
      }, 3000); // Clear after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [recentlyUpdatedItems]);

  // Track updates to highlight changed items
  useEffect(() => {
    if (lastUpdated) {
      const updatedItems = new Set();
      Object.keys(stockQuantities).forEach(itemId => {
        updatedItems.add(itemId);
      });
      setRecentlyUpdatedItems(updatedItems);
    }
  }, [lastUpdated, stockQuantities]);

  // Get stock with default fallback
  const getItemStock = useCallback((itemId, fallbackQuantity = 0) => {
    if (!itemId) return fallbackQuantity;
    return getStockQuantity(itemId) ?? fallbackQuantity;
  }, [getStockQuantity]);

  // Check if item was recently updated (for UI feedback)
  const wasRecentlyUpdated = useCallback((itemId) => {
    return recentlyUpdatedItems.has(itemId);
  }, [recentlyUpdatedItems]);

  // Validate if requested quantity is available
  const validateQuantity = useCallback((itemId, requestedQuantity) => {
    const availableStock = getItemStock(itemId);
    const isValid = availableStock >= requestedQuantity;
    
    return {
      isValid,
      availableStock,
      requestedQuantity,
      shortage: isValid ? 0 : requestedQuantity - availableStock
    };
  }, [getItemStock]);

  // Get stock status for display
  const getStockStatus = useCallback((itemId, requestedQuantity = 1) => {
    const stock = getItemStock(itemId);
    const validation = validateQuantity(itemId, requestedQuantity);
    
    let status = 'available';
    if (stock === 0) {
      status = 'out-of-stock';
    } else if (stock <= 5) {
      status = 'low-stock';
    } else if (!validation.isValid) {
      status = 'insufficient';
    }
    
    return {
      status,
      quantity: stock,
      ...validation
    };
  }, [getItemStock, validateQuantity]);

  // Update multiple items at once
  const syncItemsStock = useCallback((items) => {
    if (!Array.isArray(items) || items.length === 0) return;
    
    const stockUpdates = {};
    items.forEach(item => {
      if (item._id && item.quantity !== undefined) {
        stockUpdates[item._id] = item.quantity;
      }
    });
    
    if (Object.keys(stockUpdates).length > 0) {
      updateBulkStock(stockUpdates);
    }
  }, [updateBulkStock]);

  // Optimistically decrease stock (for immediate UI feedback)
  const decreaseStock = useCallback((itemId, quantity) => {
    const currentStock = getItemStock(itemId);
    const newStock = Math.max(0, currentStock - quantity);
    updateLocalStock(itemId, newStock);
    
    return {
      oldQuantity: currentStock,
      newQuantity: newStock,
      wasSuccessful: currentStock >= quantity
    };
  }, [getItemStock, updateLocalStock]);

  // Optimistically increase stock (for order cancellations, etc.)
  const increaseStock = useCallback((itemId, quantity) => {
    const currentStock = getItemStock(itemId);
    const newStock = currentStock + quantity;
    updateLocalStock(itemId, newStock);
    
    return {
      oldQuantity: currentStock,
      newQuantity: newStock
    };
  }, [getItemStock, updateLocalStock]);

  return {
    // Stock data
    stockQuantities,
    isConnected,
    lastUpdated,
    
    // Stock operations
    getItemStock,
    validateQuantity,
    getStockStatus,
    isInStock,
    
    // Bulk operations
    syncItemsStock,
    updateBulkStock,
    
    // Optimistic updates
    decreaseStock,
    increaseStock,
    
    // UI helpers
    wasRecentlyUpdated,
    
    // Connection management
    reconnect,
  };
};

/**
 * Hook for components that need to track stock for specific items
 * Automatically filters and manages stock for provided item IDs
 */
export const useItemsStock = (itemIds = []) => {
  const stockManager = useStockManager();
  const [itemsStock, setItemsStock] = useState({});

  // Update items stock when stockQuantities or itemIds change
  useEffect(() => {
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      setItemsStock({});
      return;
    }

    const newItemsStock = {};
    itemIds.forEach(itemId => {
      if (itemId) {
        newItemsStock[itemId] = stockManager.getItemStock(itemId);
      }
    });
    
    setItemsStock(newItemsStock);
  }, [itemIds, stockManager]);

  // Get stock for specific item from filtered list
  const getStock = useCallback((itemId) => {
    return itemsStock[itemId] || 0;
  }, [itemsStock]);

  // Check if any items are out of stock
  const hasOutOfStockItems = useCallback(() => {
    return Object.values(itemsStock).some(quantity => quantity === 0);
  }, [itemsStock]);

  // Get list of out of stock item IDs
  const getOutOfStockItems = useCallback(() => {
    return Object.entries(itemsStock)
      .filter(([, quantity]) => quantity === 0)
      .map(([itemId]) => itemId);
  }, [itemsStock]);

  return {
    ...stockManager,
    itemsStock,
    getStock,
    hasOutOfStockItems,
    getOutOfStockItems,
  };
};

export default useStockManager;
