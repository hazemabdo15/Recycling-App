/**
 * Role-based text mappings for different user types
 * Used to customize UI text based on user role (customer vs buyer)
 */

export const roleLabels = {
  // Main navigation and actions
  pickup: {
    customer: "Pickup",
    buyer: "Cart",
  },
  requestPickup: {
    customer: "Request Pickup",
    buyer: "Place Order",
  },
  schedulePickup: {
    customer: "Schedule Pickup",
    buyer: "Place Order",
  },
  pickupCart: {
    customer: "Your Pickup Cart",
    buyer: "Your Shopping Cart",
  },

  // Cart and ordering
  cartTitle: {
    customer: "🛒 Your Pickup Cart",
    buyer: "🛒 Your Shopping Cart",
  },
  cartSubtitle: {
    customer: "items ready for pickup",
    buyer: "items in your cart",
  },
  addToPickup: {
    customer: "to pickup",
    buyer: "to cart",
  },
  emptyCartTitle: {
    customer: "Add recyclable items to get started",
    buyer: "Add items to your cart",
  },
  emptyCartSubtitle: {
    customer: "Schedule your pickup and earn rewards!",
    buyer: "Browse items and place your order!",
  },

  // Order management
  orderConfirmation: {
    customer: "Pickup Request Confirmed!",
    buyer: "Order Confirmed!",
  },
  orderStatus: {
    customer:
      "Your request has been sent. We will contact you soon for pickup scheduling.",
    buyer: "Your order has been placed successfully. We will process it soon.",
  },
  trackingInfo: {
    customer: "Tracking Information",
    buyer: "Order Information",
  },
  estimatedTime: {
    customer: "Estimated Pickup",
    buyer: "Estimated Delivery",
  },

  // Address and delivery
  selectAddress: {
    customer: "Select Delivery Address",
    buyer: "Select Delivery Address",
  },
  deliveryTo: {
    customer: "Pickup from",
    buyer: "Delivery to",
  },

  // Progress indicators
  progressSteps: {
    customer: {
      1: "Select Address",
      2: "Review Order",
      3: "Pickup Confirmed",
    },
    buyer: {
      1: "Select Address",
      2: "Review Order",
      3: "Order Confirmed",
    },
  },

  // App branding
  appName: {
    customer: "EcoPickup",
    buyer: "EcoStore",
  },
  welcomeMessage: {
    customer: "Turn your recyclables into rewards and help save our planet",
    buyer: "Shop eco-friendly products and support sustainability",
  },

  // Explore page
  exploreTitle: {
    customer: "🔍 What Can You Recycle?",
    buyer: "🛒 Browse Products",
  },
  exploreSubtitle: {
    customer: "Browse materials and find what you can recycle at home",
    buyer: "Discover eco-friendly products for sustainable living",
  },
  searchPlaceholder: {
    customer: "Search recyclable materials...",
    buyer: "Search products...",
  },

  // Category details page
  categoryToastMessages: {
    itemAdded: {
      customer: "Added {quantity}{unit} {itemName} to pickup",
      buyer: "Added {quantity}{unit} {itemName} to cart",
    },
    itemRemoved: {
      customer: "Removed {itemName} from pickup",
      buyer: "Removed {itemName} from cart",
    },
    itemReduced: {
      customer: "Reduced {itemName} by {quantity}{unit}",
      buyer: "Reduced {itemName} by {quantity}{unit}",
    },
    addFailed: {
      customer: "Failed to add item to pickup",
      buyer: "Failed to add item to cart",
    },
    updateFailed: {
      customer: "Failed to update item quantity",
      buyer: "Failed to update item quantity",
    },
  },

  // Profile page
  profileLabels: {
    ordersTab: {
      customer: "My Pickups",
      buyer: "My Orders",
    },
    incomingTab: {
      customer: "Upcoming Pickups",
      buyer: "Pending Orders",
    },
    completedTab: {
      customer: "Completed Pickups",
      buyer: "Completed Orders",
    },
    cancelledTab: {
      customer: "Cancelled Pickups",
      buyer: "Cancelled Orders",
    },
    noOrdersMessage: {
      customer: "No pickups yet",
      buyer: "No orders yet",
    },
    startOrderingMessage: {
      customer: "Start recycling to see your pickups here",
      buyer: "Start shopping to see your orders here",
    },
  },

  // Tab bar labels
  tabLabels: {
    home: {
      customer: "Home",
      buyer: "Home",
    },
    explore: {
      customer: "Explore",
      buyer: "Shop",
    },
    cart: {
      customer: "Pickup",
      buyer: "Cart",
    },
    profile: {
      customer: "Profile",
      buyer: "Profile",
    },
  },

  // Profile and points
  earnPoints: {
    customer: "Earn points by recycling",
    buyer: "Earn points with purchases",
  },

  // Notifications and status
  itemsReadyFor: {
    customer: "items ready for pickup",
    buyer: "items ready for delivery",
  },

  // Minimum order messages
  minimumOrderMessage: {
    customer: "Add {amount} EGP more to schedule pickup",
    buyer: "Add {amount} EGP more to place order",
  },
  minimumOrderButton: {
    customer: "Minimum 100 EGP Required",
    buyer: "Minimum 100 EGP Required",
  },

  // Cart page specific
  cartPage: {
    findItemsButton: {
      customer: "Find Recyclables",
      buyer: "Browse Products",
    },
  },
};

/**
 * Get the appropriate label based on the key and user role
 * @param {string} key - The label key
 * @param {string} role - User role ('customer' or 'buyer')
 * @param {object} params - Optional parameters for string interpolation
 * @returns {string} The appropriate label text
 */
export function getLabel(key, role = "customer", params = {}) {
  // console.log(`[roleLabels] Getting label for key: ${key}, role: ${role}`);

  // Handle nested keys like 'tabLabels.cart'
  const keys = key.split(".");
  let roleMapping = roleLabels;

  // Navigate through nested properties
  for (const k of keys) {
    if (roleMapping && typeof roleMapping === "object" && roleMapping[k]) {
      roleMapping = roleMapping[k];
    } else {
      // console.warn(`[roleLabels] No mapping found for key: ${key}`);
      return key;
    }
  }

  if (!roleMapping) {
    // console.warn(`[roleLabels] No mapping found for key: ${key}`);
    return key;
  }

  let label = roleMapping[role] || roleMapping.customer || key;

  // console.log(`[roleLabels] Found label: ${label} for key: ${key}, role: ${role}`);

  // Handle string interpolation for parameters
  if (params && typeof label === "string") {
    Object.keys(params).forEach((param) => {
      label = label.replace(`{${param}}`, params[param]);
    });
  }

  return label;
}

/**
 * Get progress step labels for a specific role
 * @param {number} step - Step number (1, 2, 3)
 * @param {string} role - User role ('customer' or 'buyer')
 * @returns {string} The step label
 */
export function getProgressStepLabel(step, role = "customer") {
  return (
    roleLabels.progressSteps[role]?.[step] ||
    roleLabels.progressSteps.customer[step] ||
    `Step ${step}`
  );
}

/**
 * Check if a user is a buyer
 * @param {object} user - User object with role property
 * @returns {boolean} True if user is a buyer
 */
export function isBuyer(user) {
  return user?.role === "buyer";
}

/**
 * Check if a user is a customer
 * @param {object} user - User object with role property
 * @returns {boolean} True if user is a customer
 */
export function isCustomer(user) {
  return user?.role === "customer" || !user?.role; // Default to customer if no role
}

export default {
  roleLabels,
  getLabel,
  getProgressStepLabel,
  isBuyer,
  isCustomer,
};
