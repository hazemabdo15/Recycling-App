import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  addItemToCart,
  clearCart as apiClearCart,
  clearAuthData,
  getCart,
  getSessionId,
  removeItemFromCart,
  saveCart,
  testBackendConnectivity,
  testMinimalPost,
  updateCartItem,
} from "../services/api/cart.js";
import { normalizeItemData, validateQuantity } from "../utils/cartUtils";
import logger from '../utils/logger';
import { useAuth } from "./AuthContext";

const CartContext = createContext();

export const useCartContext = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { isLoggedIn, user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [removingItems, setRemovingItems] = useState(new Set());

  // Get session ID for guest users
  const getSessionIdQuery = useQuery({
    queryKey: ['sessionId'],
    queryFn: getSessionId,
    enabled: !isLoggedIn,
    staleTime: Infinity, // Session ID doesn't change often
  });

  const sessionId = getSessionIdQuery.data;

  // Cart query - fetches cart data with React Query
  const cartQuery = useQuery({
    queryKey: ['cart', isLoggedIn ? user?._id : sessionId],
    queryFn: () => getCart(isLoggedIn),
    enabled: !authLoading && (isLoggedIn || sessionId !== null),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });

  // Process cart data into the format expected by components
  const processCartData = useCallback((cartData) => {
    if (!cartData?.items) return { cartItems: {}, cartItemDetails: {} };

    const cartItems = {};
    const cartItemDetails = {};

    cartData.items.forEach((item) => {
      const itemKey = item._id;
      cartItems[itemKey] = item.quantity;
      cartItemDetails[itemKey] = {
        _id: item._id,
        categoryId: item.categoryId,
        name: item.name,
        image: item.image,
        points: item.points,
        price: item.price,
        categoryName: item.categoryName,
        measurement_unit: item.measurement_unit,
        quantity: item.quantity,
      };
    });

    return { cartItems, cartItemDetails };
  }, []);

  const { cartItems, cartItemDetails } = processCartData(cartQuery.data);

  // Update cart item mutation
  const updateCartMutation = useMutation({
    mutationFn: ({ item, quantity, measurementUnit }) =>
      updateCartItem(item, quantity, isLoggedIn, measurementUnit),
    onMutate: async ({ itemId, quantity }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['cart', isLoggedIn ? user?._id : sessionId] });

      // Snapshot the previous value
      const previousCart = queryClient.getQueryData(['cart', isLoggedIn ? user?._id : sessionId]);

      // Optimistically update the cache
      queryClient.setQueryData(['cart', isLoggedIn ? user?._id : sessionId], (old) => {
        if (!old?.items) return old;

        const updatedItems = old.items.map(cartItem =>
          cartItem._id === itemId ? { ...cartItem, quantity } : cartItem
        );

        return { ...old, items: updatedItems };
      });

      return { previousCart };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousCart) {
        queryClient.setQueryData(['cart', isLoggedIn ? user?._id : sessionId], context.previousCart);
      }
      logger.cart('Failed to update cart item', { error: err.message, itemId: variables.itemId }, 'ERROR');
    },
    onSettled: () => {
      // Always refetch after error or success to ensure cache consistency
      queryClient.invalidateQueries({ queryKey: ['cart', isLoggedIn ? user?._id : sessionId] });
    },
  });

  // Add item mutation
  const addItemMutation = useMutation({
    mutationFn: ({ item, isLoggedIn }) => addItemToCart(item, isLoggedIn),
    onMutate: async ({ item }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['cart', isLoggedIn ? user?._id : sessionId] });

      // Snapshot the previous value
      const previousCart = queryClient.getQueryData(['cart', isLoggedIn ? user?._id : sessionId]);

      // Optimistically update the cache by adding the new item
      queryClient.setQueryData(['cart', isLoggedIn ? user?._id : sessionId], (old) => {
        const newItem = {
          _id: item._id,
          categoryId: item.categoryId,
          categoryName: item.categoryName,
          name: item.name,
          image: item.image,
          points: item.points,
          price: item.price,
          measurement_unit: item.measurement_unit,
          quantity: item.quantity,
        };

        if (!old?.items) {
          return { ...old, items: [newItem] };
        }

        // Check if item already exists (shouldn't happen, but just in case)
        const existingIndex = old.items.findIndex(cartItem => cartItem._id === item._id);
        if (existingIndex >= 0) {
          // Update existing item
          const updatedItems = [...old.items];
          updatedItems[existingIndex] = { ...updatedItems[existingIndex], quantity: item.quantity };
          return { ...old, items: updatedItems };
        } else {
          // Add new item
          return { ...old, items: [...old.items, newItem] };
        }
      });

      return { previousCart };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousCart) {
        queryClient.setQueryData(['cart', isLoggedIn ? user?._id : sessionId], context.previousCart);
      }
      logger.cart('Failed to add item to cart', { error: err.message, itemId: variables.item._id }, 'ERROR');
    },
    onSettled: () => {
      // Always refetch after error or success to ensure cache consistency
      queryClient.invalidateQueries({ queryKey: ['cart', isLoggedIn ? user?._id : sessionId] });
    },
  });

  // Remove item mutation
  const removeItemMutation = useMutation({
    mutationFn: ({ itemId, isLoggedIn }) => removeItemFromCart(itemId, isLoggedIn),
    onMutate: async ({ itemId }) => {
      setRemovingItems(prev => new Set([...prev, itemId]));

      await queryClient.cancelQueries({ queryKey: ['cart', isLoggedIn ? user?._id : sessionId] });
      const previousCart = queryClient.getQueryData(['cart', isLoggedIn ? user?._id : sessionId]);

      queryClient.setQueryData(['cart', isLoggedIn ? user?._id : sessionId], (old) => {
        if (!old?.items) return old;
        return { ...old, items: old.items.filter(item => item._id !== itemId) };
      });

      return { previousCart };
    },
    onError: (err, variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(['cart', isLoggedIn ? user?._id : sessionId], context.previousCart);
      }
      logger.cart('Failed to remove item', { error: err.message, itemId: variables.itemId }, 'ERROR');
    },
    onSettled: (data, error, variables) => {
      setRemovingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(variables.itemId);
        return newSet;
      });
      queryClient.invalidateQueries({ queryKey: ['cart', isLoggedIn ? user?._id : sessionId] });
    },
  });

  // Clear cart mutation
  const clearCartMutation = useMutation({
    mutationFn: ({ isLoggedIn }) => apiClearCart(isLoggedIn),
    onSuccess: () => {
      queryClient.setQueryData(['cart', isLoggedIn ? user?._id : sessionId], { items: [] });
      logger.cart('Cart cleared successfully');
    },
    onError: (error) => {
      logger.cart('Failed to clear cart', { error: error.message }, 'ERROR');
    },
  });

  // Batch update mutation
  const batchUpdateMutation = useMutation({
    mutationFn: ({ cartItems, isLoggedIn }) => saveCart(cartItems, isLoggedIn),
    onSuccess: (data) => {
      queryClient.setQueryData(['cart', isLoggedIn ? user?._id : sessionId], data);
      logger.cart('Batch update completed successfully');
    },
    onError: (error) => {
      logger.cart('Batch update failed', { error: error.message }, 'ERROR');
    },
  });

  // Legacy compatibility functions
  const handleUpdateQuantity = async (itemId, quantity, measurementUnit = null, context = 'user-interaction', itemData = null) => {
    try {
      // Check if this is a new item (itemData provided and item not in cart)
      const isNewItem = itemData && !cartItemDetails[itemId];
      
      if (isNewItem) {
        // Use addItemMutation for new items - more efficient than updateCartItem
        console.log(`[CartContext] Adding new item to cart: ${itemData.name?.en || itemData.name}`);
        
        // Prepare item data for addItemToCart
        const itemToAdd = {
          ...itemData,
          quantity: quantity,
          measurement_unit: measurementUnit || itemData.measurement_unit
        };
        
        await addItemMutation.mutateAsync({
          item: itemToAdd,
          isLoggedIn
        });
        
        return { success: true };
      } else {
        // Use updateCartMutation for existing items
        const item = itemData || cartItemDetails[itemId];
        if (!item) {
          throw new Error(`Item ${itemId} not found in cart`);
        }

        await updateCartMutation.mutateAsync({
          itemId,
          item,
          quantity,
          measurementUnit: measurementUnit || item.measurement_unit
        });

        return { success: true };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const handleAddToCart = async (itemOrItems) => {
    try {
      const items = Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems];
      const normalizedItems = items.map(normalizeItemData);

      for (const item of normalizedItems) {
        validateQuantity(item);
        await addItemMutation.mutateAsync({ item, isLoggedIn });
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const handleRemoveFromCart = async (itemId, context = 'user-interaction') => {
    try {
      await removeItemMutation.mutateAsync({ itemId, isLoggedIn });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCartMutation.mutateAsync({ isLoggedIn });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const handleBatchUpdate = async (itemId, quantity, measurementUnit) => {
    try {
      // For batch updates, we'd need to construct the full cart items array
      // This is a simplified version - you might want to enhance this
      const updatedItems = cartQuery.data?.items?.map(item =>
        item._id === itemId ? { ...item, quantity, measurement_unit: measurementUnit } : item
      ) || [];

      await batchUpdateMutation.mutateAsync({ cartItems: updatedItems, isLoggedIn });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const handleAddAIResults = async (aiItems) => {
    try {
      for (const item of aiItems) {
        const normalizedItem = normalizeItemData(item);
        validateQuantity(normalizedItem);
        await addItemMutation.mutateAsync({ item: normalizedItem, isLoggedIn });
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Utility functions
  const getItemQuantity = (identifier) => {
    if (cartItems[identifier] !== undefined) {
      return cartItems[identifier];
    }

    const matchingItemKey = Object.keys(cartItems).find(key => key === identifier);
    return matchingItemKey ? cartItems[matchingItemKey] : 0;
  };

  const fetchBackendCart = async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: ['cart', isLoggedIn ? user?._id : sessionId] });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const testConnectivity = async () => {
    return await testBackendConnectivity();
  };

  const testMinimalPostRequest = async () => {
    return await testMinimalPost(isLoggedIn);
  };

  const clearAuth = async () => {
    await clearAuthData();
    queryClient.clear();
  };

  const testCartPerformance = async () => {
    const startTime = Date.now();
    try {
      await queryClient.invalidateQueries({ queryKey: ['cart', isLoggedIn ? user?._id : sessionId] });
      const endTime = Date.now();
      return { success: true, duration: endTime - startTime };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Clear cart on logout
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      queryClient.removeQueries({ queryKey: ['cart'] });
      setRemovingItems(new Set());
    }
  }, [isLoggedIn, authLoading, queryClient]);

  const value = {
    cartItems,
    cartItemDetails,
    getItemQuantity,
    handleAddToCart,
    handleUpdateQuantity,
    handleBatchUpdate,
    handleAddAIResults,
    handleRemoveFromCart,
    handleClearCart,
    fetchBackendCart,
    testConnectivity,
    testMinimalPostRequest,
    testCartPerformance,
    clearAuth,
    loading: cartQuery.isLoading,
    error: cartQuery.error || updateCartMutation.error || addItemMutation.error || removeItemMutation.error,
    removingItems,
    // React Query specific exports
    isFetching: cartQuery.isFetching,
    refetch: cartQuery.refetch,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};