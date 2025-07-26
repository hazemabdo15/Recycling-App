import { useCartContext } from '../context/CartContext';
import { calculateQuantity, getIncrementStep, normalizeItemData } from '../utils/cartUtils';

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
    
    const normalizedItem = normalizeItemData(item);
    const { categoryId, measurement_unit } = normalizedItem;
    
    console.log('[useCart] handleIncreaseQuantity - Normalized item:', {
      categoryId,
      measurement_unit,
      itemName: normalizedItem.name,
      categoryName: normalizedItem.categoryName
    });
    
    const currentQuantity = getItemQuantity(categoryId);
    let newQuantity;
    
    if (currentQuantity === 0) {

      newQuantity = 1;
    } else {

      const step = getIncrementStep(measurement_unit);
      newQuantity = calculateQuantity(currentQuantity, step, 'add');
    }
    
    console.log('[useCart] handleIncreaseQuantity:', { 
      categoryId, 
      currentQuantity, 
      newQuantity, 
      measurement_unit,
      isFirstIncrement: currentQuantity === 0
    });
    
    try {
      if (currentQuantity === 0) {

        const cartItem = {
          categoryId,
          categoryName: normalizedItem.categoryName,
          name: normalizedItem.name,
          image: normalizedItem.image,
          points: normalizedItem.points,
          price: normalizedItem.price,
          measurement_unit,
          quantity: 1
        };
        
        console.log('[useCart] Adding new item to cart with quantity 1:', cartItem);
        await handleAddSingleItem(cartItem);
      } else {
        console.log('[useCart] Updating existing item quantity:', { categoryId, newQuantity });
        const result = await handleUpdateQuantity(categoryId, newQuantity, measurement_unit);

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
    const normalizedItem = normalizeItemData(item);
    const { categoryId, measurement_unit } = normalizedItem;
    
    console.log('[useCart] handleDecreaseQuantity - Normalized item:', {
      categoryId,
      measurement_unit,
      itemName: normalizedItem.name,
      categoryName: normalizedItem.categoryName
    });
    
    const currentQuantity = getItemQuantity(categoryId);
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
      categoryId, 
      currentQuantity, 
      newQuantity, 
      measurement_unit,
      willRemove: newQuantity <= 0
    });
    
    try {
      if (newQuantity <= 0) {
        await handleRemoveFromCart(categoryId);
      } else {
        const result = await handleUpdateQuantity(categoryId, newQuantity, measurement_unit);

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
    
    const normalizedItem = normalizeItemData(item);
    const { categoryId, measurement_unit } = normalizedItem;

    const currentQuantity = getItemQuantity(categoryId);
    let newQuantity;
    
    if (currentQuantity === 0) {

      newQuantity = 5;
    } else {

      newQuantity = currentQuantity + 5;
    }
    
    console.log('[useCart] handleFastIncreaseQuantity:', { 
      categoryId, 
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
        
        const cartItem = {
          categoryId,
          categoryName: normalizedItem.categoryName,
          name: normalizedItem.name,
          image: normalizedItem.image,
          points: normalizedItem.points,
          price: normalizedItem.price,
          measurement_unit,
          quantity: formattedQuantity
        };
        
        console.log('[useCart] Adding new item to cart with fast quantity (FAST PATH):', cartItem);
        await handleAddSingleItem(cartItem);
      } else {
        console.log('[useCart] Fast updating existing item quantity:', { categoryId, newQuantity });
        const result = await handleUpdateQuantity(categoryId, newQuantity, measurement_unit);
        
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
    const normalizedItem = normalizeItemData(item);
    const { categoryId, measurement_unit } = normalizedItem;

    const currentQuantity = getItemQuantity(categoryId);
    let newQuantity = currentQuantity - 5;

    if (newQuantity < 1) {
      newQuantity = 0;
    }
    
    console.log('[useCart] handleFastDecreaseQuantity:', { 
      categoryId, 
      currentQuantity, 
      newQuantity, 
      measurement_unit,
      willRemove: newQuantity <= 0
    });
    
    try {
      if (newQuantity <= 0) {
        await handleRemoveFromCart(categoryId);
      } else {
        const result = await handleUpdateQuantity(categoryId, newQuantity, measurement_unit);
        
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