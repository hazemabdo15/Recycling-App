# Dark Mode Implementation Plan

## Overview
Implement a comprehensive dark mode feature across the entire React Native app using a centralized theme system with context-based state management.

## Phase 1: Core Infrastructure Setup

### 1.1 Create Theme Context and Provider
**File: `context/ThemeContext.jsx`** (NEW)
- [x] Create ThemeContext with dark/light mode state
- [x] Implement theme persistence with AsyncStorage
- [x] Provide theme toggle functionality
- [x] Export useTheme hook for components

### 1.2 Extend Theme System
**File: `styles/theme.js`** (MODIFY)
- [x] Create `lightColors` and `darkColors` objects
- [x] Implement `getColors(isDark)` function
- [x] Keep existing color structure for backward compatibility
- [x] Add dark mode variants for all colors:
  ```js
  // Light theme colors (existing)
  export const lightColors = { /* extend */ };
  
  // Dark theme colors (new)
  export const darkColors = {
    primary: "#10B981",
    secondary: "#34D399", 
    background: "#0F172A",
    white: "#1E293B",
    black: "#F8FAFC",
    base100: "#1E293B",
    base200: "#334155",
    // ... all color variants
  };
  ```

### 1.3 Update Root Layout
**File: `app/_layout.jsx`** (MODIFY)
- [x] Wrap app with ThemeProvider
- [x] Ensure proper provider order with existing contexts

## Phase 2: High-Impact Components (User-Facing)

### 2.1 Profile Components
**File: `components/profile/ProfileCard.jsx`** (MODIFY - 450 lines)
- [x] Replace hardcoded colors with theme colors  
- [x] Update LinearGradient colors dynamically
- [x] Fix avatar background and text colors
- [x] Update stat card backgrounds

### 2.2 Home Screen Components  
**File: `app/(tabs)/home.jsx`** (MODIFY - 238 lines)
- [x] Convert hero section gradients to use theme colors
- [x] Update notification background colors
- [x] Fix text colors throughout the component

### 2.3 Core UI Components
**File: `components/common/Header.jsx`** (MODIFY - 85 lines)
- [x] Update header background and text colors
- [x] Fix button background colors

**File: `components/category/CategoryHeader.jsx`** (MODIFY - 115 lines)  
- [x] Update header and stats background colors
- [x] Fix text colors for dark mode

### 2.4 Main Tab Screens
**File: `app/(tabs)/profile.jsx`** (MODIFY - 670 lines)
- [x] Convert entire profile screen to use theme colors
- [x] Update gradients, cards, and text colors
- [x] Fix navigation and action buttons

**File: `app/(tabs)/cart.jsx`** (MODIFY - 1307 lines)
- [x] Convert massive cart component to use theme colors
- [x] Update hero sections, cart cards, checkout UI
- [x] Fix all hardcoded colors and gradients

**File: `components/profile/ProfileMenu.jsx`** (MODIFY - 173 lines)
- [x] Add dark mode toggle in menu items
- [x] Update icon backgrounds and text colors
- [x] Replace hardcoded colors with theme

**File: `app/(tabs)/profile.jsx`** (MODIFY - 527 lines)
- [ ] Replace inline styles with theme colors
- [ ] Update card backgrounds and text colors
- [ ] Fix benefits section styling

### 2.2 Main Navigation Screens
**File: `app/(tabs)/home.jsx`** (MODIFY - 198 lines)
- [ ] Update hero section background
- [ ] Fix stats section colors
- [ ] Replace hardcoded colors in styles

**File: `app/(tabs)/cart.jsx`** (MODIFY - 1187 lines)
- [ ] Update header section styling
- [ ] Fix checkout summary colors
- [ ] Replace inline color definitions

### 2.3 Core UI Components
**File: `components/common/Header.jsx`** (MODIFY - 36 lines)
- [ ] Add dynamic StatusBar management
- [ ] Update header background and text colors
- [ ] Fix icon colors

**File: `components/category/CategoryHeader.jsx`** (MODIFY - 62 lines)
- [ ] Update header background and text
- [ ] Fix stats display colors
- [ ] Replace hardcoded values

## Phase 3: Style System Consolidation

### 3.1 Create Dynamic Style Helpers
**File: `styles/dynamicStyles.js`** (EXISTING)
- [x] Helper functions for dynamic styling already exist
- [x] `createThemedStyles(styleFunction)` utility available
- [x] Common dynamic style patterns implemented

### 3.2 Consolidate Category Styles  
**File: `styles/components/categoryStyles.js`** (MODIFY - 293 lines)
- [x] Convert to dynamic style functions
- [x] Replace static StyleSheet exports with getStyles functions
- [x] Update imports to use getColors from theme

