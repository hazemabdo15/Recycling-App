## Plan: Implement Pull-to-Refresh for Redeem History Page

### Goal
Enable pull-to-refresh on the Redeem History page to fetch the latest user data (including `pointsHistory`) from the backend using the current logged-in user's ID.

---

### Steps

1. **Add Pull-to-Refresh UI**
   - Use the `refreshing` and `onRefresh` props of `FlatList` in `redeem-history.jsx` to enable pull-to-refresh.

2. **Fetch User Data from Backend**
   - On refresh, make a GET request to `/users/:id` using the current user's ID.
   - Use the endpoint: `GET /users/:id` (as implemented in the backend controller).
   - **Use the `get` method from `apiService` to perform this request.**

3. **Extract and Update Points History**
   - Extract the `pointsHistory` array from the fetched user object.
   - Update the local user context or state with the new `pointsHistory`.

4. **Update Redeem History List**
   - Re-filter and re-sort the `pointsHistory` to update the displayed redeem history items.

5. **Handle Loading and Errors**
   - Show a loading indicator while fetching.
   - Handle and display any errors that occur during the fetch.

6. **Testing**
   - Test the pull-to-refresh on the Redeem History page.
   - Ensure the list updates with any new changes from the backend.

---

### Notes

- The user ID should be obtained from the current authentication context.
- The fetch should not include sensitive fields (`password`, `refreshToken`), as per the backend controller.
- Ensure the UI remains responsive and provides feedback during refresh.
- Use the same refresh style as the rest of the project:  
  Use the `RefreshControl` component with `colors={[colors.primary]}` and `tintColor={colors.primary}` for a consistent pull-to-refresh appearance.
- **Always use the `get` method from `apiService` for backend requests to ensure consistency and proper error handling.**