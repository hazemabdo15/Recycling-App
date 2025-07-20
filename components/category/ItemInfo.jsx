import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { itemInfoStyles } from '../../styles/components/categoryStyles';
import { colors } from '../../styles/theme';
import { getMeasurementIcon } from '../../utils/cartUtils';
const ItemInfo = ({ name, price, measurementUnit, unitDisplay }) => {
    return (
        <View style={itemInfoStyles.itemInfo}>
            <Text style={itemInfoStyles.itemName} numberOfLines={2}>{name}</Text>
            <View style={itemInfoStyles.itemDetails}>
                <View style={itemInfoStyles.priceContainer}>
                    <MaterialCommunityIcons
                        name="cash"
                        size={16}
                        color={colors.secondary}
                    />
                    <Text style={itemInfoStyles.itemPrice}>{price} EGP</Text>
                </View>
                <View style={itemInfoStyles.unitContainer}>
                    <MaterialCommunityIcons
                        name={getMeasurementIcon(measurementUnit)}
                        size={16}
                        color={colors.neutral}
                    />
                    <Text style={itemInfoStyles.itemUnit}>per {unitDisplay}</Text>
                </View>
            </View>
        </View>
    );
};
export default ItemInfo;