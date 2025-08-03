import { useCartContext } from '../context/CartContext';
import { calculateQuantity, createCartItem, getIncrementStep, normalizeItemData } from '../utils/cartUtils';
import { isBuyer } from '../utils/roleLabels';

export const useCart = (user = null) => {
  const {
    cartItems,
    cartItemDetails,
    getItemQuantity,
    handleAddToCart,
    handleAddSingleItem,
    handleUpdateQuantity,
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

  const handleIncreaseQuantity = async (item, showError) => {
    const needsNormalization = !item._id || !item.categoryId || !item.image || item.measurement_unit === undefined;
    const processedItem = needsNormalization ? normalizeItemData(item) : item;
    const { _id, measurement_unit, quantity: stockQuantity } = processedItem;
    const currentQuantity = getItemQuantity(_id);
    let newQuantity;
    if (currentQuantity === 0) {
      // Only apply stock validation for buyer users
      if (isBuyer(user)) {
        // Special case: for kg items, if stock < 0.25, block addition; for pieces, if stock < 1
        const minStockRequired = measurement_unit === 1 ? 0.25 : 1;
        if ((typeof stockQuantity === 'number') && stockQuantity < minStockRequired) {
          if (typeof showError === 'function') {
            showError('Not enough quantity in stock to add this item.');
          }
          return false;
        }
      }
      // Use proper step increment for first addition - 0.25 for kg items, 1 for pieces
      const step = getIncrementStep(measurement_unit);
      newQuantity = step;
    } else {
      const step = getIncrementStep(measurement_unit);
      newQuantity = calculateQuantity(currentQuantity, step, 'add');
    }
    try {
      if (currentQuantity === 0) {
        const cartItem = createCartItem(processedItem, newQuantity);
        await handleAddSingleItem(cartItem);
      } else {
        const result = await handleUpdateQuantity(_id, newQuantity, measurement_unit);
        if (result && !result.success && result.reason === 'Operation already pending') {
          console.log('⏸️ [useCart] Update skipped - operation already pending');
          return;
        }
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
        const result = await handleUpdateQuantity(_id, newQuantity, measurement_unit);

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
    const { _id, measurement_unit, quantity: stockQuantity } = processedItem;
    const currentQuantity = getItemQuantity(_id);
    let newQuantity;
    if (currentQuantity === 0) {
      // Only apply stock validation for buyer users
      if (isBuyer(user)) {
        // Block add for kg items with stock < 0.25, for pieces with stock < 1
        const minStockRequired = measurement_unit === 1 ? 0.25 : 1;
        if ((typeof stockQuantity === 'number') && stockQuantity < minStockRequired) {
          if (typeof showError === 'function') {
            showError('Not enough quantity in stock to add this item.');
          }
          return false;
        }
      }
      newQuantity = 5;
    } else {
      newQuantity = currentQuantity + 5;
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
        const result = await handleUpdateQuantity(_id, newQuantity, measurement_unit);
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
        const result = await handleUpdateQuantity(_id, newQuantity, measurement_unit);
        
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
        const result = await handleUpdateQuantity(_id, newQuantity, measurement_unit);
        console.log('useCart handleSetQuantity: handleUpdateQuantity result:', result);
        return result;
      }
    } catch (error) {
      console.error('useCart handleSetQuantity error:', error);
      return { success: false, error: error.message };
    }
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