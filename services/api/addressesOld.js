import apiService from './apiService';

/**
 * Address Service with proper backend integration
 * Follows the backend API specification exactly
 */

export const addressService = {
  // Get all user addresses
  async getAddresses() {
    try {
      console.log('[Address Service] Fetching user addresses');
      
      const response = await apiService.get('/addresses');
      
      console.log(`[Address Service] Retrieved ${response.length || 0} addresses`);
      return response;
    } catch (error) {
      console.error('[Address Service] Failed to fetch addresses:', error.message);
      throw error;
    }
  },

  // Create new address
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

  // Update existing address
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

  // Delete address
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
      console.log('Creating address with token:', token ? 'Token provided' : 'No token');
      
      // For development, check if it's a mock token
      if (token && token.startsWith('mock.')) {
        console.log('[addresses API] Mock token detected for create address, simulating success for development');
        
        // Return a mock successful response
        const mockAddress = {
          _id: 'mock-address-' + Date.now(),
          userId: 'mock-user-id',
          ...addressData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        return {
          success: true,
          data: mockAddress,
          message: 'Development mode - address created locally'
        };
      }
      
      const response = await fetch(API_ENDPOINTS.ADDRESSES, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(addressData),
      });

      console.log('Create address response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        } else if (response.status === 403) {
          throw new Error('Access forbidden. Please check your permissions.');
        } else {
          const errorText = await response.text();
          console.error('Create address error response:', errorText);
          throw new Error(`Failed to create address: ${errorText || response.statusText}`);
        }
      }

      const data = await response.json();
      console.log('Address created successfully');
      return data;
    } catch (error) {
      console.error('Error creating address:', error);
      throw error;
    }
  },

  // Update address
  async updateAddress(addressId, addressData, token) {
    try {
      console.log('[addresses API] Updating address with token:', token ? 'Token provided' : 'No token');
      
      // For development, check if it's a mock token
      if (token && token.startsWith('mock.')) {
        console.log('[addresses API] Mock token detected for update address, simulating success for development');
        
        // Return a mock successful response
        const mockAddress = {
          _id: addressId,
          userId: 'mock-user-id',
          ...addressData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        return {
          success: true,
          data: mockAddress,
          message: 'Development mode - address updated locally'
        };
      }
      
      const response = await fetch(`${API_ENDPOINTS.ADDRESSES}/${addressId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(addressData),
      });

      console.log('[addresses API] Update address response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        } else if (response.status === 403) {
          throw new Error('Access forbidden. Please check your permissions.');
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const data = await response.json();
      console.log('[addresses API] Address updated successfully');
      return data;
    } catch (error) {
      console.error('[addresses API] Error updating address:', error);
      throw error;
    }
  },

  // Delete address
  async deleteAddress(addressId, token) {
    try {
      console.log('[addresses API] Deleting address with token:', token ? 'Token provided' : 'No token');
      
      // For development, check if it's a mock token
      if (token && token.startsWith('mock.')) {
        console.log('[addresses API] Mock token detected for delete address, simulating success for development');
        
        return {
          success: true,
          message: 'Development mode - address deleted locally'
        };
      }
      
      const response = await fetch(`${API_ENDPOINTS.ADDRESSES}/${addressId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('[addresses API] Delete address response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        } else if (response.status === 403) {
          throw new Error('Access forbidden. Please check your permissions.');
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const data = await response.json();
      console.log('[addresses API] Address deleted successfully');
      return data;
    } catch (error) {
      console.error('[addresses API] Error deleting address:', error);
      throw error;
    }
  },
};
