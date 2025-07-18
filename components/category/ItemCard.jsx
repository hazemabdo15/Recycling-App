import { View } from 'react-native';
import { itemCardStyles } from '../../styles/components/categoryStyles';
import { getUnitDisplay } from '../../utils/cartUtils';
import ItemImage from './ItemImage';
import ItemInfo from './ItemInfo';
import QuantityControls from './QuantityControls';

const ItemCard = ({ 
    item, 
    quantity, 
    onIncrease, 
    onDecrease,
    disabled = false 
}) => {
    const unitDisplay = getUnitDisplay(item.measurement_unit);
    
    return (
        <View style={itemCardStyles.itemCard}>
            <View style={itemCardStyles.itemContent}>
                <ItemImage 
                    imageUri={item.image}
                    points={item.points}
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
                onIncrease={onIncrease}
                onDecrease={onDecrease}
                disabled={disabled}
            />
        </View>
    );
};

export default ItemCard;
