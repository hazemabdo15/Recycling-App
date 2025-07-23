import { createContext, useContext, useEffect, useState } from 'react';
import {
  addItemToCart,
  clearCart as apiClearCart,
  clearAuthData,
  getCart,
  removeCartItem,
  testBackendConnectivity,
  testMinimalPost,
  updateCartItem
} from '../services/api/cart.js';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCartContext = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { isLoggedIn } = useAuth();
  const [cartItems, setCartItems] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pendingOperations, setPendingOperations] = useState(new Set());
  const [removingItems, setRemovingItems] = useState(new Set());

  useEffect(() => {
    setLoading(true);
    getCart(isLoggedIn)
      .then((cart) => {

        const itemsObj = {};
                (cart.items || []).forEach((item) => {
                    itemsObj[item.categoryId] = item.quantity;
                });
        setCartItems(itemsObj);
        setError(null);
      })
      .catch((err) => {
        console.warn('Failed to fetch cart from backend, using empty cart:', err.message);
        setCartItems({});
        setError(null);
      })
      .finally(() => setLoading(false));
  }, [isLoggedIn]);

  const handleAddSingleItem = async (item) => {
    const optimisticUpdate = { ...cartItems };
    optimisticUpdate[item.categoryId] = item.quantity;
    setCartItems(optimisticUpdate);
    
    try {
      const result = await addItemToCart(item, isLoggedIn);

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
      setCartItems(cartItems);
      setError(err.message || 'Failed to add item');
      return { success: false, error: err.message };
    }
  };

  const handleAddToCart = async (itemOrItems) => {
    const items = Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems];
    
    try {
      const currentBackendCart = await getCart(isLoggedIn);
      const actualCartItems = {};
      (currentBackendCart.items || []).forEach((item) => {
        actualCartItems[item.categoryId] = item.quantity;
      });

      setCartItems(actualCartItems);

      const itemsToMerge = {};
      items.forEach(item => {
        if (itemsToMerge[item.categoryId]) {
          itemsToMerge[item.categoryId].quantity += item.quantity;
        } else {
          itemsToMerge[item.categoryId] = { ...item };
        }
      });

      const optimisticUpdate = { ...actualCartItems };
      Object.values(itemsToMerge).forEach(item => {
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
          const result = await updateCartItem(mergedItem.categoryId, newTotalQuantity, isLoggedIn);
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
      setError(err.message || 'Failed to add items');
      throw err;
    }
  };

  const handleUpdateQuantity = async (categoryId, quantity, measurementUnit = null) => {
    const operationKey = `update-${categoryId}`;
    if (pendingOperations.has(operationKey)) {
      return { success: false, reason: 'Operation already pending' };
    }

    setPendingOperations(prev => new Set([...prev, operationKey]));

    const previousCartItems = { ...cartItems };

    const optimisticUpdate = { ...cartItems };
    optimisticUpdate[categoryId] = quantity;
    setCartItems(optimisticUpdate);
    
    try {
      const result = await updateCartItem(categoryId, quantity, isLoggedIn, measurementUnit);

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

      if (err.message.includes('Item not found in cart')) {
        const updatedItems = { ...previousCartItems };
        delete updatedItems[categoryId];
        setCartItems(updatedItems);
        setError('Item was removed from cart');
      } else {
        setError(err.message || 'Failed to update item');
      }
      return { success: false, error: err.message };
    } finally {
      setTimeout(() => {
        setPendingOperations(prev => {
          const newSet = new Set(prev);
          newSet.delete(operationKey);
          return newSet;
        });
      }, 10);
    }
  };

  const handleRemoveFromCart = async (categoryId) => {
    setRemovingItems(prev => new Set([...prev, categoryId]));

    const optimisticUpdate = { ...cartItems };
    delete optimisticUpdate[categoryId];
    setCartItems(optimisticUpdate);
    
    try {
      const result = await removeCartItem(categoryId, isLoggedIn);

      if (result.items) {
        const itemsObj = {};
        result.items.forEach((backendItem) => {
          itemsObj[backendItem.categoryId] = backendItem.quantity;
        });
        setCartItems(itemsObj);
      }
      setError(null);
    } catch (err) {
      setCartItems(cartItems);
      setError(err.message || 'Failed to remove item');
    } finally {
      setRemovingItems(prev => {
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
      setError(err.message || 'Failed to clear cart');
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
    try {
      const cart = await getCart(isLoggedIn);
      return cart;
    } catch (error) {
      console.warn('Error fetching backend cart, using local cart data:', error.message);
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
        categoryId: 'perf-test-' + Date.now(),
        name: 'Performance Test Item',
        quantity: 1,
        measurement_unit: 1,
        points: 10,
        price: 5,
        image: 'test.jpg'
      };
      
      await handleAddToCart(testItem);
      await handleUpdateQuantity(testItem.categoryId, 2);
      await handleRemoveFromCart(testItem.categoryId);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      return { success: true, duration, message: `Operations completed in ${duration}ms` };
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
