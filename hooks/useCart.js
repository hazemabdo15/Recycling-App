import { useCartContext } from '../context/CartContext';
import { useStock } from '../context/StockContext';
import { validateCartOperation } from '../utils/cartStockValidation';
import { calculateQuantity, createCartItem, getIncrementStep, normalizeItemData } from '../utils/cartUtils';
import logger from '../utils/logger';
import { isBuyer } from '../utils/roleUtils';
import { useAllItems } from './useAPI';

export const useCart = (user = null) => {
  const {
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
    loading,
    error,
    removingItems,
  } = useCartContext();

  // Get real-time stock data with fallback support
  const { getStockQuantity } = useStock();
  
  // Get all items for enhanced stock lookup
  const { items: allItems } = useAllItems();
  const safeAllItems = Array.isArray(allItems) ? allItems : [];

  const handleIncreaseQuantity = async (item, showError) => {
    const needsNormalization = !item._id || !item.categoryId || !item.image || item.measurement_unit === undefined;
    const processedItem = needsNormalization ? normalizeItemData(item) : item;
    const { _id, measurement_unit } = processedItem;
    const currentQuantity = getItemQuantity(_id);
    
    // Calculate new quantity consistently
    const step = getIncrementStep(measurement_unit);
    const newQuantity = calculateQuantity(currentQuantity, step, 'add');
    
    // Real-time stock validation for buyer users
    if (isBuyer(user)) {
      // Get API stock quantity using enhanced search logic - try multiple ID fields
      // Only search if allItems data is available
      let apiStockQuantity = processedItem.quantity || 0;
      
      if (safeAllItems.length > 0) {
        const originalItem = safeAllItems.find(
          (originalItem) =>
            originalItem._id === _id ||
            originalItem._id === processedItem.categoryId ||
            originalItem.categoryId === _id ||
            originalItem.categoryId === processedItem.categoryId
        );
        
        // Get the most reliable stock value from the original item if found
        if (originalItem) {
          apiStockQuantity = originalItem?.quantity ??
            originalItem?.available_quantity ??
            originalItem?.stock_quantity ??
            originalItem?.quantity_available ??
            processedItem.quantity ??
            processedItem.available_quantity ??
            processedItem.stock_quantity ??
            processedItem.quantity_available ?? 0;
        }
      }
      
      if (safeAllItems.length > 0) {
        const originalItem = safeAllItems.find(
          (originalItem) =>
            originalItem._id === _id ||
            originalItem._id === processedItem.categoryId ||
            originalItem.categoryId === _id ||
            originalItem.categoryId === processedItem.categoryId
        );
        
        // Get the most reliable stock value from the original item if found
        if (originalItem) {
          apiStockQuantity = originalItem?.quantity ??
            originalItem?.available_quantity ??
            originalItem?.stock_quantity ??
            originalItem?.quantity_available ??
            processedItem.quantity ??
            processedItem.available_quantity ??
            processedItem.stock_quantity ??
            processedItem.quantity_available ?? 0;
        }
      }
      
      const fallbackStock = getStockQuantity(_id, apiStockQuantity);
      
      const stockQuantitiesWithFallback = {
        [_id]: fallbackStock // Use fallback to API data
      };
      
      const validation = validateCartOperation(
        'increase',
        _id,
        newQuantity,
        stockQuantitiesWithFallback,
        cartItems,
        { [_id]: processedItem }
      );
      
      if (!validation.canProceed) {
        if (typeof showError === 'function') {
          showError(validation.reason);
        }
        return false;
      }
    }
    
    try {
      // Always use handleUpdateQuantity for consistency - it can handle both new and existing items
      const result = await handleUpdateQuantity(
        _id, 
        newQuantity, 
        measurement_unit, 
        'user-interaction',
        currentQuantity === 0 ? processedItem : null // Pass item data for new items
      );
      
      if (result && result.success) {
        logger.success('Quantity increased successfully', { itemId: _id, newQuantity }, 'CART');
      }
      
      if (result && !result.success && result.reason === 'Operation already pending') {
        return;
      }
      
      return true;
    } catch (_error) {
      return false;
    }
  };

  const handleDecreaseQuantity = async (item) => {

    const needsNormalization = !item._id || !item.categoryId || !item.image || item.measurement_unit === undefined;
    const processedItem = needsNormalization ? normalizeItemData(item) : item;
    const { _id, measurement_unit } = processedItem;
    
    const currentQuantity = getItemQuantity(_id);
    let newQuantity;
    
    const step = getIncrementStep(measurement_unit);
    const minQuantity = step; // 0.25 for kg items, 1 for pieces
    
    if (currentQuantity <= minQuantity) {
      newQuantity = 0;
    } else {
      newQuantity = calculateQuantity(currentQuantity, step, 'subtract');

      // Ensure we don't go below minimum quantity
      if (newQuantity < minQuantity) {
        newQuantity = minQuantity;
      }
    }
    
    try {
      if (newQuantity <= 0) {
        await handleRemoveFromCart(_id);
        logger.success('Item removed from cart (quantity decreased to 0)', { itemId: _id }, 'CART');
      } else {
        const result = await handleUpdateQuantity(_id, newQuantity, measurement_unit, 'user-interaction', processedItem);
        
        if (result && result.success) {
          logger.success('Quantity decreased successfully', { itemId: _id, newQuantity }, 'CART');
        }

        if (result && !result.success && result.reason === 'Operation already pending') {
          return;
        }
      }
    } catch (_error) {
      // Handle error silently
    }
  };

  const handleFastIncreaseQuantity = async (item, showError) => {
    const needsNormalization = !item._id || !item.categoryId || !item.image || item.measurement_unit === undefined;
    const processedItem = needsNormalization ? normalizeItemData(item) : item;
    const { _id, measurement_unit } = processedItem;
    const currentQuantity = getItemQuantity(_id);
    let newQuantity;
    if (currentQuantity === 0) {
      // Fast step should always be 5 regardless of measurement unit
      const fastStep = 5;
      newQuantity = calculateQuantity(currentQuantity, fastStep, 'add');
      
      // Real-time stock validation for buyer users
      if (isBuyer(user)) {
        // Get API stock quantity using enhanced search logic - try multiple ID fields
        // Only search if allItems data is available
        let apiStockQuantity = processedItem.quantity || 0;
        
        if (safeAllItems.length > 0) {
          const originalItem = safeAllItems.find(
            (originalItem) =>
              originalItem._id === _id ||
              originalItem._id === processedItem.categoryId ||
              originalItem.categoryId === _id ||
              originalItem.categoryId === processedItem.categoryId
          );
          
          // Get the most reliable stock value from the original item if found
          if (originalItem) {
            apiStockQuantity = originalItem?.quantity ??
              originalItem?.available_quantity ??
              originalItem?.stock_quantity ??
              originalItem?.quantity_available ??
              processedItem.quantity ??
              processedItem.available_quantity ??
              processedItem.stock_quantity ??
              processedItem.quantity_available ?? 0;
          }
        }
        
        const fallbackStock = getStockQuantity(_id, apiStockQuantity);
        
        const stockQuantitiesWithFallback = {
          [_id]: fallbackStock // Use fallback to API data
        };
        
        const validation = validateCartOperation(
          'fast-increase',
          _id,
          newQuantity,
          stockQuantitiesWithFallback,
          cartItems,
          { [_id]: processedItem }
        );
        
        if (!validation.canProceed) {
          if (typeof showError === 'function') {
            showError(validation.reason);
          }
          return false;
        }
      }
      
      newQuantity = 5; // Always add 5 for fast increase
    } else {
      // Fast step should always be 5 regardless of measurement unit
      const fastStep = 5;
      newQuantity = calculateQuantity(currentQuantity, fastStep, 'add');
      
      // Real-time stock validation for buyer users
      if (isBuyer(user)) {
        // Get API stock quantity using enhanced search logic - try multiple ID fields
        // Only search if allItems data is available
        let apiStockQuantity = processedItem.quantity || 0;
        
        if (safeAllItems.length > 0) {
          const originalItem = safeAllItems.find(
            (originalItem) =>
              originalItem._id === _id ||
              originalItem._id === processedItem.categoryId ||
              originalItem.categoryId === _id ||
              originalItem.categoryId === processedItem.categoryId
          );
          
          // Get the most reliable stock value from the original item if found
          if (originalItem) {
            apiStockQuantity = originalItem?.quantity ??
              originalItem?.available_quantity ??
              originalItem?.stock_quantity ??
              originalItem?.quantity_available ??
              processedItem.quantity ??
              processedItem.available_quantity ??
              processedItem.stock_quantity ??
              processedItem.quantity_available ?? 0;
          }
        }
        
        const fallbackStock = getStockQuantity(_id, apiStockQuantity);
        
        const stockQuantitiesWithFallback = {
          [_id]: fallbackStock // Use fallback to API data
        };
        
        const validation = validateCartOperation(
          'fast-increase',
          _id,
          newQuantity,
          stockQuantitiesWithFallback,
          cartItems,
          { [_id]: processedItem }
        );
        
        if (!validation.canProceed) {
          if (typeof showError === 'function') {
            showError(validation.reason);
          }
          return false;
        }
      }
    }
    try {
      if (currentQuantity === 0) {
        let formattedQuantity = newQuantity;
        if (measurement_unit === 1) {
          formattedQuantity = parseFloat(newQuantity.toFixed(2));
        }
        const cartItem = createCartItem(processedItem, formattedQuantity);
        await handleAddToCart(cartItem);
      } else {
        const result = await handleUpdateQuantity(_id, newQuantity, measurement_unit, 'rapid-updates', processedItem);
        
        if (result && result.success) {
          logger.success('Rapid quantity update succeeded', { itemId: _id, newQuantity }, 'CART');
        }
        
        if (result && !result.success && result.reason === 'Operation already pending') {
          return;
        }
      }
      return true;
    } catch (_error) {
      return false;
    }
  };

  const handleFastDecreaseQuantity = async (item) => {

    const needsNormalization = !item._id || !item.categoryId || !item.image || item.measurement_unit === undefined;
    const processedItem = needsNormalization ? normalizeItemData(item) : item;
    const { _id, measurement_unit } = processedItem;

    const currentQuantity = getItemQuantity(_id);
    
    // Fast step should always be 5 regardless of measurement unit
    const fastStep = 5;
    let newQuantity = currentQuantity - fastStep;

    // Use proper minimum quantity based on measurement unit
    const minQuantity = measurement_unit === 1 ? 0.25 : 1;
    if (newQuantity < minQuantity) {
      newQuantity = 0;
    }
    
    try {
      if (newQuantity <= 0) {
        await handleRemoveFromCart(_id);
        logger.success('Item removed from cart (rapid decrease to 0)', { itemId: _id }, 'CART');
      } else {
        const result = await handleUpdateQuantity(_id, newQuantity, measurement_unit, 'rapid-updates', processedItem);
        
        if (result && result.success) {
          logger.success('Rapid quantity decrease succeeded', { itemId: _id, newQuantity }, 'CART');
        }
        
        if (result && !result.success && result.reason === 'Operation already pending') {
          return;
        }
      }
    } catch (_error) {
      // Handle error silently or log through proper logger if needed
    }
  };

  // Set quantity directly (for manual input)
  const handleSetQuantity = async (item, newQuantity) => {
    const needsNormalization = !item._id || !item.categoryId || !item.image || item.measurement_unit === undefined;
    const processedItem = needsNormalization ? normalizeItemData(item) : item;
    const { _id, measurement_unit } = processedItem;
    const currentQuantity = getItemQuantity(_id);
    
    if (newQuantity <= 0) {
      await handleRemoveFromCart(_id);
      logger.success('Item removed from cart (set quantity to 0)', { itemId: _id }, 'CART');
      return { success: true };
    }
    
    // Real-time stock validation for buyer users
    if (isBuyer(user)) {
      // Get API stock quantity using enhanced search logic - try multiple ID fields
      // Only search if allItems data is available
      let apiStockQuantity = processedItem.quantity || 0;
      
      if (safeAllItems.length > 0) {
        const originalItem = safeAllItems.find(
          (originalItem) =>
            originalItem._id === _id ||
            originalItem._id === processedItem.categoryId ||
            originalItem.categoryId === _id ||
            originalItem.categoryId === processedItem.categoryId
        );
        
        // Get the most reliable stock value from the original item if found
        if (originalItem) {
          apiStockQuantity = originalItem?.quantity ??
            originalItem?.available_quantity ??
            originalItem?.stock_quantity ??
            originalItem?.quantity_available ??
            processedItem.quantity ??
            processedItem.available_quantity ??
            processedItem.stock_quantity ??
            processedItem.quantity_available ?? 0;
        }
      }
      
      const stockQuantitiesWithFallback = {
        [_id]: getStockQuantity(_id, apiStockQuantity) // Use fallback to API data
      };
      
      const validation = validateCartOperation(
        'set',
        _id,
        newQuantity,
        stockQuantitiesWithFallback,
        cartItems,
        { [_id]: processedItem }
      );
      
      if (!validation.canProceed) {
        return { 
          success: false, 
          error: validation.reason,
          suggestion: validation.suggestion
        };
      }
    }
    
    try {
      if (currentQuantity === 0) {
        // Item doesn't exist in cart, add it
        const cartItem = createCartItem(processedItem, newQuantity);
        const result = await handleAddToCart(cartItem);
        return result || { success: true };
      } else {
        // Item exists in cart, update quantity
        const result = await handleUpdateQuantity(_id, newQuantity, measurement_unit, 'user-interaction', processedItem);
        
        if (result && result.success) {
          logger.success('Set quantity succeeded', { itemId: _id, newQuantity }, 'CART');
        }
        
        return result;
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // NEW: AI Results handler for bulk operations
  const handleAIResults = async (aiItems) => {
    return handleAddAIResults(aiItems);
  };

  // NEW: Batch update handler
  const batchUpdateCart = async (itemId, quantity, measurementUnit) => {
    return handleBatchUpdate(itemId, quantity, measurementUnit);
  };

  return {
    cartItems,
    cartItemDetails,
    getItemQuantity,
    handleIncreaseQuantity,
    handleDecreaseQuantity,
    handleFastIncreaseQuantity,
    handleFastDecreaseQuantity,
    handleSetQuantity,
    handleClearCart,
    handleRemoveFromCart,
    handleAddToCart,
    handleAIResults, // NEW: For AI voice modal
    batchUpdateCart, // NEW: For batch operations
    fetchBackendCart,
    testConnectivity,
    testMinimalPostRequest,
    testCartPerformance,
    clearAuth,
    loading,
    error,
    removingItems,
  };
};