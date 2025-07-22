import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
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
    disabled = false,
    pendingAction = null
}) => {

    const displayQuantity = formatQuantityDisplay(quantity, measurementUnit);
    
    return (
        <View style={quantityControlsStyles.quantityControlsContainer}>
            {}
            <TouchableOpacity
                style={[
                    quantityControlsStyles.fastButton,
                    quantityControlsStyles.fastButtonDecrease,
                    (quantity === 0 || disabled) && quantityControlsStyles.fastButtonDisabled
                ]}
                onPress={onFastDecrease}
                disabled={quantity === 0 || disabled || pendingAction === 'fastDecrease'}
            >
                {pendingAction === 'fastDecrease' ? (
                    <ActivityIndicator size={18} color={colors.white} />
                ) : (
                    <View style={quantityControlsStyles.fastButtonContent}>
                        <MaterialCommunityIcons
                            name="minus"
                            size={16}
                            color={quantity === 0 || disabled ? colors.base400 : colors.white}
                        />
                        <Text style={[
                            quantityControlsStyles.fastButtonText,
                            { color: quantity === 0 || disabled ? colors.base400 : colors.white }
                        ]}>5</Text>
                    </View>
                )}
            </TouchableOpacity>

            {}
            <View style={quantityControlsStyles.mainControls}>
                {}
                <TouchableOpacity
                    style={[
                        quantityControlsStyles.quantityButton,
                        (quantity === 0 || disabled) && quantityControlsStyles.quantityButtonDisabled
                    ]}
                    onPress={onDecrease}
                    disabled={quantity === 0 || disabled || (pendingAction === 'decrease')}
                >
                    {pendingAction === 'decrease' ? (
                        <ActivityIndicator size={18} color={colors.white} />
                    ) : (
                        <MaterialCommunityIcons
                            name="minus"
                            size={18}
                            color={quantity === 0 || disabled ? colors.base300 : colors.white}
                        />
                    )}
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
                    style={[
                        quantityControlsStyles.quantityButton,
                        disabled && quantityControlsStyles.quantityButtonDisabled
                    ]}
                    onPress={onIncrease}
                    disabled={disabled || (pendingAction === 'increase')}
                >
                    {pendingAction === 'increase' ? (
                        <ActivityIndicator size={18} color={colors.white} />
                    ) : (
                        <MaterialCommunityIcons
                            name="plus"
                            size={18}
                            color={disabled ? colors.base300 : colors.white}
                        />
                    )}
                </TouchableOpacity>
            </View>

            {}
            <TouchableOpacity
                style={[
                    quantityControlsStyles.fastButton,
                    quantityControlsStyles.fastButtonIncrease,
                    disabled && quantityControlsStyles.fastButtonDisabled
                ]}
                onPress={onFastIncrease}
                disabled={disabled || pendingAction === 'fastIncrease'}
            >
                {pendingAction === 'fastIncrease' ? (
                    <ActivityIndicator size={18} color={colors.white} />
                ) : (
                    <View style={quantityControlsStyles.fastButtonContent}>
                        <MaterialCommunityIcons
                            name="plus"
                            size={16}
                            color={disabled ? colors.base400 : colors.white}
                        />
                        <Text style={[
                            quantityControlsStyles.fastButtonText,
                            { color: disabled ? colors.base400 : colors.white }
                        ]}>5</Text>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
};

export default QuantityControls;