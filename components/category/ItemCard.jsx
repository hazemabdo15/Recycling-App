import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { itemCardStyles } from '../../styles/components/categoryStyles';
import { colors } from '../../styles/theme';
import { getUnitDisplay } from '../../utils/cartUtils';
import { isMaxStockReached, isOutOfStock } from '../../utils/stockUtils';
import { AnimatedListItem } from '../common';
import ItemImage from './ItemImage';
import ItemInfo from './ItemInfo';
import QuantityControls from './QuantityControls';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = (size) => (SCREEN_WIDTH / 375) * size;

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
    index = 0
}) => {
    const unitDisplay = getUnitDisplay(item.measurement_unit);
    // Always use item.quantity (stock from API) for outOfStock badge, not cartQuantity
    const outOfStock = isOutOfStock({ quantity: item.quantity });
    const maxReached = isMaxStockReached(item, quantity);
    
    return (
        <AnimatedListItem
            index={index}
            style={{
                ...itemCardStyles.itemCard,
                padding: scale(16),
                borderRadius: scale(18),
                marginVertical: scale(8),
                opacity: outOfStock ? 0.6 : 1,
            }}
        >
            {outOfStock && (
                <View style={styles.outOfStockBadge}>
                    <Text style={styles.outOfStockText}>Out of Stock</Text>
                </View>
            )}
            <View style={{
                ...itemCardStyles.itemContent,
                marginBottom: scale(16),
            }}>
                <ItemImage
                    imageUri={item.image}
                    points={item.points}
                    containerStyle={{ width: scale(80), height: scale(80), borderRadius: scale(12), marginRight: scale(16) }}
                />
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
                maxQuantity={item.quantity}
                disabled={disabled}
                pendingAction={pendingAction}
                disableDecrease={quantity === 0}
                maxReached={maxReached}
                outOfStock={outOfStock}
            />
        </AnimatedListItem>
    );
};

const styles = StyleSheet.create({
    outOfStockBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: colors.error,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
        zIndex: 10,
    },
    outOfStockText: {
        color: colors.white,
        fontWeight: 'bold',
        fontSize: 12,
        letterSpacing: 0.5,
    },
});

export default ItemCard;