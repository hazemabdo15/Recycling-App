import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStock } from '../context/StockContext';
import { addressService } from '../services/api/addresses';
import { CartStockValidator } from '../services/cartStockValidator';
import { unifiedOrderService } from '../services/unifiedOrderService';
import { isBuyer } from '../utils/roleUtils';
import { workflowStateUtils } from '../utils/workflowStateUtils';
import { useCart } from './useCart';

export const usePickupWorkflow = () => {
  const { user } = useAuth();
  const { cartItemDetails } = useCart(user);
  const { stockQuantities } = useStock();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fetchingAddresses, setFetchingAddresses] = useState(false);

  const [currentPhase, setCurrentPhase] = useState(1);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [orderData, setOrderData] = useState(null);

  // Restore workflow state on mount (for deep link returns)
  useEffect(() => {
    const restoreState = async () => {
      try {
        const savedState = await workflowStateUtils.restoreWorkflowState();
        if (savedState && savedState.selectedAddress) {
          console.log('🔄 [Pickup Workflow] Restoring workflow state:', savedState);
          setSelectedAddress(savedState.selectedAddress);
          setCurrentPhase(savedState.currentPhase || 1);
        }
      } catch (error) {
        console.error('❌ [Pickup Workflow] Failed to restore state:', error);
      }
    };

    restoreState();
  }, []);

  const nextPhase = useCallback(() => {
    setCurrentPhase(prev => Math.min(prev + 1, 3));
  }, []);

  const previousPhase = useCallback(() => {
    setCurrentPhase(prev => Math.max(prev - 1, 1));
  }, []);

  const reset = useCallback(async () => {
    setCurrentPhase(1);
    setSelectedAddress(null);
    setOrderData(null);
    setError(null);
    
    // Clear any saved workflow state
    await workflowStateUtils.clearWorkflowState();
    console.log('🔄 [Pickup Workflow] Workflow reset and state cleared');
  }, []);

  const fetchAddresses = useCallback(async () => {
    console.log('[Pickup Workflow] fetchAddresses called, user role:', user?.role);


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

  // Enhanced createOrder using unified service with proper data handling
  const createOrder = useCallback(async (orderOptions = {}) => {
    // Allow passing address in orderOptions to override selectedAddress from state
    const addressToUse = orderOptions.address || selectedAddress;
    
    console.log('Order creation attempt', { 
      hasSelectedAddress: !!selectedAddress,
      hasAddressToUse: !!addressToUse,
      selectedAddressId: selectedAddress?._id,
      addressToUseId: addressToUse?._id,
      hasUser: !!user,
      userId: user?._id,
      hasCartItemDetails: !!cartItemDetails,
      cartItemCount: Object.keys(cartItemDetails || {}).length,
      orderOptions
    });

    if (!addressToUse) {
      const errorMsg = 'Please select an address first';
      console.error('Order creation failed - no address:', errorMsg);
      throw new Error(errorMsg);
    }
    
    if (!user) {
      const errorMsg = 'User authentication required';
      console.error('Order creation failed - no user:', errorMsg);
      throw new Error(errorMsg);
    }

    if (!cartItemDetails || Object.keys(cartItemDetails).length === 0) {
      const errorMsg = 'Cart is empty - cannot create order';
      console.error('Order creation failed - empty cart:', errorMsg);
      throw new Error(errorMsg);
    }
    
    // Enhanced cart validation before proceeding with order creation (only for buyer users)
    if (isBuyer(user)) {
      const cartItems = {};
      Object.values(cartItemDetails).forEach(item => {
        cartItems[item._id] = item.quantity;
      });
      
      // Use the enhanced cart validator for better error handling
      const validationResult = await CartStockValidator.quickValidate(
        cartItems,
        stockQuantities,
        cartItemDetails
      );
      
      if (!validationResult.isValid) {
        console.error('Order creation failed - enhanced cart validation:', validationResult.issues);
        
        // Provide more detailed error message
        const errorMessage = validationResult.issues?.length > 0 
          ? `Cart validation failed: ${validationResult.issues.map(i => i.message).join(', ')}`
          : 'Some items in your cart are no longer available';
          
        throw new Error(errorMessage);
      }
    } else {
      console.log('🔄 [Pickup Workflow] Skipping stock validation for customer user');
    }
    
    // Save workflow state before potential payment redirect
    if (orderOptions.paymentMethod === 'credit-card') {
      console.log('💾 [Pickup Workflow] Saving state before payment redirect');
      await workflowStateUtils.saveWorkflowState({
        selectedAddress: addressToUse,
        currentPhase,
        cartItemDetails
      });
    }
    
    setLoading(true);
    setError(null);
    try {
      // Single call to unified service
      const order = await unifiedOrderService.createPickupOrder(
        addressToUse, 
        user, 
        cartItemDetails,
        orderOptions
      );
      
      // ✅ Ensure order data is properly stored
      console.log('Order created, storing data', { 
        orderId: order._id || order?.data?._id, 
        hasItems: !!(order.items || order?.data?.items),
        itemCount: (order.items || order?.data?.items)?.length
      });
      
      setOrderData(order);
      
      // Only set phase to confirmation if this is NOT a credit card payment
      // (for credit card payments, the phase will be set by the deep link handler)
      if (orderOptions.paymentMethod !== 'credit-card') {
        setCurrentPhase(3);
      }
      
      // Clear saved state after successful order creation
      await workflowStateUtils.clearWorkflowState();
      
      // ✅ Return the complete order for external handlers
      return order;
    } catch (error) {
      console.error('Order creation failed in workflow', { 
        error: error.message,
        hasSelectedAddress: !!selectedAddress,
        hasUser: !!user,
        hasCartItems: !!cartItemDetails
      });
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [selectedAddress, user, cartItemDetails, currentPhase, stockQuantities]);

  // Removed validateOrderData - validation is now handled in unifiedOrderService

  return useMemo(() => ({
    addresses,
    loading,
    error,
    currentPhase,
    selectedAddress,
    orderData,
    cartItemDetails,

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
    cartItemDetails,
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
