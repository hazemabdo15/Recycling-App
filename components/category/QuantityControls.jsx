import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { quantityControlsStyles } from '../../styles/components/categoryStyles';
import { colors } from '../../styles/theme';
import { formatQuantityDisplay } from '../../utils/cartUtils';

let Animated, useAnimatedStyle, useSharedValue, withRepeat, withTiming;

try {
  const reanimated = require('react-native-reanimated');
  Animated = reanimated.default;
  useAnimatedStyle = reanimated.useAnimatedStyle;
  useSharedValue = reanimated.useSharedValue;
  withRepeat = reanimated.withRepeat;
  withTiming = reanimated.withTiming;
} catch (_error) {
  const { View: RNView } = require('react-native');
  Animated = { View: RNView };
  useAnimatedStyle = () => ({});
  useSharedValue = (value) => ({ value });
  withRepeat = (value) => value;
  withTiming = (value) => value;
}

const AnimatedSpinner = ({ isVisible, size = 18, color = colors.white }) => {
    const rotation = useSharedValue(0);

    useEffect(() => {
        if (isVisible) {
            rotation.value = withRepeat(
                withTiming(360, { duration: 1000 }),
                -1,
                false
            );
        } else {
            rotation.value = 0;
        }
    }, [isVisible, rotation]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }],
    }));

    if (!isVisible) return null;

    return (
        <Animated.View style={animatedStyle}>
            <MaterialCommunityIcons name="reload" size={size} color={color} />
        </Animated.View>
    );
};

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
                    <AnimatedSpinner isVisible={true} size={18} color={colors.white} />
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
                        <AnimatedSpinner isVisible={true} size={18} color={colors.white} />
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
                        <AnimatedSpinner isVisible={true} size={18} color={colors.white} />
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
                    <AnimatedSpinner isVisible={true} size={18} color={colors.white} />
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