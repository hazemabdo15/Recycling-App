import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AppState } from 'react-native';
import {
    addItemToCart,
    clearCart as apiClearCart,
    clearAuthData,
    getCart,
    removeItemFromCart,
    testBackendConnectivity,
    testMinimalPost,
    updateCartItem,
} from "../services/api/cart.js";
import { createCartItem, getCartKey, normalizeItemData, validateQuantity } from "../utils/cartUtils";
import { debouncedCartManager } from "../utils/debouncedCartOperations";
import { useAuth } from "./AuthContext";
import logger from '../utils/logger';

const CartContext = createContext();

export const useCartContext = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { isLoggedIn, user, loading: authLoading } = useAuth();
  const [cartItems, setCartItems] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [removingItems, setRemovingItems] = useState(new Set());
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const [cartItemDetails, setCartItemDetails] = useState({});

  // App state management for syncing pending operations
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'background' && debouncedCartManager.hasPendingOperations()) {
        logger.cart('App going to background, syncing pending operations');
        debouncedCartManager.syncAll();
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    let didCancel = false;

    if (authLoading) {
      return;
    }
    console.log('[CartContext] Auth state changed, isLoggedIn:', isLoggedIn, 'user:', user, 'authLoading:', authLoading);

    if (!isLoggedIn && !authLoading) {
      console.log('[CartContext] User logged out, clearing cart state and session');
      setCartItems({});
      setCartItemDetails({});
      setError(null);
      setRemovingItems(new Set());
      setLoading(false);
      setHasLoadedOnce(false);

      clearAuthData();
      return;
    }

    if (isLoggedIn && !authLoading) {
      setLoading(true);
      (async () => {
        try {
          // Add a small delay to ensure auth state is fully settled
          await new Promise(resolve => setTimeout(resolve, 100));
          
          console.log('[CartContext] Loading authenticated cart...');
          const cart = await getCart(isLoggedIn);
          if (didCancel) return;

          console.log('[CartContext] Raw cart response:', cart);
          const itemsObj = {};
          const itemDetailsObj = {};
          const cartItems = cart.data?.data?.items || cart.data?.items || cart.items || [];
          console.log('[CartContext] Parsed cart items array:', cartItems);

          if (cartItems.length === 0) {
            console.log('[CartContext] No items found in authenticated cart');
            // Only clear cart state if we haven't loaded successfully before
            if (!hasLoadedOnce) {
              console.log('[CartContext] First load with empty cart, clearing state');
              setCartItems({});
              setCartItemDetails({});
            } else {
              console.log('[CartContext] Already loaded before, keeping existing cart state');
            }
            setError(null);
            setLoading(false);
            return;
          }

          const hasCompleteData = cartItems.length > 0 && cartItems.every(item => 
            item.categoryId && item.image && item.measurement_unit !== undefined
          );
          
          if (hasCompleteData) {
            console.log('[CartContext] Backend cart items have complete data, using directly');

            for (const cartItem of cartItems) {
              try {
                const itemKey = cartItem._id;
                
                if (!itemKey) {
                  console.error('[CartContext] Item missing _id field:', cartItem);
                  continue;
                }

                itemsObj[itemKey] = cartItem.quantity || 0;
                itemDetailsObj[itemKey] = cartItem;
                
                console.log('[CartContext] Processed cart item:', cartItem.name, 'quantity:', cartItem.quantity);
              } catch (itemError) {
                console.error('[CartContext] Error processing cart item:', itemError.message, cartItem);
              }
            }
          } else {
            console.log('[CartContext] Cart items missing essential data, fetching full item details...');

            const needsFullItemData = cartItems.some(item => 
              !item.categoryId || !item.image || item.measurement_unit === undefined
            );
            
            let allItemsData = null;
            if (needsFullItemData) {
              try {
                const { categoriesAPI } = await import("../services/api");
                const response = await categoriesAPI.getAllItems(user?.role || "customer");
                allItemsData = response.data?.items || response.data || response.items || response;
                console.log('[CartContext] Fetched', allItemsData?.length || 0, 'items for cart merging');
              } catch (itemsError) {
                console.warn('[CartContext] Failed to fetch full item data:', itemsError.message);
              }
            }
            
            for (const cartItem of cartItems) {
              try {
                let itemToUse = cartItem;

                if (needsFullItemData && allItemsData && Array.isArray(allItemsData)) {
                  const fullItemData = allItemsData.find(item => item._id === cartItem._id);
                  if (fullItemData) {
                    itemToUse = {
                      ...fullItemData,
                      quantity: cartItem.quantity,
                    };
                    console.log('[CartContext] Merged cart item with full data:', fullItemData.name);
                  } else {
                    itemToUse = normalizeItemData(cartItem);
                  }
                } else {
                  const isIncomplete = !cartItem.categoryId || !cartItem.image || cartItem.measurement_unit === undefined;
                  if (isIncomplete) {
                    itemToUse = normalizeItemData(cartItem);
                  }
                }

                const itemKey = itemToUse._id;
                
                if (!itemKey) {
                  console.error('[CartContext] Item missing _id field:', cartItem);
                  continue;
                }

                itemsObj[itemKey] = itemToUse.quantity || 0;
                itemDetailsObj[itemKey] = itemToUse;
                
                console.log('[CartContext] Processed cart item:', itemToUse.name, 'quantity:', itemToUse.quantity);
              } catch (itemError) {
                console.error('[CartContext] Error processing cart item:', itemError.message, cartItem);
              }
            }
          }
          
          // Set the authenticated cart
          setCartItems(itemsObj);
          setCartItemDetails(itemDetailsObj);
          setError(null);
          console.log('[CartContext] Authenticated cart loaded successfully, items:', Object.keys(itemsObj).length);
          console.log('[CartContext] Cart items:', Object.keys(itemsObj));
          console.log('[CartContext] Cart quantities:', Object.values(itemsObj));

          // Force a re-render by updating the trigger
          setUpdateTrigger(prev => prev + 1);
          setHasLoadedOnce(true);

        } catch (err) {
          if (didCancel) return;
          console.warn(
            "Failed to fetch cart from backend, using empty cart:",
            err.message
          );
          setCartItems({});
          setCartItemDetails({});
          setError(null);
        } finally {
          if (didCancel) return;
          setLoading(false);
        }
      })();
    }
    return () => {
      didCancel = true;
    };
  }, [isLoggedIn, user, authLoading, hasLoadedOnce]);
  const handleAddSingleItem = async (item) => {
    const normalizedItem = normalizeItemData(item);

    const cartItem = createCartItem(normalizedItem, normalizedItem.quantity || 1);
    
    try {
      validateQuantity(cartItem);
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }

    const itemKey = cartItem._id;
    const optimisticUpdate = { ...cartItems };
    const optimisticDetails = { ...cartItemDetails };
    
    optimisticUpdate[itemKey] = cartItem.quantity;
    optimisticDetails[itemKey] = cartItem;

    setCartItems(optimisticUpdate);
    setCartItemDetails(optimisticDetails);

    try {
      // Use updateCartItem instead of addItemToCart for consistency
      // This ensures all cart operations use absolute quantity setting rather than incremental adding
      const result = await updateCartItem(cartItem, cartItem.quantity, isLoggedIn, cartItem.measurement_unit);

      if (result.items && Array.isArray(result.items)) {
        const itemsObj = {};
        const itemDetailsObj = {};
        
        for (const backendItem of result.items) {
          const backendItemKey = getCartKey(backendItem);
          itemsObj[backendItemKey] = backendItem.quantity;
          itemDetailsObj[backendItemKey] = backendItem;
        }
        
        setCartItems(itemsObj);
        setCartItemDetails(itemDetailsObj);
      } else {

        console.log('[CartContext] Backend add successful, keeping optimistic update');
      }
      
      setError(null);
      return { success: true, result };
    } catch (err) {

      setCartItems(cartItems);
      setCartItemDetails(cartItemDetails);
      setError(err.message || "Failed to add item");
      return { success: false, error: err.message };
    }
  };

  const handleAddToCart = async (itemOrItems) => {
    const items = Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems];
    const normalizedItems = items.map(normalizeItemData);
    try {
      normalizedItems.forEach(validateQuantity);
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
    try {
      const currentBackendCart = await getCart(isLoggedIn);
      const actualCartItems = {};
      (currentBackendCart.items || []).forEach((item) => {
        const itemKey = getCartKey(item);
        actualCartItems[itemKey] = item.quantity;
      });
      setCartItems(actualCartItems);
      const itemsToMerge = {};
      normalizedItems.forEach((item) => {
        const itemKey = getCartKey(item);
        if (itemsToMerge[itemKey]) {
          itemsToMerge[itemKey].quantity += item.quantity;
        } else {
          itemsToMerge[itemKey] = { ...item };
        }
      });
      const optimisticUpdate = { ...actualCartItems };
      Object.values(itemsToMerge).forEach((item) => {
        const itemKey = getCartKey(item);
        const currentQuantity = actualCartItems[itemKey] || 0;
        const newQuantity = currentQuantity + item.quantity;
        optimisticUpdate[itemKey] = newQuantity;
      });
      setCartItems(optimisticUpdate);
      const results = [];
      for (const mergedItem of Object.values(itemsToMerge)) {
        const itemKey = getCartKey(mergedItem);
        const actualCurrentQuantity = actualCartItems[itemKey] || 0;
        if (actualCurrentQuantity > 0) {
          const newTotalQuantity = actualCurrentQuantity + mergedItem.quantity;

          const result = await updateCartItem(
            mergedItem,
            newTotalQuantity,
            isLoggedIn,
            mergedItem.measurement_unit
          );
          results.push(result);
        } else {
          const result = await addItemToCart(mergedItem, isLoggedIn);
          results.push(result);
        }
      }
      const finalCart = await getCart(isLoggedIn);
      const finalItemsObj = {};
      const finalItemDetailsObj = {};
      (finalCart.items || []).forEach((backendItem) => {
        const itemKey = getCartKey(backendItem);
        finalItemsObj[itemKey] = backendItem.quantity;
        finalItemDetailsObj[itemKey] = backendItem;
      });
      setCartItems(finalItemsObj);
      setCartItemDetails(finalItemDetailsObj);
      setError(null);
    } catch (err) {
      try {
        const revertCart = await getCart(isLoggedIn);
        const revertItemsObj = {};
        const revertItemDetailsObj = {};
        (revertCart.items || []).forEach((item) => {
          const itemKey = getCartKey(item);
          revertItemsObj[itemKey] = item.quantity;
          revertItemDetailsObj[itemKey] = item;
        });
        setCartItems(revertItemsObj);
        setCartItemDetails(revertItemDetailsObj);
      } catch (_revertErr) {
        setCartItems({});
        setCartItemDetails({});
      }
      setError(err.message || "Failed to add items");
      throw err;
    }
  };

  const handleUpdateQuantity = async (
    itemId,
    quantity,
    measurementUnit = null,
    context = 'user-interaction',
    itemData = null
  ) => {
    let itemDetails = cartItemDetails[itemId];
    
    // If item doesn't exist in cart yet, create it from provided itemData
    if (!itemDetails && itemData) {
      logger.cart('Creating new item entry for update operation', { itemId, quantity });
      
      // Create cart item from provided data
      const cartItem = createCartItem(itemData, quantity);
      itemDetails = cartItem;
      
      // Add to optimistic state immediately
      const optimisticUpdate = { ...cartItems };
      const optimisticDetails = { ...cartItemDetails };
      
      optimisticUpdate[itemId] = quantity;
      optimisticDetails[itemId] = cartItem;
      
      setCartItems(optimisticUpdate);
      setCartItemDetails(optimisticDetails);
    } else if (!itemDetails) {
      return { success: false, error: "Item details not found in cart and no itemData provided" };
    }

    // Determine operation strategy
    const strategy = context === 'ai-bulk' || context === 'bulk-import' ? 'batch-save' : 'debounced';

    if (strategy === 'batch-save') {
      // Use batch save for bulk operations
      return handleBatchUpdate(itemId, quantity, measurementUnit);
    }

    // DEBOUNCED APPROACH: For user interactions
    const previousCartItems = { ...cartItems };
    const previousCartDetails = { ...cartItemDetails };

    // Immediate optimistic update (if not already done above)
    if (cartItems[itemId] !== quantity) {
      const optimisticUpdate = { ...cartItems };
      const optimisticDetailsUpdate = { ...cartItemDetails };
      optimisticUpdate[itemId] = quantity;
      optimisticDetailsUpdate[itemId] = { ...itemDetails, quantity };
      
      setCartItems(optimisticUpdate);
      setCartItemDetails(optimisticDetailsUpdate);
    }

    // Error callback for rollback
    const onError = (prevState, error) => {
      setCartItems(prevState);
      setCartItemDetails(previousCartDetails);
      setError(error.message || "Failed to update item");
      logger.cart('Rolled back optimistic update', { itemId, error: error.message });
    };

    // Use debounced cart manager
    debouncedCartManager.updateQuantity(
      itemId,
      itemDetails,
      quantity,
      measurementUnit,
      isLoggedIn,
      previousCartItems,
      onError
    );

    return { success: true };
  };
  const handleBatchUpdate = async (itemId, quantity, measurementUnit) => {
    // Convert current cart state to array format for batch save
    const cartArray = Object.values(cartItemDetails).map(item => ({
      ...item,
      quantity: cartItems[item._id] === undefined ? item.quantity : cartItems[item._id]
    }));

    // Update the specific item in the array
    const itemIndex = cartArray.findIndex(item => item._id === itemId);
    if (itemIndex !== -1) {
      cartArray[itemIndex].quantity = quantity;
    }

    const previousCartItems = { ...cartItems };
    const previousCartDetails = { ...cartItemDetails };

    // Optimistic update
    const optimisticUpdate = { ...cartItems };
    optimisticUpdate[itemId] = quantity;
    setCartItems(optimisticUpdate);

    // Error callback for rollback
    const onError = (prevState, error) => {
      setCartItems(prevState);
      setCartItemDetails(previousCartDetails);
      setError(error.message || "Failed to save cart");
    };

    try {
      await debouncedCartManager.batchSave(cartArray, isLoggedIn, previousCartItems, onError);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // NEW: Add AI Results handler for bulk operations
  const handleAddAIResults = async (aiItems) => {
    const previousCartItems = { ...cartItems };
    const previousCartDetails = { ...cartItemDetails };

    try {
      // Immediate optimistic update for all items
      const optimisticCartItems = { ...cartItems };
      const optimisticCartDetails = { ...cartItemDetails };
      
      aiItems.forEach(item => {
        const processedItem = normalizeItemData(item);
        const cartItem = createCartItem(processedItem, item.quantity);
        
        optimisticCartItems[cartItem._id] = cartItem.quantity;
        optimisticCartDetails[cartItem._id] = cartItem;
      });

      setCartItems(optimisticCartItems);
      setCartItemDetails(optimisticCartDetails);

      // Batch save: Single API call for all AI items
      const cartArray = Object.values(optimisticCartDetails).map(item => ({
        ...item,
        quantity: optimisticCartItems[item._id] || 0
      })).filter(item => item.quantity > 0);

      const onError = (prevState, error) => {
        setCartItems(prevState);
        setCartItemDetails(previousCartDetails);
        setError("Failed to add AI results to cart");
      };

      await debouncedCartManager.batchSave(cartArray, isLoggedIn, previousCartItems, onError);
      
      logger.success(`Added ${aiItems.length} items from AI results via batch save`, null, 'CART');
      return { success: true, itemCount: aiItems.length };
      
    } catch (error) {
      // Revert on failure
      setCartItems(previousCartItems);
      setCartItemDetails(previousCartDetails);
      setError('Failed to add AI results to cart');
      return { success: false, error: error.message };
    }
  };

  const handleRemoveFromCart = async (itemId, context = 'user-interaction') => {
    setRemovingItems((prev) => new Set([...prev, itemId]));

    const originalCartItems = { ...cartItems };
    const originalCartDetails = { ...cartItemDetails };

    // Immediate optimistic update
    const optimisticUpdate = { ...cartItems };
    const optimisticDetails = { ...cartItemDetails };
    delete optimisticUpdate[itemId];
    delete optimisticDetails[itemId];
    setCartItems(optimisticUpdate);
    setCartItemDetails(optimisticDetails);

    const strategy = context === 'ai-bulk' || context === 'bulk-import' ? 'batch-save' : 'debounced';

    if (strategy === 'debounced') {
      // Error callback for rollback
      const onError = (prevState, error) => {
        setCartItems(prevState);
        setCartItemDetails(originalCartDetails);
        setError(error.message || "Failed to remove item");
        setRemovingItems((prev) => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      };

      // Use debounced cart manager for single item removal
      debouncedCartManager.removeItem(itemId, isLoggedIn, originalCartItems, onError);

      // Remove from removing items set after a short delay (optimistic)
      setTimeout(() => {
        setRemovingItems((prev) => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      }, 100);

    } else {
      // Use regular API call for batch operations
      try {
        const result = await removeItemFromCart(itemId, isLoggedIn);

        if (result && result.items && Array.isArray(result.items)) {
          const itemsObj = {};
          const itemDetailsObj = {};
          result.items.forEach((backendItem) => {
            const backendItemKey = getCartKey(backendItem);
            itemsObj[backendItemKey] = backendItem.quantity;
            itemDetailsObj[backendItemKey] = backendItem;
          });
          setCartItems(itemsObj);
          setCartItemDetails(itemDetailsObj);
        }
        
        setError(null);
      } catch (err) {
        // Revert optimistic update on failure
        setCartItems(originalCartItems);
        setCartItemDetails(originalCartDetails);
        setError(err.message || "Failed to remove item");
      } finally {
        setRemovingItems((prev) => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      }
    }
  };

  const handleClearCart = async () => {

    setCartItems({});
    setCartItemDetails({});

    try {
      await apiClearCart(isLoggedIn);
      setError(null);
      console.log('[CartContext] Cart cleared successfully on backend');
    } catch (err) {
      console.warn('[CartContext] Backend cart clear failed, but keeping local cart cleared:', err.message);

      setError(null);
    }
  };

  const refreshCart = useCallback(async () => {
    try {
      console.log('[CartContext] Refreshing cart, isLoggedIn:', isLoggedIn);
      const cart = await getCart(isLoggedIn);
      const itemsObj = {};
      const itemDetailsObj = {};
      
      const cartItems = cart.data?.data?.items || cart.data?.items || cart.items || [];
      console.log('[CartContext] Refreshed cart items:', cartItems.length);
      
      // Handle complete vs incomplete data like in the main useEffect
      const hasCompleteData = cartItems.length > 0 && cartItems.every(item => 
        item.categoryId && item.image && item.measurement_unit !== undefined
      );
      
      if (hasCompleteData) {
        console.log('[CartContext] Refresh: Backend cart items have complete data');
        cartItems.forEach((item) => {
          const itemKey = item._id;
          if (itemKey) {
            itemsObj[itemKey] = item.quantity;
            itemDetailsObj[itemKey] = {
              ...item,
              _id: itemKey,
            };
            console.log('[CartContext] Refresh processed item:', item.name, 'quantity:', item.quantity);
          }
        });
      } else {
        console.log('[CartContext] Refresh: Cart items missing essential data, using normalization');
        cartItems.forEach((item) => {
          const normalizedItem = normalizeItemData(item);
          const itemKey = normalizedItem._id || getCartKey(normalizedItem);
          if (itemKey) {
            itemsObj[itemKey] = normalizedItem.quantity;
            itemDetailsObj[itemKey] = {
              ...normalizedItem,
              _id: itemKey,
            };
            console.log('[CartContext] Refresh processed normalized item:', normalizedItem.name, 'quantity:', normalizedItem.quantity);
          }
        });
      }
      
      setCartItems(itemsObj);
      setCartItemDetails(itemDetailsObj);
      console.log('[CartContext] Cart refreshed successfully, total items:', Object.keys(itemsObj).length);
    } catch (err) {
      console.error('[CartContext] Error refreshing cart:', err.message);
      throw err;
    }
  }, [isLoggedIn]);

  // Debug function to force cart refresh
  const forceRefreshCart = useCallback(async () => {
    console.log('[CartContext] Force refreshing cart...');
    setLoading(true);
    try {
      await refreshCart();
      console.log('[CartContext] Force refresh completed');
      
      // Force UI update by incrementing a counter
      setUpdateTrigger(prev => prev + 1);
    } catch (error) {
      console.error('[CartContext] Force refresh failed:', error.message);
    } finally {
      setLoading(false);
    }
  }, [refreshCart]);

  const getItemQuantity = (identifier) => {

    if (cartItems[identifier]) {
      return cartItems[identifier];
    }

    const matchingItemKey = Object.keys(cartItems).find(key => {
      const item = cartItemDetails[key];
      if (!item) return false;

      return key === identifier || 
             item.categoryId === identifier ||
             item._id === identifier;
    });
    
    return matchingItemKey ? cartItems[matchingItemKey] : 0;
  };

  const fetchBackendCart = async () => {

    if (!isLoggedIn) {

      let sessionId = null;
      try {
        sessionId = await require('../services/api/cart').getSessionId();
      } catch {}
      if (!sessionId) {

        return { items: {} };
      }
    }
    try {
      const cart = await getCart(isLoggedIn);
      return cart;
    } catch (error) {
      console.warn(
        "Error fetching backend cart, using local cart data:",
        error.message
      );
      return { items: cartItems };
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
  };

  const testCartPerformance = async () => {
    const startTime = Date.now();
    try {
      const testItem = {
        categoryId: "perf-test-" + Date.now(),
        name: "Performance Test Item",
        quantity: 1,
        measurement_unit: 1,
        points: 10,
        price: 5,
        image: "test.jpg",
      };

      await handleAddToCart(testItem);
      await handleUpdateQuantity(testItem.categoryId, 2);
      await handleRemoveFromCart(testItem.categoryId);

      const endTime = Date.now();
      const duration = endTime - startTime;
      return {
        success: true,
        duration,
        message: `Operations completed in ${duration}ms`,
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartItemDetails,
        updateTrigger,
        getItemQuantity,
        handleAddToCart,
        handleAddSingleItem,
        handleUpdateQuantity,
        handleBatchUpdate,
        handleAddAIResults,
        handleRemoveFromCart,
        handleClearCart,
        refreshCart,
        forceRefreshCart,
        fetchBackendCart,
        testConnectivity,
        testMinimalPostRequest,
        testCartPerformance,
        clearAuth,
        loading,
        error,
        removingItems,
        debouncedCartManager, // Expose manager for advanced usage
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
