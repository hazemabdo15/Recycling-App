
export const getUnitDisplay = (measurementUnit) => {
    return measurementUnit === 1 ? 'KG' : 'Piece';
};

export const getIncrementStep = (measurementUnit) => {
    return measurementUnit === 1 ? 0.25 : 1;
};

export const getMinimumQuantity = (measurementUnit) => {

    return 1;
};

export const validateQuantity = (item) => {
    const quantity = Number(item.quantity);
    const measurementUnit = Number(item.measurement_unit);
    
    if (isNaN(quantity) || quantity <= 0) {
        throw new Error("Quantity must be greater than 0.");
    }
    
    if (isNaN(measurementUnit)) {
        throw new Error("Invalid measurement unit. Must be 1 (KG) or 2 (Piece).");
    }
    
    if (measurementUnit === 1) {

        if (quantity < 1) {
            throw new Error("For KG items, minimum quantity is 1.");
        }

        if (quantity > 1 && quantity % 0.25 !== 0) {
            throw new Error("For KG items, quantity must be in 0.25 increments (e.g., 1.0, 1.25, 1.5, 1.75, 2.0).");
        }
    } else if (measurementUnit === 2) {

        if (!Number.isInteger(quantity) || quantity < 1) {
            throw new Error("For piece items, quantity must be whole numbers >= 1.");
        }
    } else {
        throw new Error("Invalid measurement unit. Must be 1 (KG) or 2 (Piece).");
    }
};

export const normalizeItemData = (item) => {
    // Smart normalization - only process if data is actually incomplete
    if (!item) {
        console.warn('[normalizeItemData] Received null/undefined item');
        return {};
    }
    
    // If the item already has all required fields, return it as-is (most efficient)
    if (item._id && item.categoryId && item.name && item.measurement_unit !== undefined) {
        return { ...item };
    }
    
    // Legacy fallback normalization for incomplete data
    console.log('[normalizeItemData] Normalizing incomplete item:', {
        _id: item._id,
        categoryId: item.categoryId,
        name: item.name,
        measurement_unit: item.measurement_unit
    });
    
    return {
        _id: item._id || item.itemId,
        categoryId: item.categoryId || item.categoryId,
        name: item.name || item.material || 'Unknown Item',
        image: item.image || '',
        points: item.points || 0,
        price: item.price || item.value || 0,
        categoryName: item.categoryName || '',
        measurement_unit: item.measurement_unit || item.unit || 2,
        quantity: item.quantity || 1,
        ...item // Preserve any additional fields
    };
};

export const formatQuantityDisplay = (quantity, measurementUnit) => {
    if (measurementUnit === 1) {

        return Number(quantity).toFixed(2);
    }
    return quantity.toString();
};

export const calculateQuantity = (currentQuantity, step, operation = 'add') => {
    const current = Number(currentQuantity) || 0;
    const stepValue = Number(step) || 0;
    
    let result;
    if (operation === 'add') {
        result = current + stepValue;
    } else if (operation === 'subtract') {
        result = current - stepValue;
    } else {
        result = current;
    }

    result = Math.round((result + Number.EPSILON) * 100) / 100;

    return Math.max(0, result);
};

export const calculateCartStats = (items, cartItems) => {
    const totalItems = items.length;
    
    let totalPoints = 0;
    let totalValue = 0;
    
    items.forEach(item => {
        // normalizeItemData is now safe and won't corrupt complete data
        const processedItem = normalizeItemData(item);
        const itemKey = getCartKey(processedItem);
        const quantity = cartItems[itemKey] || 0;
        
        totalPoints += (processedItem.points || 0) * quantity;
        totalValue += (processedItem.price || 0) * quantity;
    });
    
    return {
        totalItems,
        totalPoints: Math.round((totalPoints + Number.EPSILON) * 100) / 100,
        totalValue: Math.round((totalValue + Number.EPSILON) * 100) / 100
    };
};

export const getMeasurementIcon = (measurementUnit) => {
    return measurementUnit === 1 ? "weight-kilogram" : "cube-outline";
};

