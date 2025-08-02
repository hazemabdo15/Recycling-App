


export const calculateTotalAmount = (cartItemsDisplay) => {
  if (!Array.isArray(cartItemsDisplay)) {
    return 0;
  }
  
  return cartItemsDisplay.reduce((sum, item) => {
    const itemTotal = item.totalPrice || 0;
    return sum + itemTotal;
  }, 0);
};


export const formatAmount = (amount) => {
  return `${amount.toFixed(2)} EGP`;
};


export const isBuyer = (user) => {
  return user?.role === 'buyer';
};


export const validatePaymentPrerequisites = ({ user, accessToken, cartItems }) => {
  if (!user) {
    return { isValid: false, error: 'User information is missing' };
  }
  
  if (!accessToken) {
    return { isValid: false, error: 'Authentication required' };
  }
  
  if (!cartItems || Object.keys(cartItems).length === 0) {
    return { isValid: false, error: 'Cart is empty' };
  }
  
  const userId = user._id || user.userId || user.id;
  if (!userId) {
    return { isValid: false, error: 'User ID is missing' };
  }
  
  return { isValid: true, userId };
};


export const PAYMENT_ERRORS = {
  NETWORK_ERROR: 'Cannot connect to payment service. Please check your internet connection.',
  AUTHENTICATION_ERROR: 'Authentication failed. Please log in again.',
  SERVER_ERROR: 'Payment service is temporarily unavailable. Please try again later.',
  VALIDATION_ERROR: 'Invalid payment information. Please check your order details.',
  MINIMUM_AMOUNT_ERROR: 'Order total is below the minimum payment amount.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
};


export const getPaymentErrorMessage = (error) => {
  if (!error) return PAYMENT_ERRORS.UNKNOWN_ERROR;
  
  const message = error.message || '';
  
  if (message.includes('network') || message.includes('connect')) {
    return PAYMENT_ERRORS.NETWORK_ERROR;
  }
  
  if (message.includes('auth') || message.includes('token')) {
    return PAYMENT_ERRORS.AUTHENTICATION_ERROR;
  }
  
  if (message.includes('server') || message.includes('500')) {
    return PAYMENT_ERRORS.SERVER_ERROR;
  }
  
  if (message.includes('minimum') || message.includes('amount')) {
    return PAYMENT_ERRORS.MINIMUM_AMOUNT_ERROR;
  }
  
  return message || PAYMENT_ERRORS.UNKNOWN_ERROR;
};
