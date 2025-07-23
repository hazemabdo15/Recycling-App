import React, { useState, useEffect } from 'react';
import {
    Text,
    TouchableOpacity,
    View,
    ScrollView,
    Image,
    StyleSheet,
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
  const [cartItemsDisplay, setCartItemsDisplay] = useState([]);

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

  // Update cart display items when allItems or cartItems change
  useEffect(() => {
    if (itemsLoaded && cartItems && allItems.length > 0) {
      const displayItems = Object.entries(cartItems).map(([categoryId, quantity]) => {
        const realItem = allItems.find(item => item._id === categoryId || item.categoryId === categoryId);
        
        if (realItem) {
          return {
            categoryId,
            quantity,
            itemName: realItem.name,
            measurement_unit: realItem.measurement_unit,
            points: realItem.points || 10,
            price: realItem.price || 5.0,
            image: realItem.image,
            totalPoints: (realItem.points || 10) * quantity,
            totalPrice: (realItem.price || 5.0) * quantity
          };
        } else {
          return {
            categoryId,
            quantity,
            itemName: `Item ${categoryId}`,
            measurement_unit: 'KG',
            points: 10,
            price: 5.0,
            image: null,
            totalPoints: 10 * quantity,
            totalPrice: 5.0 * quantity
          };
        }
      });
      
      setCartItemsDisplay(displayItems);
    }
  }, [itemsLoaded, cartItems, allItems]);

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

  // Calculate totals
  const totalItems = cartItemsDisplay.reduce((sum, item) => sum + item.quantity, 0);
  const totalPoints = cartItemsDisplay.reduce((sum, item) => sum + item.totalPoints, 0);
  const totalPrice = cartItemsDisplay.reduce((sum, item) => sum + item.totalPrice, 0);

  const renderCartItem = (item, index) => (
    <View key={index} style={styles.itemCard}>
      <View style={styles.itemContent}>
        {item.image ? (
          <Image 
            source={{ uri: item.image }} 
            style={styles.itemImage}
            onError={() => console.log('Failed to load image:', item.image)}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>📦</Text>
          </View>
        )}
        
        <View style={styles.itemDetails}>
          <Text style={styles.itemName}>{item.itemName}</Text>
          <Text style={styles.itemUnit}>
            {item.quantity} {item.measurement_unit}
          </Text>
          <View style={styles.itemStats}>
            <Text style={styles.points}>{item.totalPoints} pts</Text>
            <Text style={styles.price}>{item.totalPrice.toFixed(2)} EGP</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Review Your Order</Text>
        <Text style={styles.subtitle}>
          {selectedAddress?.street ? `Delivery to ${selectedAddress.street}` : 'No address selected'}
        </Text>
      </View>

      {!itemsLoaded ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading items...</Text>
        </View>
      ) : (
        <>
          <View style={styles.itemsSection}>
            <Text style={styles.sectionTitle}>Items in your cart:</Text>
            {cartItemsDisplay.map((item, index) => renderCartItem(item, index))}
          </View>

          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>Order Summary:</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Items:</Text>
                <Text style={styles.summaryValue}>{totalItems}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Points:</Text>
                <Text style={[styles.summaryValue, styles.pointsText]}>{totalPoints}</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Price:</Text>
                <Text style={styles.totalValue}>{totalPrice.toFixed(2)} EGP</Text>
              </View>
            </View>
          </View>

          <View style={styles.actionsSection}>
            <TouchableOpacity 
              style={styles.confirmButton}
              onPress={handleConfirm}
              disabled={!itemsLoaded}
            >
              <Text style={styles.confirmButtonText}>
                Confirm Order
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => {
                console.log('[ReviewPhase] Back pressed');
                if (typeof onBack === 'function') {
                  onBack();
                }
              }}
            >
              <Text style={styles.backButtonText}>
                Back to Address
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  itemsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemContent: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 24,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 15,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  itemUnit: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  itemStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  points: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  price: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  summarySection: {
    padding: 20,
    paddingTop: 0,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  pointsText: {
    color: '#4CAF50',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
    marginTop: 8,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  actionsSection: {
    padding: 20,
    paddingTop: 0,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReviewPhase;
