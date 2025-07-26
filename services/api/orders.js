import { validateQuantity } from '../../utils/cartUtils';
import apiService from './apiService';

export const orderService = {

  async createOrder(orderData) {
    try {
      console.log('[Order Service] Creating order');

      this.validateOrderData(orderData);
      
      const response = await apiService.post('/orders', orderData);
      
      console.log('[Order Service] Order created successfully');
      return response;
    } catch (error) {
      console.error('[Order Service] Failed to create order:', error.message);
      throw error;
    }
  },

  async getOrders() {
    try {
      console.log('[Order Service] Fetching user orders');
      
      const response = await apiService.get('/orders');
      
      console.log(`[Order Service] Retrieved ${response.count || response.data?.length || 0} orders`);
      return response;
    } catch (error) {
      console.error('[Order Service] Failed to fetch orders:', error.message);
      
      // If it's a 401/403 error, the user is not properly authenticated
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.error('[Order Service] Authentication error, user may need to re-login');
      }
      
      throw error;
    }
  },

  async getOrder(orderId) {
    try {
      console.log('[Order Service] Fetching order:', orderId);
      
      const response = await apiService.get(`/orders/${orderId}`);
      
      console.log('[Order Service] Order retrieved successfully');
      return response;
    } catch (error) {
      console.error('[Order Service] Failed to fetch order:', error.message);
      throw error;
    }
  },

  async getOrdersByStatus(status) {
    try {
      console.log('[Order Service] Fetching orders with status:', status);
      
      const response = await apiService.get(`/orders/status/${status}`);
      
      console.log(`[Order Service] Retrieved ${response.count || 0} ${status} orders`);
      return response;
    } catch (error) {
      console.error('[Order Service] Failed to fetch orders by status:', error.message);
      throw error;
    }
  },

  async updateOrderStatus(orderId, status) {
    try {
      console.log('[Order Service] Updating order status:', orderId, status);
      
      const response = await apiService.put(`/orders/${orderId}/status`, { status });
      
      console.log('[Order Service] Order status updated successfully');
      return response;
    } catch (error) {
      console.error('[Order Service] Failed to update order status:', error.message);
      throw error;
    }
  },

  async cancelOrder(orderId) {
    try {
      console.log('[Order Service] Cancelling order:', orderId);
      
      const response = await apiService.patch(`/orders/${orderId}/cancel`);
      
      console.log('[Order Service] Order cancelled successfully');
      return response;
    } catch (error) {
      console.error('[Order Service] Failed to cancel order:', error.message);
      throw error;
    }
  },

  async deleteOrder(orderId) {
    try {
      console.log('[Order Service] Deleting order:', orderId);
      
      const response = await apiService.delete(`/orders/${orderId}`);
      
      console.log('[Order Service] Order deleted successfully');
      return response;
    } catch (error) {
      console.error('[Order Service] Failed to delete order:', error.message);
      throw error;
    }
  },

  async deleteAllOrders() {
    try {
      console.log('[Order Service] Deleting all user orders');
      
      const response = await apiService.delete('/orders');
      
      console.log('[Order Service] All orders deleted successfully');
      return response;
    } catch (error) {
      console.error('[Order Service] Failed to delete all orders:', error.message);
      throw error;
    }
  },

  async getOrderAnalytics() {
    try {
      console.log('[Order Service] Fetching order analytics');
      
      const response = await apiService.get('/orders/analytics');
      
      console.log('[Order Service] Analytics retrieved successfully');
      return response;
    } catch (error) {
      console.error('[Order Service] Failed to fetch analytics:', error.message);
      throw error;
    }
  },

  async getTopCities() {
    try {
      console.log('[Order Service] Fetching top cities');
      
      const response = await apiService.get('/orders/analytics/top-cities');
      
      console.log('[Order Service] Top cities retrieved successfully');
      return response;
    } catch (error) {
      console.error('[Order Service] Failed to fetch top cities:', error.message);
      throw error;
    }
  },

  async getTopMaterials(category = null) {
    try {
      console.log('[Order Service] Fetching top materials', category ? `for category: ${category}` : '');
      
      const url = category 
        ? `/top-materials-recycled?category=${encodeURIComponent(category)}`
        : '/top-materials-recycled';
      
      const response = await apiService.get(url);
      
      console.log('[Order Service] Top materials retrieved successfully');
      return response;
    } catch (error) {
      console.error('[Order Service] Failed to fetch top materials:', error.message);
      throw error;
    }
  },

  async getTopUsers() {
    try {
      console.log('[Order Service] Fetching top users');
      
      const response = await apiService.get('/top-users-points');
      
      console.log('[Order Service] Top users retrieved successfully');
      return response;
    } catch (error) {
      console.error('[Order Service] Failed to fetch top users:', error.message);
      throw error;
    }
  },

  validateOrderData(orderData) {
    const requiredFields = ['address', 'items', 'phoneNumber', 'userName', 'imageUrl', 'email'];
    const missingFields = requiredFields.filter(field => !orderData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
      throw new Error('At least one item is required');
    }

    if (!orderData.address.city) {
      throw new Error('Address must include at least city');
    }

    orderData.items.forEach((item, index) => {
      this.validateOrderItem(item, index);
    });
  },

  validateOrderItem(item, index) {
    const requiredItemFields = ['categoryId', 'image', 'itemName', 'measurement_unit', 'points', 'price', 'quantity'];
    const missingFields = requiredItemFields.filter(field => item[field] === undefined || item[field] === null);
    
    if (missingFields.length > 0) {
      throw new Error(`Item ${index + 1} missing required fields: ${missingFields.join(', ')}`);
    }

    try {
      validateQuantity({
        quantity: item.quantity,
        measurement_unit: item.measurement_unit
      });
    } catch (error) {
      throw new Error(`Item ${index + 1}: ${error.message}`);
    }
  }
};
