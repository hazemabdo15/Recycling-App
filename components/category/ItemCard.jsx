import { StyleSheet, Text, View } from "react-native";
import { itemCardStyles } from "../../styles/components/categoryStyles";
import { colors } from "../../styles/theme";
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
  const unitDisplay = getUnitDisplay(item.measurement_unit);
  // Only show stock-related logic for buyers
  const showStockLogic = isBuyer(user);
  const outOfStock = showStockLogic
    ? isOutOfStock({ quantity: item.quantity })
    : false;
  const maxReached = showStockLogic ? isMaxStockReached(item, quantity) : false;

  return (
    <AnimatedListItem
      index={index}
      style={{
        ...itemCardStyles.itemCard,
      }}
    >
      {/* Diagonal Out of Stock Banner Overlay */}
      {outOfStock && (
        <View style={styles.cornerBannerWrapper} pointerEvents="none">
          <View style={styles.cornerBanner}>
            <Text style={styles.cornerBannerText}>OUT OF STOCK</Text>
          </View>
        </View>
      )}
      {/* Show badge with stock quantity only if in stock, hide if out of stock */}
      {showStockLogic && !outOfStock && (
        <View style={styles.stockRightBadge}>
          <Text style={styles.stockRightText}>
            {typeof item.quantity === "number"
              ? `Stock: ${item.quantity} ${unitDisplay}`
              : "Stock: N/A"}
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
        maxQuantity={showStockLogic ? item.quantity : undefined}
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

const styles = StyleSheet.create({
  cornerBannerWrapper: {
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
  cornerBanner: {
    width: 260,
    height: 40,
    backgroundColor: 'rgba(239,68,68,0.92)', // red-500
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '45deg' }],
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
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
  stockRightBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: colors.base200 || "#F3F4F6",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    zIndex: 12,
    minWidth: 60,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  stockRightText: {
    color: colors.primary || "#0E9F6E",
    fontWeight: "600",
    fontSize: 12,
    letterSpacing: 0.2,
  },
  outOfStockBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: colors.error,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    zIndex: 12,
    minWidth: 60,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  outOfStockText: {
    color: colors.white,
    fontWeight: "bold",
    fontSize: 12,
    letterSpacing: 0.5,
  },
});

export default ItemCard;