### 3.3 Consolidate Common Styles
**File: `styles/components/commonStyles.js`** (MODIFY - 146 lines)  
- [x] Convert layoutStyles, loadingStateStyles, errorStateStyles to dynamic functions
- [x] Convert buttonStyles, cardStyles, badgeStyles to dynamic functions
- [x] Update all color references to use getColors

### 3.4 Profile-Related Styles
**File: `styles/components/profileStyles.js`** (MODIFY - 15 lines)
- [x] Convert profileStyles to getProfileStyles function
- [x] Update color references

**File: `styles/components/profileHeaderStyles.js`** (MODIFY - 74 lines)
- [x] Convert profileHeaderStyles to getProfileHeaderStyles function  
- [x] Update all hardcoded colors to theme colors

### 3.5 Explore Styles
**File: `styles/components/exploreStyles.js`** (MODIFY - 31 lines)
- [x] Convert exploreStyles to getExploreStyles function
- [x] Update background and text colors

### 3.6 Additional Style Files
**File: `styles/redeemHistory.js`** (MODIFY - 65 lines)
- [x] Convert to getRedeemHistoryStyles function
- [x] Update all hardcoded colors to dynamic theme colors

**✅ Phase 3 Complete:** All shared style files now use dynamic theming functions.

### 3.3 Update Common Styles
**File: `styles/components/commonStyles.js`** (MODIFY - 110 lines)
- [ ] Convert card styles to be theme-aware
- [ ] Update button styles for dark mode
- [ ] Fix loading and error state colors

### 3.4 Profile Styles Consolidation
**File: `styles/components/profileStyles.js`** (MODIFY - minor)
**File: `styles/components/profileHeaderStyles.js`** (MODIFY - 38 lines)
- [ ] Make all profile-related styles dynamic
- [ ] Remove hardcoded backgrounds

## Phase 4: Complex Components with Inline Styles

### 4.1 Pickup/Order Components
**File: `components/pickup/ReviewPhase.jsx`** (MODIFY - 1035 lines)
- [ ] Extract inline styles to dynamic style functions
- [ ] Update payment method card colors
- [ ] Fix summary section styling
- [ ] Convert all hardcoded colors

**File: `components/pickup/ConfirmationPhase.jsx`** (MODIFY - 489 lines)
- [ ] Update success/confirmation styling
- [ ] Fix tracking card colors
- [ ] Convert inline styles

**File: `components/pickup/AddressPhase.jsx`** (MODIFY - 274 lines)
- [ ] Update form input styling
- [ ] Fix background colors

### 4.2 Modal Components
**File: `components/Modals/CompleteOrderModal.jsx`** (MODIFY - 594 lines)
- [ ] Update modal background and content
- [ ] Fix button styling
- [ ] Convert quantity section colors

**File: `components/Modals/OrderDetailsModal.jsx`** (MODIFY - 255 lines)
- [ ] Update detail card styling
- [ ] Fix status badge colors

**File: `components/Modals/RecyclingModal.jsx`** (MODIFY - 459 lines)
- [ ] Update modal container and options
- [ ] Fix points display styling

### 4.3 Card Components
**File: `components/cards/OrderCard.jsx`** (MODIFY - 127 lines)
- [ ] Update card container styling
- [ ] Fix status badge colors
- [ ] Convert customer info styling

**File: `components/cards/OrderCardDelivery.jsx`** (MODIFY - 132 lines)
- [ ] Similar updates to OrderCard
- [ ] Fix action button styling

**File: `components/cards/EarnPointsCard.jsx`** (MODIFY - 180 lines)
- [ ] Update gradient and background colors
- [ ] Fix icon and text styling

## Phase 5: Category and Item Management

### 5.1 Category Components
**File: `app/category-details.jsx`** (MODIFY - 685 lines)
- [ ] Update hero section styling
- [ ] Fix item list backgrounds
- [ ] Convert stat displays

**File: `components/category/ItemCard.jsx`** (MODIFY - 31 lines)
- [ ] Update item card styling
- [ ] Fix banner and badge colors

**File: `components/category/ItemInfo.jsx`** (MODIFY - 18 lines)
- [ ] Update price and unit displays
- [ ] Fix icon colors

### 5.2 Sections and Lists
**File: `components/sections/CategoriesGrid.jsx`** (MODIFY - 599 lines)
- [ ] Update grid container styling
- [ ] Fix category card colors
- [ ] Convert loading states

**File: `components/sections/TopRecycledSection.jsx`** (MODIFY - 221 lines)
- [ ] Update item card styling
- [ ] Fix rank badges and stats

## Phase 6: Screens and Features

