import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Dimensions, Text, TouchableOpacity, View } from 'react-native';
import { quantityControlsStyles } from '../../styles/components/categoryStyles';
import { colors } from '../../styles/theme';
import { formatQuantityDisplay } from '../../utils/cartUtils';

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
    disableDecrease = false
}) => {
    const displayQuantity = formatQuantityDisplay(quantity, measurementUnit);
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
                    marginHorizontal: scale(8),
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
                <View style={[
                    quantityControlsStyles.quantityDisplay,
                    { minWidth: scale(60), paddingHorizontal: scale(16) },
                ]}>
                    <Text style={[
                        quantityControlsStyles.quantityText,
                        { fontSize: scale(16), lineHeight: scale(20) },
                    ]}>
                        {displayQuantity}
                    </Text>
                    <Text style={[
                        quantityControlsStyles.unitText,
                        { fontSize: scale(11), marginTop: scale(-2) },
                    ]}>
                        {unitDisplay}
                    </Text>
                </View>
                <TouchableOpacity
                    style={[
                        quantityControlsStyles.quantityButton,
                        { width: scale(32), height: scale(32), borderRadius: scale(16) },
                    ]}
                    onPress={onIncrease}
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
                ]}
                onPress={onFastIncrease}
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