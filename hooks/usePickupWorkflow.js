import { useCallback, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { addressService } from '../services/api/addresses';
import { orderService } from '../services/api/orders';
import { validateQuantity } from '../utils/cartUtils';

export const usePickupWorkflow = () => {
  const { user } = useAuth();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fetchingAddresses, setFetchingAddresses] = useState(false);

  const [currentPhase, setCurrentPhase] = useState(1);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [orderData, setOrderData] = useState(null);

  const nextPhase = useCallback(() => {
    setCurrentPhase(prev => Math.min(prev + 1, 3));
  }, []);

  const previousPhase = useCallback(() => {
    setCurrentPhase(prev => Math.max(prev - 1, 1));
  }, []);

  const reset = useCallback(() => {
    setCurrentPhase(1);
    setSelectedAddress(null);
    setOrderData(null);
    setError(null);
  }, []);

  const fetchAddresses = useCallback(async () => {
    console.log('[Pickup Workflow] fetchAddresses called, user role:', user?.role);
    
    // Buyers now can fetch and see their saved addresses

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

      const addressList = Array.isArray(addressData) ? addressData : (addressData.data?.data || addressData.data || []);
      setAddresses(addressList);
      
      console.log(`[Pickup Workflow] Fetched ${addressList.length} addresses`);
    } catch (err) {
      console.error('[Pickup Workflow] Failed to fetch addresses:', err.message);
      
      // Handle authentication errors specifically
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Authentication required. Please log in again.');
        console.error('[Pickup Workflow] Authentication error - user may need to re-login');
      } else {
        setError(`Failed to load addresses: ${err.message}`);
      }
      
      setAddresses([]);
    } finally {
      setLoading(false);
      setFetchingAddresses(false);
    }
  }, [fetchingAddresses, user?.role]);

  const createAddress = useCallback(async (addressData) => {
    setLoading(true);
    setError(null);
    try {
      console.log('[Pickup Workflow] Creating new address');
      const newAddress = await addressService.createAddress(addressData);

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

  const updateAddress = useCallback(async (addressId, addressData) => {
    setLoading(true);
    setError(null);
    try {
      console.log('[Pickup Workflow] Updating address:', addressId);
      const updatedAddress = await addressService.updateAddress(addressId, addressData);

      setAddresses(prev => prev.map(addr => 
        addr._id === addressId ? updatedAddress : addr
      ));

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

  const deleteAddress = useCallback(async (addressId) => {
    setLoading(true);
    setError(null);
    try {
      console.log('[Pickup Workflow] Deleting address:', addressId);
      await addressService.deleteAddress(addressId);

      setAddresses(prev => prev.filter(addr => addr._id !== addressId));

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
      console.log(`[Pickup Workflow] Processing ${cartItems.length} items from cart`);

      const orderData = {
        address: {
          userId: user._id || user.userId, // Add userId to match backend schema
          city: selectedAddress.city || '',
          area: selectedAddress.area || '',
          street: selectedAddress.street || '',
          building: selectedAddress.building || '',
          floor: selectedAddress.floor || '',
          apartment: selectedAddress.apartment || '',
          landmark: selectedAddress.landmark || '',
          notes: selectedAddress.notes || '', // Add notes field to match backend schema
          isDefault: false
        },
        items: cartItems.map((item, index) => {
          const mappedItem = {
            _id: item._id, // Item ID (individual item identifier)
            categoryId: item.categoryId, // Use original categoryId (should be parent category ID from API)
            image: item.image,
            name: item.name || item.itemName || 'Unknown Item', // Backend expects 'name' field
            categoryName: item.categoryName || 'Unknown Category', // Add categoryName field
            measurement_unit: Number(item.measurement_unit),
            points: Number(item.points) || 10,
            price: Number(item.price) || 5.0,
            quantity: Number(item.quantity)
          };
          
          console.log(`[Pickup Workflow] Processing item ${index + 1}: ${mappedItem.name} (${mappedItem.categoryName})`);
          
          return mappedItem;
        }),
        phoneNumber: userData.phoneNumber || userData.phone || '',
        userName: userData.name || userData.userName || '',
        imageUrl: userData.imageUrl || userData.avatar || '',
        email: userData.email || ''
      };

      validateOrderData(orderData);

      console.log('[Pickup Workflow] Complete order data being sent to backend:', JSON.stringify(orderData, null, 2));

      const response = await orderService.createOrder(orderData);

      const order = response.data?.data || response.data || response;
      setOrderData(order);
      
      console.log('[Pickup Workflow] Order created successfully:', order._id);

      // Move to success phase first
      setCurrentPhase(3);

      // Skip cart clearing since the order was created successfully
      // The cart will be automatically synced when the user navigates back to cart page
      console.log('[Pickup Workflow] Order completed successfully. Cart clearing skipped to avoid backend conflicts.');
      
      return order;
    } catch (err) {
      // Suppress console errors for known "Category not found" backend validation issue
      // This error is expected and handled by the enhanced order verification system
      if (err.message && err.message.includes('Category with ID') && err.message.includes('not found')) {
        console.log('[Pickup Workflow] Known category validation error detected - error handled by enhanced verification system');
      } else {
        console.error('[Pickup Workflow] Failed to create order:', err.message);
      }
      setError(`Failed to create order: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [selectedAddress, user]);

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

    orderData.items.forEach((item, index) => {
      const requiredItemFields = ['_id', 'categoryId', 'image', 'name', 'categoryName', 'measurement_unit', 'points', 'price', 'quantity'];
      const missingItemFields = requiredItemFields.filter(field => 
        item[field] === undefined || item[field] === null
      );
      
      if (missingItemFields.length > 0) {
        throw new Error(`Item ${index + 1} missing required fields: ${missingItemFields.join(', ')}`);
      }

      validateQuantity({
        quantity: Number(item.quantity),
        measurement_unit: Number(item.measurement_unit)
      });
    });
  };

  return useMemo(() => ({
    addresses,
    loading,
    error,
    currentPhase,
    selectedAddress,
    orderData,

    nextPhase,
    previousPhase,
    reset,
    fetchAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    createOrder,
    setSelectedAddress,

    setError,
    setCurrentPhase,
    setOrderData
  }), [
    addresses,
    loading,
    error,
    currentPhase,
    selectedAddress,
    orderData,
    nextPhase,
    previousPhase,
    reset,
    fetchAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    createOrder,
    setSelectedAddress,
    setError,
    setCurrentPhase,
    setOrderData
  ]);
};
