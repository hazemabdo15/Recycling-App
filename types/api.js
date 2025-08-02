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
  quantity: 0,
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
  quantity: 0,
  categoryName: '',
};

export const CartItemType = {
  _id: '',
  categoryId: '',
  name: '',
  image: '',
  points: 0,
  price: 0,
  categoryName: '',
  measurement_unit: 0,
  quantity: 0
};