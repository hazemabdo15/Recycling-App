# Complete Role-Based Translation Migration Guide

## Overview
This guide shows you how to fully migrate from `roleLabels.js` to the integrated translation system that supports both multiple languages and user roles.

## ✅ What's Been Completed

All content from `roleLabels.js` has been migrated to both `en.json` and `ar.json` files:

### ✓ App Names
```json
{
  "app": {
    "name": {
      "customer": "EcoPickup",
      "buyer": "EcoStore"
    }
  }
}
```

### ✓ Tab Labels
```json
{
  "tabs": {
    "explore": {
      "customer": "Explore",
      "buyer": "Shop"
    },
    "cart": {
      "customer": "Pickup", 
      "buyer": "Cart"
    }
  }
}
```

### ✓ Cart Messages
```json
{
  "cart": {
    "title": {
      "customer": "🛒 Your Pickup Cart",
      "buyer": "🛒 Your Shopping Cart"
    },
    "empty": {
      "customer": "Add recyclable items to get started",
      "buyer": "Add items to your cart"
    }
  }
}
```

### ✓ Orders & Tracking
```json
{
  "orders": {
    "confirmation": {
      "customer": "Pickup Request Confirmed!",
      "buyer": "Order Confirmed!"
    },
    "trackingInfo": {
      "customer": "Tracking Information",
      "buyer": "Order Information"
    }
  }
}
```

And many more sections including: explore page, pickup, addresses, progress steps, category toast messages, profile labels, earn points, minimum order messages, etc.

## 🔄 Migration Examples

### Before (Using roleLabels.js):
```jsx
import { getLabel, getProgressStepLabel } from "../../utils/roleLabels";

// In your component
<Text>{getLabel("cartTitle", user?.role)}</Text>
<Text>{getLabel("exploreTitle", user?.role)}</Text>
<Text>{getProgressStepLabel(1, user?.role)}</Text>
<Text>{getLabel("categoryToastMessages.itemAdded", user?.role, {
  quantity: 2,
  unit: "kg",
  itemName: "Plastic"
})}</Text>
```

### After (Using integrated system):
```jsx
import { useLocalization } from "../../context/LocalizationContext";

// In your component
const { t, tRole } = useLocalization();

<Text>{tRole("cart.title", user?.role)}</Text>
<Text>{tRole("explore.title", user?.role)}</Text>
<Text>{tRole("progressSteps", user?.role)?.[1]}</Text>
<Text>{tRole("categoryToastMessages.itemAdded", user?.role, {
  quantity: 2,
  unit: "kg", 
  itemName: "Plastic"
})}</Text>
```

## 📋 Complete Migration Mapping

| Old roleLabels Key | New Translation Key | Example Usage |
|-------------------|-------------------|---------------|
| `appName` | `app.name` | `tRole("app.name", user?.role)` |
| `welcomeMessage` | `home.callToAction` | `tRole("home.callToAction", user?.role)` |
| `cartTitle` | `cart.title` | `tRole("cart.title", user?.role)` |
| `cartSubtitle` | `cart.subtitle` | `tRole("cart.subtitle", user?.role)` |
| `addToPickup` | `cart.addTo` | `tRole("cart.addTo", user?.role)` |
| `emptyCartTitle` | `cart.empty` | `tRole("cart.empty", user?.role)` |
| `emptyCartSubtitle` | `cart.emptySubtitle` | `tRole("cart.emptySubtitle", user?.role)` |
| `exploreTitle` | `explore.title` | `tRole("explore.title", user?.role)` |
| `exploreSubtitle` | `explore.subtitle` | `tRole("explore.subtitle", user?.role)` |
| `searchPlaceholder` | `explore.searchPlaceholder` | `tRole("explore.searchPlaceholder", user?.role)` |
| `pickup` | `pickup.label` | `tRole("pickup.label", user?.role)` |
| `requestPickup` | `pickup.request` | `tRole("pickup.request", user?.role)` |
| `schedulePickup` | `pickup.schedule` | `tRole("pickup.schedule", user?.role)` |
| `money` | `money` | `tRole("money", user?.role)` |
| `orderConfirmation` | `orders.confirmation` | `tRole("orders.confirmation", user?.role)` |
| `orderStatus` | `orders.statusMessage` | `tRole("orders.statusMessage", user?.role)` |
| `trackingInfo` | `orders.trackingInfo` | `tRole("orders.trackingInfo", user?.role)` |
| `estimatedTime` | `orders.estimatedTime` | `tRole("orders.estimatedTime", user?.role)` |
| `selectAddress` | `address.select` | `tRole("address.select", user?.role)` |
| `deliveryTo` | `address.deliveryTo` | `tRole("address.deliveryTo", user?.role)` |
| `tabLabels.explore` | `tabs.explore` | `tRole("tabs.explore", user?.role)` |
| `tabLabels.cart` | `tabs.cart` | `tRole("tabs.cart", user?.role)` |
| `earnPoints` | `earnPoints` | `tRole("earnPoints", user?.role)` |
| `itemsReadyFor` | `itemsReadyFor` | `tRole("itemsReadyFor", user?.role)` |
| `minimumOrderMessage` | `minimumOrder.message` | `tRole("minimumOrder.message", user?.role, {amount})` |
| `minimumOrderButton` | `minimumOrder.button` | `tRole("minimumOrder.button", user?.role)` |
| `cartPage.findItemsButton` | `cart.findItemsButton` | `tRole("cart.findItemsButton", user?.role)` |