### 6.1 Feature Screens
**File: `app/achievements.jsx`** (MODIFY - 615 lines)
- [ ] Update achievement card styling
- [ ] Fix modal styling
- [ ] Convert tier displays

**File: `app/recycling-history.jsx`** (MODIFY - 658 lines)
- [ ] Update order card styling
- [ ] Fix status displays
- [ ] Convert review buttons

**File: `app/help-support.jsx`** (MODIFY - 62 lines)
- [ ] Update header styling
- [ ] Fix content backgrounds

### 6.2 Utility Screens
**File: `app/pickup.jsx`** (MODIFY - 704 lines)
- [ ] Update progress indicators
- [ ] Fix phase styling

**File: `app/delivery/dashboard.jsx`** (MODIFY - 426 lines)
- [ ] Update dashboard styling
- [ ] Fix modal components

## Phase 7: Supporting Files

### 7.1 Specialized Styles
**File: `styles/redeemHistory.js`** (MODIFY - 38 lines)
- [ ] Convert to use theme colors
- [ ] Make styles dynamic

### 7.2 UI Components
**File: `components/ui/Card.jsx`** (MODIFY - minor)
- [ ] Ensure theme compatibility

**File: `components/ui/SkeletonLoader.jsx`** (MODIFY - 78 lines)
- [ ] Update skeleton colors for dark mode

### 7.3 Common Components
**File: `components/common/SplashScreen.jsx`** (MODIFY - 127 lines)
- [ ] Update gradient and text colors

**File: `components/achievements/ProgressBar.jsx`** (MODIFY - 34 lines)
- [ ] Update progress colors

**File: `components/achievements/TierCard.jsx`** (MODIFY - 57 lines)
- [ ] Update tier card styling

## Phase 8: Final Integration and Testing

### 8.1 StatusBar Management
**File: `components/common/DynamicStatusBar.jsx`** (NEW)
- [x] Create dynamic StatusBar component
- [x] Handle iOS/Android differences

### 8.2 Global CSS Updates
**File: `styles/globals.css`** (MODIFY)
- [ ] Add dark mode CSS variables
- [ ] Update media queries

### 8.3 Integration Testing
- [ ] Test theme switching across all screens
- [ ] Verify persistence works correctly
- [ ] Check performance impact
- [ ] Validate accessibility in both themes

## Implementation Priority

### High Priority (Week 1)
1. ✅ Core Infrastructure (Phase 1)
2. 🚧 Profile Components (Phase 2.1) - ProfileMenu completed
3. ⏳ Main Navigation (Phase 2.2)
4. ⏳ Header Component (Phase 2.3)

### Medium Priority (Week 2)
5. ✅ Style System Consolidation (Phase 3)
6. ✅ Pickup Components (Phase 4.1)
7. ✅ Modal Components (Phase 4.2)

### Lower Priority (Week 3)
8. ✅ Card Components (Phase 4.3)
9. ✅ Category Management (Phase 5)
10. ✅ Feature Screens (Phase 6)

### Final Week
11. ✅ Supporting Files (Phase 7)
12. ✅ Integration & Testing (Phase 8)

## File Impact Summary

### Critical Files (Immediate Impact)
- `context/ThemeContext.jsx` (NEW)
- `styles/theme.js` (MODIFY)
- `app/_layout.jsx` (MODIFY)
- `components/profile/ProfileMenu.jsx` (ADD toggle)

### High-Impact Files (200+ lines)
- `app/(tabs)/cart.jsx` (1187 lines)
- `components/pickup/ReviewPhase.jsx` (1035 lines)
- `app/pickup.jsx` (704 lines)
- `app/category-details.jsx` (685 lines)
- `app/recycling-history.jsx` (658 lines)
- `app/achievements.jsx` (615 lines)
- `components/sections/CategoriesGrid.jsx` (599 lines)
- `components/Modals/CompleteOrderModal.jsx` (594 lines)

### Medium-Impact Files (100-200 lines)
- `components/Modals/RecyclingModal.jsx` (459 lines)
- `app/delivery/dashboard.jsx` (426 lines)
- `styles/components/categoryStyles.js` (279 lines)
- `components/Modals/OrderDetailsModal.jsx` (255 lines)

## Success Metrics
- [ ] All screens properly themed
- [ ] No hardcoded colors remaining
- [ ] Theme persistence working
- [ ] Performance impact < 100ms
- [ ] Accessibility standards maintained
- [ ] User preference respected (system theme)

## Notes
- Always test on both iOS and Android
- Consider performance implications of theme switching
- Ensure proper contrast ratios for accessibility
- Document any breaking changes
- Maintain backward compatibility where possible