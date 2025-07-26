# BACKEND GUIDE: Recycling-BackEnd

## Overview
This backend provides a robust infrastructure for a recycling platform, supporting multiple user roles (admin, customer, buyer, delivery), authentication, cart and order management, points system, notifications, and Stripe payments. Built with Node.js, Express, TypeScript, and MongoDB (Mongoose).

---

## Table of Contents
- [Authentication & User Roles](#authentication--user-roles)
- [Models & Schemas](#models--schemas)
  - [User](#user)
  - [Cart](#cart)
  - [Order (PickupOrder)](#order-pickuporder)
  - [Category & Item](#category--item)
  - [Notification](#notification)
- [API Endpoints](#api-endpoints)
  - [Auth](#auth)
  - [User](#user-1)
  - [Cart](#cart-1)
  - [Order (Pickup)](#order-pickup)
  - [Category & Item](#category--item-1)
  - [Notification](#notification-1)
  - [Stripe Payments](#stripe-payments)
- [Middleware](#middleware)
- [Error Handling](#error-handling)
- [Frontend Integration Notes](#frontend-integration-notes)
- [Appendix: Data Schemas](#appendix-data-schemas)

---

## Authentication & User Roles
- **JWT-based authentication**: All protected endpoints require a Bearer token in the `Authorization` header.
- **Roles**:  
  - `admin`: Full access, can manage users, orders, categories, etc.
  - `customer`: Can create orders, manage cart, earn points, make payments.
  - `buyer`: Same as customer unless you add buyer-specific logic.
  - `delivery`: Can view and complete assigned orders.

---

## Models & Schemas

### User
```typescript
interface IUser extends Document {
  id: string;
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  provider: "google" | "facebook" | "none";
  refreshToken?: string;
  role: "admin" | "customer" | "buyer" | "delivery";
  isGuest: boolean;
  totalPoints: number;
  pointsHistory: PointsHistoryEntry[];
  imgUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
  lastActiveAt?: Date;
  stripeCustomerId?: string;
  comparePassword(candidate: string): Promise<boolean>;
  toSafeObject(): SafeUser;
}
```
- **PointsHistoryEntry**: Tracks points earned, deducted, or adjusted per order.
- **SafeUser**: Used for responses, omits sensitive fields.

### Cart
```typescript
interface ICartItem {
  categoryId: string;
  itemName: string;
  image?: string;
  points: number;
  price: number;
  categoryName: string;
  measurement_unit: number; // 1 = KG, 2 = Piece
  quantity: number;
}

interface ICart extends Document {
  userId?: Types.ObjectId;
  sessionId?: string;
  items: ICartItem[];
}
```
- **Validation**: Quantity is validated based on measurement unit (0.25 increments for KG, whole numbers for Piece).

### Order (PickupOrder)
```typescript
interface IOrderUser {
  userId: mongoose.Types.ObjectId;
  phoneNumber?: string;
  userName?: string;
  email?: string;
  image?: string;
}

interface IOrder extends Document {
  user: IOrderUser;
  address: IAddress;
  items: IItem[];
  courier?: mongoose.Types.ObjectId;
  status: 'pending' | 'assigntocourier' | 'completed' | 'cancelled';
  statusHistory: IStatusHistory[];
  deliveryProof?: IDeliveryProof;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```
- **Status**: Orders move through statuses (`pending`, `assigntocourier`, `completed`, `cancelled`).
- **DeliveryProof**: Photo and info for completed deliveries.

### Category & Item
```typescript
interface ICategory extends Document {
  name: string;
  description?: string;
  items: IItem[];
}

interface IItem {
  categoryId: mongoose.Types.ObjectId;
  image: string;
  itemName: string;
  measurement_unit: 1 | 2;
  points: number;
  price: number;
  quantity: number;
  categoryName?: string;
}
```

### Notification
```typescript
interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: string;
  message: string;
  read: boolean;
  createdAt: Date;
}
```

---

## API Endpoints

### Auth
| Endpoint                | Method | Description                | Request Body / Params                | Response                          |
|-------------------------|--------|----------------------------|--------------------------------------|------------------------------------|
| `/auth/initiateSignup`  | POST   | Start signup, send OTP     | `{ email }`                          | `{ message }`                      |
| `/auth/verifyRegister`  | POST   | Complete signup            | `{ name, email, password, otpCode, phoneNumber, provider, role }` | `{ accessToken, user }`            |
| `/auth/login`           | POST   | Login                      | `{ email, password }`                | `{ accessToken, user }`            |
| `/auth/logout`          | POST   | Logout                     | (token in header)                    | `{ message }`                      |
| `/auth/refresh`         | POST   | Refresh JWT                | (refreshToken in cookie)             | `{ accessToken }`                  |
| `/auth/forgotPassword`  | POST   | Send reset OTP             | `{ email }`                          | `{ message }`                      |
| `/auth/resetPassword`   | POST   | Reset password             | `{ email, otpCode, newPassword }`    | `{ message }`                      |

### User
| Endpoint                | Method | Description                | Request Body / Params                | Response                          |
|-------------------------|--------|----------------------------|--------------------------------------|------------------------------------|
| `/users/me`             | GET    | Get current user           | (token)                              | `SafeUser`                        |
| `/users/:id`            | GET    | Get user by ID (admin)     | (token, id param)                    | `SafeUser`                        |
| `/users/:id`            | PATCH  | Update user role (admin)   | `{ role }`                           | `SafeUser`                        |
| `/users/:id`            | DELETE | Delete user (admin)        | (id param)                           | `{ message }`                     |
| `/users/:id/stripe-customer` | POST | Create Stripe customer   | (token, id param)                    | `{ stripeCustomerId }`             |
| `/users/:id/create-payment-intent` | POST | Create payment intent | `{ amount }`                        | `{ clientSecret }`                |
| `/users/:id/payments`   | GET    | Get user payments          | (token, id param)                    | `[Payment]`                       |

### Cart
| Endpoint                | Method | Description                | Request Body / Params                | Response                          |
|-------------------------|--------|----------------------------|--------------------------------------|------------------------------------|
| `/cart`                 | GET    | Get cart                   | (token/session)                      | `Cart`                            |
| `/cart`                 | POST   | Add item to cart           | `CartItemInput`                      | `Cart`                            |
| `/cart/item`            | PATCH  | Update item quantity       | `{ categoryId, quantity }`           | `Cart`                            |
| `/cart/item/:categoryId`| DELETE | Remove item from cart      | (categoryId param)                   | `Cart`                            |
| `/cart/clear`           | POST   | Clear cart                 | (token/session)                      | `{ message, cart }`               |

### Order (Pickup)
| Endpoint                | Method | Description                | Request Body / Params                | Response                          |
|-------------------------|--------|----------------------------|--------------------------------------|------------------------------------|
| `/orders`               | GET    | Get user orders            | (token)                              | `{ success, count, data: [Order] }`|
| `/orders`               | POST   | Create order               | `OrderCreateRequest`                 | `{ success, message, data: Order }`|
| `/orders/:id`           | GET    | Get order by ID            | (id param)                           | `{ success, data: Order }`        |
| `/orders/:id`           | DELETE | Delete order               | (id param)                           | `{ success, message, data }`      |
| `/orders/:id/status`    | PUT    | Update order status        | `{ status, reason?, notes? }`        | `{ success, message, data }`      |
| `/orders/points`        | GET    | Get orders with points     | (token)                              | `{ success, count, data }`        |
| `/orders/status/:status`| GET    | Get orders by status       | (status param)                       | `{ success, count, data }`        |
| `/orders/:id/cancel`    | PATCH  | Cancel order               | `{ reason, notes }`                  | `{ success, message, data }`      |
| `/orders/analytics`     | GET    | Order analytics            | (admin)                              | `{ ...analytics }`                |

### Category & Item
| Endpoint                | Method | Description                | Request Body / Params                | Response                          |
|-------------------------|--------|----------------------------|--------------------------------------|------------------------------------|
| `/categories`           | GET    | Get all categories         |                                      | `[Category]`                      |
| `/categories`           | POST   | Create category (admin)    | `{ name, description }`              | `Category`                        |
| `/categories/:id`       | PATCH  | Update category (admin)    | `{ name, description }`              | `Category`                        |
| `/categories/:id`       | DELETE | Delete category (admin)    | (id param)                           | `{ message }`                     |
| `/categories/:categoryId/items` | POST | Add item to category (admin) | `{ ...item }`                  | `Item`                            |
| `/categories/:categoryId/items/:itemId` | PATCH | Update item (admin) | `{ ...item }`                  | `Item`                            |
| `/categories/:categoryId/items/:itemId` | DELETE | Delete item (admin) | (params)                      | `{ message }`                     |

### Notification
| Endpoint                | Method | Description                | Request Body / Params                | Response                          |
|-------------------------|--------|----------------------------|--------------------------------------|------------------------------------|
| `/notifications`        | GET    | Get user notifications     | (token)                              | `[Notification]`                  |
| `/notifications/:id/read` | PATCH | Mark as read              | (id param)                           | `{ message }`                     |

### Stripe Payments
| Endpoint                | Method | Description                | Request Body / Params                | Response                          |
|-------------------------|--------|----------------------------|--------------------------------------|------------------------------------|
| `/users/:id/stripe-customer` | POST | Create Stripe customer   | (token, id param)                    | `{ stripeCustomerId }`             |
| `/users/:id/create-payment-intent` | POST | Create payment intent | `{ amount }`                        | `{ clientSecret }`                |
| `/users/:id/payments`   | GET    | Get user payments          | (token, id param)                    | `[Payment]`                       |
| `/payments`             | GET    | Get all payments (admin)   | (admin)                              | `[Payment]`                       |

---

## Middleware
- **authenticate**: Verifies JWT and attaches user to request.
- **authorize([roles])**: Restricts access to users with specified roles.
- **paginate**: Adds pagination to list endpoints.
- **updateLastActive**: Updates user's last active timestamp.

---

## Error Handling
- All endpoints return appropriate HTTP status codes.
- Error responses are in the form:
  ```json
  { "success": false, "message": "Error message" }
  ```

---

## Frontend Integration Notes
- **Authentication**: Store JWT in secure storage. Send as `Authorization: Bearer <token>` in all requests.
- **Role-based UI**: After login, check `user.role` to determine which screens to show.
- **Cart**: Use `/cart` endpoints for buyer/customer cart management.
- **Orders**: Use `/orders` endpoints for order creation, status, and history.
- **Points**: Use `/orders/points` to show user points and history.
- **Payments**: Use Stripe endpoints for payment flows.
- **Profile**: Use `/users/me` for profile info and `/users/:id` for admin actions.
- **Notifications**: Use `/notifications` to show user notifications.

---

## Appendix: Data Schemas

### User (SafeUser)
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "phoneNumber": "string",
  "provider": "google|facebook|none",
  "role": "admin|customer|buyer|delivery",
  "isGuest": false,
  "imgUrl": "string",
  "createdAt": "date",
  "updatedAt": "date",
  "lastActiveAt": "date",
  "stripeCustomerId": "string"
}
```

### Cart
```json
{
  "_id": "string",
  "userId": "string",
  "sessionId": "string",
  "items": [
    {
      "categoryId": "string",
      "itemName": "string",
      "image": "string",
      "points": 0,
      "price": 0,
      "categoryName": "string",
      "measurement_unit": 1,
      "quantity": 0
    }
  ],
  "createdAt": "date",
  "updatedAt": "date"
}
```

### Order
```json
{
  "_id": "string",
  "user": {
    "userId": "string",
    "phoneNumber": "string",
    "userName": "string",
    "email": "string",
    "image": "string"
  },
  "address": {
    "city": "string",
    "area": "string",
    "street": "string",
    "building": "string",
    "floor": "string",
    "apartment": "string",
    "landmark": "string",
    "isDefault": false
  },
  "items": [
    {
      "categoryId": "string",
      "image": "string",
      "itemName": "string",
      "measurement_unit": 1,
      "points": 0,
      "price": 0,
      "quantity": 0,
      "categoryName": "string"
    }
  ],
  "courier": "string",
  "status": "pending|assigntocourier|completed|cancelled",
  "statusHistory": [
    {
      "status": "pending",
      "timestamp": "date",
      "updatedBy": "string",
      "reason": "string",
      "notes": "string"
    }
  ],
  "deliveryProof": {
    "photoPath": "string",
    "photoUrl": "string",
    "uploadedAt": "date",
    "notes": "string",
    "completedBy": "string"
  },
  "completedAt": "date",
  "createdAt": "date",
  "updatedAt": "date"
}
```

### Category
```json
{
  "_id": "string",
  "name": "string",
  "description": "string",
  "items": [ /* see Item schema */ ]
}
```

### Notification
```json
{
  "_id": "string",
  "userId": "string",
  "type": "string",
  "message": "string",
  "read": false,
  "createdAt": "date"
}
```

---

## Notes
- All endpoints and models are subject to role-based access control.
- If you want to add buyer-specific logic, update the backend to check for `"buyer"` in the `authorize` middleware and controllers.
- For any new features, update both the backend and this documentation.

---

**For further details, refer to the codebase and the OpenAPI spec (`openapi.yaml`).**
If you need example requests/responses for any endpoint, let me know!
