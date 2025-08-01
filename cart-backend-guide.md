# Recycling-BackEnd

This is the backend for a recycling platform, built with Node.js, Express, and MongoDB (Mongoose). It provides RESTful APIs for user authentication, category and item management, cart operations, order processing, and more. This README is designed to help frontend developers understand the backend structure, endpoints, and data models, especially for cart and item management.

---


## Table of Contents
- [Project Structure](#project-structure)
- [Key Models](#key-models)
- [Cart Item Schema](#cart-item-schema)
- [API Endpoints](#api-endpoints)
  - [Categories & Items](#categories--items)
  - [Cart](#cart)
  - [Orders](#orders)
- [Cart Data Example](#cart-data-example)
- [Validation Rules](#validation-rules)
- [Useful Tips for Frontend](#useful-tips-for-frontend)
- [Extra Notes](#extra-notes)

---

## Project Structure

```
├── src/
│   ├── controllers/         # Route handlers (cartControllers.ts, ...)
│   ├── models/              # Mongoose schemas (cart.ts, item.ts, ...)
│   ├── routes/              # Express route definitions
│   ├── middlewares/         # Auth, session, etc.
│   ├── services/            # Business logic
│   └── utils/               # Helpers
├── uploads/                 # Uploaded files (e.g., delivery proofs)
├── package.json
├── tsconfig.json
└── README.md
```

---

## Key Models

### Item (`src/models/item.ts`)
- `_id`: string (MongoDB ObjectId)
- `name`: string
- `points`: number
- `price`: number
- `quantity`: number
- `measurement_unit`: 1 (KG) or 2 (PIECE)
- `image`: string (URL)
- `categoryName`: string
- `categoryId`: string (reference to category)

### Cart Item (`src/models/cart.ts`)
- `_id`: string (item _id)
- `categoryId`: string (category _id)
- `name`: string
- `image`: string
- `points`: number
- `price`: number
- `categoryName`: string
- `measurement_unit`: number (1 = KG, 2 = PIECE)
- `quantity`: number

---

## Cart Item Schema

**New Cart Item Schema:**
```js
{
  _id: string,           // Item _id (from items collection)
  categoryId: string,    // Category _id
  name: string,          // Item name
  image: string,         // Item image URL
  points: number,        // Points per item
  price: number,         // Price per item
  categoryName: string,  // Category name
  measurement_unit: 1|2, // 1 = KG, 2 = PIECE
  quantity: number       // Quantity (see validation below)
}
```

---

## API Endpoints

### Categories & Items
- `GET /api/categories?role=customer&limit=5`  
  Returns categories with their items. Each item includes `_id`, `name`, `points`, `price`, `measurement_unit`, `image`, `quantity`, `categoryName`, etc.
- `GET /api/categories/get-items?role=customer`  
  Returns a flat list of all items with full details, including `_id` and `categoryId`.
- `GET /api/categories/get-items/:categoryName?role=customer`  
  Returns items for a specific category.

### Cart
- `GET /api/cart`  
  Get the current user's/session's cart.
- `POST /api/cart`  
  Add an item to the cart. Body must include all cart item fields (see schema above).
- `PUT /api/cart`  
  Update an item's quantity in the cart. Body: `{ _id, quantity }`.
- `DELETE /api/cart/:_id`  
  Remove an item from the cart by its `_id`.
- `DELETE /api/cart/`  
  Clear the entire cart.

export default (router: express.Router) => {
  router.get("/cart", optionalAuthenticate, getCart);
  router.post("/cart", optionalAuthenticate,addItemToCart);
  router.put("/cart", optionalAuthenticate,updateCartItem);
  router.delete("/cart/:categoryId", optionalAuthenticate,removeCartItem);
  router.delete("/cart/", optionalAuthenticate, clearCart);
};

### Orders
- `POST /api/orders`  
  Create a new order. Items array must include `_id`, `categoryId`, `itemName`, `image`, `measurement_unit`, `points`, `price`, `quantity`, etc.

---

## Cart Data Example

**New Cart Example:**
```json
{
  "_id": "...",
  "sessionId": "...",
  "items": [
    {
      "_id": "687d76ddba6a94b1537a1aed",
      "categoryId": "687d76c4ba6a94b1537a1ae5",
      "name": "shredded paper",
      "image": "...",
      "points": 38,
      "price": 2,
      "categoryName": "paper",
      "measurement_unit": 1,
      "quantity": 5
    },
    // ... more items ...
  ],
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

## Validation Rules
- **measurement_unit = 1 (KG):**
  - `quantity` must be in 0.25 increments (e.g., 0.25, 0.5, 0.75, 1.0, ...)
- **measurement_unit = 2 (PIECE):**
  - `quantity` must be a whole number >= 1
- Validation is enforced both in the backend controller and the Mongoose schema.

---

## Useful Tips for Frontend
- Always send both `_id` (item id) and `categoryId` when adding items to the cart.
- Use the `/api/categories/get-items` endpoint to get all items with both `_id` and `categoryId` for cart operations.
- When displaying the cart, use the `items` array from the cart object. Each item will have both `_id` and `categoryId`.
- For updating/removing cart items, use the item's `_id`.
- The cart is associated with either a `userId` (logged-in user) or a `sessionId` (guest user).
- If you need to display available quantity, use the `quantity` field from the item endpoints, not the cart.
- When creating an order, pass the cart's items array as the `items` field in the order payload.

---

## Extra Notes
- **Session vs User:**
  - If the user is not logged in, the cart is tied to a `sessionId` (from cookies or local storage).
  - If logged in, the cart is tied to `userId`.
- **Item Naming:**
  - In some endpoints, the item name field may be `name` or `itemName`. Always use the value from the item object.
- **Error Handling:**
  - The backend returns clear error messages for invalid quantity, missing fields, or not found items.
- **Extensibility:**
  - The backend is designed to support both authenticated and guest users, and can be extended for more item types or cart features.

---

## Contact & Contribution
For questions or contributions, please open an issue or pull request on the repository.

---

Old cart Item Schema : 

const cartItemSchema = new Schema<ICartItem>(
  {
    categoryId: { type: String, required: true },
    name: { type: String, required: true },
    image: { type: String, required: false },
    points: { type: Number, required: true },
    price: { type: Number, required: true },
    categoryName: { type: String, required: true },
    measurement_unit: { type: Number, required: true },
    quantity: {
      type: Number,
      required: true,
      min: 0.25,
      validate: {
        validator: function (this: ICartItem, value: number) {
          // For KG items (measurement_unit = 1), allow 0.25 increments
          if (this.measurement_unit === 1) {
            // Check if value is a multiple of 0.25 (0.25, 0.5, 0.75, 1.0, 1.25, etc.)
            // Use Math.round to handle floating point precision issues
            const multiplied = Math.round(value * 4);
            return multiplied >= 1 && Math.abs(value * 4 - multiplied) < 0.0001;
          }
          // For Piece items (measurement_unit = 2), require whole numbers >= 1
          return Number.isInteger(value) && value >= 1;
        },
        message:
          "For KG items, quantity must be in 0.25 increments (0.25, 0.5, 0.75, 1.0, etc.). For Piece items, quantity must be whole numbers >= 1.",
      },
    },
  },
  { _id: false }
);


-------------------------------------------------------
New cart Item schema : 

const cartItemSchema = new Schema<ICartItem>(
  {
    _id: { type: String, required: false },
    categoryId: { type: String, required: true },
    name: { type: String, required: true },
    image: { type: String, required: false },
    points: { type: Number, required: true },
    price: { type: Number, required: true },
    categoryName: { type: String, required: true },
    measurement_unit: { type: Number, required: true },
    quantity: {
      type: Number,
      required: true,
      min: 0.25,
      validate: {
        validator: function (this: ICartItem, value: number) {
          // For KG items (measurement_unit = 1), allow 0.25 increments
          if (this.measurement_unit === 1) {
            // Check if value is a multiple of 0.25 (0.25, 0.5, 0.75, 1.0, 1.25, etc.)
            // Use Math.round to handle floating point precision issues
            const multiplied = Math.round(value * 4);
            return multiplied >= 1 && Math.abs(value * 4 - multiplied) < 0.0001;
          }
          // For Piece items (measurement_unit = 2), require whole numbers >= 1
          return Number.isInteger(value) && value >= 1;
        },
        message:
          "For KG items, quantity must be in 0.25 increments (0.25, 0.5, 0.75, 1.0, etc.). For Piece items, quantity must be whole numbers >= 1.",
      },
    },
  },
  { _id: false }
);


---------------------
old cart example : 
{
  "_id": {
    "$oid": "688bca179b314e9d44ff7b23"
  },
  "sessionId": "df1c143b-cc77-4d06-9ba8-1589c1bd54ae",
  "items": [
    {
      "categoryId": "687d76ddba6a94b1537a1aed" ---> (refers to _id in the new Schema),
      "itemName": "shredded paper",
      "image": "https://res.cloudinary.com/dyz4a4ume/image/upload/v1753530435/recycling/subcategories/image/qtbopsz2jjitexxnovo9.png",
      "points": 38,
      "price": 2,
      "categoryName": "paper",
      "measurement_unit": 1,
      "quantity": 5
    },
    {
      "categoryId": "688008c63b6c069a866a7797",
      "itemName": "Books",
      "image": "https://res.cloudinary.com/dyz4a4ume/image/upload/v1753221147/recycling/subcategories/image/hc9p2urpeyoxy9ixx9uv.png",
      "points": 133,
      "price": 7,
      "categoryName": "paper",
      "measurement_unit": 1,
      "quantity": 1
    },
    {
      "categoryId": "6884bfc9e2ac8765a008f483",
      "itemName": "news paper",
      "image": "https://res.cloudinary.com/dyz4a4ume/image/upload/v1753530140/recycling/subcategories/image/lxle7r76kloo2k3gy3z8.png",
      "points": 116,
      "price": 6,
      "categoryName": "Unknown Category",
      "measurement_unit": 1,
      "quantity": 1.5
    },
    {
      "categoryId": "687e083ef23f6fdfcb40231d",
      "itemName": "router",
      "image": "https://res.cloudinary.com/dyz4a4ume/image/upload/v1753813350/recycling/subcategories/image/v5skykbljjyi6c9vpz1a.png",
      "points": 50,
      "price": 2,
      "categoryName": "e-wasted",
      "measurement_unit": 2,
      "quantity": 6
    },
    {
      "categoryId": "68890db719397e0750d5ae8d",
      "itemName": "Mobile",
      "image": "https://res.cloudinary.com/dyz4a4ume/image/upload/v1753812232/recycling/subcategories/image/lgrw9ddsnnsoog9qg4cv.png",
      "points": 570,
      "price": 30,
      "categoryName": "Unknown Category",
      "measurement_unit": 2,
      "quantity": 1
    }
  ],
  "createdAt": {
    "$date": "2025-07-31T19:55:03.838Z"
  },
  "updatedAt": {
    "$date": "2025-07-31T19:55:16.731Z"
  },
  "__v": 4
}

--------------------------------------
new cart example (should be like this ): 

{
  "_id": {
    "$oid": "688bca179b314e9d44ff7b23"
  },
  "sessionId": "df1c143b-cc77-4d06-9ba8-1589c1bd54ae",
  "items": [
    {
      "_id": "687d76ddba6a94b1537a1aed",			
      "categoryId": "687d76c4ba6a94b1537a1ae5",
      "itemName": "shredded paper",
      "image": "https://res.cloudinary.com/dyz4a4ume/image/upload/v1753530435/recycling/subcategories/image/qtbopsz2jjitexxnovo9.png",
      "points": 38,
      "price": 2,
      "categoryName": "paper",
      "measurement_unit": 1,
      "quantity": 5
    },
    {
      "_id": "688008c63b6c069a866a7797",	
      "categoryId": "687d76c4ba6a94b1537a1ae5",
      "itemName": "Books",
      "image": "https://res.cloudinary.com/dyz4a4ume/image/upload/v1753221147/recycling/subcategories/image/hc9p2urpeyoxy9ixx9uv.png",
      "points": 133,
      "price": 7,
      "categoryName": "paper",
      "measurement_unit": 1,
      "quantity": 1
    },
    {
      "_id": "6884bfc9e2ac8765a008f483",
      "categoryId": "687d76c4ba6a94b1537a1ae5",
      "itemName": "news paper",
      "image": "https://res.cloudinary.com/dyz4a4ume/image/upload/v1753530140/recycling/subcategories/image/lxle7r76kloo2k3gy3z8.png",
      "points": 116,
      "price": 6,
      "categoryName": "paper",
      "measurement_unit": 1,
      "quantity": 1.5
    },
    {
      "_id": "687e083ef23f6fdfcb40231d",
      "categoryId": "687e051316468b6886743500" ,
      "itemName": "router",
      "image": "https://res.cloudinary.com/dyz4a4ume/image/upload/v1753813350/recycling/subcategories/image/v5skykbljjyi6c9vpz1a.png",
      "points": 50,
      "price": 2,
      "categoryName": "e-wasted",
      "measurement_unit": 2,
      "quantity": 6
    },
    {
      "_id": "68890db719397e0750d5ae8d",
      "categoryId": "687e051316468b6886743500",
      "itemName": "Mobile",
      "image": "https://res.cloudinary.com/dyz4a4ume/image/upload/v1753812232/recycling/subcategories/image/lgrw9ddsnnsoog9qg4cv.png",
      "points": 570,
      "price": 30,
      "categoryName": "Unknown Category",
      "measurement_unit": 2,
      "quantity": 1
    }
  ],
  "createdAt": {
    "$date": "2025-07-31T19:55:03.838Z"
  },
  "updatedAt": {
    "$date": "2025-07-31T19:55:16.731Z"
  },
  "__v": 4
}
-----------------------------------------------------

the returned data from this endpoint ( GET http://localhost:5000/api/categories/get-items?role=customer):

{
    "data": [
        {
            "_id": "687d76ddba6a94b1537a1aed",
            "name": "shredded paper",
            "points": 38,
            "price": 2,
            "measurement_unit": 1,
            "image": "https://res.cloudinary.com/dyz4a4ume/image/upload/v1753530435/recycling/subcategories/image/qtbopsz2jjitexxnovo9.png",
            "quantity": 25.25,
            "categoryName": "paper",
            "categoryId": "687d76c4ba6a94b1537a1ae5"
        },
        {
            "_id": "688008c63b6c069a866a7797",
            "name": "Books",
            "points": 133,
            "price": 7,
            "measurement_unit": 1,
            "image": "https://res.cloudinary.com/dyz4a4ume/image/upload/v1753221147/recycling/subcategories/image/hc9p2urpeyoxy9ixx9uv.png",
            "quantity": 21.25,
            "categoryName": "paper",
            "categoryId": "687d76c4ba6a94b1537a1ae5"
        },
        {
            "_id": "6884bfc9e2ac8765a008f483",
            "name": "news paper",
            "points": 116,
            "price": 6,
            "measurement_unit": 1,
            "image": "https://res.cloudinary.com/dyz4a4ume/image/upload/v1753530140/recycling/subcategories/image/lxle7r76kloo2k3gy3z8.png",
            "quantity": 2.25,
            "categoryName": "paper",
            "categoryId": "687d76c4ba6a94b1537a1ae5"
        },
        {
            "_id": "687e083ef23f6fdfcb40231d",
            "name": "router",
            "points": 50,
            "price": 2,
            "measurement_unit": 2,
            "image": "https://res.cloudinary.com/dyz4a4ume/image/upload/v1753813350/recycling/subcategories/image/v5skykbljjyi6c9vpz1a.png",
            "quantity": 76,
            "categoryName": "e-wasted",
            "categoryId": "687e051316468b6886743500"
        },
        {
            "_id": "68890db719397e0750d5ae8d",
            "name": "Mobile",
            "points": 570,
            "price": 30,
            "measurement_unit": 2,
            "image": "https://res.cloudinary.com/dyz4a4ume/image/upload/v1753812232/recycling/subcategories/image/lgrw9ddsnnsoog9qg4cv.png",
            "quantity": 3,
            "categoryName": "e-wasted",
            "categoryId": "687e051316468b6886743500"
        }
    ],
    "pagination": {
        "currentPage": 1,
        "itemsPerPage": 5,
        "totalItems": 17,
        "totalPages": 4,
        "hasNextPage": true
    }
}
---------------------------------------------------------
and this is the data returning from this endpoint (GET http://localhost:5000/api/categories?role=customer&limit=5 ):

{
    "success": true,
    "data": [
        {
            "_id": "687d76c4ba6a94b1537a1ae5",
            "name": "paper",
            "description": "paper items",
            "image": "https://res.cloudinary.com/dyz4a4ume/image/upload/v1753385914/nzaxqpwrehddrklvgbgd.png",
            "items": [
                {
                    "name": "shredded paper",
                    "points": 38,
                    "price": 2,
                    "measurement_unit": 1,
                    "image": "https://res.cloudinary.com/dyz4a4ume/image/upload/v1753530435/recycling/subcategories/image/qtbopsz2jjitexxnovo9.png",
                    "categoryName": "paper",
                    "_id": "687d76ddba6a94b1537a1aed",
                    "quantity": 25.25
                },
                {
                    "name": "Books",
                    "points": 133,
                    "price": 7,
                    "measurement_unit": 1,
                    "image": "https://res.cloudinary.com/dyz4a4ume/image/upload/v1753221147/recycling/subcategories/image/hc9p2urpeyoxy9ixx9uv.png",
                    "_id": "688008c63b6c069a866a7797",
                    "quantity": 21.25,
                    "categoryName": "paper"
                },
                {
                    "name": "news paper",
                    "points": 116,
                    "price": 6,
                    "quantity": 2.25,
                    "measurement_unit": 1,
                    "image": "https://res.cloudinary.com/dyz4a4ume/image/upload/v1753530140/recycling/subcategories/image/lxle7r76kloo2k3gy3z8.png",
                    "_id": "6884bfc9e2ac8765a008f483"
                }
            ],
            "createdAt": "2025-07-20T23:07:48.124Z",
            "updatedAt": "2025-07-31T16:05:04.878Z",
            "__v": 4
        },
        {
            "_id": "687e051316468b6886743500",
            "name": "e-wasted",
            "description": "e-waste products",
            "image": "https://res.cloudinary.com/dyz4a4ume/image/upload/v1753089127/recycling/categories/image/mnl0wnqzl5ljys1imnc5.jpg",
            "items": [
                {
                    "name": "router",
                    "points": 50,
                    "price": 2,
                    "measurement_unit": 2,
                    "image": "https://res.cloudinary.com/dyz4a4ume/image/upload/v1753813350/recycling/subcategories/image/v5skykbljjyi6c9vpz1a.png",
                    "_id": "687e083ef23f6fdfcb40231d",
                    "quantity": 76,
                    "categoryName": "e-wasted"
                },
                {
                    "name": "Mobile",
                    "points": 570,
                    "price": 30,
                    "quantity": 3,
                    "measurement_unit": 2,
                    "image": "https://res.cloudinary.com/dyz4a4ume/image/upload/v1753812232/recycling/subcategories/image/lgrw9ddsnnsoog9qg4cv.png",
                    "_id": "68890db719397e0750d5ae8d"
                },
                {
                    "name": "Laptop",
                    "points": 1900,
                    "price": 100,
                    "quantity": 4,
                    "measurement_unit": 2,
                    "image": "https://res.cloudinary.com/dyz4a4ume/image/upload/v1753812347/recycling/subcategories/image/l05qk7fuey5k9nwrghac.png",
                    "_id": "68890e2a19397e0750d5aecc"
                },
                {
                    "name": "Receiver",
                    "points": 342,
                    "price": 18,
                    "quantity": 9,
                    "measurement_unit": 2,
                    "image": "https://res.cloudinary.com/dyz4a4ume/image/upload/v1753812728/recycling/subcategories/image/jq1iqcggsxpfmcdn7akc.png",
                    "_id": "68890fa719397e0750d5b053"
                },
                {
                    "name": "powerbank",
                    "points": 152,
                    "price": 8,
                    "quantity": 6,
                    "measurement_unit": 2,
                    "image": "https://res.cloudinary.com/dyz4a4ume/image/upload/v1753813207/recycling/subcategories/image/ic9fw56jrssnftc02k9f.png",
                    "_id": "6889118519397e0750d5b22b"
                }
            ],
            "createdAt": "2025-07-21T09:14:59.151Z",
            "updatedAt": "2025-07-31T14:03:52.264Z",
            "__v": 0
        },
        {
            "_id": "687e9637adcf919b39d0b0e7",
            "name": "metals",
            "description": "sort of metal items",
            "image": "https://res.cloudinary.com/dyz4a4ume/image/upload/v1753126284/recycling/categories/image/qxgprlhappyh2sc4uver.jpg",
            "items": [
                {
                    "name": "Cooking pan",
                    "points": 418,
                    "price": 22,
                    "measurement_unit": 2,
                    "image": "https://res.cloudinary.com/dyz4a4ume/image/upload/v1753469904/recycling/subcategories/image/sdxx4uwh2b1wipysb0mq.png",
                    "_id": "687e969aadcf919b39d0b0f2",
                    "quantity": 16
                },
                {
                    "name": "hammer",
                    "points": 150,
                    "price": 12,
                    "measurement_unit": 2,
                    "image": "https://res.cloudinary.com/dyz4a4ume/image/upload/v1753469774/recycling/subcategories/image/oskck2riy3eexxjp9blv.png",
                    "_id": "687fa9f84014d8232bc96952",
                    "quantity": 76
                },
                {
                    "name": "Tea pot",
                    "points": 190,
                    "price": 10,
                    "quantity": 5,
                    "measurement_unit": 2,
                    "image": "https://res.cloudinary.com/dyz4a4ume/image/upload/v1753813995/recycling/subcategories/image/b9io0rucogsjchhm4oju.png",
                    "_id": "6889149919397e0750d5b3ab"
                }
            ],
            "createdAt": "2025-07-21T19:34:15.174Z",
            "updatedAt": "2025-07-31T14:14:09.970Z",
            "__v": 0
        },
        {
            "_id": "687e977eadcf919b39d0b1d4",
            "name": "spare-parts",
            "description": "various spare parts",
            "image": "https://res.cloudinary.com/dyz4a4ume/image/upload/v1753126610/recycling/categories/image/ret9s6sbhuv6ytpyse1h.jpg",
            "items": [
                {
                    "name": "car battery",
                    "points": 5320,
                    "price": 280,
                    "measurement_unit": 2,
                    "image": "https://res.cloudinary.com/dyz4a4ume/image/upload/v1753470016/recycling/subcategories/image/fdgickisxtv4zpdbbrub.png",
                    "_id": "687e97eeadcf919b39d0b1e1",
                    "quantity": 77,
                    "categoryName": "spare-parts"
                }
            ],
            "createdAt": "2025-07-21T19:39:42.100Z",
            "updatedAt": "2025-07-31T17:49:57.559Z",
            "__v": 0
        },
        {
            "_id": "68849b356e240988fbe3a5ef",
            "name": "plastic",
            "description": "Items made of plastic.",
            "image": "https://res.cloudinary.com/dyz4a4ume/image/upload/v1753520949/recycling/categories/image/koa0xnfq0buggpjwoylv.png",
            "items": [
                {
                    "name": "Acrylic",
                    "points": 285,
                    "price": 15,
                    "quantity": 51,
                    "measurement_unit": 1,
                    "image": "https://res.cloudinary.com/dyz4a4ume/image/upload/v1753813577/recycling/subcategories/image/lszreenz5uv73qmsjsrd.png",
                    "_id": "68849bba6e240988fbe3a603"
                },
                {
                    "name": "Solid Plastic",
                    "points": 19,
                    "price": 12,
                    "quantity": 196,
                    "measurement_unit": 1,
                    "image": "https://res.cloudinary.com/dyz4a4ume/image/upload/v1753521196/recycling/subcategories/image/li7jz6cgfosuxyhpbbwv.png",
                    "_id": "68849c2b6e240988fbe3a616"
                },
                {
                    "name": "water colman",
                    "points": 50,
                    "price": 2,
                    "quantity": 500.75,
                    "measurement_unit": 1,
                    "image": "https://res.cloudinary.com/dyz4a4ume/image/upload/v1753521330/recycling/subcategories/image/ekb0hirlkzfmchquzwve.png",
                    "_id": "68849cb16e240988fbe3a641"
                },
                {
                    "name": "Plastic Barrel",
                    "points": 30,
                    "price": 20,
                    "quantity": 97.5,
                    "measurement_unit": 1,
                    "image": "https://res.cloudinary.com/dyz4a4ume/image/upload/v1753521392/recycling/subcategories/image/cvyhbot31bd0nvqf7fw2.png",
                    "_id": "68849cef6e240988fbe3a66c"
                }
            ],
            "createdAt": "2025-07-26T09:09:09.137Z",
            "updatedAt": "2025-07-31T14:18:20.501Z",
            "__v": 7
        }
    ],
    "pagination": {
        "currentPage": 1,
        "itemsPerPage": 5,
        "totalItems": 6,
        "totalPages": 2,
        "hasNextPage": true
    }
}
------------------------------------------------------
and this is what is returned from this endpoint ( GET http://localhost:5000/api/categories/get-items/paper?role=customer&limit=5) :

{
    "data": [
        {
            "name": "shredded paper",
            "points": 38,
            "price": 2,
            "measurement_unit": 1,
            "image": "https://res.cloudinary.com/dyz4a4ume/image/upload/v1753530435/recycling/subcategories/image/qtbopsz2jjitexxnovo9.png",
            "categoryName": "paper",
            "_id": "687d76ddba6a94b1537a1aed",
            "quantity": 25.25
        },
        {
            "name": "Books",
            "points": 133,
            "price": 7,
            "measurement_unit": 1,
            "image": "https://res.cloudinary.com/dyz4a4ume/image/upload/v1753221147/recycling/subcategories/image/hc9p2urpeyoxy9ixx9uv.png",
            "_id": "688008c63b6c069a866a7797",
            "quantity": 21.25,
            "categoryName": "paper"
        },
        {
            "name": "news paper",
            "points": 116,
            "price": 6,
            "quantity": 2.25,
            "measurement_unit": 1,
            "image": "https://res.cloudinary.com/dyz4a4ume/image/upload/v1753530140/recycling/subcategories/image/lxle7r76kloo2k3gy3z8.png",
            "_id": "6884bfc9e2ac8765a008f483"
        }
    ],
    "pagination": {
        "currentPage": 1,
        "itemsPerPage": 5,
        "totalItems": 3,
        "totalPages": 1,
        "hasNextPage": false
    }
}

-----------------------------

those are the function to handle the cart in the cartController in the backend : 

const validateQuantity = (
  quantity: number,
  measurement_unit: number
): { isValid: boolean; message?: string } => {
  if (measurement_unit === 1) {
    // KG items
    // Allow 0.25 increments: 0.25, 0.5, 0.75, 1.0, 1.25, etc.
    // Use Math.round to handle floating point precision issues
    const multiplied = Math.round(quantity * 4);
    const isValid =
      multiplied >= 1 && Math.abs(quantity * 4 - multiplied) < 0.0001;
    return {
      isValid,
      message: !isValid
        ? "For KG items, quantity must be in 0.25 increments (0.25, 0.5, 0.75, 1.0, etc.)"
        : undefined,
    };
  } else {
    // Piece items (measurement_unit = 2)
    // Require whole numbers >= 1
    const isValid = Number.isInteger(quantity) && quantity >= 1;
    return {
      isValid,
      message: !isValid
        ? "For Piece items, quantity must be whole numbers >= 1"
        : undefined,
    };
  }
};

export const getCart = async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const sessionId = req.sessionId;

  if (!userId && !sessionId) {
    return res.status(400).json({ message: "Missing user or session" });
  }

  let cart = null;
  if (userId) {
    cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
      await cart.save();
    }
  } else if (sessionId) {
    cart = await Cart.findOne({ sessionId });
    if (!cart) {
      cart = new Cart({ sessionId, items: [] });
      await cart.save();
    }
  }
  return res.status(200).json(cart);
};

export const addItemToCart = async (req: Request, res: Response) => {
  console.log("in add to cart");

  const userId = req.user?.userId;
  const sessionId = req.sessionId;
  const {
    _id,
    categoryId,
    categoryName,
    name,
    image,
    points,
    price,
    measurement_unit,
    quantity,
  } = req.body;

  if (!userId && !sessionId) {
    return res.status(400).json({ message: "Missing user or session" });
  }

  // Validate quantity based on measurement unit
  const validation = validateQuantity(quantity, measurement_unit);
  if (!validation.isValid) {
    return res.status(400).json({ message: validation.message });
  }

  let cart = await Cart.findOne(userId ? { userId } : { sessionId });
  if (!cart) {
    cart = new Cart({ ...(userId ? { userId } : { sessionId }), items: [] });
  }

  // Find item by categoryId
  const existingItem = cart.items.find(
    (item) => item._id === _id
  );
  if (existingItem) {
    const newQuantity = existingItem.quantity + quantity;
    // Validate the new total quantity
    const newQuantityValidation = validateQuantity(
      newQuantity,
      measurement_unit
    );
    if (!newQuantityValidation.isValid) {
      return res.status(400).json({ message: newQuantityValidation.message });
    }
    existingItem.quantity = newQuantity;
    // Optionally update other fields if needed
    if (name) existingItem.name = name;
    if (image) existingItem.image = image;
    if (points) existingItem.points = points;
    if (price) existingItem.price = price;
    if (measurement_unit) existingItem.measurement_unit = measurement_unit;
  } else {
    cart.items.push({
      _id,
      categoryId,
      categoryName,
      name,
      image,
      points,
      price,
      measurement_unit,
      quantity,
    });
  }

  await cart.save();
  return res.json(cart);
};

export const updateCartItem = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const sessionId = req.sessionId;
    const { _id, quantity } = req.body;

    if (!_id || typeof quantity !== "number") {
      return res
        .status(400)
        .json({ message: "Valid _id and quantity are required" });
    }

    let cart = await Cart.findOne(userId ? { userId } : { sessionId });
    if (!cart) {
      cart = new Cart({ ...(userId ? { userId } : { sessionId }), items: [] });
      await cart.save();
    }

    const item = cart.items.find((i) => i._id === _id);
    if (!item)
      return res.status(404).json({ message: "Item not found in cart" });

    // Validate quantity based on measurement unit
    const validation = validateQuantity(quantity, item.measurement_unit);
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.message });
    }

    item.quantity = quantity;
    await cart.save();
    return res.status(200).json(cart);
  } catch (error) {
    return res.status(500).json({ message: "Failed to update item", error });
  }
};

export const removeCartItem = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const sessionId = req.sessionId;
    const _id = req.params._id?.trim();

    if (!_id) {
      return res.status(400).json({ message: "_id is required" });
    }

    let cart = await Cart.findOne(userId ? { userId } : { sessionId });
    if (!cart) {
      cart = new Cart({ ...(userId ? { userId } : { sessionId }), items: [] });
      await cart.save();
    }
    cart.items = cart.items.filter(
      (item) => item._id.toString().trim() !== _id
    );
    await cart.save();
    return res.status(200).json(cart);
  } catch (error) {
    return res.status(500).json({ message: "Failed to remove item", error });
  }
};

export const clearCart = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const sessionId = req.sessionId;

    if (!userId && !sessionId) {
      return res
        .status(400)
        .json({ message: "User or session ID is required" });
    }

    let cart = await Cart.findOne(userId ? { userId } : { sessionId });
    if (!cart) {
      cart = new Cart({ ...(userId ? { userId } : { sessionId }), items: [] });
      await cart.save();
    }
    cart.items = [];
    await cart.save();
    return res.json({ message: "Cart cleared", cart });
  } catch (error) {
    return res.status(500).json({ message: "Failed to clear cart", error });
  }
};