// New utility functions for handling the improved backend schema

/**
 * Creates a cart item object that matches the new backend schema
 * @param {Object} item - The item from API endpoints
 * @param {number} quantity - The quantity to add to cart
 * @returns {Object} Cart item formatted for backend
 */
export const createCartItem = (item, quantity = 1) => {
    // normalizeItemData is now safe and won't corrupt complete data
    const processedItem = normalizeItemData(item);
    
    // The API should provide categoryName, but have a fallback for safety
    let categoryName = processedItem.categoryName;
    
    // Only use fallback mapping if categoryName is missing
    if (!categoryName) {
        console.warn('[createCartItem] Missing categoryName, using fallback mapping for:', processedItem.name);
        const categoryNameMapping = {
            "687d76c4ba6a94b1537a1ae5": "paper",
            "687e051316468b6886743500": "e-wasted", 
            "687e977eadcf919b39d0b1d4": "spare-parts",
            "687e9637adcf919b39d0b0e7": "metals",
            "687e9686adcf919b39d0b0ea": "metals",
            "687e9635adcf919b39d0b0e6": "plastic",
            "687e9633adcf919b39d0b0e5": "glass"
        };
        
        categoryName = categoryNameMapping[processedItem.categoryId] || "unknown";
    }
    
    const result = {
        _id: processedItem._id,                    // Item ID
        categoryId: processedItem.categoryId,      // Category ID  
        name: processedItem.name,                  // Item name
        image: processedItem.image || '',          // Item image URL
        points: processedItem.points || 0,         // Points per item
        price: processedItem.price || 0,           // Price per item
        categoryName: categoryName,                // Category name (REQUIRED by backend)
        measurement_unit: processedItem.measurement_unit, // 1 = KG, 2 = PIECE
        quantity: quantity                      // Quantity in cart
    };
    
    return result;
};

/**
 * Converts API item data to format suitable for cart operations
 * Uses _id as the primary identifier for cart operations
 * @param {Object} item - Item from API
 * @returns {Object} Normalized item with proper IDs
 */
export const normalizeApiItem = (item) => {
    const normalized = normalizeItemData(item);
    
    // Ensure we have the required fields for cart operations
    if (!normalized._id) {
        console.warn('Item missing _id field:', item);
    }
    
    return {
        ...normalized,
        // Ensure we use the item _id as the primary identifier
        itemId: normalized._id,           // For clarity in cart operations
        cartKey: normalized._id,          // Key to use in cart state
    };
};

/**
 * Helper function to get the cart key for an item
 * IMPORTANT: With the naming correction, this returns the actual item ID
 * @param {Object} item - Item object
 * @returns {string} The item ID to use for cart operations
 */
export const getCartKey = (item) => {
    // normalizeItemData is now safe and won't corrupt complete data
    const processed = normalizeItemData(item);
    return processed._id;
};

/**
 * Helper function to get the display key for UI components
 * @param {Object} item - Item object  
 * @returns {string} The key to use for UI rendering (should be stable and unique)
 */
export const getDisplayKey = (item) => {
    // Use the item ID for display keys (most stable identifier)
    const itemId = getCartKey(item);
    return itemId || String(Math.random());
};

/**
 * Calculates cart statistics from backend cart format
 * @param {Array} cartItems - Items from backend cart.items array
 * @returns {Object} Cart statistics
 */
export const calculateBackendCartStats = (cartItems = []) => {
    const totalItems = cartItems.length;
    
    let totalPoints = 0;
    let totalValue = 0;
    
    cartItems.forEach(item => {
        const quantity = item.quantity || 0;
        totalPoints += (item.points || 0) * quantity;
        totalValue += (item.price || 0) * quantity;
    });
    
    return {
        totalItems,
        totalPoints: Math.round((totalPoints + Number.EPSILON) * 100) / 100,
        totalValue: Math.round((totalValue + Number.EPSILON) * 100) / 100
    };
};