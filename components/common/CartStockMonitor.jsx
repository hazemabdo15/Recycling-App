import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useStock } from '../../context/StockContext';
import { scaleSize } from '../../utils/scale';
import { spacing } from '../../styles/theme';
import { validateCartStock } from '../../utils/cartStockValidation';

/**
 * Cart Stock Monitor
 * Displays real-time stock status for all items in the cart
 * Shows warnings for low stock or out of stock items
 */
const CartStockMonitor = ({ 
  cartItems, 
  cartItemDetails, 
  style,
  showTitle = true,
  maxHeight = 150 
}) => {
  const { colors } = useThemedStyles();
  const { stockQuantities } = useStock();
  const styles = getStyles(colors);

  // Validate cart stock and get detailed status
  const cartValidation = useMemo(() => {
    if (!cartItems || !stockQuantities || !cartItemDetails) {
      return { isValid: true, results: [] };
    }

    return validateCartStock(cartItems, stockQuantities, cartItemDetails);
  }, [cartItems, stockQuantities, cartItemDetails]);

  // Filter to show only problematic items
  const problemItems = useMemo(() => {
    return cartValidation.results?.filter(result => !result.isValid) || [];
  }, [cartValidation]);

  // If no problems, don't show the monitor
  if (problemItems.length === 0) {
    return null;
  }

  const getStatusIcon = (availableStock, requestedQuantity) => {
    if (availableStock === 0) {
      return { name: 'alert-circle', color: colors.error };
    } else if (availableStock < requestedQuantity) {
      return { name: 'alert', color: colors.warning };
    }
    return { name: 'check-circle', color: colors.success };
  };

  const getStatusMessage = (item) => {
    const { availableStock, requestedQuantity } = item;
    const unit = cartItemDetails[item.itemId]?.measurement_unit === 1 ? 'kg' : 'pieces';
    
    if (availableStock === 0) {
      return 'Out of stock';
    } else if (availableStock < requestedQuantity) {
      return `Only ${availableStock} ${unit} available`;
    }
    return 'Available';
  };

  return (
    <View style={[styles.container, style]}>
      {showTitle && (
        <View style={styles.header}>
          <MaterialCommunityIcons 
            name="package-variant-closed" 
            size={scaleSize(16)} 
            color={colors.warning} 
          />
          <Text style={styles.title}>Stock Alerts</Text>
        </View>
      )}
      
      <ScrollView 
        style={[styles.scrollContainer, { maxHeight }]}
        showsVerticalScrollIndicator={false}
      >
        {problemItems.map((item, index) => {
          const statusIcon = getStatusIcon(item.availableStock, item.requestedQuantity);
          const statusMessage = getStatusMessage(item);
          const unit = cartItemDetails[item.itemId]?.measurement_unit === 1 ? 'kg' : 'pieces';
          
          return (
            <View key={item.itemId || index} style={styles.itemContainer}>
              <View style={styles.itemHeader}>
                <MaterialCommunityIcons 
                  name={statusIcon.name} 
                  size={scaleSize(14)} 
                  color={statusIcon.color} 
                />
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.itemName}
                </Text>
              </View>
              
              <View style={styles.itemDetails}>
                <Text style={[styles.statusText, { color: statusIcon.color }]}>
                  {statusMessage}
                </Text>
                <Text style={styles.quantityText}>
                  Requested: {item.requestedQuantity} {unit}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
      
      {/* Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          {problemItems.length} item{problemItems.length > 1 ? 's' : ''} need{problemItems.length === 1 ? 's' : ''} attention
        </Text>
      </View>
    </View>
  );
};

const getStyles = (colors) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: scaleSize(12),
    padding: scaleSize(spacing.md),
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleSize(spacing.sm),
  },
  title: {
    fontSize: scaleSize(14),
    fontWeight: '600',
    color: colors.text,
    marginLeft: scaleSize(spacing.xs),
  },
  scrollContainer: {
    flexGrow: 0,
  },
  itemContainer: {
    paddingVertical: scaleSize(spacing.xs),
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '30',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleSize(spacing.xs / 2),
  },
  itemName: {
    fontSize: scaleSize(13),
    fontWeight: '500',
    color: colors.text,
    marginLeft: scaleSize(spacing.xs),
    flex: 1,
  },
  itemDetails: {
    paddingLeft: scaleSize(spacing.md),
  },
  statusText: {
    fontSize: scaleSize(12),
    fontWeight: '500',
    marginBottom: scaleSize(2),
  },
  quantityText: {
    fontSize: scaleSize(11),
    color: colors.textSecondary,
  },
  summary: {
    marginTop: scaleSize(spacing.sm),
    paddingTop: scaleSize(spacing.sm),
    borderTopWidth: 1,
    borderTopColor: colors.border + '30',
  },
  summaryText: {
    fontSize: scaleSize(12),
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default CartStockMonitor;
