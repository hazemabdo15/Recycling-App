## Feature: E-Wallet Page

### Objective
Implement a modern, sleek E-Wallet page accessible from the profile menu. The page should be created in the `app` folder (not `screens`). It should display the user's current balance, a list of wallet transactions, and allow adding new transactions (withdrawals).

---

### Tasks

1. **Design & UI**
   - Create a new E-Wallet page with a modern, clean design in the `app` folder.
   - Display the user's balance prominently at the top.
   - Show a list of recent transactions with clear formatting (type, amount, date, gateway).
   - Add a button for "Withdraw" with a modal or form for input.
   - In the withdraw modal, allow the user to choose a payment gateway (e.g., PayPal, Vodafone Cash, etc.) as placeholders. Pressing any gateway proceeds with the withdrawal.

2. **Data Fetching**
   - Fetch the user object to get the current balance from `attachments.balance`.
   - Fetch transactions from `GET /users/{userId}/transactions`.
   - Display loading and error states for both balance and transactions.

3. **Add Transaction**
   - Implement a form/modal to add a new transaction (withdrawal).
   - User selects a payment gateway (placeholder).
   - On submit, POST to `/users/{userId}/transactions` with the required body.
   - Refresh the balance and transaction list after a successful transaction.

4. **Navigation**
   - Ensure the E-Wallet page is navigated to when pressing the E-Wallet button in the profile menu.

5. **Styling**
   - Use consistent colors, fonts, and spacing for a sleek, modern look.
   - Add icons or illustrations as needed for visual appeal.

6. **Testing**
   - Test fetching and displaying balance and transactions.
   - Test adding a transaction and UI updates.
   - Test navigation from the profile menu.
   - Test gateway selection in the withdraw modal.

---

### Acceptance Criteria

- E-Wallet page displays the correct balance and transaction history.
- User can add a new withdrawal transaction and select a payment gateway (placeholder).
- UI is modern, clean, and responsive.
- All data is fetched and updated correctly after actions.
- No major UI or functional bugs.