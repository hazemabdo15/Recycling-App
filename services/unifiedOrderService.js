// Unified Order Service for all order creation flows
import { logger } from '../utils/persistentLogger';
import apiService from './api/apiService';

export const unifiedOrderService = {
  async createPickupOrder(selectedAddress, userData, cartItemDetails, orderOptions = {}) {
    logger.info('Creating pickup order', { 
      addressCity: selectedAddress?.city, 
      userEmail: userData?.email,
      itemCount: Object.keys(cartItemDetails || {}).length,
      paymentMethod: orderOptions.paymentMethod,
      userRole: userData?.role
    });

    try {
      const orderData = this.transformCartToOrder(
        cartItemDetails,
        selectedAddress,
        userData,
        orderOptions
      );

      logger.info('Order data prepared', { orderData });

      const response = await apiService.post('/orders', orderData);
      
      // ✅ Handle different response structures from backend
      let completeOrder;
      if (response.data && response.data._id) {
        // Response has nested data structure
        completeOrder = {
          ...response.data,
          _id: response.data._id,
          items: response.data.items || orderData.items,
          address: response.data.address || orderData.address,
          user: response.data.user || orderData.user,
          status: response.data.status || 'pending',
          createdAt: response.data.createdAt || new Date().toISOString()
        };
      } else {
        // Response is direct order object
        completeOrder = {
          ...response,
          _id: response._id || response.id,
          items: response.items || orderData.items,
          address: response.address || orderData.address,
          user: response.user || orderData.user,
          status: response.status || 'pending',
          createdAt: response.createdAt || new Date().toISOString()
        };
      }
      
      logger.success('Order created successfully', { 
        orderId: completeOrder._id,
        itemCount: completeOrder.items?.length,
        userRole: userData?.role
      });
      
      return completeOrder;
    } catch (error) {
      logger.error('Order creation failed', { error: error.message, stack: error.stack });
      throw error;
    }
  },

  transformCartToOrder(cartItems, address, userData, orderOptions = {}) {
    // Single transformation point
    const items = Object.entries(cartItems).map(([categoryId, item]) => {
      if (typeof item === 'number') {
        // Handle case where cartItems is { categoryId: quantity }
        throw new Error('Cart items should contain full item data, not just quantities');
      }
      
      return {
        _id: item._id || categoryId,
        categoryId: item.categoryId || categoryId,
        name: item.name || item.itemName || 'Unknown Item',
        categoryName: item.categoryName || 'Unknown Category',
        measurement_unit: item.measurement_unit || 1,
        points: item.points || 0,
        price: item.price || 0,
        quantity: item.quantity || 1,
        image: item.image || `${(item.name || 'item').toLowerCase().replace(/\s+/g, '-')}.png`
      };
    });

    const orderData = {
      phoneNumber: userData.phoneNumber || userData.phone || '',
      userName: userData.name || userData.userName || '',
      email: userData.email || '',
      imageUrl: userData.imageUrl || userData.avatar || '',
      user: {
        userId: userData._id || userData.userId,
        phoneNumber: userData.phoneNumber || userData.phone || '',
        userName: userData.name || userData.userName || '',
        email: userData.email || ''
      },
      address: {
        city: address.city || '',
        area: address.area || '',
        street: address.street || '',
        building: address.building || '',
        floor: address.floor || '',
        apartment: address.apartment || '',
        landmark: address.landmark || '',
        isDefault: address.isDefault || false
      },
      items,
      status: 'pending',
      paymentMethod: orderOptions.paymentMethod === 'cash' ? 'cash' : 'credit-card',
      courier: null,
      deliveryProof: null,
      collectedAt: null,
      completedAt: null,
      estimatedWeight: null,
      quantityAdjustmentNotes: null,
      hasQuantityAdjustments: false,
      statusHistory: []
    };

    logger.info('Order data transformed', { 
      itemCount: items.length, 
      paymentMethod: orderData.paymentMethod,
      address: orderData.address.city 
    });

    return orderData;
  }
};
