import { createContext, useContext, useEffect, useState } from "react";
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
import { useAuth } from "./AuthContext";

const CartContext = createContext();

export const useCartContext = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { isLoggedIn, user, loading: authLoading } = useAuth();
  const [cartItems, setCartItems] = useState({}); // Key: item._id, Value: quantity
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pendingOperations, setPendingOperations] = useState(new Set());
  const [removingItems, setRemovingItems] = useState(new Set());
  // Store full cart item details for better performance
  const [cartItemDetails, setCartItemDetails] = useState({}); // Key: item._id, Value: full item object

  useEffect(() => {
    let didCancel = false;
    // Wait for AuthContext to finish loading before running cart logic
    if (authLoading) {
      // Don't do anything until auth is loaded
      return;
    }
    console.log('[CartContext] Auth state changed, isLoggedIn:', isLoggedIn, 'user:', user, 'authLoading:', authLoading);

    if (!isLoggedIn && !authLoading) {
      // User logged out, clear all cart state and session
      console.log('[CartContext] User logged out, clearing cart state and session');
      setCartItems({});
      setCartItemDetails({});
      setError(null);
      setPendingOperations(new Set());
      setRemovingItems(new Set());
      setLoading(false);
      // Clear sessionId and accessToken from storage
      clearAuthData();
      return;
    }

    if (isLoggedIn && !authLoading) {
      // Always fetch cart after login with enhanced error handling
      setLoading(true);
      (async () => {
        try {
          const cart = await getCart(isLoggedIn);
          if (didCancel) return;
          
          // Process cart items with proper normalization and fallback data fetching
          const itemsObj = {};
          const itemDetailsObj = {};
          const cartItems = cart.data?.data?.items || cart.data?.items || cart.items || [];
          
          // Check if cart items have complete data (they should from backend)
          const hasCompleteData = cartItems.length > 0 && cartItems.every(item => 
            item.categoryId && item.image && item.measurement_unit !== undefined
          );
          
          if (hasCompleteData) {
            console.log('[CartContext] Backend cart items have complete data, using directly');
            // Use backend cart data directly since it's complete
            for (const cartItem of cartItems) {
              try {
                // Backend items already have complete data, no need to normalize
                // CRITICAL: Just use the backend data as-is since it's already complete
                
                // Use _id as the key (this is the actual item ID)
                const itemKey = cartItem._id;
                
                if (!itemKey) {
                  console.error('[CartContext] Item missing _id field:', cartItem);
                  continue;
                }
                
                // Store in cart items object for context
                itemsObj[itemKey] = cartItem.quantity || 0;
                
                // Store full item details for UI components (use complete backend data)
                itemDetailsObj[itemKey] = cartItem;
                
                console.log('[CartContext] Processed cart item:', cartItem.name, 'quantity:', cartItem.quantity);
              } catch (itemError) {
                console.error('[CartContext] Error processing cart item:', itemError.message, cartItem);
              }
            }
          } else {
            console.log('[CartContext] Cart items missing essential data, fetching full item details...');
            // Fallback to the old logic only if cart data is incomplete
            const needsFullItemData = cartItems.some(item => 
              !item.categoryId || !item.image || item.measurement_unit === undefined
            );
            
            let allItemsData = null;
            if (needsFullItemData) {
              try {
                // Fetch all items to get complete data
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
                
                // If we have incomplete data and full items data is available, merge them
                if (needsFullItemData && allItemsData && Array.isArray(allItemsData)) {
                  const fullItemData = allItemsData.find(item => item._id === cartItem._id);
                  if (fullItemData) {
                    itemToUse = {
                      ...fullItemData,
                      quantity: cartItem.quantity, // Preserve cart quantity
                    };
                    console.log('[CartContext] Merged cart item with full data:', fullItemData.name);
                  } else {
                    // Only normalize if we couldn't find full data
                    itemToUse = normalizeItemData(cartItem);
                  }
                } else {
                  // Only normalize if data is actually incomplete
                  const isIncomplete = !cartItem.categoryId || !cartItem.image || cartItem.measurement_unit === undefined;
                  if (isIncomplete) {
                    itemToUse = normalizeItemData(cartItem);
                  }
                }
                
                // Use _id as the key (this is the actual item ID)
                const itemKey = itemToUse._id;
                
                if (!itemKey) {
                  console.error('[CartContext] Item missing _id field:', cartItem);
                  continue;
                }
                
                // Store in cart items object for context
                itemsObj[itemKey] = itemToUse.quantity || 0;
                
                // Store full item details for UI components
                itemDetailsObj[itemKey] = itemToUse;
                
                console.log('[CartContext] Processed cart item:', itemToUse.name, 'quantity:', itemToUse.quantity);
              } catch (itemError) {
                console.error('[CartContext] Error processing cart item:', itemError.message, cartItem);
              }
            }
          }
          setCartItems(itemsObj);
          setCartItemDetails(itemDetailsObj);
          setError(null);
          console.log('[CartContext] Cart loaded successfully with new schema');
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
  }, [isLoggedIn, user, authLoading]);
  const handleAddSingleItem = async (item) => {
    const normalizedItem = normalizeItemData(item);
    
    // Create proper cart item for new backend schema
    const cartItem = createCartItem(normalizedItem, normalizedItem.quantity || 1);
    
    try {
      validateQuantity(cartItem);
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
    
    // Use _id as the key for optimistic update
    const itemKey = cartItem._id;
    const optimisticUpdate = { ...cartItems };
    const optimisticDetails = { ...cartItemDetails };
    
    optimisticUpdate[itemKey] = cartItem.quantity;
    optimisticDetails[itemKey] = cartItem;
    
    // Apply optimistic update immediately for instant UI feedback
    setCartItems(optimisticUpdate);
    setCartItemDetails(optimisticDetails);

    try {
      const result = await addItemToCart(cartItem, isLoggedIn);
      
      // Use optimistic update result instead of refetching entire cart
      // Only update if backend returns specific item data
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
        // If backend doesn't return full cart, trust our optimistic update
        console.log('[CartContext] Backend add successful, keeping optimistic update');
      }
      
      setError(null);
      return { success: true, result };
    } catch (err) {
      // Revert optimistic update on error
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
        const itemKey = getCartKey(item); // Use proper item key
        actualCartItems[itemKey] = item.quantity;
      });
      setCartItems(actualCartItems);
      const itemsToMerge = {};
      normalizedItems.forEach((item) => {
        const itemKey = getCartKey(item); // Use proper item key
        if (itemsToMerge[itemKey]) {
          itemsToMerge[itemKey].quantity += item.quantity;
        } else {
          itemsToMerge[itemKey] = { ...item };
        }
      });
      const optimisticUpdate = { ...actualCartItems };
      Object.values(itemsToMerge).forEach((item) => {
        const itemKey = getCartKey(item); // Use proper item key
        const currentQuantity = actualCartItems[itemKey] || 0;
        const newQuantity = currentQuantity + item.quantity;
        optimisticUpdate[itemKey] = newQuantity;
      });
      setCartItems(optimisticUpdate);
      const results = [];
      for (const mergedItem of Object.values(itemsToMerge)) {
        const itemKey = getCartKey(mergedItem); // Use proper item key
        const actualCurrentQuantity = actualCartItems[itemKey] || 0;
        if (actualCurrentQuantity > 0) {
          const newTotalQuantity = actualCurrentQuantity + mergedItem.quantity;
          // Pass the full merged item object to updateCartItem
          const result = await updateCartItem(
            mergedItem,             // Pass full item object with categoryId
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
      (finalCart.items || []).forEach((backendItem) => {
        const itemKey = getCartKey(backendItem); // Use proper item key
        finalItemsObj[itemKey] = backendItem.quantity;
      });
      setCartItems(finalItemsObj);
      setError(null);
    } catch (err) {
      try {
        const revertCart = await getCart(isLoggedIn);
        const revertItemsObj = {};
        (revertCart.items || []).forEach((item) => {
          const itemKey = getCartKey(item); // Use proper item key
          revertItemsObj[itemKey] = item.quantity;
        });
        setCartItems(revertItemsObj);
      } catch (_revertErr) {
        setCartItems({});
      }
      setError(err.message || "Failed to add items");
      throw err;
    }
  };

  const handleUpdateQuantity = async (
    itemId,                    // Changed from categoryId to itemId (using _id)
    quantity,
    measurementUnit = null
  ) => {
    const operationKey = `update-${itemId}`;
    if (pendingOperations.has(operationKey)) {
      return { success: false, reason: "Operation already pending" };
    }

    setPendingOperations((prev) => new Set([...prev, operationKey]));

    const previousCartItems = { ...cartItems };
    const previousCartDetails = { ...cartItemDetails };

    // Get the full item details (we need categoryId for backend)
    const itemDetails = cartItemDetails[itemId];
    if (!itemDetails) {
      setPendingOperations((prev) => {
        const newSet = new Set(prev);
        newSet.delete(operationKey);
        return newSet;
      });
      return { success: false, error: "Item details not found in cart" };
    }

    // Optimistic update using _id as key - Update both quantity and details
    const optimisticUpdate = { ...cartItems };
    const optimisticDetailsUpdate = { ...cartItemDetails };
    optimisticUpdate[itemId] = quantity;
    optimisticDetailsUpdate[itemId] = { ...itemDetails, quantity };
    
    setCartItems(optimisticUpdate);
    setCartItemDetails(optimisticDetailsUpdate);

    try {
      // Pass the full item object with categoryId
      const result = await updateCartItem(
        itemDetails,            // Pass full item object with categoryId
        quantity,
        isLoggedIn,
        measurementUnit
      );

      // Use optimistic update result instead of refetching entire cart
      // Only update if backend returns specific item data
      if (result.items && Array.isArray(result.items)) {
        const itemsObj = {};
        const itemDetailsObj = {};
        
        result.items.forEach((backendItem) => {
          const backendItemKey = getCartKey(backendItem);
          itemsObj[backendItemKey] = backendItem.quantity;
          itemDetailsObj[backendItemKey] = backendItem;
        });
        
        setCartItems(itemsObj);
        setCartItemDetails(itemDetailsObj);
      } else {
        // If backend doesn't return full cart, trust our optimistic update
        console.log('[CartContext] Backend update successful, keeping optimistic update');
      }
      
      setError(null);
      return { success: true, result };
    } catch (err) {
      // Revert optimistic updates
      setCartItems(previousCartItems);
      setCartItemDetails(previousCartDetails);

      if (err.message.includes("Item not found in cart")) {
        const updatedItems = { ...previousCartItems };
        const updatedDetails = { ...previousCartDetails };
        delete updatedItems[itemId];
        delete updatedDetails[itemId];
        setCartItems(updatedItems);
        setCartItemDetails(updatedDetails);
        setError("Item was removed from cart");
      } else {
        setError(err.message || "Failed to update item");
      }
      return { success: false, error: err.message };
    } finally {
      setTimeout(() => {
        setPendingOperations((prev) => {
          const newSet = new Set(prev);
          newSet.delete(operationKey);
          return newSet;
        });
      }, 10);
    }
  };

  const handleRemoveFromCart = async (itemId) => {  // Changed parameter name from categoryId to itemId
    setRemovingItems((prev) => new Set([...prev, itemId]));

    // Store original state for potential revert
    const originalCartItems = { ...cartItems };
    const originalCartDetails = { ...cartItemDetails };

    // Apply optimistic update immediately for instant UI feedback
    const optimisticUpdate = { ...cartItems };
    const optimisticDetails = { ...cartItemDetails };
    delete optimisticUpdate[itemId];
    delete optimisticDetails[itemId];
    setCartItems(optimisticUpdate);
    setCartItemDetails(optimisticDetails);

    try {
      const result = await removeItemFromCart(itemId, isLoggedIn);

      // Use optimistic update result instead of refetching entire cart
      // Only update if backend returns specific cart data
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
      } else {
        // If backend doesn't return full cart, trust our optimistic update
        console.log('[CartContext] Backend remove successful, keeping optimistic update');
      }
      
      setError(null);
    } catch (err) {
      // Revert optimistic updates on error
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
  };

  const handleClearCart = async () => {
    const originalCart = { ...cartItems };
    const originalDetails = { ...cartItemDetails };
    setCartItems({});
    setCartItemDetails({});

    try {
      await apiClearCart(isLoggedIn);
      setError(null);
    } catch (err) {
      // Revert both cart items and details
      setCartItems(originalCart);
      setCartItemDetails(originalDetails);
      setError(err.message || "Failed to clear cart");
    }
  };

  const refreshCart = async () => {
    try {
      const cart = await getCart(isLoggedIn);
      const itemsObj = {};
      const itemDetailsObj = {};
      
      const cartItems = cart.items || [];
      cartItems.forEach((item) => {
        // Use consistent key function for item ID
        const itemKey = getCartKey(item);
        itemsObj[itemKey] = item.quantity;
        itemDetailsObj[itemKey] = {
          ...item,
          _id: itemKey, // Ensure _id is properly set
        };
      });
      
      setCartItems(itemsObj);
      setCartItemDetails(itemDetailsObj);
    } catch (err) {
      throw err;
    }
  };

  // Backward compatibility function - handles the naming correction
  // OLD: categoryId was actually the item ID (wrong naming)
  // NEW: _id = item ID, categoryId = actual category ID
  const getItemQuantity = (identifier) => {
    // First try using the identifier directly as item ID
    if (cartItems[identifier]) {
      return cartItems[identifier];
    }
    
    // For backward compatibility: if someone passes what they think is categoryId
    // but it's actually an item ID from old data, check if it exists as a key
    const matchingItemKey = Object.keys(cartItems).find(key => {
      const item = cartItemDetails[key];
      if (!item) return false;
      
      // Check if the identifier matches either the item ID or the old "categoryId" field
      return key === identifier || 
             item.categoryId === identifier ||
             item._id === identifier;
    });
    
    return matchingItemKey ? cartItems[matchingItemKey] : 0;
  };

  const fetchBackendCart = async () => {
    // Prevent fetching cart if not logged in and no valid sessionId
    if (!isLoggedIn) {
      // Try to get guest sessionId from storage
      let sessionId = null;
      try {
        sessionId = await require('../services/api/cart').getSessionId();
      } catch {}
      if (!sessionId) {
        // No session, do not fetch
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
        cartItemDetails,        // Export cart item details for better performance
        getItemQuantity,
        handleAddToCart,
        handleAddSingleItem,
        handleUpdateQuantity,
        handleRemoveFromCart,
        handleClearCart,
        refreshCart,
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
