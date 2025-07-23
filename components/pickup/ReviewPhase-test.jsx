import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useContext, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { AuthContext } from '../../context/AuthContext';
import { useAllItems } from '../../hooks/useAPI';
import { borderRadius, spacing, typography } from '../../styles';
import { colors } from '../../styles/theme';
import { normalizeItemData } from '../../utils/cartUtils';

const ReviewPhase = ({ selectedAddress, cartItems, onConfirm, onBack, loading, user: userProp, pickupWorkflow, ...otherProps }) => {
  console.log('[ReviewPhase] Test component starting with props:', {
    selectedAddress: !!selectedAddress,
    cartItems: !!cartItems,
    onConfirm: typeof onConfirm,
    onBack: typeof onBack,
    loading: typeof loading
  });

  // ALL HOOKS MUST BE CALLED FIRST (React rule)
  const authContext = useContext(AuthContext);
  const { items: allItems, loading: itemsLoading } = useAllItems();
  const [phoneNumber, setPhoneNumber] = useState('');

  // DEBUG: Add comprehensive error checking
  console.log('[ReviewPhase] Component start - props received:', {
    selectedAddress: !!selectedAddress,
    cartItems: !!cartItems,
    onConfirm: typeof onConfirm,
    onBack: typeof onBack,
    loading: typeof loading,
    userProp: !!userProp,
    pickupWorkflow: !!pickupWorkflow
  });

  // Safe user extraction using useMemo
  const user = useMemo(() => {
    try {
      if (authContext && typeof authContext === 'object') {
        return authContext.user || null;
      }
      return null;
    } catch (error) {
      console.warn('[ReviewPhase] AuthContext access failed:', error.message);
      return null;
    }
  }, [authContext]);

  // Update phone number when user data becomes available
  useEffect(() => {
    const phoneValue = user?.phoneNumber || user?.phone || user?.mobile || user?.number || '';
    if (phoneValue) {
      setPhoneNumber(phoneValue);
    }
    console.log('[ReviewPhase] Phone number updated:', phoneValue || 'none');
  }, [user, authContext]);

  // Safe items array
  const safeAllItems = useMemo(() => allItems || [], [allItems]);

  // Convert cart items to display format with safety checks
  const reviewItems = useMemo(() => {
    try {
      if (!cartItems || !Array.isArray(safeAllItems)) {
        console.warn('[ReviewPhase] Invalid data for processing items');
        return [];
      }

      const items = Object.entries(cartItems).map(([categoryId, quantity]) => {
        try {
          const itemDetails = safeAllItems.find((item) => item.categoryId === categoryId || item._id === categoryId) || {};
          
          const combinedItem = {
            ...itemDetails,
            categoryId: categoryId,
            name: itemDetails.name || itemDetails.material || 'Unknown Item',
            image: itemDetails.image,
            points: typeof itemDetails.points === 'number' ? itemDetails.points : 0,
            price: typeof itemDetails.price === 'number' ? itemDetails.price : 0,
            measurement_unit: itemDetails.measurement_unit,
            quantity: quantity,
          };

          const normalizedItem = normalizeItemData(combinedItem);
          return normalizedItem;
        } catch (error) {
          console.error(`[ReviewPhase] Error processing item ${categoryId}:`, error);
          return null;
        }
      }).filter(item => item && item.quantity > 0);

      return items;
    } catch (error) {
      console.error('[ReviewPhase] Error processing review items:', error);
      return [];
    }
  }, [cartItems, safeAllItems]);

  // Early safety check for props AFTER hooks
  if (!selectedAddress || !cartItems) {
    console.log('[ReviewPhase] Missing required props, rendering fallback');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: colors.error, textAlign: 'center' }}>
          Loading review data...
        </Text>
      </View>
    );
  }

  // Additional safety check for essential functions
  if (typeof onConfirm !== 'function' || typeof onBack !== 'function') {
    console.error('[ReviewPhase] Missing required callback functions');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: colors.error, textAlign: 'center' }}>
          Component configuration error
        </Text>
      </View>
    );
  }

  console.log('[ReviewPhase] Rendering test component to isolate $$typeof error');

  // SIMPLE TEST VERSION TO ISOLATE $$TYPEOF ERROR
  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: '#f5f5f5' }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>
        Review Phase - Test Version
      </Text>
      <Text style={{ marginBottom: 10 }}>
        Address: {selectedAddress?.street || 'No address'}
      </Text>
      <Text style={{ marginBottom: 10 }}>
        Cart Items: {Object.keys(cartItems || {}).length}
      </Text>
      <Text style={{ marginBottom: 20 }}>
        User: {user?.name || 'No user'}
      </Text>
      
      <TouchableOpacity 
        style={{ 
          backgroundColor: '#007AFF', 
          padding: 15, 
          borderRadius: 8, 
          alignItems: 'center',
          marginBottom: 10
        }}
        onPress={() => {
          console.log('[ReviewPhase] Test confirm pressed');
          if (typeof onConfirm === 'function') {
            onConfirm({ test: true });
          }
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>
          Test Confirm
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
          console.log('[ReviewPhase] Test back pressed');
          if (typeof onBack === 'function') {
            onBack();
          }
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>
          Test Back
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default ReviewPhase;
