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
    
    const step = getIncrementStep(measurement_unit);

    const minValue = measurement_unit === 1 ? 0.25 : 1;
    const currentQuantity = getItemQuantity(categoryId);
    
    let newQuantity;
    if (currentQuantity === 0) {
      newQuantity = minValue;
    } else {
      newQuantity = calculateQuantity(currentQuantity, step, 'add');
    }
    
    console.log('[useCart] handleIncreaseQuantity:', { 
      categoryId, 
      currentQuantity, 
      newQuantity, 
      measurement_unit,
      step,
      minValue
    });
    
    try {
      if (currentQuantity === 0) {
        // Format quantity properly
        let formattedQuantity = newQuantity;

        if (measurement_unit === 1) {
          formattedQuantity = parseFloat(newQuantity.toFixed(2));
        }
        
        const cartItem = {
          categoryId,
          categoryName: normalizedItem.categoryName, // Include categoryName
          name: normalizedItem.name,
          image: normalizedItem.image,
          points: normalizedItem.points,
          price: normalizedItem.price,
          measurement_unit,
          quantity: formattedQuantity
        };
        
        console.log('[useCart] Adding new item to cart (FAST PATH):', cartItem);
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
      // Could show user-friendly error here
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
    
    const step = getIncrementStep(measurement_unit);
    const minValue = measurement_unit === 1 ? 0.25 : 1;
    const currentQuantity = getItemQuantity(categoryId);
    
    let newQuantity = calculateQuantity(currentQuantity, step, 'subtract');
    
    console.log('[useCart] handleDecreaseQuantity:', { categoryId, currentQuantity, newQuantity, minValue, measurement_unit });

    // For KG items, if new quantity is below minimum but greater than 0, set to 0
    if (measurement_unit === 1 && newQuantity < minValue && newQuantity > 0) {
      newQuantity = 0;
    }
    
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
      // Could show user-friendly error here
    }
  };

  const handleFastIncreaseQuantity = async (item) => {
    console.log('[useCart] handleFastIncreaseQuantity - Original item:', item);
    
    const normalizedItem = normalizeItemData(item);
    const { categoryId, measurement_unit } = normalizedItem;

    const fastStep = 5;
    const currentQuantity = getItemQuantity(categoryId);
    let newQuantity = currentQuantity + fastStep;
    
    console.log('[useCart] handleFastIncreaseQuantity:', { 
      categoryId, 
      currentQuantity, 
      newQuantity, 
      fastStep,
      measurement_unit
    });
    
    try {
      if (currentQuantity === 0) {
        // Format quantity properly
        let formattedQuantity = newQuantity;
        
        if (measurement_unit === 1) {
          formattedQuantity = parseFloat(newQuantity.toFixed(2));
        }
        
        const cartItem = {
          categoryId,
          categoryName: normalizedItem.categoryName, // Include categoryName
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

    const fastStep = 5;
    const minValue = measurement_unit === 1 ? 0.25 : 1;
    const currentQuantity = getItemQuantity(categoryId);
    let newQuantity = currentQuantity - fastStep;
    
    console.log('[useCart] handleFastDecreaseQuantity:', { 
      categoryId, 
      currentQuantity, 
      newQuantity, 
      fastStep, 
      minValue, 
      measurement_unit 
    });

    // If new quantity is below minimum, set to 0
    if (newQuantity < minValue) {
      newQuantity = 0;
    }
    
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