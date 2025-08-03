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
  const [cartItems, setCartItems] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pendingOperations, setPendingOperations] = useState(new Set());
  const [removingItems, setRemovingItems] = useState(new Set());

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
      setPendingOperations(new Set());
      setRemovingItems(new Set());
      setLoading(false);

      clearAuthData();
      return;
    }

    if (isLoggedIn && !authLoading) {

      setLoading(true);
      (async () => {
        try {
          const cart = await getCart(isLoggedIn);
          if (didCancel) return;

          const itemsObj = {};
          const itemDetailsObj = {};
          const cartItems = cart.data?.data?.items || cart.data?.items || cart.items || [];

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
      const result = await addItemToCart(cartItem, isLoggedIn);

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
    measurementUnit = null
  ) => {
    const operationKey = `update-${itemId}`;
    if (pendingOperations.has(operationKey)) {
      return { success: false, reason: "Operation already pending" };
    }

    setPendingOperations((prev) => new Set([...prev, operationKey]));

    const previousCartItems = { ...cartItems };
    const previousCartDetails = { ...cartItemDetails };

    const itemDetails = cartItemDetails[itemId];
    if (!itemDetails) {
      setPendingOperations((prev) => {
        const newSet = new Set(prev);
        newSet.delete(operationKey);
        return newSet;
      });
      return { success: false, error: "Item details not found in cart" };
    }

    const optimisticUpdate = { ...cartItems };
    const optimisticDetailsUpdate = { ...cartItemDetails };
    optimisticUpdate[itemId] = quantity;
    optimisticDetailsUpdate[itemId] = { ...itemDetails, quantity };
    
    setCartItems(optimisticUpdate);
    setCartItemDetails(optimisticDetailsUpdate);

    try {

      const result = await updateCartItem(
        itemDetails,
        quantity,
        isLoggedIn,
        measurementUnit
      );

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

        console.log('[CartContext] Backend update successful, keeping optimistic update');
      }
      
      setError(null);
      return { success: true, result };
    } catch (err) {

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

  const handleRemoveFromCart = async (itemId) => {
    setRemovingItems((prev) => new Set([...prev, itemId]));

    const originalCartItems = { ...cartItems };
    const originalCartDetails = { ...cartItemDetails };

    const optimisticUpdate = { ...cartItems };
    const optimisticDetails = { ...cartItemDetails };
    delete optimisticUpdate[itemId];
    delete optimisticDetails[itemId];
    setCartItems(optimisticUpdate);
    setCartItemDetails(optimisticDetails);

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
      } else {

        console.log('[CartContext] Backend remove successful, keeping optimistic update');
      }
      
      setError(null);
    } catch (err) {

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

  const refreshCart = async () => {
    try {
      const cart = await getCart(isLoggedIn);
      const itemsObj = {};
      const itemDetailsObj = {};
      
      const cartItems = cart.items || [];
      cartItems.forEach((item) => {

        const itemKey = getCartKey(item);
        itemsObj[itemKey] = item.quantity;
        itemDetailsObj[itemKey] = {
          ...item,
          _id: itemKey,
        };
      });
      
      setCartItems(itemsObj);
      setCartItemDetails(itemDetailsObj);
    } catch (err) {
      throw err;
    }
  };

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
