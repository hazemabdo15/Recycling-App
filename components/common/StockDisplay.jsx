import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { spacing } from '../../styles/theme';
import { getStockStatus } from '../../utils/cartStockValidation';
import { scaleSize } from '../../utils/scale';

/**
 * Real-time stock display component
 * Shows current stock status with visual indicators
 */
const StockDisplay = ({ 
  itemId, 
  stockQuantities, 
  measurementUnit = 1,
  style,
  showIcon = true,
  size = 'medium'
}) => {
  const { colors } = useThemedStyles();
  const styles = getStyles(colors, size);

  if (!itemId || !stockQuantities) {
    return null;
  }

  const stockStatus = getStockStatus(itemId, stockQuantities);
  const unit = measurementUnit === 1 ? 'kg' : 'pieces';

  const getIconName = () => {
    switch (stockStatus.status) {
      case 'out-of-stock':
        return 'package-variant-closed';
      case 'low-stock':
        return 'package-variant';
      default:
        return 'package-variant-closed-check';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: stockStatus.color + '20' }, style]}>
      {showIcon && (
        <MaterialCommunityIcons 
          name={getIconName()} 
          size={styles.iconSize} 
          color={stockStatus.color} 
        />
      )}
      <Text style={[styles.text, { color: stockStatus.color }]}>
        {stockStatus.quantity} {unit}
      </Text>
      {stockStatus.status === 'out-of-stock' && (
        <Text style={[styles.statusText, { color: stockStatus.color }]}>
          Out of Stock
        </Text>
      )}
      {stockStatus.status === 'low-stock' && (
        <Text style={[styles.statusText, { color: stockStatus.color }]}>
          Low Stock
        </Text>
      )}
    </View>
  );
};

const getStyles = (colors, size) => {
  const fontSize = size === 'small' ? 10 : size === 'large' ? 14 : 12;
  const iconSize = size === 'small' ? 12 : size === 'large' ? 18 : 15;
  const padding = size === 'small' ? spacing.xs : size === 'large' ? spacing.sm : spacing.xs;

  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: scaleSize(padding),
      paddingVertical: scaleSize(padding / 2),
      borderRadius: scaleSize(8),
      alignSelf: 'flex-start',
    },
    text: {
      fontSize: scaleSize(fontSize),
      fontWeight: '600',
      marginLeft: scaleSize(spacing.xs / 2),
    },
    statusText: {
      fontSize: scaleSize(fontSize - 1),
      fontWeight: '500',
      marginLeft: scaleSize(spacing.xs),
    },
    iconSize: scaleSize(iconSize),
  });
};

export default StockDisplay;
