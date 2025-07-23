import { useCallback, useState } from 'react';
import { addressService } from '../services/api/addresses';
import { orderService } from '../services/api/orders';
import { validateQuantity } from '../utils/cartUtils';
import { useCart } from './useCart';

export const usePickupWorkflow = () => {
  // Get cart clearing function
  const { handleClearCart } = useCart();
  
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

  // Create new address
  const createAddress = useCallback(async (addressData) => {
    setLoading(true);
    setError(null);
    try {
      console.log('[Pickup Workflow] Creating new address');
      const newAddress = await addressService.createAddress(addressData);
      
      // Add new address to the list
      setAddresses(prev => [...prev, newAddress]);
      console.log('[Pickup Workflow] Address created successfully');
      
      return newAddress;
    } catch (err) {
      console.error('[Pickup Workflow] Failed to create address:', err.message);
      setError(`Failed to create address: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update existing address
  const updateAddress = useCallback(async (addressId, addressData) => {
    setLoading(true);
    setError(null);
    try {
      console.log('[Pickup Workflow] Updating address:', addressId);
      const updatedAddress = await addressService.updateAddress(addressId, addressData);
      
      // Update address in the list
      setAddresses(prev => prev.map(addr => 
        addr._id === addressId ? updatedAddress : addr
      ));
      
      // Update selected address if it was the one being updated
      if (selectedAddress && selectedAddress._id === addressId) {
        setSelectedAddress(updatedAddress);
      }
      
      console.log('[Pickup Workflow] Address updated successfully');
      return updatedAddress;
    } catch (err) {
      console.error('[Pickup Workflow] Failed to update address:', err.message);
      setError(`Failed to update address: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [selectedAddress]);

  // Delete address
  const deleteAddress = useCallback(async (addressId) => {
    setLoading(true);
    setError(null);
    try {
      console.log('[Pickup Workflow] Deleting address:', addressId);
      await addressService.deleteAddress(addressId);
      
      // Remove address from the list
      setAddresses(prev => prev.filter(addr => addr._id !== addressId));
      
      // Clear selected address if it was deleted
      if (selectedAddress && selectedAddress._id === addressId) {
        setSelectedAddress(null);
      }
      
      console.log('[Pickup Workflow] Address deleted successfully');
    } catch (err) {
      console.error('[Pickup Workflow] Failed to delete address:', err.message);
      setError(`Failed to delete address: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [selectedAddress]);

  // Create pickup order
  const createOrder = useCallback(async (cartItems, userData) => {
    if (!selectedAddress) {
      throw new Error('Please select an address first');
    }

    if (!cartItems || cartItems.length === 0) {
      throw new Error('Your cart is empty');
    }

    setLoading(true);
    setError(null);
    try {
      console.log('[Pickup Workflow] Creating pickup order');
      
      // Prepare order data according to backend specification
      const orderData = {
        address: {
          city: selectedAddress.city || '',
          area: selectedAddress.area || '',
          street: selectedAddress.street || '',
          building: selectedAddress.building || '',
          floor: selectedAddress.floor || '',
          apartment: selectedAddress.apartment || '',
          landmark: selectedAddress.landmark || '',
          isDefault: false
        },
        items: cartItems.map(item => ({
          categoryId: item.categoryId,
          image: item.image,
          itemName: item.itemName || item.name,
          measurement_unit: Number(item.measurement_unit), // Ensure it's a number
          points: Number(item.points) || 10,
          price: Number(item.price) || 5.0,
          quantity: Number(item.quantity) // Ensure it's a number
        })),
        phoneNumber: userData.phoneNumber || userData.phone || '',
        userName: userData.name || userData.userName || '',
        imageUrl: userData.imageUrl || userData.avatar || '',
        email: userData.email || ''
      };

      // Validate order data before sending
      validateOrderData(orderData);

      const response = await orderService.createOrder(orderData);
      
      // Handle both direct order response and wrapped response
      const order = response.data || response;
      setOrderData(order);
      
      console.log('[Pickup Workflow] Order created successfully:', order._id);
      
      // Clear the cart after successful order creation
      try {
        handleClearCart();
        console.log('[Pickup Workflow] Cart cleared after successful order creation');
      } catch (cartError) {
        console.warn('[Pickup Workflow] Failed to clear cart:', cartError.message);
        // Don't throw here - order was successful, cart clearing is secondary
      }
      
      // Move to confirmation phase
      setCurrentPhase(3);
      
      return order;
    } catch (err) {
      console.error('[Pickup Workflow] Failed to create order:', err.message);
      setError(`Failed to create order: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [selectedAddress, handleClearCart]);

  // Validate order data
  const validateOrderData = (orderData) => {
    const requiredFields = ['address', 'items', 'phoneNumber', 'userName', 'email'];
    const missingFields = requiredFields.filter(field => 
      !orderData[field] || (Array.isArray(orderData[field]) && orderData[field].length === 0)
    );
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required information: ${missingFields.join(', ')}`);
    }

    if (!orderData.address.city) {
      throw new Error('Address must include at least city');
    }

    // Validate each item
    orderData.items.forEach((item, index) => {
      console.log(`[Pickup Workflow] Validating item ${index + 1}:`, {
        categoryId: item.categoryId,
        quantity: item.quantity,
        quantityType: typeof item.quantity,
        measurement_unit: item.measurement_unit,
        measurement_unit_type: typeof item.measurement_unit,
        itemName: item.itemName
      });
      
      const requiredItemFields = ['categoryId', 'image', 'itemName', 'measurement_unit', 'points', 'price', 'quantity'];
      const missingItemFields = requiredItemFields.filter(field => 
        item[field] === undefined || item[field] === null
      );
      
      if (missingItemFields.length > 0) {
        throw new Error(`Item ${index + 1} missing required fields: ${missingItemFields.join(', ')}`);
      }

      // Validate each item using centralized validation
      validateQuantity({
        quantity: Number(item.quantity),
        measurement_unit: Number(item.measurement_unit)
      });
    });
  };

  return {
    // State
    addresses,
    loading,
    error,
    currentPhase,
    selectedAddress,
    orderData,
    
    // Actions
    nextPhase,
    previousPhase,
    reset,
    fetchAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    createOrder,
    setSelectedAddress,
    
    // Setters for manual state management if needed
    setError,
    setCurrentPhase
  };
};
