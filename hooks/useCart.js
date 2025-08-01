import { useCartContext } from '../context/CartContext';
import { calculateQuantity, createCartItem, getIncrementStep, normalizeItemData } from '../utils/cartUtils';

export const useCart = () => {
  const {
    cartItems,
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

  const handleIncreaseQuantity = async (item) => {
    console.log('[useCart] handleIncreaseQuantity - Original item:', item);
    
    // Only normalize if the item is missing essential fields
    const needsNormalization = !item._id || !item.categoryId || !item.image || item.measurement_unit === undefined;
    const processedItem = needsNormalization ? normalizeItemData(item) : item;
    const { _id, measurement_unit } = processedItem;  // Use _id instead of categoryId
    
    console.log('[useCart] handleIncreaseQuantity - Processed item:', {
      _id,
      measurement_unit,
      itemName: processedItem.name,
      categoryName: processedItem.categoryName
    });
    
    // Use _id to get current quantity (with backward compatibility)
    const currentQuantity = getItemQuantity(_id);
    let newQuantity;
    
    if (currentQuantity === 0) {
      newQuantity = 1;
    } else {
      const step = getIncrementStep(measurement_unit);
      newQuantity = calculateQuantity(currentQuantity, step, 'add');
    }
    
    console.log('[useCart] handleIncreaseQuantity:', { 
      _id, 
      currentQuantity, 
      newQuantity, 
      measurement_unit,
      isFirstIncrement: currentQuantity === 0
    });
    
    try {
      if (currentQuantity === 0) {
        // Create proper cart item using new schema
        const cartItem = createCartItem(processedItem, 1);
        
        console.log('[useCart] Adding new item to cart with quantity 1:', cartItem);
        await handleAddSingleItem(cartItem);
      } else {
        console.log('[useCart] Updating existing item quantity:', { _id, newQuantity });
        // Use _id for update operations
        const result = await handleUpdateQuantity(_id, newQuantity, measurement_unit);

        if (result && !result.success && result.reason === 'Operation already pending') {
          console.log('⏸️ [useCart] Update skipped - operation already pending');
          return;
        }
      }
    } catch (error) {
      console.error('[useCart] handleIncreaseQuantity error:', error);
    }
  };

  const handleDecreaseQuantity = async (item) => {
    // Only normalize if the item is missing essential fields
    const needsNormalization = !item._id || !item.categoryId || !item.image || item.measurement_unit === undefined;
    const processedItem = needsNormalization ? normalizeItemData(item) : item;
    const { _id, measurement_unit } = processedItem;  // Use _id instead of categoryId
    
    console.log('[useCart] handleDecreaseQuantity - Processed item:', {
      _id,
      measurement_unit,
      itemName: processedItem.name,
      categoryName: processedItem.categoryName
    });
    
    const currentQuantity = getItemQuantity(_id);  // Use _id to get quantity
    let newQuantity;
    
    if (currentQuantity <= 1) {
      newQuantity = 0;
    } else {
      const step = getIncrementStep(measurement_unit);
      newQuantity = calculateQuantity(currentQuantity, step, 'subtract');

      if (newQuantity < 1) {
        newQuantity = 1;
      }
    }
    
    console.log('[useCart] handleDecreaseQuantity:', { 
      _id, 
      currentQuantity, 
      newQuantity, 
      measurement_unit,
      willRemove: newQuantity <= 0
    });
    
    try {
      if (newQuantity <= 0) {
        await handleRemoveFromCart(_id);  // Use _id for removal
      } else {
        const result = await handleUpdateQuantity(_id, newQuantity, measurement_unit);  // Use _id for update

        if (result && !result.success && result.reason === 'Operation already pending') {
          console.log('⏸️ [useCart] Update skipped - operation already pending');
          return;
        }
      }
    } catch (error) {
      console.error('[useCart] handleDecreaseQuantity error:', error);
    }
  };

  const handleFastIncreaseQuantity = async (item) => {
    console.log('[useCart] handleFastIncreaseQuantity - Original item:', item);
    
    // Only normalize if the item is missing essential fields
    const needsNormalization = !item._id || !item.categoryId || !item.image || item.measurement_unit === undefined;
    const processedItem = needsNormalization ? normalizeItemData(item) : item;
    const { _id, measurement_unit } = processedItem;  // Use _id instead of categoryId

    const currentQuantity = getItemQuantity(_id);  // Use _id to get quantity
    let newQuantity;
    
    if (currentQuantity === 0) {
      newQuantity = 5;
    } else {
      newQuantity = currentQuantity + 5;
    }
    
    console.log('[useCart] handleFastIncreaseQuantity:', { 
      _id, 
      currentQuantity, 
      newQuantity,
      measurement_unit
    });
    
    try {
      if (currentQuantity === 0) {
        let formattedQuantity = newQuantity;
        
        if (measurement_unit === 1) {
          formattedQuantity = parseFloat(newQuantity.toFixed(2));
        }
        
        // Create proper cart item using new schema
        const cartItem = createCartItem(processedItem, formattedQuantity);
        
        console.log('[useCart] Adding new item to cart with fast quantity (FAST PATH):', cartItem);
        await handleAddSingleItem(cartItem);
      } else {
        console.log('[useCart] Fast updating existing item quantity:', { _id, newQuantity });
        const result = await handleUpdateQuantity(_id, newQuantity, measurement_unit);  // Use _id for update
        
        if (result && !result.success && result.reason === 'Operation already pending') {
          console.log('⏸️ [useCart] Fast update skipped - operation already pending');
          return;
        }
      }
    } catch (error) {
      console.error('[useCart] handleFastIncreaseQuantity error:', error);
    }
  };

  const handleFastDecreaseQuantity = async (item) => {
    // Only normalize if the item is missing essential fields
    const needsNormalization = !item._id || !item.categoryId || !item.image || item.measurement_unit === undefined;
    const processedItem = needsNormalization ? normalizeItemData(item) : item;
    const { _id, measurement_unit } = processedItem;  // Use _id instead of categoryId

    const currentQuantity = getItemQuantity(_id);  // Use _id to get quantity
    let newQuantity = currentQuantity - 5;

    if (newQuantity < 1) {
      newQuantity = 0;
    }
    
    console.log('[useCart] handleFastDecreaseQuantity:', { 
      _id,           // Use _id instead of categoryId
      currentQuantity, 
      newQuantity, 
      measurement_unit,
      willRemove: newQuantity <= 0
    });
    
    try {
      if (newQuantity <= 0) {
        await handleRemoveFromCart(_id);  // Use _id for removal
      } else {
        const result = await handleUpdateQuantity(_id, newQuantity, measurement_unit);  // Use _id for update
        
        if (result && !result.success && result.reason === 'Operation already pending') {
          console.log('⏸️ [useCart] Fast decrease skipped - operation already pending');
          return;
        }
      }
    } catch (error) {
      console.error('[useCart] handleFastDecreaseQuantity error:', error);
    }
  };

  return {
    cartItems,
    getItemQuantity,
    handleIncreaseQuantity,
    handleDecreaseQuantity,
    handleFastIncreaseQuantity,
    handleFastDecreaseQuantity,
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