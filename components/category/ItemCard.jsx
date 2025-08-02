import { Dimensions, View } from 'react-native';
import { itemCardStyles } from '../../styles/components/categoryStyles';
import { getUnitDisplay } from '../../utils/cartUtils';
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
    disabled = false,
    pendingAction = null,
    index = 0
}) => {
    const unitDisplay = getUnitDisplay(item.measurement_unit);
    
    return (
        <AnimatedListItem
            index={index}
            style={{
                ...itemCardStyles.itemCard,
                padding: scale(16),
                borderRadius: scale(18),
                marginVertical: scale(8),
            }}
        >
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
                disabled={disabled}
                pendingAction={pendingAction}
                disableDecrease={quantity === 0}
            />
        </AnimatedListItem>
    );
};
export default ItemCard;