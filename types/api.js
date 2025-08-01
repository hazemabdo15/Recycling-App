export const CategoryType = {
  _id: '',
  name: '',
  description: '',
  image: '',
  items: [],
  createdAt: '',
  updatedAt: '',
  __v: 0,
};

export const ItemType = {
  _id: '',
  name: '',
  points: 0,
  price: 0,
  measurement_unit: 0,
  image: '',
  quantity: 0, // Available quantity in inventory
  categoryName: '',
  categoryId: '',
};

export const CategoryItemType = {
  _id: '',
  name: '',
  points: 0,
  price: 0,
  measurement_unit: 0,
  image: '',
  quantity: 0, // Available quantity in inventory
  categoryName: '',
};

// New Cart Item Type matching backend schema
export const CartItemType = {
  _id: '',           // Item _id (from items collection)
  categoryId: '',    // Category _id 
  name: '',          // Item name
  image: '',         // Item image URL
  points: 0,         // Points per item
  price: 0,          // Price per item
  categoryName: '',  // Category name
  measurement_unit: 0, // 1 = KG, 2 = PIECE
  quantity: 0        // Quantity in cart
};