import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';
import { quantityControlsStyles } from '../../styles/components/categoryStyles';
import { colors } from '../../styles/theme';
const QuantityControls = ({ 
    quantity, 
    unitDisplay, 
    onIncrease, 
    onDecrease, 
    disabled = false 
}) => {
    return (
        <View style={quantityControlsStyles.quantityControls}>
            <TouchableOpacity 
                style={[
                    quantityControlsStyles.quantityButton, 
                    (quantity === 0 || disabled) && quantityControlsStyles.quantityButtonDisabled
                ]}
                onPress={onDecrease}
                disabled={quantity === 0 || disabled}
            >
                <MaterialCommunityIcons 
                    name="minus" 
                    size={20} 
                    color={quantity === 0 || disabled ? colors.base300 : colors.white} 
                />
            </TouchableOpacity>
            <View style={quantityControlsStyles.quantityDisplay}>
                <Text style={quantityControlsStyles.quantityText}>
                    {quantity} {unitDisplay}
                </Text>
            </View>
            <TouchableOpacity 
                style={[quantityControlsStyles.quantityButton, disabled && quantityControlsStyles.quantityButtonDisabled]}
                onPress={onIncrease}
                disabled={disabled}
            >
                <MaterialCommunityIcons 
                    name="plus" 
                    size={20} 
                    color={disabled ? colors.base300 : colors.white} 
                />
            </TouchableOpacity>
        </View>
    );
};
export default QuantityControls;

