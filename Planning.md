# Refactoring Plan: Recycling History Page Modernization

## Objective

Redesign the `recycling-history.jsx` page to be more visually appealing and modern, improving user experience and aligning with the updated profile/menu styles.

---

## 1. **Analysis of Current State**

- The page uses basic FlatList rendering for orders with tabs (incoming, completed, cancelled).
- Order cards are simple, with minimal styling and visual hierarchy.
- Buttons (Download PDF, Cancel Order) are basic and not visually distinct.
- The background and spacing are plain, lacking depth and modern UI cues.

---

## 2. **Modern UI/UX Goals**

- Use card-based layouts with rounded corners and subtle shadows.
- Add a visually distinct header for the page and tabs.
- Improve tab styling for better clarity and touch feedback.
- Redesign order cards: more padding, rounded corners, shadow, and clear separation.
- Use modern button styles: rounded, colored, with icons if possible.
- Enhance typography: font weights, sizes, and color contrast.
- Add subtle background color to the page for depth.
- Ensure responsive design and accessibility.

---

## 3. **Implementation Steps**

### A. **Page Container & Background**
- Add a light background color to the page (e.g., `#F7F8FA`).
- Use a `SafeAreaView` or `View` with padding for the main container.

### B. **Header & Tabs**
- Create a card-like header with the page title ("Recycling History").
- Style tabs with pill-shaped buttons, clear active/inactive states, and spacing.

### C. **Order Card Redesign**
- Each order is displayed in a card with:
  - Rounded corners (`borderRadius`)
  - Soft shadow (`elevation`/`shadow*`)
  - White background
  - Spacing between cards
- Use a clear layout for order info: status, date, items, etc.
- Use icons for order status if possible.

### D. **Order Item List**
- Display order items in a visually grouped section within the card.
- Use light backgrounds and rounded corners for item lists.

### E. **Buttons**
- Style "Download PDF" and "Cancel Order" buttons:
  - Rounded, filled backgrounds (primary/secondary colors)
  - Icons (if available)
  - Proper spacing and alignment

### F. **Typography**
- Use larger, bolder fonts for headings and key info.
- Use muted colors for secondary text.
- Ensure good contrast for readability.

### G. **Empty State**
- Add a friendly illustration or icon and message when there are no orders in a tab.

### H. **Responsiveness**
- Use scaling utilities (`scaleSize`) for padding, font sizes, etc.
- Test on different device sizes.

---

## 4. **Dependencies & File Changes**

- **File:** `app/recycling-history.jsx` (main refactor)
- **Styles:** Inline or move to a dedicated StyleSheet section.
- **Icons:** Use `@expo/vector-icons` or similar for status/buttons.
- **Utilities:** Use existing `scaleSize`, color palette, and button components if available.

---

## 5. **Testing & Review**

- Test all tabs (incoming, completed, cancelled) for visual consistency.
- Test button actions (PDF, Cancel) for usability.
- Check for overflow, alignment, and responsiveness.
- Review accessibility (touch targets, contrast).

---

## 6. **Future Enhancements**

- Add animations for tab transitions or card appearance.
- Allow filtering/sorting of orders.
- Add order detail modal or page.

---

**Ready to proceed with the refactor following