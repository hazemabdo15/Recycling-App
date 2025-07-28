
---

## 1. Data Model

### Item Model (src/models/item.ts)
```ts
export interface IItem {
  _id: Types.ObjectId;
  name: string;
  points: number;
  price: number;
  quantity: number; // Stock quantity
  measurement_unit: 1 | 2;
  image: string;
  categoryName: string;
}

export const itemSchema = new Schema<IItem>({
  name: { type: String, required: true },
  points: { type: Number, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true }, // Stock quantity
  measurement_unit: { type: Number, enum: [1, 2], required: true },
  image: { type: String, required: true },
  categoryName: { type: String },
});
```

### Cart Item Model (src/models/cart.ts)
```ts
export interface ICartItem {
  categoryId: string;
  categoryName: string; 
  itemName: string;
  image: string;
  points: number;
  price: number;
  measurement_unit: number;
  quantity: number;
}
```

### Order Item Model (src/models/pickupOrder.ts)
```ts
const ItemSchema = new mongoose.Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  image: { type: String, required: true },
  itemName: { type: String, required: true },
  measurement_unit: { type: Number, enum: [1, 2], required: true },
  points: { type: Number, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  categoryName: String,
});
```

---

## 2. Stock Update Logic

### Stock Helper (src/utils/stockHelper.ts)
```ts
export const updateItemQuantities = async (
  items: Array<{ categoryId: string; quantity: number }>,
  operation: "increase" | "decrease"
) => {
  for (const item of items) {
    const category = await Category.findById(item.categoryId);
    if (!category) throw new Error(`Category not found: ${item.categoryId}`);
    const targetItem = category.items.id(item._id);
    if (!targetItem) throw new Error(`Item not found: ${item._id}`);
    if (operation === "decrease") {
      if (targetItem.quantity < item.quantity) {
        throw new Error(`Not enough quantity for item: ${targetItem.name}`);
      }
      targetItem.quantity -= item.quantity;
    } else if (operation === "increase") {
      targetItem.quantity += item.quantity;
    } else {
      throw new Error(
        `Invalid operation "${operation}". Use "increase" or "decrease".`
      );
    }
    await category.save();
  }
};
```
- This function is used to increase or decrease the stock of items when orders are created or completed.

---

## 3. Controller Functions

### Order Creation (src/controllers/pickupController.ts)
```ts
export const createOrder = async (req, res) => {
  // ...extracts items from request
  // If buyer, update item quantities (decrease stock)
  if (user.role === "buyer") {
    await updateItemQuantities(savedOrder.items, "decrease");
  }
  // ...returns order
};
```

### Order Completion (src/controllers/courierController.ts)
```ts
// When an order is completed, restock items (increase stock)
try {
  await updateItemQuantities(savedOrder.items, "increase");
  console.log("✅ Restocked item quantities for completed order.");
} catch (restockError) {
  console.error("❌ Failed to restock items:", restockError);
}
```

### Item Update (src/controllers/itemsController.ts)
```ts
// When updating an item, you can also update its quantity (stock)
if (quantity !== undefined) item.quantity = Number(quantity);
```

---

## 4. Endpoints

### Order Endpoints (src/routes/pickupRoutes.ts)
- POST `/orders` — Create a new order (decreases stock for buyers)
- PUT `/orders/:id/status` — Update order status (can trigger restock on completion)

### Item Endpoints (src/routes/categoryRoutes.ts)
- PUT `/categories/:categoryId/items/:itemId` — Update item (including quantity/stock)

---

## 5. Request and Response Forms

### Create Order (POST /orders)
**Request:**
```json
{
  "address": { ... },
  "items": [
    {
      "categoryId": "string",
      "itemName": "string",
      "image": "string",
      "measurement_unit": 1,
      "points": 10,
      "price": 5,
      "quantity": 2,
      "categoryName": "Paper"
    }
  ],
  "phoneNumber": "string",
  "userName": "string"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": { ...orderObject }
}
```

### Update Item (PUT /categories/:categoryId/items/:itemId)
**Request:**
```json
{
  "name": "string",
  "points": 10,
  "price": 5,
  "measurement_unit": 1,
  "quantity": 100, // new stock value
  "image": "string"
}
```
**Response:**
```json
{
  "message": "Item updated successfully",
  "item": { ...itemObject }
}
```

---

## 6. OpenAPI Documentation

### Example (src/docs/openapi/paths/pickup.yml)
```yaml
items:
  type: array
  items:
    type: object
    properties:
      itemName:
        type: string
      image:
        type: string
      measurement_unit:
        type: integer
      points:
        type: number
      price:
        type: number
      quantity:
        type: number
      categoryId:
        type: string
      categoryName:
        type: string
```

---

## 7. Quantity Validation

- For KG items (`measurement_unit: 1`): quantity must be in 0.25 increments (0.25, 0.5, 0.75, 1.0, etc.)
- For Piece items (`measurement_unit: 2`): quantity must be a whole number >= 1

Validation is enforced in both the cart and order creation logic.

