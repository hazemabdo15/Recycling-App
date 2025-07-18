import { useState } from 'react';
import { getIncrementStep } from '../utils/cartUtils';

export const useCart = () => {
    const [cartItems, setCartItems] = useState({});
    
    const getItemQuantity = (itemId) => {
        return cartItems[itemId] || 0;
    };
    
    const handleIncreaseQuantity = (item) => {
        const step = getIncrementStep(item.measurement_unit);
        const currentQuantity = getItemQuantity(item._id);
        setCartItems(prev => ({
            ...prev,
            [item._id]: currentQuantity + step
        }));
    };
    
    const handleDecreaseQuantity = (item) => {
        const step = getIncrementStep(item.measurement_unit);
        const currentQuantity = getItemQuantity(item._id);
        if (currentQuantity > 0) {
            setCartItems(prev => ({
                ...prev,
                [item._id]: Math.max(0, currentQuantity - step)
            }));
        }
    };
    
    const clearCart = () => {
        setCartItems({});
    };
    
    const removeFromCart = (itemId) => {
        setCartItems(prev => {
            const newCart = { ...prev };
            delete newCart[itemId];
            return newCart;
        });
    };
    
    return {
        cartItems,
        getItemQuantity,
        handleIncreaseQuantity,
        handleDecreaseQuantity,
        clearCart,
        removeFromCart
    };
};
