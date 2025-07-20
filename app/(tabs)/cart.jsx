import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../styles/theme';

const Cart = () => {
  const { newItems } = useLocalSearchParams();
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    if (newItems) {
      try {
        const parsedItems = JSON.parse(newItems);
        setCartItems(prev => [...prev, ...parsedItems]);
      } catch (error) {
        console.error('Error parsing new items:', error);
      }
    }
  }, [newItems]);

  const renderCartItem = ({ item, index }) => (
    <View style={styles.cartItem}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.material}</Text>
        <Text style={styles.itemDetails}>{item.quantity} {item.unit}</Text>
      </View>
      <MaterialCommunityIcons name="recycle" size={24} color={colors.primary} />
    </View>
  );

  if (cartItems.length === 0) {
    return (
      <View style={styles.container}>
        <MaterialCommunityIcons name="cart-outline" size={64} color={colors.base300} />
        <Text style={styles.title}>Your Cart is Empty</Text>
        <Text style={styles.subtitle}>Add items using voice recording or browse our catalog</Text>
      </View>
    );
  }

  return (
    <View style={styles.filledContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cart ({cartItems.length} items)</Text>
      </View>
      <FlatList
        data={cartItems}
        renderItem={renderCartItem}
        keyExtractor={(item, index) => `${item.material}-${index}`}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.base100,
    paddingHorizontal: spacing.xl,
  },
  filledContainer: {
    flex: 1,
    backgroundColor: colors.base100,
  },
  title: {
    ...typography.title,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
    color: colors.neutral,
  },
  subtitle: {
    ...typography.subtitle,
    color: colors.neutral,
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.base200,
  },
  headerTitle: {
    ...typography.title,
    fontSize: 22,
    fontWeight: '700',
    color: colors.black,
  },
  listContainer: {
    paddingVertical: spacing.md,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: 12,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...typography.subtitle,
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
    marginBottom: spacing.xs,
  },
  itemDetails: {
    ...typography.caption,
    color: colors.neutral,
    textTransform: 'uppercase',
  },
});

export default Cart;