---

## Summary

- The stock feature is managed via the `quantity` field in the item model.
- Stock is decreased when an order is created (for buyers) and increased when an order is completed.
- The main logic is in `updateItemQuantities` in `src/utils/stockHelper.ts`.
- Endpoints that affect stock: order creation (`POST /orders`), order completion (status update), and item update (`PUT /categories/:categoryId/items/:itemId`).
- Requests must include the `quantity` field for each item, and responses return the updated order/item.
- Quantity validation ensures only valid stock changes are allowed.

If you need code samples for any specific endpoint or function, let me know!Here is a detailed report about the stock feature in your backend, including how it works, its endpoints, controller functions, request/response forms, and the data model.

---

## 1. Overview

The stock feature manages the available quantity of items in your system. It ensures that item quantities are updated when orders are created or modified, and validates quantities based on measurement units (KG or PIECE).

---

## 2. Data Model

### Item Model (item.ts)
- `name`: string
- `points`: number
- `price`: number
- `quantity`: number (the stock count)
- `measurement_unit`: 1 (KG) or 2 (PIECE)
- `image`: string
- `categoryName`: string

### Embedded in Category Model
Items are embedded in categories, and their stock is managed within the category document.

---

## 3. Stock Update Logic

### Utility: `updateItemQuantities` (stockHelper.ts)
- **Purpose:** Increases or decreases item stock when orders are created or completed.
- **Parameters:**
  - `items`: Array of items (must include `categoryId` and `itemName`)
  - `operation`: `"increase"` or `"decrease"`
- **Logic:**
  - Finds the category and item.
  - For `"decrease"`, checks if enough stock exists, then subtracts.
  - For `"increase"`, adds to the stock.
  - Saves the updated category.

---

## 4. Endpoints & Controller Functions

### A. Item Endpoints (Stock Management)

#### Add Item to Category
- **Endpoint:** `POST /categories/add-item/{categoryName}`
- **Controller:** `addItem` in `itemsController.ts`
- **Request (multipart/form-data):**
  - `itemName`: string
  - `points`: number
  - `price`: number
  - `quantity`: number
  - `measurement_unit`: 1 or 2
  - `image`: file
- **Response:**
  - `200 OK`: Item added
  - `400/404`: Error

#### Update Item in Category
- **Endpoint:** `PUT /categories/item/{categoryName}/{itemId}`
- **Controller:** `updateItem` in `itemsController.ts`
- **Request:** (fields to update)
- **Response:** Item updated or error

#### Get All Items (with Stock)
- **Endpoint:** `GET /categories/get-items`
- **Controller:** `getAllItems` in `itemsController.ts`
- **Response:**
  - Paginated list of items, each with `quantity` field

---

### B. Order Endpoints (Affect Stock)

#### Create Order (Decreases Stock)
- **Endpoint:** `POST /orders`
- **Controller:** `createOrder` in `pickupController.ts`
- **Request (application/json):**
  ```json
  {
    "address": "...",
    "items": [
      {
        "categoryId": "...",
        "itemName": "...",
        "image": "...",
        "measurement_unit": 1,
        "points": 10,
        "price": 100,
        "quantity": 2
      }
    ],
    "phoneNumber": "...",
    "userName": "...",
    "email": "..."
  }
  ```
- **Response:**
  - `201 Created`: Order created, stock decreased
  - `400/404/500`: Error

#### Complete Order (Increases Stock)
- **Endpoint:** (Handled in courier/admin controllers when order is completed/cancelled)
- **Controller:** Calls `updateItemQuantities` with `"increase"` to restock items if needed.

---

## 5. Quantity Validation

- **KG items (`measurement_unit = 1`):** Quantity must be in 0.25 increments (e.g., 0.25, 0.5, 0.75, 1.0, etc.)
- **Piece items (`measurement_unit = 2`):** Quantity must be a whole number >= 1

Validation is enforced in both the model and controller.

---

## 6. Example Request/Response

### Add Item (Stock)
**Request:**
```
POST /categories/add-item/Plastic
Content-Type: multipart/form-data

{
  "itemName": "Bottle",
  "points": 5,
  "price": 10,
  "quantity": 100,
  "measurement_unit": 2,
  "image": <file>
}
```
**Response:**
```json
{
  "message": "Item added",
  "item": {
    "name": "Bottle",
    "quantity": 100,
    ...
  }
}
```

### Create Order (Affects Stock)
**Request:**
```
POST /orders
Content-Type: application/json

{
  "address": "...",
  "items": [
    {
      "categoryId": "...",
      "itemName": "Bottle",
      "quantity": 2,
      "measurement_unit": 2,
      ...
    }
  ],
  ...
}
```
**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": { ... }
}
```

---

## 7. Summary

- **Stock is managed per item within categories.**
- **Stock is decreased when a buyer places an order, and increased if an order is cancelled or reverted.**
- **Endpoints for adding/updating items and creating orders are the main ways to interact with stock.**
- **Validation ensures only valid quantities are accepted.**

