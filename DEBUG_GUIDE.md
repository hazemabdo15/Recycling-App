# Role-Based UI Debugging Guide

## Current Issue
Buyer users see the same UI as customer users despite role-based implementation being complete.

## Debugging Steps

### 1. Test Registration Flow
1. **Register a new buyer account:**
   - Go to registration screen
   - Select "Buyer" role
   - Complete registration with OTP
   - **Check console logs for:**
     - `[RegisterForm] Registering with role: buyer`
     - `[auth.js] Registration payload:` (should show role: 'buyer')
     - `[auth.js] Registration response:` (should show user with role: 'buyer')
     - `[authUtils] Storing user in AsyncStorage:` (should show role: 'buyer')

### 2. Test Login Flow
1. **Login with buyer account:**
   - **Check console logs for:**
     - `[auth.js] Login response:` (should show user with role: 'buyer')
     - `[AuthContext] Login called with userData:` (should show role: 'buyer')
     - `[authUtils] Storing user in AsyncStorage:` (should show role: 'buyer')

### 3. Test App Launch
1. **Restart the app:**
   - **Check console logs for:**
     - `[authUtils] Retrieved user from AsyncStorage:` (should show role: 'buyer')
     - `[AuthContext] Loading stored user:` (should show role: 'buyer')
     - `[AuthContext] Stored user role:` (should show 'buyer')

### 4. Test Role Labels
1. **Navigate to /debug screen:**
   - Should show current user role
   - Should show test labels for both customer and buyer
   - **Check console logs for:**
     - `[roleLabels] getLabel called with role:` (should show correct role)
     - Label function calls with role parameter

### 5. Test UI Components
1. **Navigate to different screens and check:**
   - Cart screen: Title should be "Cart" for buyers, "Pickup Cart" for customers
   - Home screen: Welcome message should be role-specific
   - Categories: Toast messages should be role-specific
   - **Check console logs for getLabel calls**

## What to Look For

### ✅ Expected Behavior
- Registration saves role correctly
- Login retrieves role correctly
- User object in AsyncStorage contains role
- getLabel() receives correct role parameter
- UI shows different text for buyers vs customers

### ❌ Problem Indicators
- Role missing from registration payload
- Role missing from backend response
- Role not stored in AsyncStorage
- getLabel() receives null/undefined role
- All UI shows customer text regardless of role

## Common Issues & Solutions

### Issue 1: Role not saved during registration
- **Problem:** Backend doesn't save role or registration payload missing role
- **Solution:** Check backend endpoint and RegisterForm role selection

### Issue 2: Role not returned during login
- **Problem:** Backend login doesn't return role in user object
- **Solution:** Check backend login endpoint response

### Issue 3: Role not persisted in AsyncStorage
- **Problem:** User object stored without role property
- **Solution:** Check setLoggedInUser function and data structure

### Issue 4: Role not retrieved from storage
- **Problem:** getLoggedInUser returns user without role
- **Solution:** Check AsyncStorage data and parsing

### Issue 5: Role not passed to getLabel
- **Problem:** Components not passing user.role to getLabel function
- **Solution:** Check component implementations and user object structure

## Next Steps
1. Follow debugging steps above
2. Share console log output showing the specific failure point
3. If issue persists, check backend user model and authentication endpoints
