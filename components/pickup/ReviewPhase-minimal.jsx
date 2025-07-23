import React, { useState, useEffect } from 'react';
import {
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { categoriesAPI } from '../../services/api';

const ReviewPhase = ({ selectedAddress, cartItems, onConfirm, onBack, loading }) => {
  console.log('[ReviewPhase] MINIMAL component starting');
  console.log('[ReviewPhase] Received props:', {
    selectedAddress: !!selectedAddress,
    cartItems: cartItems,
    cartItemsType: typeof cartItems,
    cartItemsKeys: cartItems ? Object.keys(cartItems) : [],
    onConfirm: typeof onConfirm,
    onBack: typeof onBack,
    loading: typeof loading
  });

  const [allItems, setAllItems] = useState([]);
  const [itemsLoaded, setItemsLoaded] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        console.log('[ReviewPhase] Fetching all items...');
        const response = await categoriesAPI.getAllItems();
        const items = response.items || response;
        setAllItems(Array.isArray(items) ? items : []);
        setItemsLoaded(true);
        console.log('[ReviewPhase] Items loaded:', items.length);
      } catch (error) {
        console.error('[ReviewPhase] Failed to fetch items:', error);
        setItemsLoaded(true); // Set to true even on error to avoid infinite loading
      }
    };
    
    fetchItems();
  }, []);

  const handleConfirm = () => {
    console.log('[ReviewPhase] MINIMAL confirm pressed');
    console.log('[ReviewPhase] Processing cart items:', cartItems);
    console.log('[ReviewPhase] Available items for lookup:', allItems.length);
    
    // Convert cart object to array format expected by createOrder
    // cartItems is likely in format: { categoryId: quantity, ... }
    // We need to convert it to array of item objects
    if (cartItems && typeof cartItems === 'object') {
      // Convert using real item data
      const cartItemsArray = Object.entries(cartItems).map(([categoryId, quantity]) => {
        // Find the real item data
        const realItem = allItems.find(item => item._id === categoryId || item.categoryId === categoryId);
        
        if (realItem) {
          console.log('[ReviewPhase] Found real item for', categoryId, ':', realItem.name);
          return {
            categoryId: categoryId,
            quantity: quantity,
            itemName: realItem.name,
            measurement_unit: realItem.measurement_unit === 'KG' ? 1 : 2, // Convert string to number format expected by backend
            points: realItem.points || 10,
            price: realItem.price || 5.0,
            image: realItem.image || `${realItem.name.toLowerCase().replace(/\s+/g, '-')}.png`
          };
        } else {
          console.log('[ReviewPhase] No real item found for', categoryId, ', using fallback with proper image');
          return {
            categoryId: categoryId,
            quantity: quantity,
            itemName: `Item ${categoryId}`,
            measurement_unit: 1, // Default to KG (1)
            points: 10,
            price: 5.0,
            image: `item-${categoryId.slice(-4)}.png` // Generate a valid image filename
          };
        }
      });
      
      const userData = {
        phoneNumber: '123456789',
        name: 'Test User',
        email: 'test@example.com',
        imageUrl: 'https://via.placeholder.com/150/0000FF/808080?text=TestUser' // Add required imageUrl field
      };
      
      console.log('[ReviewPhase] Calling onConfirm with:', {
        cartItemsArray,
        userData
      });
      
      if (typeof onConfirm === 'function') {
        onConfirm(cartItemsArray, userData);
      }
    } else {
      console.error('[ReviewPhase] Invalid cartItems format:', cartItems);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: '#f5f5f5' }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>
        Review Phase - Minimal Test Version
      </Text>
      <Text style={{ marginBottom: 10 }}>
        Address: {selectedAddress?.street || 'No address'}
      </Text>
      <Text style={{ marginBottom: 10 }}>
        Cart Items: {Object.keys(cartItems || {}).length}
      </Text>
      <Text style={{ marginBottom: 10 }}>
        Items Loaded: {itemsLoaded ? `${allItems.length} items` : 'Loading...'}
      </Text>
      <Text style={{ marginBottom: 20 }}>
        Loading: {loading ? 'Yes' : 'No'}
      </Text>
      
      <TouchableOpacity 
        style={{ 
          backgroundColor: itemsLoaded ? '#007AFF' : '#cccccc', 
          padding: 15, 
          borderRadius: 8, 
          alignItems: 'center',
          marginBottom: 10
        }}
        onPress={handleConfirm}
        disabled={!itemsLoaded}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>
          {itemsLoaded ? 'Minimal Confirm' : 'Loading Items...'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={{ 
          backgroundColor: '#FF3B30', 
          padding: 15, 
          borderRadius: 8, 
          alignItems: 'center' 
        }}
        onPress={() => {
          console.log('[ReviewPhase] MINIMAL back pressed');
          if (typeof onBack === 'function') {
            onBack();
          }
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>
          Minimal Back
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default ReviewPhase;
