import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';
import { quantityControlsStyles } from '../../styles/components/categoryStyles';
import { colors } from '../../styles/theme';
import { formatQuantityDisplay } from '../../utils/cartUtils';

const QuantityControls = ({
    quantity,
    unitDisplay,
    measurementUnit,
    onIncrease,
    onDecrease,
    onFastIncrease,
    onFastDecrease,
    disableDecrease = false
}) => {

    const displayQuantity = formatQuantityDisplay(quantity, measurementUnit);
    
    return (
        <View style={quantityControlsStyles.quantityControlsContainer}>
            {}
            <TouchableOpacity
                style={[
                    quantityControlsStyles.fastButton,
                    quantityControlsStyles.fastButtonDecrease,
                    disableDecrease && { opacity: 0.5 }
                ]}
                onPress={disableDecrease ? undefined : onFastDecrease}
                disabled={disableDecrease}
            >
                <View style={quantityControlsStyles.fastButtonContent}>
                    <MaterialCommunityIcons
                        name="minus"
                        size={16}
                        color={colors.white}
                    />
                    <Text style={[
                        quantityControlsStyles.fastButtonText,
                        { color: colors.white }
                    ]}>5</Text>
                </View>
            </TouchableOpacity>

            {}
            <View style={quantityControlsStyles.mainControls}>
                {}
                <TouchableOpacity
                    style={[quantityControlsStyles.quantityButton, disableDecrease && { opacity: 0.5 }]}
                    onPress={disableDecrease ? undefined : onDecrease}
                    disabled={disableDecrease}
                >
                    <MaterialCommunityIcons
                        name="minus"
                        size={18}
                        color={colors.white}
                    />
                </TouchableOpacity>
                
                {}
                <View style={quantityControlsStyles.quantityDisplay}>
                    <Text style={quantityControlsStyles.quantityText}>
                        {displayQuantity}
                    </Text>
                    <Text style={quantityControlsStyles.unitText}>
                        {unitDisplay}
                    </Text>
                </View>
                
                {}
                <TouchableOpacity
                    style={quantityControlsStyles.quantityButton}
                    onPress={onIncrease}
                >
                    <MaterialCommunityIcons
                        name="plus"
                        size={18}
                        color={colors.white}
                    />
                </TouchableOpacity>
            </View>

            {}
            <TouchableOpacity
                style={[
                    quantityControlsStyles.fastButton,
                    quantityControlsStyles.fastButtonIncrease
                ]}
                onPress={onFastIncrease}
            >
                <View style={quantityControlsStyles.fastButtonContent}>
                    <MaterialCommunityIcons
                        name="plus"
                        size={16}
                        color={colors.white}
                    />
                    <Text style={[
                        quantityControlsStyles.fastButtonText,
                        { color: colors.white }
                    ]}>5</Text>
                </View>
            </TouchableOpacity>
        </View>
    );
};

export default QuantityControls;