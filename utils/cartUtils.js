
export const getUnitDisplay = (measurementUnit) => {
    return measurementUnit === 1 ? 'KG' : 'Piece';
};
export const getIncrementStep = (measurementUnit) => {
    return measurementUnit === 1 ? 0.25 : 1; // 0.25 for KG, 1 for Piece
};
export const calculateCartStats = (items, cartItems) => {
    const totalItems = items.length;
    const totalPoints = items.reduce((sum, item) => sum + (item.points * (cartItems[item._id] || 0)), 0);
    const totalValue = items.reduce((sum, item) => sum + (item.price * (cartItems[item._id] || 0)), 0);
    return {
        totalItems,
        totalPoints,
        totalValue
    };
};
export const getMeasurementIcon = (measurementUnit) => {
    return measurementUnit === 1 ? "weight-kilogram" : "cube-outline";
};