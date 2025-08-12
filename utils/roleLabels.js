export const roleLabels = {
  money: {
    customer: "You'll Earn",
    buyer: "You'll Pay",
  },

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

  selectAddress: {
    customer: "Select Delivery Address",
    buyer: "Select Delivery Address",
  },
  deliveryTo: {
    customer: "Pickup from",
    buyer: "Delivery to",
  },

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

  appName: {
    customer: "EcoPickup",
    buyer: "EcoStore",
  },
  welcomeMessage: {
    customer: "Turn your recyclables into rewards and help save our planet",
    buyer: "Shop eco-friendly products and support sustainability",
  },

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

  profileLabels: {
    ordersTab: {
      customer: "My Pickups",
      buyer: "My Orders",
    },
    incomingTab: {
      customer: "Upcoming\nPickups",
  buyer: "Pending\nOrders",
    },
    completedTab: {
      customer: "Completed\nPickups",
      buyer: "Completed\nOrders",
    },
    cancelledTab: {
      customer: "Cancelled\nPickups",
      buyer: "Cancelled\nOrders",
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

  earnPoints: {
    customer: "Earn points by recycling",
    buyer: "Recycle and help the planet",
  },

  itemsReadyFor: {
    customer: "items ready for pickup",
    buyer: "items ready for delivery",
  },

  minimumOrderMessage: {
    customer: "Add {amount} EGP more to schedule pickup",
    buyer: "Add {amount} EGP more to place order",
  },
  minimumOrderButton: {
    customer: "Minimum 100 EGP Required",
    buyer: "Minimum 100 EGP Required",
  },

  cartPage: {
    findItemsButton: {
      customer: "Find Recyclables",
      buyer: "Browse Products",
    },
  },
};

export function getLabel(key, role = "customer", params = {}) {
  const keys = key.split(".");
  let roleMapping = roleLabels;

  for (const k of keys) {
    if (roleMapping && typeof roleMapping === "object" && roleMapping[k]) {
      roleMapping = roleMapping[k];
    } else {
      return key;
    }
  }

  if (!roleMapping) {
    return key;
  }

  let label = roleMapping[role] || roleMapping.customer || key;

  if (params && typeof label === "string") {
    Object.keys(params).forEach((param) => {
      label = label.replace(`{${param}}`, params[param]);
    });
  }

  return label;
}

export function getProgressStepLabel(step, role = "customer") {
  return (
    roleLabels.progressSteps[role]?.[step] ||
    roleLabels.progressSteps.customer[step] ||
    `Step ${step}`
  );
}

export function isBuyer(user) {
  return user?.role === "buyer";
}

export function isCustomer(user) {
  return user?.role === "customer" || !user?.role;
}

export default {
  roleLabels,
  getLabel,
  getProgressStepLabel,
  isBuyer,
  isCustomer,
};