### Progress Steps (Special Case):
```jsx
// Old way
getProgressStepLabel(1, user?.role)

// New way  
tRole("progressSteps", user?.role)?.[1]
```

### Profile Labels:
```jsx
// Old way
getLabel("profileLabels.ordersTab", user?.role)

// New way
tRole("profileLabels.ordersTab", user?.role)
```

### Toast Messages with Parameters:
```jsx
// Old way
getLabel("categoryToastMessages.itemAdded", user?.role, {
  quantity: 2,
  unit: "kg",
  itemName: "Plastic"
})

// New way
tRole("categoryToastMessages.itemAdded", user?.role, {
  quantity: 2,
  unit: "kg", 
  itemName: "Plastic"
})
```

## 🛠️ Step-by-Step Migration Process

### 1. Update Component Imports
```jsx
// Remove this
import { getLabel, getProgressStepLabel } from "../../utils/roleLabels";

// Make sure you have this
import { useLocalization } from "../../context/LocalizationContext";
```

### 2. Update Hook Usage
```jsx
// Add tRole to destructuring
const { t, tRole } = useLocalization();
```

### 3. Replace Function Calls
Use the mapping table above to replace each `getLabel()` call with the corresponding `tRole()` call.

### 4. Test Both Roles
Make sure to test your app with both:
- Customer role (`user.role = "customer"`)
- Buyer role (`user.role = "buyer"`)

### 5. Test Both Languages
Switch between English and Arabic to ensure all translations work correctly.

## 🔍 Finding Remaining Usage

Run this command to find any remaining `getLabel` usage:
```bash
grep -r "getLabel" app/ components/ --include="*.js" --include="*.jsx"
```

## 🎯 Final Cleanup

Once all `getLabel()` calls are migrated:

1. **Remove the roleLabels.js file**:
   ```bash
   rm utils/roleLabels.js
   ```

2. **Remove any remaining imports**:
   Search for and remove any imports of `roleLabels.js`

3. **Update index files** if they export roleLabels

## ✅ Verification Checklist

- [ ] All `getLabel()` calls replaced with `tRole()`
- [ ] All `getProgressStepLabel()` calls replaced
- [ ] No imports of `roleLabels.js` remain
- [ ] App works correctly with customer role
- [ ] App works correctly with buyer role  
- [ ] App works correctly in English
- [ ] App works correctly in Arabic
- [ ] All role-specific text displays appropriately
- [ ] Parameters/interpolation works correctly
- [ ] `roleLabels.js` file removed

## 🎉 Benefits Achieved

✅ **Unified System**: One source for all translations and roles  
✅ **Better Maintainability**: All text in standard JSON translation files  
✅ **Scalability**: Easy to add new languages or roles  
✅ **Fallback System**: Automatic fallbacks prevent missing text  
✅ **Developer Experience**: Better IDE support and autocompletion  
✅ **Consistency**: Standard i18n patterns throughout the app
