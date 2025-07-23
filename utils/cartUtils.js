
export const getUnitDisplay = (measurementUnit) => {
    return measurementUnit === 1 ? 'KG' : 'Piece';
};
export const getIncrementStep = (measurementUnit) => {
    return measurementUnit === 1 ? 0.25 : 1;
};

export const normalizeItemData = (item) => {
    const normalized = { ...item };

    normalized.categoryId = item.categoryId || item._id;

    if (typeof item.measurement_unit === 'string') {
        const lowerUnit = item.measurement_unit.toLowerCase();
        if (lowerUnit === 'kg' || lowerUnit === 'kilogram') {
            normalized.measurement_unit = 1;
        } else if (lowerUnit === 'piece' || lowerUnit === 'pieces') {
            normalized.measurement_unit = 2;
        } else {
            // Unknown unit, default to KG
            normalized.measurement_unit = 1;
        }
    } else if (typeof item.measurement_unit === 'number') {
        // Validate numeric measurement unit
        if (item.measurement_unit !== 1 && item.measurement_unit !== 2) {
            normalized.measurement_unit = 1; // Default to KG
        }
    } else {
        // Invalid type, default to KG
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