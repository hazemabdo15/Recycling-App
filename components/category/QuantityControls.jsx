import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { Dimensions, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { getQuantityControlsStyles } from '../../styles/components/categoryStyles';
import { showMaxStockMessage } from '../../utils/cartMessages';

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
    itemName = 'Item', // item name for toast messages
    disabled = false, // Add disabled prop
    pendingAction = null, // Add pendingAction prop
    componentKey = null, // Unique identifier to prevent state cross-contamination
}) => {
    const { colors, isDarkMode } = useThemedStyles();
    const quantityControlsStyles = getQuantityControlsStyles(isDarkMode);
    
    // Initialize with a unique reference to prevent cross-contamination
    const [inputValue, setInputValue] = React.useState(() => {
        const value = quantity?.toString() || '';
        return quantity === 0 ? '0' : value;
    });
    
    const inputRef = useRef(null);
    const lastValidValue = useRef(() => {
        const value = quantity?.toString() || '';
        return quantity === 0 ? '0' : value;
    });
    
    // Use a ref to track the previous quantity to prevent unnecessary updates
    const previousQuantity = useRef(quantity);
    
    React.useEffect(() => {
        // Only update if the quantity actually changed for THIS component
        if (previousQuantity.current !== quantity) {
            const newValue = quantity === 0 ? '0' : (quantity?.toString() || '');
            setInputValue(newValue);
            lastValidValue.current = newValue;
            previousQuantity.current = quantity;
            
            // Log for debugging (will be removed later)
            console.log(`[QuantityControls-${componentKey}] Quantity updated from ${previousQuantity.current} to ${quantity}`);
        }
    }, [quantity, componentKey]);

    // Only update local state on change, validate on end editing
    const handleInputChange = (val) => {
        setInputValue(val);
    };

    const handleEndEditing = (e) => {
        const val = e.nativeEvent.text;
        
        // Allow zero for removal
        if (val === '' || val === '0' || val === 0) {
            if (onQuantityInput) onQuantityInput(0);
            // Remove duplicate toast - parent will handle unified messaging
            return;
        }
        
        if (measurementUnit === 1) { // kg
            let num = parseFloat(val);
            if (isNaN(num) || num < 0.25) {
                // Remove duplicate toast - parent will handle unified messaging
                // Instant reversion - no setTimeout delay
                setInputValue(lastValidValue.current);
                return;
            }
            
            // Smart rounding logic
            num = Math.floor(num / 0.25) * 0.25;
            const diff = num + 0.25 - parseFloat(val);
            if (diff <= 0.125) num += 0.25;
            num = Math.round(num * 100) / 100;
            
            // Stock validation
            if (typeof maxQuantity === 'number' && num > maxQuantity) {
                // Show stock error message for buyers
                showMaxStockMessage(itemName, maxQuantity, measurementUnit);
                // Instant reversion - no setTimeout delay
                setInputValue(lastValidValue.current);
                return;
            }
            
            // Update input field to show rounded value immediately
            setInputValue(num.toString());
            lastValidValue.current = num.toString();
            
            if (onQuantityInput) onQuantityInput(num);
            // Remove duplicate toast - parent will handle unified messaging
            
                    
        } else { // pieces
            let num = parseFloat(val);
            if (isNaN(num) || num < 1) {
                // Remove duplicate toast - parent will handle unified messaging
                // Instant reversion - no setTimeout delay
                setInputValue(lastValidValue.current);
                return;
            }
            
            // Smart rounding for pieces
            num = Math.round(num);
            
            // Minimum quantity check after rounding
            if (num < 1) num = 1;
            
            // Stock validation
            if (typeof maxQuantity === 'number' && num > maxQuantity) {
                // Show stock error message for buyers
                showMaxStockMessage(itemName, maxQuantity, measurementUnit);
                // Instant reversion - no setTimeout delay
                setInputValue(lastValidValue.current);
                return;
            }
            
            // Update input field to show rounded value immediately
            setInputValue(num.toString());
            lastValidValue.current = num.toString();
            
            if (onQuantityInput) onQuantityInput(num);
            // Remove duplicate toast - parent will handle unified messaging
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
                    (disableDecrease || disabled) && { opacity: 0.5 },
                ]}
                onPress={(disableDecrease || disabled) ? undefined : onFastDecrease}
                disabled={disableDecrease || disabled}
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
                        (disableDecrease || disabled) && { opacity: 0.5 },
                    ]}
                    onPress={(disableDecrease || disabled) ? undefined : onDecrease}
                    disabled={disableDecrease || disabled}
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
                        editable={!outOfStock && !disabled}
                        returnKeyType="done"
                        selectTextOnFocus
                    />
                    <Text style={[
                        quantityControlsStyles.unitText,
                        { fontSize: scale(11), marginTop: scale(-2), color: colors.primary, marginLeft: 6, paddingRight: 8, paddingLeft: 4 },
                    ]}>
                        {unitDisplay}
                    </Text>
                </View>
                <TouchableOpacity
                    style={[
                        quantityControlsStyles.quantityButton,
                        { width: scale(32), height: scale(32), borderRadius: scale(16) },
                        (maxReached || outOfStock || disabled) && { opacity: 0.5 },
                    ]}
                    onPress={(maxReached || outOfStock || disabled) ? undefined : onIncrease}
                    disabled={maxReached || outOfStock || disabled}
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
                    (maxReached || outOfStock || disabled) && { opacity: 0.5 },
                ]}
                onPress={(maxReached || outOfStock || disabled) ? undefined : onFastIncrease}
                disabled={maxReached || outOfStock || disabled}
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

export default React.memo(QuantityControls, (prevProps, nextProps) => {
    // Prevent unnecessary re-renders by comparing only relevant props
    return (
        prevProps.quantity === nextProps.quantity &&
        prevProps.disabled === nextProps.disabled &&
        prevProps.pendingAction === nextProps.pendingAction &&
        prevProps.maxReached === nextProps.maxReached &&
        prevProps.outOfStock === nextProps.outOfStock &&
        prevProps.disableDecrease === nextProps.disableDecrease &&
        prevProps.componentKey === nextProps.componentKey &&
        prevProps.maxQuantity === nextProps.maxQuantity &&
        prevProps.measurementUnit === nextProps.measurementUnit &&
        prevProps.unitDisplay === nextProps.unitDisplay
    );
});