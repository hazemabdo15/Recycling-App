import apiService from './apiService';

export const addressService = {

  async getAddresses() {
    try {
      console.log('[Address Service] Fetching user addresses');
      
      const response = await apiService.get('/addresses');
      
      console.log(`[Address Service] Retrieved ${response.length || 0} addresses`);
      return response;
    } catch (error) {
      console.error('[Address Service] Failed to fetch addresses:', error.message);
      
      // If it's a 401/403 error, the user is not properly authenticated
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.error('[Address Service] Authentication error, user may need to re-login');
      }
      
      throw error;
    }
  },

  async createAddress(addressData) {
    try {
      console.log('[Address Service] Creating new address');
      
      const response = await apiService.post('/addresses', addressData);
      
      console.log('[Address Service] Address created successfully');
      return response;
    } catch (error) {
      console.error('[Address Service] Failed to create address:', error.message);
      throw error;
    }
  },

  async updateAddress(addressId, addressData) {
    try {
      console.log('[Address Service] Updating address:', addressId);
      
      const response = await apiService.put(`/addresses/${addressId}`, addressData);
      
      console.log('[Address Service] Address updated successfully');
      return response;
    } catch (error) {
      console.error('[Address Service] Failed to update address:', error.message);
      throw error;
    }
  },

  async deleteAddress(addressId) {
    try {
      console.log('[Address Service] Deleting address:', addressId);
      
      await apiService.delete(`/addresses/${addressId}`);
      
      console.log('[Address Service] Address deleted successfully');
    } catch (error) {
      console.error('[Address Service] Failed to delete address:', error.message);
      throw error;
    }
  }
};
