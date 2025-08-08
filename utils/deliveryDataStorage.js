class DeliveryDataStorage {
  constructor() {
    this.deliveryData = null;
  }

  storeDeliveryData(data) {
    this.deliveryData = data;
  }

  getDeliveryData() {
    return this.deliveryData;
  }

  clearDeliveryData() {
    this.deliveryData = null;
  }

  hasDeliveryData() {
    return this.deliveryData !== null;
  }
}

// Singleton instance
const deliveryDataStorage = new DeliveryDataStorage();

export default deliveryDataStorage;
