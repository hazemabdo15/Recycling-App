import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { Dimensions, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { quantityControlsStyles } from '../../styles/components/categoryStyles';
import { colors } from '../../styles/theme';
import { showGlobalToast } from '../common/GlobalToast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = (size) => (SCREEN_WIDTH / 375) * size;

const QuantityControls = ({
    quantity,
    unitDisplay,
    measurementUnit,
    onIncrease,
    onDecrease,
    onFastIncrease,
    onFastDecrease,
    disableDecrease = false,
    maxReached = false,
    outOfStock = false,
    onQuantityInput, // new prop for direct input
    maxQuantity, // stock quantity for validation
}) => {
    const [inputValue, setInputValue] = React.useState(quantity?.toString() || '');
    const inputRef = useRef(null);
    const lastValidValue = useRef(quantity?.toString() || '');
    
    React.useEffect(() => {
        // Always sync input and last valid value to prop, including zero
        setInputValue((quantity === 0 ? '0' : quantity?.toString()) || '');
        // Only update lastValidValue if the prop matches the input (cart update succeeded)
        lastValidValue.current = (quantity === 0 ? '0' : quantity?.toString()) || '';
    }, [quantity]);

    // Only update local state on change, validate on end editing
    const handleInputChange = (val) => {
        setInputValue(val);
    };

    const handleEndEditing = (e) => {
        const val = e.nativeEvent.text;
        
        // Allow zero for removal
        if (val === '' || val === '0' || val === 0) {
            if (onQuantityInput) onQuantityInput(0);
            showGlobalToast('Item removed from cart', 2000, 'info');
            return;
        }
        
        if (measurementUnit === 1) { // kg
            let num = parseFloat(val);
            if (isNaN(num) || num < 0.25) {
                showGlobalToast('Please enter a valid quantity (minimum 0.25 kg)', 2000, 'error');
                // Instant reversion - no setTimeout delay
                setInputValue(lastValidValue.current);
                return;
            }
            
            // Smart rounding logic
            const originalNum = num;
            num = Math.floor(num / 0.25) * 0.25;
            const diff = num + 0.25 - parseFloat(val);
            if (diff <= 0.125) num += 0.25;
            num = Math.round(num * 100) / 100;
            
            // Stock validation
            if (typeof maxQuantity === 'number' && num > maxQuantity) {
                showGlobalToast(`Not enough stock. Only ${maxQuantity} kg available.`, 2000, 'error');
                // Instant reversion - no setTimeout delay
                setInputValue(lastValidValue.current);
                return;
            }
            
            if (onQuantityInput) onQuantityInput(num);
            
            // Show ONE consolidated message based on what happened
            if (Math.abs(originalNum - num) > 0.01) {
                // Show rounding + success in one message
                showGlobalToast(`Rounded to ${num} kg and added to cart`, 2500, 'success');
            } else {
                // Show simple success message
                showGlobalToast(`Added ${num} kg to the cart`, 2000, 'success');
            }
            
        } else { // pieces
            let num = parseFloat(val);
            if (isNaN(num) || num < 1) {
                showGlobalToast('Please enter a valid quantity (minimum 1 piece)', 2000, 'error');
                // Instant reversion - no setTimeout delay
                setInputValue(lastValidValue.current);
                return;
            }
            
            // Smart rounding for pieces (always whole numbers)
            const originalNum = num;
            num = Math.round(num);
            
            // Stock validation
            if (typeof maxQuantity === 'number' && num > maxQuantity) {
                showGlobalToast(`Not enough stock. Only ${maxQuantity} pieces available.`, 2000, 'error');
                // Instant reversion - no setTimeout delay
                setInputValue(lastValidValue.current);
                return;
            }
            
            if (onQuantityInput) onQuantityInput(num);
            
            // Show ONE consolidated message based on what happened
            if (Math.abs(originalNum - num) > 0.01) {
                // Show rounding + success in one message
                showGlobalToast(`Rounded to ${num} pieces and added to cart`, 2500, 'success');
            } else {
                // Show simple success message
                showGlobalToast(`Added ${num} pieces to the cart`, 2000, 'success');
            }
        }
    };

    // maxQuantity is passed from ItemCard as item.quantity
    return (
        <View style={[
            quantityControlsStyles.quantityControlsContainer,
            {
                borderRadius: scale(24),
                padding: scale(8),
                marginTop: scale(4),
            },
        ]}>
            <TouchableOpacity
                style={[
                    quantityControlsStyles.fastButton,
                    quantityControlsStyles.fastButtonDecrease,
                    { width: scale(44), height: scale(44), borderRadius: scale(18) },
                    disableDecrease && { opacity: 0.5 },
                ]}
                onPress={disableDecrease ? undefined : onFastDecrease}
                disabled={disableDecrease}
            >
                <View style={quantityControlsStyles.fastButtonContent}>
                    <MaterialCommunityIcons
                        name="minus"
                        size={scale(16)}
                        color={colors.white}
                    />
                    <Text style={[
                        quantityControlsStyles.fastButtonText,
                        { color: colors.white, fontSize: scale(11), marginTop: scale(-1) },
                    ]}>5</Text>
                </View>
            </TouchableOpacity>
            <View style={[
                quantityControlsStyles.mainControls,
                {
                    borderRadius: scale(14),
                    paddingHorizontal: scale(8),
                    paddingVertical: scale(4),
                    marginHorizontal: scale(5),
                },
            ]}>
                <TouchableOpacity
                    style={[
                        quantityControlsStyles.quantityButton,
                        { width: scale(32), height: scale(32), borderRadius: scale(16) },
                        disableDecrease && { opacity: 0.5 },
                    ]}
                    onPress={disableDecrease ? undefined : onDecrease}
                    disabled={disableDecrease}
                >
                    <MaterialCommunityIcons
                        name="minus"
                        size={scale(18)}
                        color={colors.white}
                    />
                </TouchableOpacity>
                <View
                    style={[
                        quantityControlsStyles.quantityDisplay,
                        { minWidth: scale(90), paddingHorizontal: scale(0), borderWidth: 1, borderColor: colors.primary, borderRadius: scale(10), backgroundColor: colors.white, elevation: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
                    ]}
                >
                    <TextInput
                        ref={inputRef}
                        style={[
                            quantityControlsStyles.quantityText,
                            { fontSize: scale(16), lineHeight: scale(20), color: colors.primary, fontWeight: 'bold', letterSpacing: 0.5, flex: 1, textAlign: 'center', paddingVertical: 0, paddingHorizontal: 0, backgroundColor: 'transparent' },
                        ]}
                        value={inputValue}
                        onChangeText={handleInputChange}
                        onEndEditing={handleEndEditing}
                        keyboardType={measurementUnit === 1 ? 'decimal-pad' : 'number-pad'}
                        editable={!maxReached && !outOfStock}
                        returnKeyType="done"
                        selectTextOnFocus
                    />
                    <Text style={[
                        quantityControlsStyles.unitText,
                        { fontSize: scale(11), marginTop: scale(-2), color: colors.primary, marginLeft: 2 },
                    ]}>
                        {unitDisplay}
                    </Text>
                </View>
                <TouchableOpacity
                    style={[
                        quantityControlsStyles.quantityButton,
                        { width: scale(32), height: scale(32), borderRadius: scale(16) },
                        (maxReached || outOfStock) && { opacity: 0.5 },
                    ]}
                    onPress={maxReached || outOfStock ? undefined : onIncrease}
                    disabled={maxReached || outOfStock}
                >
                    <MaterialCommunityIcons
                        name="plus"
                        size={scale(18)}
                        color={colors.white}
                    />
                </TouchableOpacity>
            </View>
            <TouchableOpacity
                style={[
                    quantityControlsStyles.fastButton,
                    quantityControlsStyles.fastButtonIncrease,
                    { width: scale(44), height: scale(44), borderRadius: scale(18) },
                    (maxReached || outOfStock) && { opacity: 0.5 },
                ]}
                onPress={maxReached || outOfStock ? undefined : onFastIncrease}
                disabled={maxReached || outOfStock}
            >
                <View style={quantityControlsStyles.fastButtonContent}>
                    <MaterialCommunityIcons
                        name="plus"
                        size={scale(16)}
                        color={colors.white}
                    />
                    <Text style={[
                        quantityControlsStyles.fastButtonText,
                        { color: colors.white, fontSize: scale(11), marginTop: scale(-1) },
                    ]}>5</Text>
                </View>
            </TouchableOpacity>
        </View>
    );
};

export default QuantityControls;