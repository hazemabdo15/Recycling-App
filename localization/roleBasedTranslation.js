import i18next from './i18n';

/**
 * Get a translation with role-based support
 * @param {string} key - Translation key (e.g., 'home.callToAction')
 * @param {string} role - User role ('customer' or 'buyer')
 * @param {object} params - Parameters for interpolation
 * @returns {string} Translated text based on role
 */
export const getRoleBasedTranslation = (key, role = 'customer', params = {}) => {
  // First try to get the role-specific translation
  const roleKey = `${key}.${role}`;
  const roleTranslation = i18next.t(roleKey, { ...params, defaultValue: null });
  
  // If role-specific translation exists and is not the key itself, return it
  if (roleTranslation && roleTranslation !== roleKey) {
    return roleTranslation;
  }
  
  // Fallback to customer role if buyer role doesn't exist
  if (role === 'buyer') {
    const customerKey = `${key}.customer`;
    const customerTranslation = i18next.t(customerKey, { ...params, defaultValue: null });
    if (customerTranslation && customerTranslation !== customerKey) {
      return customerTranslation;
    }
  }
  
  // Final fallback to the base key
  return i18next.t(key, params);
};

/**
 * Check if a user is a buyer
 * @param {object} user - User object
 * @returns {boolean}
 */
export const isBuyer = (user) => {
  return user?.role === 'buyer';
};

/**
 * Check if a user is a customer
 * @param {object} user - User object
 * @returns {boolean}
 */
export const isCustomer = (user) => {
  return user?.role === 'customer' || !user?.role;
};

/**
 * Get user role, defaulting to 'customer'
 * @param {object} user - User object
 * @returns {string} User role
 */
export const getUserRole = (user) => {
  return user?.role || 'customer';
};

export default {
  getRoleBasedTranslation,
  isBuyer,
  isCustomer,
  getUserRole,
};
