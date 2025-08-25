import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { categoriesAPI } from "../services/api";
import {
  addItemToCart,
  clearCart as apiClearCart,
  clearAuthData,
  getCart,
  getSessionId,
  testBackendConnectivity,
  testMinimalPost,
  updateCartItem,
} from "../services/api/cart.js";
import { createCartItem, getCartKey, normalizeItemData, validateQuantity } from "../utils/cartUtils";
import { simpleCartManager } from "../utils/debouncedCartOperations";
import logger from '../utils/logger';
import { useAuth } from "./AuthContext";

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

    try {
      // Direct API call - add item to cart
      const result = await addItemToCart(cartItem, isLoggedIn);
      
      // Refresh cart from backend to get accurate state
      await refreshCart();
      
      setError(null);
      return { success: true, result };
    } catch (err) {
      setError(err.message || "Failed to add item");
      return { success: false, error: err.message };
    }
  };

  const handleAddToCart = async (itemOrItems) => {
    setLoading(true);
    setError(null);

    try {
      const items = Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems];
      const normalizedItems = items.map(normalizeItemData);
      
      // Validate items
      normalizedItems.forEach(validateQuantity);

      // Add items directly without optimistic updates
      for (const item of normalizedItems) {
        logger.cart('Adding item to cart directly', { itemId: item._id, quantity: item.quantity });
        
        const itemKey = item._id;
        const currentQuantity = cartItems[itemKey] || 0;
        
        if (currentQuantity > 0) {
          // Update existing item
          const newQuantity = currentQuantity + item.quantity;
          await updateCartItem(item, newQuantity, isLoggedIn, item.measurement_unit);
        } else {
          // Add new item
          await addItemToCart(item, isLoggedIn);
        }
      }

      // Refresh cart from backend to get the latest state
      await refreshCart();
      
      logger.success('Items added to cart successfully', { count: normalizedItems.length }, 'CART');
      return { success: true };

    } catch (err) {
      logger.cart('Failed to add items to cart', { error: err.message }, 'ERROR');
      setError(err.message || "Failed to add items");
      
      // Refresh cart to ensure consistency
      try {
        await refreshCart();
      } catch (refreshError) {
        logger.cart('Failed to refresh cart after error', { error: refreshError.message }, 'ERROR');
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (
    itemId,
    quantity,
    measurementUnit = null,
    context = 'user-interaction',
    itemData = null
  ) => {
    setLoading(true);
    setError(null);

    try {
      let itemDetails = cartItemDetails[itemId];
      
      // If not found by itemId, try to find using getCartKey with itemData
      if (!itemDetails && itemData) {
        const alternateKey = getCartKey(itemData);
        itemDetails = cartItemDetails[alternateKey];
        logger.cart('Trying alternate key lookup', { itemId, alternateKey, found: !!itemDetails });
      }
      
      // Debug logging
      logger.cart('HandleUpdateQuantity called', { 
        itemId, 
        quantity, 
        hasItemDetails: !!itemDetails, 
        hasItemData: !!itemData,
        itemDataKeys: itemData ? Object.keys(itemData) : null,
        cartItemDetailsCount: Object.keys(cartItemDetails).length 
      });
      
      // If item doesn't exist in cart yet, create it from provided itemData
      if (!itemDetails && itemData) {
        logger.cart('Creating new item entry for update operation', { itemId, quantity });
        const cartItem = createCartItem(itemData, quantity);
        itemDetails = cartItem;
      } else if (!itemDetails) {
        // More detailed error message
        logger.cart('Item details not found and no valid itemData provided', { 
          itemId, 
          hasItemData: !!itemData,
          cartItemDetailsKeys: Object.keys(cartItemDetails).slice(0, 5), // Show first 5 keys
          availableKeys: Object.keys(cartItemDetails).length,
          itemData: itemData ? { _id: itemData._id, name: itemData.name } : 'null'
        }, 'ERROR');
        throw new Error("Item details not found in cart and no itemData provided");
      }

      // Store original state for potential rollback
      const originalQuantity = cartItems[itemId] || 0;
      const originalItemDetails = cartItemDetails[itemId];

      // Optimistic update for immediate UI feedback
      const optimisticUpdate = { ...cartItems };
      optimisticUpdate[itemId] = quantity;
      setCartItems(optimisticUpdate);

      // Also update cartItemDetails if we have itemDetails
      if (itemDetails && !originalItemDetails) {
        const optimisticDetails = { ...cartItemDetails };
        optimisticDetails[itemId] = itemDetails;
        setCartItemDetails(optimisticDetails);
      }

      // Define rollback function
      const rollbackOptimisticUpdate = () => {
        setCartItems(prevItems => ({
          ...prevItems,
          [itemId]: originalQuantity
        }));
        // Rollback item details if we added them optimistically
        if (itemDetails && !originalItemDetails) {
          setCartItemDetails(prevDetails => {
            const updated = { ...prevDetails };
            delete updated[itemId];
            return updated;
          });
        }
        refreshCart(); // Sync with backend to be safe
      };

      // Use SimpleCartManager for background sync with optimistic update
      logger.cart('Updating item quantity with optimistic update', { itemId, quantity, measurementUnit });
      
      await simpleCartManager.updateQuantity(
        itemId,
        itemDetails,
        quantity,
        measurementUnit || itemDetails.measurement_unit,
        isLoggedIn,
        null, // onOptimisticUpdate already done above
        rollbackOptimisticUpdate // onError rollback
      );
      
      logger.success('Item quantity updated successfully', { itemId, quantity }, 'CART');
      return { success: true };

    } catch (error) {
      logger.cart('Failed to update item quantity', {
        itemId,
        error: error.message
      }, 'ERROR');
      
      setError(error.message || "Failed to update item");
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };
  const handleBatchUpdate = async (itemId, quantity, measurementUnit) => {
    try {
      // Direct API call with item update
      await updateCartItem(itemId, quantity, measurementUnit, isLoggedIn);
      
      // Refresh cart from backend to get accurate state
      await refreshCart();
      
      setError(null);
      return { success: true };
    } catch (error) {
      setError(error.message || "Failed to update item");
      return { success: false, error: error.message };
    }
  };

  // NEW: Add AI Results handler for bulk operations
  const handleAddAIResults = async (aiItems) => {
    try {
      // Process each AI item and add it to cart individually
      for (const item of aiItems) {
        const processedItem = normalizeItemData(item);
        const cartItem = createCartItem(processedItem, item.quantity);
        
        // Direct API call for each item
        await addItemToCart(cartItem, isLoggedIn);
      }

      // Refresh cart from backend to get accurate state
      await refreshCart();
      
      setError(null);
      logger.success(`Added ${aiItems.length} items from AI results`, null, 'CART');
      return { success: true, itemCount: aiItems.length };
      
    } catch (error) {
      setError('Failed to add AI results to cart');
      return { success: false, error: error.message };
    }
  };

  const handleRemoveFromCart = async (itemId, context = 'user-interaction') => {
    // Set loading state
    setRemovingItems((prev) => new Set([...prev, itemId]));

    try {
      // Store original state for potential rollback
      const originalCartItems = { ...cartItems };
      const originalCartDetails = { ...cartItemDetails };

      // Optimistic update for immediate UI feedback
      const optimisticUpdate = { ...cartItems };
      const optimisticDetails = { ...cartItemDetails };
      delete optimisticUpdate[itemId];
      delete optimisticDetails[itemId];
      setCartItems(optimisticUpdate);
      setCartItemDetails(optimisticDetails);

      // Define rollback function
      const rollbackOptimisticUpdate = () => {
        setCartItems(originalCartItems);
        setCartItemDetails(originalCartDetails);
      };

      // Use SimpleCartManager for background sync
      await simpleCartManager.removeItem(
        itemId,
        isLoggedIn,
        null, // onOptimisticUpdate already done above
        rollbackOptimisticUpdate // onError rollback
      );
      
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to remove item");
    } finally {
      // Clear loading state
      setRemovingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
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
      
      // Direct update without preserving pending operations
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
    // First, try direct lookup with the identifier
    if (cartItems[identifier] !== undefined) {
      const quantity = cartItems[identifier];
      logger.cart('Direct quantity lookup', { identifier, quantity }, 'DEBUG');
      return quantity;
    }

    // FIXED: More precise matching to prevent cross-item contamination
    // Only match by exact _id, not by category or loose matching
    const matchingItemKey = Object.keys(cartItems).find(key => {
      const item = cartItemDetails[key];
      if (!item) return false;

      // ONLY match by exact _id to prevent quantity cross-contamination
      return item._id === identifier;
    });
    
    const result = matchingItemKey ? cartItems[matchingItemKey] : 0;
    logger.cart('Fallback quantity lookup', { 
      identifier, 
      matchingKey: matchingItemKey, 
      quantity: result,
      availableKeys: Object.keys(cartItems)
    }, 'DEBUG');
    
    return result;
  };

  const fetchBackendCart = async () => {

    if (!isLoggedIn) {

      let sessionId = null;
      try {
        sessionId = await getSessionId();
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
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
