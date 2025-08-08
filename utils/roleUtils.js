// Role-based utility functions for pickup workflow
export const isBuyer = (user) => {
  return user?.role?.toLowerCase() === 'buyer';
};

export const isCustomer = (user) => {
  return user?.role?.toLowerCase() === 'customer' || user?.role?.toLowerCase() === 'user';
};

export const shouldShowDeliveryFee = (user) => {
  return isBuyer(user);
};

export const shouldShowItemsSubtotal = (user) => {
  // Show for all users but with different context
  return true;
};

export const shouldShowTotalValue = (user) => {
  return isBuyer(user);
};
