import { useCartContext } from '../context/CartContext';
import { useStock } from '../context/StockContext';
import { calculateQuantity, createCartItem, getIncrementStep, normalizeItemData } from '../utils/cartUtils';
import { validateCartOperation } from '../utils/cartStockValidation';
import { isBuyer } from '../utils/roleUtils';

export const useCart = (user = null) => {
  const {
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
    fetchBackendCart,
    testConnectivity,
    testMinimalPostRequest,
    testCartPerformance,
    clearAuth,
    loading,
    error,
    removingItems,
    debouncedCartManager,
  } = useCartContext();

  // Get real-time stock data
  const { stockQuantities } = useStock();

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
      const validation = validateCartOperation(
        'increase',
        _id,
        newQuantity,
        stockQuantities,
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
      
      if (result && !result.success && result.reason === 'Operation already pending') {
        console.log('⏸️ [useCart] Update skipped - operation already pending');
        return;
      }
      
      return true;
    } catch (error) {
      console.error('[useCart] handleIncreaseQuantity error:', error);
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
      } else {
        const result = await handleUpdateQuantity(_id, newQuantity, measurement_unit, 'user-interaction');

        if (result && !result.success && result.reason === 'Operation already pending') {
          console.log('⏸️ [useCart] Update skipped - operation already pending');
          return;
        }
      }
    } catch (error) {
      console.error('[useCart] handleDecreaseQuantity error:', error);
    }
  };

  const handleFastIncreaseQuantity = async (item, showError) => {
    const needsNormalization = !item._id || !item.categoryId || !item.image || item.measurement_unit === undefined;
    const processedItem = needsNormalization ? normalizeItemData(item) : item;
    const { _id, measurement_unit } = processedItem;
    const currentQuantity = getItemQuantity(_id);
    let newQuantity;
    if (currentQuantity === 0) {
      // Calculate new quantity consistently
      const fastStep = measurement_unit === 1 ? 5 : 1.0; // 5 pieces or 1kg
      newQuantity = calculateQuantity(currentQuantity, fastStep, 'add');
      
      // Real-time stock validation for buyer users
      if (isBuyer(user)) {
        const validation = validateCartOperation(
          'fast-increase',
          _id,
          newQuantity,
          stockQuantities,
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
      
      newQuantity = measurement_unit === 1 ? 5 : 1.0; // 5 pieces or 1kg
    } else {
      // Calculate new quantity consistently
      const fastStep = measurement_unit === 1 ? 5 : 1.0; // 5 pieces or 1kg
      newQuantity = calculateQuantity(currentQuantity, fastStep, 'add');
      
      // Real-time stock validation for buyer users
      if (isBuyer(user)) {
        const validation = validateCartOperation(
          'fast-increase',
          _id,
          newQuantity,
          stockQuantities,
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
        await handleAddSingleItem(cartItem);
      } else {
        const result = await handleUpdateQuantity(_id, newQuantity, measurement_unit, 'rapid-updates');
        if (result && !result.success && result.reason === 'Operation already pending') {
          console.log('⏸️ [useCart] Fast update skipped - operation already pending');
          return;
        }
      }
      return true;
    } catch (error) {
      console.error('[useCart] handleFastIncreaseQuantity error:', error);
      return false;
    }
  };

  const handleFastDecreaseQuantity = async (item) => {

    const needsNormalization = !item._id || !item.categoryId || !item.image || item.measurement_unit === undefined;
    const processedItem = needsNormalization ? normalizeItemData(item) : item;
    const { _id, measurement_unit } = processedItem;

    const currentQuantity = getItemQuantity(_id);
    let newQuantity = currentQuantity - 5;

    // Use proper minimum quantity based on measurement unit
    const minQuantity = measurement_unit === 1 ? 0.25 : 1;
    if (newQuantity < minQuantity) {
      newQuantity = 0;
    }
    
    try {
      if (newQuantity <= 0) {
        await handleRemoveFromCart(_id);
      } else {
        const result = await handleUpdateQuantity(_id, newQuantity, measurement_unit, 'rapid-updates');
        
        if (result && !result.success && result.reason === 'Operation already pending') {
          console.log('⏸️ [useCart] Fast decrease skipped - operation already pending');
          return;
        }
      }
    } catch (error) {
      console.error('[useCart] handleFastDecreaseQuantity error:', error);
    }
  };

  // Set quantity directly (for manual input)
  const handleSetQuantity = async (item, newQuantity) => {
    console.log('useCart handleSetQuantity called with:', { item: item?.name, newQuantity });
    const needsNormalization = !item._id || !item.categoryId || !item.image || item.measurement_unit === undefined;
    const processedItem = needsNormalization ? normalizeItemData(item) : item;
    const { _id, measurement_unit } = processedItem;
    const currentQuantity = getItemQuantity(_id);
    console.log('useCart handleSetQuantity processed:', { _id, measurement_unit, newQuantity, currentQuantity });
    
    if (newQuantity <= 0) {
      console.log('useCart handleSetQuantity: removing item (quantity <= 0)');
      await handleRemoveFromCart(_id);
      return { success: true };
    }
    
    // Real-time stock validation for buyer users
    if (isBuyer(user)) {
      const validation = validateCartOperation(
        'set',
        _id,
        newQuantity,
        stockQuantities,
        cartItems,
        { [_id]: processedItem }
      );
      
      if (!validation.canProceed) {
        console.log('useCart handleSetQuantity: stock validation failed:', validation.reason);
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
        console.log('useCart handleSetQuantity: adding new item to cart');
        const cartItem = createCartItem(processedItem, newQuantity);
        const result = await handleAddSingleItem(cartItem);
        console.log('useCart handleSetQuantity: handleAddSingleItem result:', result);
        return result || { success: true };
      } else {
        // Item exists in cart, update quantity
        console.log('useCart handleSetQuantity: updating existing item quantity');
        const result = await handleUpdateQuantity(_id, newQuantity, measurement_unit, 'user-interaction');
        console.log('useCart handleSetQuantity: handleUpdateQuantity result:', result);
        return result;
      }
    } catch (error) {
      console.error('useCart handleSetQuantity error:', error);
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

  // NEW: Force sync all pending operations
  const syncPendingOperations = async () => {
    return debouncedCartManager.syncAll();
  };

  return {
    cartItems,
    cartItemDetails,
    updateTrigger,
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
    syncPendingOperations, // NEW: Force sync pending operations
    fetchBackendCart,
    testConnectivity,
    testMinimalPostRequest,
    testCartPerformance,
    clearAuth,
    loading,
    error,
    removingItems,
    debouncedCartManager, // NEW: Expose manager for advanced usage
  };
};