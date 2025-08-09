# Global Toast Refactoring Plan

## Objective

- Only one toast should be visible at a time.
- When a new toast is triggered, the current toast should dismiss immediately and the new one should appear quickly.
- Entry and exit animations must be smooth but fast.
- Toast duration should be short (e.g., 1.2s–1.5s).
- Update all components and hooks that use the global toast system.

---

## 1. Identify All Usage Points

### Direct Usage
- [`showGlobalToast`](components/common/GlobalToast.jsx) is used directly in:
  - [`useToast`](hooks/useToast.js)
  - [`utils/cartMessages.js`](utils/cartMessages.js)
  - [`services/api/apiService.js`](services/api/apiService.js)
  - [`app/ai-results-modal.jsx`](app/ai-results-modal.jsx)
  - [`components/sections/CategoriesGrid.jsx`](components/sections/CategoriesGrid.jsx)

### Indirect Usage
- Any component using the [`useToast`](hooks/useToast.js) hook (search for `useToast()`):
  - Category, cart, and possibly authentication-related components.

---

## 2. Refactor the Global Toast System

### a. Update [`GlobalToast`](components/common/GlobalToast.jsx)
- Change the toast queue to only allow one toast at a time.
- When a new toast is triggered:
  - Immediately dismiss the current toast (with a fast outro animation).
  - Show the new toast (with a fast intro animation).
- Ensure the animation timing is fast (entry/exit ≤ 200ms).
- Set the default toast duration to a short value (e.g., 1200ms).

### b. Update [`showGlobalToast`](components/common/GlobalToast.jsx)
- Ensure it replaces the current toast instead of stacking.

---

## 3. Update All Usage Points

### a. [`useToast`](hooks/useToast.js)
- Update the default duration to match the new short duration.
- Ensure all usages of `showToast`, `showSuccess`, etc., use the new duration.

### b. All Direct Calls
- Update any direct calls to `showGlobalToast` to use the new short duration if they specify a custom duration.

### c. [`utils/cartMessages.js`](utils/cartMessages.js)
- Update all toast calls to use the new duration.

### d. [`services/api/apiService.js`](services/api/apiService.js)
- Update all toast calls to use the new duration.

### e. [`app/ai-results-modal.jsx`](app/ai-results-modal.jsx)
- Update all toast calls to use the new duration.

### f. [`components/sections/CategoriesGrid.jsx`](components/sections/CategoriesGrid.jsx)
- Update all toast calls to use the new duration.

---

## 4. Animation Improvements

- Ensure entry/exit animations are smooth and fast (≤ 200ms).
- Test swipe-to-dismiss and tap-to-dismiss for responsiveness.
- Ensure no visual glitches when replacing toasts rapidly.

---

## 5. Testing

- Test all flows that trigger toasts (cart, auth, errors, info, etc.).
- Rapidly trigger multiple toasts to ensure only one is visible at a time and transitions are smooth.
- Test on both iOS and Android.

---

## 6. Documentation

- Update documentation/comments in [`GlobalToast`](components/common/GlobalToast.jsx) and [`useToast`](hooks/useToast.js) to reflect the new behavior.

---

## 7. Optional: Provide a Migration Guide

- Briefly document the new usage pattern for developers in the README or a separate doc.

---

**Summary:**  
This refactor will ensure a modern, non-stacking, single-toast UX with fast, smooth transitions and a short display duration. All components and hooks using the global toast system will be updated