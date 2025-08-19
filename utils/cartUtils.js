import { t } from "i18next";

export const getUnitDisplay = (measurementUnit) => {
    return measurementUnit === 1 ? t("units.kg") : t("units.piece");
};

export const getIncrementStep = (measurementUnit) => {
    return measurementUnit === 1 ? 0.25 : 1;
};

export const getMinimumQuantity = (measurementUnit) => {
    // Return 0.25 for kg items, 1 for pieces
    return measurementUnit === 1 ? 0.25 : 1;
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
        // For KG items, minimum quantity is 0.25
        if (quantity < 0.25) {
            throw new Error("For KG items, minimum quantity is 0.25.");
        }
        // Check if quantity is in 0.25 increments
        if (quantity % 0.25 !== 0) {
            throw new Error("For KG items, quantity must be in 0.25 increments (e.g., 0.25, 0.5, 0.75, 1.0, 1.25).");
        }
    } else if (measurementUnit === 2) {

        if (!Number.isInteger(quantity) || quantity < 1) {
            throw new Error("For piece items, quantity must be whole numbers >= 1.");
        }
    } else {
        throw new Error("Invalid measurement unit. Must be 1 (KG) or 2 (Piece).");
    }
};

// Helper function for stock validation in AI voice modal
export const validateStockForAIItems = (aiItems, currentCartQuantities, stockMap) => {
    const processedItems = [];
    const stockWarnings = [];
    let totalDiscardedItems = 0;
    
    aiItems.forEach(material => {
        const itemId = material._id;
        const requestedQuantity = material.quantity;
        const currentCartQuantity = currentCartQuantities[itemId] || 0;
        const stockQuantity = stockMap[itemId];
        
        if (stockQuantity === undefined) {
            // No stock limit, add full quantity
            processedItems.push(material);
            return;
        }
        
        // Calculate how much we can actually add
        const availableToAdd = Math.max(0, stockQuantity - currentCartQuantity);
        const quantityToAdd = Math.min(requestedQuantity, availableToAdd);
        const discardedQuantity = requestedQuantity - quantityToAdd;
        
        if (quantityToAdd > 0) {
            processedItems.push({
                ...material,
                quantity: quantityToAdd
            });
        }
        
        if (discardedQuantity > 0) {
            const unitText = material.measurement_unit === 1 ? 'kg' : 'pieces';
            stockWarnings.push({
                name: material.name,
                discarded: discardedQuantity,
                unit: unitText,
                availableStock: stockQuantity,
                currentInCart: currentCartQuantity
            });
            totalDiscardedItems++;
        }
    });
    
    return {
        processedItems,
        stockWarnings,
        totalDiscardedItems
    };
};

export const normalizeItemData = (item) => {

    if (!item) {
        console.warn('[normalizeItemData] Received null/undefined item');
        return {};
    }

    if (item._id && item.categoryId && item.name && item.measurement_unit !== undefined) {
        return { ...item };
    }

    console.log('[normalizeItemData] Normalizing incomplete item:', {
        _id: item._id,
        categoryId: item.categoryId,
        name: item.name,
        measurement_unit: item.measurement_unit
    });
    
    return {
        _id: item._id || item.itemId,
        categoryId: item.categoryId,
        name: item.name || item.material || 'Unknown Item',
        image: item.image || '',
        points: item.points || 0,
        price: item.price || item.value || 0,
        categoryName: item.categoryName || '',
        measurement_unit: item.measurement_unit || item.unit || 2,
        quantity: item.quantity || 1,
        ...item
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



export const createCartItem = (item, quantity = 1) => {

    const processedItem = normalizeItemData(item);

    let categoryName = processedItem.categoryName;

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
        _id: processedItem._id,
        categoryId: processedItem.categoryId,
        name: processedItem.name,
        image: processedItem.image || '',
        points: processedItem.points || 0,
        price: processedItem.price || 0,
        categoryName: categoryName,
        measurement_unit: processedItem.measurement_unit,
        quantity: quantity
    };
    console.log('[createCartItem] Created cart item:', result);
    return result;
};



export const getCartKey = (item) => {

    const processed = normalizeItemData(item);
    return processed._id;
};


export const getDisplayKey = (item) => {

    const itemId = getCartKey(item);
    return itemId || String(Math.random());
};


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