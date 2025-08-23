/**
 * Cart Validation Banner Component
 * 
 * Shows real-time cart validation status and issues
 * Can be placed at the top of checkout/cart screens to warn users
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useCartContext } from '../../context/CartContext';
import { useStock } from '../../context/StockContext';
import { useCartValidation } from '../../hooks/useCartValidation';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { isBuyer } from '../../utils/roleUtils';
import { scaleSize } from '../../utils/scale';

const CartValidationBanner = ({ 
  style,
  onFixPressed,
  showFixButton = true,
  autoHide = true 
}) => {
  const { user } = useAuth();
  const { colors } = useThemedStyles();
  const { cartItems, cartItemDetails } = useCartContext();
  const { stockQuantities } = useStock();
  const { quickValidateCart, validateCart } = useCartValidation({
    validateOnFocus: false,
    showMessages: false, // We'll handle messages in this component
    source: 'validationBanner'
  });

  const [validationResult, setValidationResult] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const styles = getStyles(colors);

  // Only show for buyer users
  const shouldShow = isBuyer(user) && !isLoading;

  // Validate cart when data changes
  useEffect(() => {
    const validateCartStatus = async () => {
      if (!shouldShow || !cartItems || Object.keys(cartItems).length === 0) {
        setValidationResult(null);
        setIsVisible(false);
        return;
      }

      try {
        const result = await quickValidateCart();
        setValidationResult(result);
        setIsVisible(!result.isValid && result.issues?.length > 0);
      } catch (error) {
        console.error('Cart validation error:', error);
        setValidationResult(null);
        setIsVisible(false);
      }
    };

    validateCartStatus();
  }, [cartItems, cartItemDetails, stockQuantities, shouldShow, quickValidateCart]);

  // Auto-hide after successful validation
  useEffect(() => {
    if (autoHide && validationResult?.isValid) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [validationResult?.isValid, autoHide]);

  const handleFixCart = async () => {
    if (!validationResult || validationResult.isValid) return;

    setIsLoading(true);
    try {
      const result = await validateCart({ forceValidation: true });
      if (result.success) {
        setIsVisible(false);
        if (onFixPressed) {
          onFixPressed(result);
        }
      }
    } catch (error) {
      console.error('Error fixing cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getIssuesSummary = () => {
    if (!validationResult?.issues) return '';

    const outOfStockCount = validationResult.issues.find(i => i.type === 'out-of-stock')?.count || 0;
    const insufficientStockCount = validationResult.issues.find(i => i.type === 'insufficient-stock')?.count || 0;

    if (outOfStockCount > 0 && insufficientStockCount > 0) {
      return `${outOfStockCount} out of stock, ${insufficientStockCount} low stock`;
    } else if (outOfStockCount > 0) {
      return `${outOfStockCount} item${outOfStockCount > 1 ? 's' : ''} out of stock`;
    } else if (insufficientStockCount > 0) {
      return `${insufficientStockCount} item${insufficientStockCount > 1 ? 's' : ''} low stock`;
    }

    return 'Cart has issues';
  };

  if (!shouldShow || !isVisible) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={scaleSize(20)}
          color={colors.warning}
          style={styles.icon}
        />
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>Cart Issues Detected</Text>
          <Text style={styles.subtitle}>{getIssuesSummary()}</Text>
        </View>

        {showFixButton && (
          <TouchableOpacity
            style={styles.fixButton}
            onPress={handleFixCart}
            disabled={isLoading}
          >
            <Text style={styles.fixButtonText}>
              {isLoading ? 'Fixing...' : 'Fix'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const getStyles = (colors) => StyleSheet.create({
  container: {
    backgroundColor: colors.warningBackground || '#FFF3CD',
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    borderRadius: scaleSize(8),
    marginHorizontal: scaleSize(16),
    marginVertical: scaleSize(8),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scaleSize(12),
  },
  icon: {
    marginRight: scaleSize(12),
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: scaleSize(14),
    fontWeight: '600',
    color: colors.warningText || '#856404',
    marginBottom: scaleSize(2),
  },
  subtitle: {
    fontSize: scaleSize(12),
    color: colors.warningText || '#856404',
    opacity: 0.8,
  },
  fixButton: {
    backgroundColor: colors.warning,
    paddingHorizontal: scaleSize(16),
    paddingVertical: scaleSize(8),
    borderRadius: scaleSize(6),
    marginLeft: scaleSize(8),
  },
  fixButtonText: {
    fontSize: scaleSize(12),
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default CartValidationBanner;
