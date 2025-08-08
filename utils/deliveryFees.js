// Shared city list and delivery fee mapping for the app

export const CITIES = [
  'Cairo', 'Alexandria', 'Giza', 'Sharm El Sheikh', 'Hurghada', 
  'Luxor', 'Aswan', 'Port Said', 'Suez', 'Ismailia'
];

// Delivery fee mapping (EGP)
export const DELIVERY_FEES_BY_CITY = {
  Cairo: 30,
  Alexandria: 40,
  Giza: 35,
  'Sharm El Sheikh': 60,
  Hurghada: 55,
  Luxor: 70,
  Aswan: 75,
  'Port Said': 50,
  Suez: 45,
  Ismailia: 50
};

// Default fee if city not found
export const DEFAULT_DELIVERY_FEE = 50;

export function getDeliveryFeeForCity(city) {
  if (!city) return DEFAULT_DELIVERY_FEE;
  return DELIVERY_FEES_BY_CITY[city] ?? DEFAULT_DELIVERY_FEE;
}
