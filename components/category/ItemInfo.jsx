import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from 'i18next';
import { Dimensions, Text, View } from 'react-native';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { getItemInfoStyles } from '../../styles/components/categoryStyles';
import { getMeasurementIcon } from '../../utils/cartUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = (size) => (SCREEN_WIDTH / 375) * size;

const ItemInfo = ({ name, price, measurementUnit, unitDisplay }) => {
    const { colors, isDarkMode } = useThemedStyles();
    const itemInfoStyles = getItemInfoStyles(isDarkMode);
    
    return (
        <View style={itemInfoStyles.itemInfo}>
            <Text style={[itemInfoStyles.itemName, { fontSize: scale(20), marginBottom: scale(8), lineHeight: scale(24) }]} numberOfLines={2}>{name}</Text>
            <View style={itemInfoStyles.itemDetails}>
                <View style={[itemInfoStyles.priceContainer, { paddingHorizontal: scale(8), paddingVertical: scale(4), borderRadius: scale(8), marginRight: scale(8) }]}> 
                    <MaterialCommunityIcons
                        name="cash"
                        size={scale(16)}
                        color={colors.secondary}
                    />
                    <Text style={[itemInfoStyles.itemPrice, { fontSize: scale(16), marginLeft: scale(4) }]}>{price} {t("units.egp")}</Text>
                </View>
                <View style={[itemInfoStyles.unitContainer, { paddingHorizontal: scale(8), paddingVertical: scale(4), borderRadius: scale(8) }]}> 
                    <MaterialCommunityIcons
                        name={getMeasurementIcon(measurementUnit)}
                        size={scale(16)}
                        color={colors.neutral}
                    />
                    <Text style={[itemInfoStyles.itemUnit, { fontSize: scale(12), marginLeft: scale(4) }]}>{t("units.per")} {unitDisplay}</Text>
                </View>
            </View>
        </View>
    );
};
export default ItemInfo;