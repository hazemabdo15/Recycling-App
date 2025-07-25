
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
    const normalized = { ...item };

    normalized.categoryId = item.categoryId || item._id;

    if (!normalized.categoryName) {
        normalized.categoryName = item.categoryName || 
                                  item.category?.name || 
                                  item.categoryType || 
                                  'Unknown Category';
    }

    if (typeof item.measurement_unit === 'string') {
        const lowerUnit = item.measurement_unit.toLowerCase();
        if (lowerUnit === 'kg' || lowerUnit === 'kilogram') {
            normalized.measurement_unit = 1;
        } else if (lowerUnit === 'piece' || lowerUnit === 'pieces') {
            normalized.measurement_unit = 2;
        } else {

            normalized.measurement_unit = 1;
        }
    } else if (typeof item.measurement_unit === 'number') {

        if (item.measurement_unit !== 1 && item.measurement_unit !== 2) {
            normalized.measurement_unit = 1;
        }
    } else {

        normalized.measurement_unit = 1;
    }
    
    return normalized;
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
        const normalizedItem = normalizeItemData(item);
        const categoryId = normalizedItem.categoryId;
        const quantity = cartItems[categoryId] || 0;
        
        totalPoints += (normalizedItem.points || 0) * quantity;
        totalValue += (normalizedItem.price || 0) * quantity;
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