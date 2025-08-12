# Profile Page Refactor & Menu Implementation Plan

## Goal

- Add a new menu section below the ProfileCard, styled as in the provided screenshots.
- Menu options: **Recycling History**, **E-Wallet** (placeholder), **Help & Support** (placeholder), **Logout**.
- Move the logout button from ProfileCard to the new menu.
- When "Recycling History" is pressed, navigate to a new page that shows the current orders FlatList with tabs (upcoming, completed, cancelled).
- Menu should be easily expandable for future options.

---

## 1. **Component & File Structure Analysis**

### Key Files Involved

- `app/(tabs)/profile.jsx`  
  Main profile page, renders ProfileCard, FlatList, and handles logic.
- `components/profile/ProfileCard.jsx`  
  Renders the user info card and currently includes the logout button.
- `components/common/Loader.jsx`  
  Loader for async states.
- `components/Modals/RecyclingModal.jsx`  
  Modal for redeeming points.
- `context/AuthContext.js`  
  Provides user, logout, setUser, etc.
- `hooks/useUserPoints.js`  
  Fetches user points.
- `services/api/orders.js`  
  Fetches/cancels orders.
- `utils/roleLabels.js`  
  Role helpers.
- `utils/scale.js`  
  Scaling utility for styles.

---

## 2. **Implementation Steps**

### A. **Create the Menu Component**

- **New file:** `components/profile/ProfileMenu.jsx`
- Props: `onRecyclingHistory`, `onEWallet`, `onHelpSupport`, `onLogout`
- Style to match the screenshot (icon, label, subtitle, right arrow).
- Use TouchableOpacity for each menu item.
- Export for reuse.

### B. **Refactor Profile Page**

- **Remove** the logout button from `ProfileCard`.
- **Insert** the new `ProfileMenu` below `ProfileCard` in `profile.jsx`.
- Pass the correct handlers for each menu item.
- For now, `onEWallet` and `onHelpSupport` can show an Alert ("Coming soon").

### C. **Recycling History Navigation**

- **Create new page:** `app/recycling-history.jsx`
  - Copy the FlatList/tabs logic from `profile.jsx`.
  - Accept user/orders as props or fetch them again if needed.
  - Ensure the UI matches the current FlatList/tabs.
- In `ProfileMenu`, pressing "Recycling History" should navigate to `/recycling-history`.

### D. **Logout Functionality**

- Move the logout logic from `ProfileCard` to the menu.
- Ensure `onLogout` in the menu triggers the same confirm/logout flow as before.

### E. **Dependency Management**

- **ProfileCard**: Remove logout button/logic, keep only user info and avatar edit.
- **ProfileMenu**: New, stateless, only triggers callbacks.
- **Profile.jsx**:  
  - Imports and renders both ProfileCard and ProfileMenu.
  - Handles navigation and logic for menu actions.
- **RecyclingHistory.jsx**:  
  - Can reuse order fetching logic or accept props.
  - Should be independent for future expansion.

---

## 3. **File/Component Dependencies**

- `ProfileMenu` is used by `profile.jsx` only.
- `ProfileCard` is used by `profile.jsx` only.
- `profile.jsx` manages state, passes handlers to both.
- `RecyclingHistory.jsx` can be navigated to from `profile.jsx` (using Expo Router).

---

## 4. **Steps to Avoid Dependency Issues**

- **Step 1:** Build `ProfileMenu` as a new, isolated component.
- **Step 2:** Refactor `ProfileCard` to remove logout, test independently.
- **Step 3:** Update `profile.jsx` to use both components, wire up handlers.
- **Step 4:** Create `RecyclingHistory.jsx` and test navigation.
- **Step 5:** Remove FlatList/tabs from main profile page.
- **Step 6:** Test all flows (avatar edit, logout, navigation, menu expansion).

---

## 5. **Future Expansion**

- `ProfileMenu` should accept a list of menu items (icon, label, subtitle, onPress) for easy addition.
- Can add more options (Settings, Achievements, etc.) by updating the menu config.

---

## 6. **Summary Table**

| File/Component                | Change Needed                                  | Depends On                |
|-------------------------------|------------------------------------------------|---------------------------|
| `ProfileCard.jsx`             | Remove logout button/logic                     | None                      |
| `ProfileMenu.jsx` (new)       | Create menu UI, trigger callbacks              | None                      |
| `profile.jsx`                 | Use ProfileMenu, handle menu actions, refactor | ProfileCard, ProfileMenu  |
| `recycling-history.jsx` (new) | Show orders FlatList/tabs                      | orderService, user        |

---

## 7. **Next Steps**

1. Scaffold `ProfileMenu.jsx` with placeholder handlers.
2. Refactor `ProfileCard.jsx` to remove logout.
3. Update `profile.jsx` to use new menu and handlers.
4. Scaffold `recycling-history.jsx` and implement navigation.
5. Test and polish styles to match the screenshots.

---

**Ready to proceed with code scaffolding and implementation.**