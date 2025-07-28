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
import { normalizeItemData, validateQuantity } from '../utils/cartUtils';
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
  // const [fetchingCart, setFetchingCart] = useState(false);

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
      setError(null);
      setPendingOperations(new Set());
      setRemovingItems(new Set());
      setLoading(false);
      // setFetchingCart(false);
      // Clear sessionId and accessToken from storage
      clearAuthData();
      return;
    }

    if (isLoggedIn && !authLoading) {
      // Always fetch cart after login, do not skip if fetchingCart is true
      // setFetchingCart(true);
      setLoading(true);
      (async () => {
        try {
          const cart = await getCart(isLoggedIn);
          if (didCancel) return;
          const itemsObj = {};
          const cartItems = cart.data?.data?.items || cart.data?.items || cart.items || [];
          for (const item of cartItems) {
            itemsObj[item.categoryId] = item.quantity;
          }
          setCartItems(itemsObj);
          setError(null);
          console.log('[CartContext] Cart loaded successfully');
        } catch (err) {
          if (didCancel) return;
          console.warn(
            "Failed to fetch cart from backend, using empty cart:",
            err.message
          );
          setCartItems({});
          setError(null);
        } finally {
          if (didCancel) return;
          setLoading(false);
          // setFetchingCart(false);
        }
      })();
    }
    return () => {
      didCancel = true;
    };
  }, [isLoggedIn, user, authLoading]);
  const handleAddSingleItem = async (item) => {
    const normalizedItem = normalizeItemData(item);
    try {
      validateQuantity(normalizedItem);
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
    const optimisticUpdate = { ...cartItems };
    optimisticUpdate[normalizedItem.categoryId] = normalizedItem.quantity;
    setCartItems(optimisticUpdate);

    try {
      const result = await addItemToCart(normalizedItem, isLoggedIn);
      if (result.items) {
        const itemsObj = {};
        for (const backendItem of result.items) {
          itemsObj[backendItem.categoryId] = backendItem.quantity;
        }
        setCartItems(itemsObj);
      }
      setError(null);
      return { success: true, result };
    } catch (err) {
      setCartItems(cartItems);
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
        actualCartItems[item.categoryId] = item.quantity;
      });
      setCartItems(actualCartItems);
      const itemsToMerge = {};
      normalizedItems.forEach((item) => {
        if (itemsToMerge[item.categoryId]) {
          itemsToMerge[item.categoryId].quantity += item.quantity;
        } else {
          itemsToMerge[item.categoryId] = { ...item };
        }
      });
      const optimisticUpdate = { ...actualCartItems };
      Object.values(itemsToMerge).forEach((item) => {
        const currentQuantity = actualCartItems[item.categoryId] || 0;
        const newQuantity = currentQuantity + item.quantity;
        optimisticUpdate[item.categoryId] = newQuantity;
      });
      setCartItems(optimisticUpdate);
      const results = [];
      for (const mergedItem of Object.values(itemsToMerge)) {
        const actualCurrentQuantity = actualCartItems[mergedItem.categoryId] || 0;
        if (actualCurrentQuantity > 0) {
          const newTotalQuantity = actualCurrentQuantity + mergedItem.quantity;
          const result = await updateCartItem(
            mergedItem.categoryId,
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
        finalItemsObj[backendItem.categoryId] = backendItem.quantity;
      });
      setCartItems(finalItemsObj);
      setError(null);
    } catch (err) {
      try {
        const revertCart = await getCart(isLoggedIn);
        const revertItemsObj = {};
        (revertCart.items || []).forEach((item) => {
          revertItemsObj[item.categoryId] = item.quantity;
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
    categoryId,
    quantity,
    measurementUnit = null
  ) => {
    const operationKey = `update-${categoryId}`;
    if (pendingOperations.has(operationKey)) {
      return { success: false, reason: "Operation already pending" };
    }

    setPendingOperations((prev) => new Set([...prev, operationKey]));

    const previousCartItems = { ...cartItems };

    const optimisticUpdate = { ...cartItems };
    optimisticUpdate[categoryId] = quantity;
    setCartItems(optimisticUpdate);

    try {
      const result = await updateCartItem(
        categoryId,
        quantity,
        isLoggedIn,
        measurementUnit
      );

      if (result.items) {
        const itemsObj = {};
        result.items.forEach((backendItem) => {
          itemsObj[backendItem.categoryId] = backendItem.quantity;
        });
        setCartItems(itemsObj);
      }
      setError(null);
      return { success: true, result };
    } catch (err) {
      setCartItems(previousCartItems);

      if (err.message.includes("Item not found in cart")) {
        const updatedItems = { ...previousCartItems };
        delete updatedItems[categoryId];
        setCartItems(updatedItems);
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

  const handleRemoveFromCart = async (categoryId) => {
    setRemovingItems((prev) => new Set([...prev, categoryId]));

    const optimisticUpdate = { ...cartItems };
    delete optimisticUpdate[categoryId];
    setCartItems(optimisticUpdate);

    try {
      const result = await removeItemFromCart(categoryId, isLoggedIn);

      if (result && result.items) {
        const itemsObj = {};
        result.items.forEach((backendItem) => {
          itemsObj[backendItem.categoryId] = backendItem.quantity;
        });
        setCartItems(itemsObj);
      }
      setError(null);
    } catch (err) {
      setCartItems(cartItems);
      setError(err.message || "Failed to remove item");
    } finally {
      setRemovingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(categoryId);
        return newSet;
      });
    }
  };

  const handleClearCart = async () => {
    const originalCart = { ...cartItems };
    setCartItems({});

    try {
      await apiClearCart(isLoggedIn);
      setError(null);
    } catch (err) {
      setCartItems(originalCart);
      setError(err.message || "Failed to clear cart");
    }
  };

  const refreshCart = async () => {
    try {
      const cart = await getCart(isLoggedIn);
      const itemsObj = {};
      (cart.items || []).forEach((item) => {
        itemsObj[item.categoryId] = item.quantity;
      });
      setCartItems(itemsObj);
    } catch (err) {
      throw err;
    }
  };

  const getItemQuantity = (categoryId) => cartItems[categoryId] || 0;

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
        getItemQuantity,
        handleAddToCart,
        handleAddSingleItem,
        handleUpdateQuantity,
        handleRemoveFromCart,
        handleClearCart,
        refreshCart, // <-- ensure this is exported
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
