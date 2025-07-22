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
      .catch((err) => setError(err.message || 'Failed to fetch cart'))
      .finally(() => setLoading(false));
  }, [isLoggedIn]);

  const handleAddSingleItem = async (item) => {
    console.log('⚡ [CartContext] handleAddSingleItem - FAST PATH:', item.categoryId);

    const optimisticUpdate = { ...cartItems };
    optimisticUpdate[item.categoryId] = item.quantity;
    setCartItems(optimisticUpdate);
    
    try {

      const result = await addItemToCart(item, isLoggedIn);
      console.log('✅ [CartContext] Fast add result:', result);

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

      console.log('❌ [CartContext] Fast add failed, reverting...');
      setCartItems(cartItems);
      console.error('❌ [CartContext] handleAddSingleItem error:', err);
      setError(err.message || 'Failed to add item');
      return { success: false, error: err.message };
    }
  };

  const handleAddToCart = async (itemOrItems) => {

    const items = Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems];
    
    console.log('🚀 [CartContext] handleAddToCart - START');
    console.log('📊 [CartContext] Current LOCAL cart state:', cartItems);
    console.log('📦 [CartContext] Items to add:', items);
    
    try {

      console.log('� [CartContext] Fetching REAL backend cart state before processing...');
      const currentBackendCart = await getCart(isLoggedIn);
      const actualCartItems = {};
      (currentBackendCart.items || []).forEach((item) => {
        actualCartItems[item.categoryId] = item.quantity;
      });
      console.log('🌐 [CartContext] ACTUAL backend cart state:', actualCartItems);
      console.log('🔍 [CartContext] Backend cart keys:', Object.keys(actualCartItems));

      setCartItems(actualCartItems);

      const itemsToMerge = {};
      items.forEach(item => {
        console.log(`🔄 [CartContext] Processing item: ${item.categoryId} (${item.name}) qty: ${item.quantity}`);
        console.log(`🆔 [CartContext] CategoryId: "${item.categoryId}" (type: ${typeof item.categoryId})`);
        if (itemsToMerge[item.categoryId]) {

          console.log(`🔗 [CartContext] Merging duplicate in batch: ${item.categoryId}`);
          itemsToMerge[item.categoryId].quantity += item.quantity;
        } else {
          itemsToMerge[item.categoryId] = { ...item };
        }
      });
      
      console.log('📋 [CartContext] Items to merge after batching:', itemsToMerge);

      const optimisticUpdate = { ...actualCartItems };
      Object.values(itemsToMerge).forEach(item => {
        const currentQuantity = actualCartItems[item.categoryId] || 0;
        const newQuantity = currentQuantity + item.quantity;
        console.log(`📈 [CartContext] Merging item ${item.categoryId}: ${currentQuantity} + ${item.quantity} = ${newQuantity}`);
        console.log(`🔍 [CartContext] Current quantity in backend: ${currentQuantity}`);
        optimisticUpdate[item.categoryId] = newQuantity;
      });
      
      console.log('✨ [CartContext] Optimistic update result:', optimisticUpdate);
      setCartItems(optimisticUpdate);
      
      console.log('🌐 [CartContext] Starting backend operations...');

      const results = [];
      for (const mergedItem of Object.values(itemsToMerge)) {
        const actualCurrentQuantity = actualCartItems[mergedItem.categoryId] || 0;
        
        console.log(`🔍 [CartContext] Processing ${mergedItem.categoryId}:`);
        console.log(`   - Name: ${mergedItem.name}`);
        console.log(`   - Actual backend quantity: ${actualCurrentQuantity}`);
        console.log(`   - Adding quantity: ${mergedItem.quantity}`);
        console.log(`   - Is existing? ${actualCurrentQuantity > 0}`);
        
        if (actualCurrentQuantity > 0) {

          const newTotalQuantity = actualCurrentQuantity + mergedItem.quantity;
          console.log(`🔄 [CartContext] UPDATING existing item ${mergedItem.categoryId}: ${actualCurrentQuantity} → ${newTotalQuantity}`);
          const result = await updateCartItem(mergedItem.categoryId, newTotalQuantity, isLoggedIn);
          results.push(result);
          console.log(`✅ [CartContext] Update result:`, result);
        } else {

          console.log(`➕ [CartContext] ADDING new item ${mergedItem.categoryId} with quantity ${mergedItem.quantity}`);
          const result = await addItemToCart(mergedItem, isLoggedIn);
          results.push(result);
          console.log(`✅ [CartContext] Add result:`, result);
        }
      }

      console.log('� [CartContext] Fetching FINAL cart state from backend...');
      const finalCart = await getCart(isLoggedIn);
      const finalItemsObj = {};
      (finalCart.items || []).forEach((backendItem) => {
        console.log(`� [CartContext] Final backend item: ${backendItem.categoryId} = ${backendItem.quantity}`);
        finalItemsObj[backendItem.categoryId] = backendItem.quantity;
      });
      
      console.log('🎯 [CartContext] FINAL cart state from backend:', finalItemsObj);
      setCartItems(finalItemsObj);
      
      setError(null);
      console.log('🎉 [CartContext] handleAddToCart - SUCCESS');
      
    } catch (err) {

      console.log('❌ [CartContext] Error occurred, reverting...');

      try {
        const revertCart = await getCart(isLoggedIn);
        const revertItemsObj = {};
        (revertCart.items || []).forEach((item) => {
          revertItemsObj[item.categoryId] = item.quantity;
        });
        setCartItems(revertItemsObj);
      } catch (revertErr) {
        console.error('❌ [CartContext] Failed to revert cart state:', revertErr);
        setCartItems({});
      }
      console.error('❌ [CartContext] handleAddToCart error:', err);
      console.error('[CartContext] handleAddToCart error details:', {
        message: err.message,
        stack: err.stack,
        items: items
      });
      setError(err.message || 'Failed to add items');
      throw err;
    }
  };

  const handleUpdateQuantity = async (categoryId, quantity) => {

    const operationKey = `update-${categoryId}`;
    if (pendingOperations.has(operationKey)) {
      console.log('⏸️ [CartContext] Skipping update - operation already pending for:', categoryId);
      return { success: false, reason: 'Operation already pending' };
    }

    setPendingOperations(prev => new Set([...prev, operationKey]));

    const previousCartItems = { ...cartItems };

    const optimisticUpdate = { ...cartItems };
    optimisticUpdate[categoryId] = quantity;
    setCartItems(optimisticUpdate);
    
    try {
      console.log('🔄 [CartContext] handleUpdateQuantity - Request:', { categoryId, quantity, isLoggedIn });
      const result = await updateCartItem(categoryId, quantity, isLoggedIn);
      console.log('✅ [CartContext] handleUpdateQuantity - Backend response:', result);

      if (result.items) {
        const itemsObj = {};
        result.items.forEach((backendItem) => {
          itemsObj[backendItem.categoryId] = backendItem.quantity;
        });
        console.log('🎯 [CartContext] Setting final state from backend:', itemsObj);
        setCartItems(itemsObj);
      }
      setError(null);
      return { success: true, result };
    } catch (err) {

      console.log('🔄 [CartContext] Reverting to previous state due to error');
      setCartItems(previousCartItems);
      console.error('❌ [CartContext] handleUpdateQuantity error:', err);

      if (err.message.includes('Item not found in cart')) {
        console.warn('🗑️ [CartContext] Item not found in cart, removing from local state:', categoryId);

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
      console.log('[CartContext] handleRemoveFromCart:', categoryId);
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
      console.error('[CartContext] handleRemoveFromCart error:', err);
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
      console.log('[CartContext] refreshCart raw response:', cart);
      const itemsObj = {};
      (cart.items || []).forEach((item) => {
        itemsObj[item.categoryId] = item.quantity;
      });
      console.log('[CartContext] refreshCart processed items:', itemsObj);
      setCartItems(itemsObj);
    } catch (err) {
      console.error('[CartContext] refreshCart error:', err);
      throw err;
    }
  };

  const getItemQuantity = (categoryId) => cartItems[categoryId] || 0;

  const fetchBackendCart = async () => {
    const cart = await getCart(isLoggedIn);
    return cart;
  };

  const testConnectivity = async () => {
    console.log('[CartContext] Testing backend connectivity...');
    return await testBackendConnectivity();
  };

  const testMinimalPostRequest = async () => {
    console.log('[CartContext] Testing minimal POST request...');
    return await testMinimalPost(isLoggedIn);
  };

  const clearAuth = async () => {
    console.log('[CartContext] Clearing authentication data...');
    await clearAuthData();
  };

  const testCartPerformance = async () => {
    console.log('[CartContext] Starting performance test...');
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
      console.log(`[CartContext] Performance test completed in ${duration}ms`);
      return { success: true, duration, message: `Operations completed in ${duration}ms` };
    } catch (err) {
      console.error('[CartContext] Performance test failed:', err);
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
