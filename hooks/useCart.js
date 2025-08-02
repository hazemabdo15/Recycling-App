import { useCartContext } from '../context/CartContext';
import { calculateQuantity, createCartItem, getIncrementStep, normalizeItemData } from '../utils/cartUtils';

export const useCart = () => {
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

  const handleIncreaseQuantity = async (item) => {

    const needsNormalization = !item._id || !item.categoryId || !item.image || item.measurement_unit === undefined;
    const processedItem = needsNormalization ? normalizeItemData(item) : item;
    const { _id, measurement_unit } = processedItem;

    const currentQuantity = getItemQuantity(_id);
    let newQuantity;
    
    if (currentQuantity === 0) {
      newQuantity = 1;
    } else {
      const step = getIncrementStep(measurement_unit);
      newQuantity = calculateQuantity(currentQuantity, step, 'add');
    }
    
    try {
      if (currentQuantity === 0) {

        const cartItem = createCartItem(processedItem, 1);
        await handleAddSingleItem(cartItem);
      } else {

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

    const needsNormalization = !item._id || !item.categoryId || !item.image || item.measurement_unit === undefined;
    const processedItem = needsNormalization ? normalizeItemData(item) : item;
    const { _id, measurement_unit } = processedItem;
    
    const currentQuantity = getItemQuantity(_id);
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

  const handleFastIncreaseQuantity = async (item) => {

    const needsNormalization = !item._id || !item.categoryId || !item.image || item.measurement_unit === undefined;
    const processedItem = needsNormalization ? normalizeItemData(item) : item;
    const { _id, measurement_unit } = processedItem;

    const currentQuantity = getItemQuantity(_id);
    let newQuantity;
    
    if (currentQuantity === 0) {
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
    } catch (error) {
      console.error('[useCart] handleFastIncreaseQuantity error:', error);
    }
  };

  const handleFastDecreaseQuantity = async (item) => {

    const needsNormalization = !item._id || !item.categoryId || !item.image || item.measurement_unit === undefined;
    const processedItem = needsNormalization ? normalizeItemData(item) : item;
    const { _id, measurement_unit } = processedItem;

    const currentQuantity = getItemQuantity(_id);
    let newQuantity = currentQuantity - 5;

    if (newQuantity < 1) {
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

  return {
    cartItems,
    cartItemDetails,
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