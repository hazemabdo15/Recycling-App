import { StyleSheet, Text, View } from "react-native";
import { useLocalization } from "../../context/LocalizationContext";
import { useStock } from "../../context/StockContext";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { getItemCardStyles } from "../../styles/components/categoryStyles";
import { getUnitDisplay } from "../../utils/cartUtils";
import { isBuyer } from "../../utils/roleUtils";
import { isMaxStockReached, isOutOfStock } from "../../utils/stockUtils";
import { AnimatedListItem } from "../common";
import ItemImage from "./ItemImage";
import ItemInfo from "./ItemInfo";
import QuantityControls from "./QuantityControls";

const ItemCard = ({
  item,
  quantity,
  onIncrease,
  onDecrease,
  onFastIncrease,
  onFastDecrease,
  onManualInput,
  disabled = false,
  pendingAction = null,
  index = 0,
  user = null,
}) => {
  const { t, isRTL } = useLocalization();
  const { colors, isDarkMode } = useThemedStyles();
  const { getStockQuantity, stockSocketConnected } = useStock();
  const itemCardStyles = getItemCardStyles(isDarkMode);
  const styles = getItemCardComponentStyles(colors);
  const unitDisplay = getUnitDisplay(item.measurement_unit);
  
  // Get real-time stock quantity with proper precedence and fallback
  const realTimeStock = getStockQuantity(item._id, item.quantity);
  const displayStock = realTimeStock !== undefined ? realTimeStock : (item.quantity ?? 0);
  
  // Debug logging for stock updates
  console.log(`[ItemCard] ${item._id}: API=${item.quantity ?? 'undefined'}, RealTime=${getStockQuantity(item._id) ?? 'undefined'}, Fallback=${realTimeStock ?? 'undefined'}, Display=${displayStock}, Socket=${stockSocketConnected}`);
  
  // Debug RTL state
  console.log('ItemCard RTL state:', isRTL);
  
  // Use separate style objects for RTL and LTR
  const bannerWrapperStyle = isRTL ? styles.cornerBannerWrapperRTL_Custom : styles.cornerBannerWrapperLTR_Custom;
  const bannerStyle = isRTL ? styles.cornerBannerRTL_Custom : styles.cornerBannerLTR_Custom;
  
  // Debug the applied styles
  console.log('Banner wrapper style:', bannerWrapperStyle);
  console.log('Banner style:', bannerStyle);
  
  // Only show stock-related logic for buyers
  const showStockLogic = isBuyer(user);
  const outOfStock = showStockLogic
    ? isOutOfStock({ quantity: displayStock })
    : false;
  const maxReached = showStockLogic ? isMaxStockReached({ ...item, quantity: displayStock }, quantity) : false;

  return (
    <AnimatedListItem
      index={index}
      style={{
        ...itemCardStyles.itemCard,
      }}
    >
      {/* Debug: Log parent container styles */}
      {console.log('Parent container styles:', itemCardStyles.itemCard)}
      
      {/* Diagonal Out of Stock Banner Overlay */}
      {outOfStock && (
        <View style={bannerWrapperStyle} pointerEvents="none">
          <View style={bannerStyle}>
            <Text style={styles.cornerBannerText}>{t('categories.itemCard.outOfStock')}</Text>
          </View>
        </View>
      )}
      {/* Show badge with stock quantity only if in stock, hide if out of stock */}
      {showStockLogic && !outOfStock && (
        <View style={isRTL ? styles.stockBadgeRTL_Custom : styles.stockBadgeLTR_Custom}>
          <Text style={[styles.stockBadgeText, { color: colors.primary }]}>
            {typeof displayStock === "number"
              ? `${t('categories.itemCard.stock')}: ${displayStock} ${unitDisplay}`
              : `${t('categories.itemCard.stock')}: N/A`}
          </Text>
        </View>
      )}
      <View
        style={{
          ...itemCardStyles.itemContent,
        }}
      >
        <ItemImage imageUri={item.image} points={item.points} />
        <ItemInfo
          name={item.name}
          price={item.price}
          measurementUnit={item.measurement_unit}
          unitDisplay={unitDisplay}
        />
      </View>
      <QuantityControls
        quantity={quantity}
        unitDisplay={unitDisplay}
        measurementUnit={item.measurement_unit}
        onIncrease={onIncrease}
        onDecrease={onDecrease}
        onFastIncrease={onFastIncrease}
        onFastDecrease={onFastDecrease}
        onManualInput={onManualInput}
        onQuantityInput={(val) => onManualInput(val)}
        maxQuantity={showStockLogic ? displayStock : undefined}
        itemName={item.name}
        disabled={disabled}
        pendingAction={pendingAction}
        disableDecrease={quantity === 0}
        maxReached={showStockLogic ? maxReached : false}
        outOfStock={showStockLogic ? outOfStock : false}
      />
    </AnimatedListItem>
  );
};

// Dynamic styles function for ItemCard component
const getItemCardComponentStyles = (colors) => StyleSheet.create({
  // ==========================================
  // RTL STYLES - TWEAK THESE FOR RTL LAYOUT
  // ==========================================
  cornerBannerWrapperRTL_Custom: {
    position: 'absolute',
    top: 14,
    left: 200, // Change this value to adjust RTL position
    width: 260,
    height: 40,
    zIndex: 30,
    pointerEvents: 'none',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cornerBannerRTL_Custom: {
    width: 260,
    height: 40,
    backgroundColor: 'rgba(239,68,68,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '-45deg' }], // Change rotation angle here
    borderRadius: 10,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  stockBadgeRTL_Custom: {
    position: "absolute",
    top: 10,
    left: 250,
    backgroundColor: colors.itemCardBg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    zIndex: 12,
    minWidth: 60,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  
  // ==========================================
  // LTR STYLES 
  // ==========================================
  cornerBannerWrapperLTR_Custom: {
    position: 'absolute',
    top: 14,
    right: -80,
    width: 260,
    height: 40,
    zIndex: 30,
    pointerEvents: 'none',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cornerBannerLTR_Custom: {
    width: 260,
    height: 40,
    backgroundColor: 'rgba(239,68,68,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '45deg' }],
    borderRadius: 10,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  stockBadgeLTR_Custom: {
    position: "absolute",
    top: 10,
    right: 10, // Positioned on the right side for LTR
    backgroundColor: colors.itemCardBg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    zIndex: 12,
    minWidth: 60,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  
  // ==========================================
  // ORIGINAL STYLES (KEPT FOR REFERENCE)
  // ==========================================
  cornerBannerText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    opacity: 0.97,
    textAlign: 'center',
    width: 280,
    alignSelf: 'left',
  },
  stockBadgeText: {
    fontWeight: "600",
    fontSize: 12,
    letterSpacing: 0.2,
  },
});

export default ItemCard;
