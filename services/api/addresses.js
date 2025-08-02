import logger from '../../utils/logger';
import { measureApiCall } from '../../utils/performanceMonitor';
import apiService from './apiService';

export const addressService = {

  async getAddresses() {
    return measureApiCall(
      async () => {
        try {
          logger.api('Fetching user addresses');
          
          const response = await apiService.get('/addresses');
          
          logger.api(`Retrieved ${response.length || 0} addresses`, {
            count: response.length || 0
          });
          return response;
        } catch (error) {
          logger.api('Failed to fetch addresses', {
            error: error.message,
            status: error.response?.status
          }, 'ERROR');

          if (error.response?.status === 401 || error.response?.status === 403) {
            logger.auth('Authentication error in address service', {
              status: error.response.status,
              action: 'fetch_addresses'
            }, 'ERROR');
          }
          
          throw error;
        }
      },
      'addresses-get'
    );
  },

  async createAddress(addressData) {
    return measureApiCall(
      async () => {
        try {
          logger.api('Creating new address', {
            hasData: !!addressData,
            fields: addressData ? Object.keys(addressData) : []
          });
          
          const response = await apiService.post('/addresses', addressData);
          
          logger.success('Address created successfully', {
            addressId: response.id || response._id
          });
          return response;
        } catch (error) {
          logger.api('Failed to create address', {
            error: error.message,
            status: error.response?.status,
            addressData: addressData ? Object.keys(addressData) : null
          }, 'ERROR');
          throw error;
        }
      },
      'addresses-create'
    );
  },

  async updateAddress(addressId, addressData) {
    return measureApiCall(
      async () => {
        try {
          logger.api('Updating address', {
            addressId,
            hasData: !!addressData,
            fields: addressData ? Object.keys(addressData) : []
          });
          
          const response = await apiService.put(`/addresses/${addressId}`, addressData);
          
          logger.success('Address updated successfully', {
            addressId
          });
          return response;
        } catch (error) {
          logger.api('Failed to update address', {
            error: error.message,
            status: error.response?.status,
            addressId
          }, 'ERROR');
          throw error;
        }
      },
      'addresses-update'
    );
  },

  async deleteAddress(addressId) {
    return measureApiCall(
      async () => {
        try {
          logger.api('Deleting address', { addressId });
          
          await apiService.delete(`/addresses/${addressId}`);
          
          logger.success('Address deleted successfully', {
            addressId
          });
        } catch (error) {
          logger.api('Failed to delete address', {
            error: error.message,
            status: error.response?.status,
            addressId
          }, 'ERROR');
          throw error;
        }
      },
      'addresses-delete'
    );
  }
};
