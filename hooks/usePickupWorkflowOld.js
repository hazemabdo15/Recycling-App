import { useCallback, useState } from 'react';
import { addressService } from '../services/api/addresses';
import { orderService } from '../services/api/orders';

export const usePickupWorkflow = () => {
  // API state
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fetchingAddresses, setFetchingAddresses] = useState(false);

  // Workflow state
  const [currentPhase, setCurrentPhase] = useState(1);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [orderData, setOrderData] = useState(null);

  // Phase navigation
  const nextPhase = useCallback(() => {
    setCurrentPhase(prev => Math.min(prev + 1, 3));
  }, []);

  const previousPhase = useCallback(() => {
    setCurrentPhase(prev => Math.max(prev - 1, 1));
  }, []);

  // Reset workflow
  const reset = useCallback(() => {
    setCurrentPhase(1);
    setSelectedAddress(null);
    setOrderData(null);
    setError(null);
  }, []);

  // Fetch user addresses using new service
  const fetchAddresses = useCallback(async () => {
    // Prevent multiple simultaneous fetches
    if (fetchingAddresses) {
      console.log('[Pickup Workflow] Already fetching addresses, skipping...');
      return;
    }
    
    setFetchingAddresses(true);
    setLoading(true);
    setError(null);
    try {
      console.log('[Pickup Workflow] Fetching user addresses');
      const addressData = await addressService.getAddresses();
      
      // Handle both array response and object response with data property
      const addressList = Array.isArray(addressData) ? addressData : (addressData.data || []);
      setAddresses(addressList);
      
      console.log(`[Pickup Workflow] Fetched ${addressList.length} addresses`);
    } catch (err) {
      console.error('[Pickup Workflow] Failed to fetch addresses:', err.message);
      setError(`Failed to load addresses: ${err.message}`);
      setAddresses([]);
    } finally {
      setLoading(false);
      setFetchingAddresses(false);
    }
  }, [fetchingAddresses]);
      console.log('Fetching addresses with token...');
      const response = await addressService.getAddresses(token);
      if (response.success && Array.isArray(response.data)) {
        setAddresses(response.data);
        console.log('Addresses fetched successfully:', response.data.length);
      } else {
        setAddresses([]);
        console.log('No addresses found or invalid response format');
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
      
      // Handle specific error cases
      if (err.message.includes('403')) {
        setError('Access denied. Your session may have expired. Please try logging in again.');
      } else if (err.message.includes('401')) {
        setError('Authentication required. Please log in again.');
      } else {
        setError(err.message);
      }
      
      setAddresses([]);
    } finally {
      setLoading(false);
      setFetchingAddresses(false);
    }
  }, [token, fetchingAddresses]);

  // Create new address
  const createAddress = useCallback(async (addressData) => {
    if (!token) throw new Error('Authentication required');

    setLoading(true);
    setError(null);
    try {
      console.log('Creating address:', addressData);
      const response = await addressService.createAddress(addressData, token);
      if (response.success) {
        console.log('Address created successfully:', response.data);
        
        // For mock tokens, add the address to local state since fetchAddresses won't get real data
        if (token.startsWith('mock.')) {
          setAddresses(prev => [...prev, response.data]);
        } else {
          // For real tokens, refresh from backend
          await fetchAddresses();
        }
        
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create address');
      }
    } catch (err) {
      console.error('Error creating address:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token, fetchAddresses]);

  // Update address
  const updateAddress = useCallback(async (addressId, addressData) => {
    if (!token) throw new Error('Authentication required');

    setLoading(true);
    setError(null);
    try {
      console.log('Updating address:', addressId, addressData);
      const response = await addressService.updateAddress(addressId, addressData, token);
      if (response.success) {
        console.log('Address updated successfully:', response.data);
        
        // For mock tokens, update the address in local state
        if (token.startsWith('mock.')) {
          setAddresses(prev => prev.map(addr => 
            addr._id === addressId ? response.data : addr
          ));
        } else {
          // For real tokens, refresh from backend
          await fetchAddresses();
        }
        
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update address');
      }
    } catch (err) {
      console.error('Error updating address:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token, fetchAddresses]);

  // Delete address
  const deleteAddress = useCallback(async (addressId) => {
    if (!token) throw new Error('Authentication required');

    setLoading(true);
    setError(null);
    try {
      console.log('Deleting address:', addressId);
      const response = await addressService.deleteAddress(addressId, token);
      if (response.success) {
        console.log('Address deleted successfully');
        
        // For mock tokens, remove the address from local state
        if (token.startsWith('mock.')) {
          setAddresses(prev => prev.filter(addr => addr._id !== addressId));
        } else {
          // For real tokens, refresh from backend
          await fetchAddresses();
        }
        
        return true;
      } else {
        throw new Error(response.message || 'Failed to delete address');
      }
    } catch (err) {
      console.error('Error deleting address:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token, fetchAddresses]);

  // Create pickup order
  const createPickupOrder = useCallback(async (orderData) => {
    if (!token) throw new Error('Authentication required');

    setLoading(true);
    setError(null);
    try {
      const response = await orderService.createOrder(orderData, token);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create order');
      }
    } catch (err) {
      console.error('Error creating order:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Create order and move to confirmation phase
  const createOrder = useCallback(async (cartItems) => {
    if (!selectedAddress) {
      throw new Error('Please select an address');
    }

    try {
      const orderPayload = {
        address: selectedAddress,
        items: cartItems,
        total: Object.values(cartItems || {}).reduce((sum, item) => 
          sum + (item.quantity * item.price), 0
        ),
      };

      const result = await createPickupOrder(orderPayload);
      setOrderData(result);
      nextPhase(); // Move to confirmation phase
      return result;
    } catch (err) {
      console.error('Error creating order:', err);
      throw err;
    }
  }, [selectedAddress, createPickupOrder, nextPhase]);

  return {
    // API state
    addresses,
    loading,
    error,
    
    // Workflow state
    currentPhase,
    selectedAddress,
    orderData,
    
    // Phase navigation
    nextPhase,
    previousPhase,
    reset,
    
    // Address management
    fetchAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    setSelectedAddress,
    
    // Order creation
    createOrder,
    createPickupOrder,
  };
};
