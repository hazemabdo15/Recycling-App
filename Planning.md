# Redeem History Feature Implementation Plan

## 1. Objective
Implement a functional "Redeem History" button in the profile menu that navigates to a new page displaying all the user's redeem history in a modern, sleek UI, maintaining the hero section style from the recycling-history page.

---

## 2. Data Source
- Use the `pointsHistory` array from the user object.
- Filter for entries where:
  - `type` is `"deducted"`
  - `reason` includes `"Voucher redeemed"` or `"Cashback"` or `"Points deducted"`

---

## 3. UI/UX Requirements
 Create a new screen: **RedeemHistoryScreen**
 Hero section at the top using a linear gradient background, styled similarly to the recycling-history page (do not use a HeroSection component).
 List of redeem history items below the hero section.
 Each item should display:
  - Reason (e.g., "Voucher redeemed: Talabat Mart")
  - Points deducted (e.g., "-500")
  - Date (formatted nicely)
 Modern, clean, and consistent with app theme.

 `screens/RedeemHistoryScreen.js` (new)
 `navigation/ProfileMenu.js` or wherever the profile menu is handled
 `styles/redeemHistory.js` (new or extend existing styles)

---

## 5. Implementation Steps

1. **Create RedeemHistoryScreen component**
   - Scaffold the screen with hero section and list.
   - Import user data (from context, redux, or props).

2. **Filter and map redeem history**
   - Extract relevant entries from `pointsHistory`.

3. **Design UI**
   - Reuse/recreate hero section from recycling-history.
   - Design redeem history list items.

4. **Connect navigation**
   - Update profile menu to navigate to the new screen.

5. **Testing**
   - Test with various user data (empty, few, many entries).
   - Ensure responsiveness and performance.

---

## 6. Optional Enhancements
- Add search/filter by date or type.
- Add icons for different redeem types (voucher, cashback, etc).
- Show running total of points after each redeem.

---

## 7. Files to Update/Create
- `screens/RedeemHistoryScreen.js` (new)
- `navigation/ProfileMenu.js` or wherever the profile menu is handled
- `styles/redeemHistory.js` (new or extend existing styles)

---
