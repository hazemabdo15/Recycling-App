import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Dimensions, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { categoryHeaderStyles } from '../../styles/components/categoryStyles';
import { colors, spacing } from '../../styles/theme';
import { getLabel, isBuyer } from '../../utils/roleLabels';
import { scaleSize } from '../../utils/scale';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = (size) => (SCREEN_WIDTH / 375) * size;

const CategoryHeader = ({
    categoryName,
    totalItems,
    totalPoints,
    totalValue,
    animatedStyle,
    headerOpacity,
    onGoBack
}) => {
    const { user } = useAuth();
    return (
        <View
            style={[
                categoryHeaderStyles.header,
                animatedStyle,
                // Remove internal padding, only keep backgroundColor and other base styles
                { paddingHorizontal: 0, paddingLeft: 0, paddingRight: 0, padding: 0, paddingBottom: 0, marginBottom: scaleSize(spacing.md) },
            ]}
        >
            <View
                style={{
                    paddingHorizontal: scaleSize(spacing.sm),
                    width: '100%',
                }}
            >
                <View style={[
                    categoryHeaderStyles.headerContentRow,
                    { marginBottom: scale(20) },
                ]}>
                    <MaterialCommunityIcons
                        name="arrow-left"
                        size={scale(28)}
                        color={colors.primary}
                        style={{ marginRight: scale(8) }}
                        onPress={onGoBack}
                    />
                    <Text style={[
                        categoryHeaderStyles.title,
                        { fontSize: scale(32), marginBottom: scale(8), letterSpacing: scale(-0.5) },
                    ]}>{categoryName}</Text>
                </View>
                <View style={[
                    categoryHeaderStyles.headerStats,
                    { borderRadius: scale(18), padding: scale(16) },
                ]}>
                    <View style={categoryHeaderStyles.statItem}>
                        <MaterialCommunityIcons
                            name="package-variant"
                            size={scale(20)}
                            color={colors.primary}
                        />
                        <Text style={[
                            categoryHeaderStyles.statText,
                            { fontSize: scale(20), marginTop: scale(4), marginBottom: scale(2) },
                        ]}>{totalItems}</Text>
                        <Text style={[
                            categoryHeaderStyles.statLabel,
                            { fontSize: scale(12) },
                        ]}>Items</Text>
                    </View>
                    {!isBuyer(user) && (
                        <View style={categoryHeaderStyles.statItem}>
                            <MaterialCommunityIcons
                                name="star"
                                size={scale(20)}
                                color={colors.accent}
                            />
                            <Text style={[
                                categoryHeaderStyles.statText,
                                { fontSize: scale(20), marginTop: scale(4), marginBottom: scale(2) },
                            ]}>{totalPoints}</Text>
                            <Text style={[
                                categoryHeaderStyles.statLabel,
                                { fontSize: scale(12) },
                            ]}>Eco Points</Text>
                        </View>
                    )}
                    <View style={categoryHeaderStyles.statItem}>
                        <MaterialCommunityIcons
                            name="cash"
                            size={scale(20)}
                            color={colors.secondary}
                        />
                        <Text style={[
                            categoryHeaderStyles.statText,
                            { fontSize: scale(20), marginTop: scale(4), marginBottom: scale(2) },
                        ]}>{totalValue} EGP</Text>
                        <Text style={[
                            categoryHeaderStyles.statLabel,
                            { fontSize: scale(12) },
                        ]}>{getLabel("money", user?.role)}</Text>
                    </View>
                </View>
            </View>
        </View>
    );
}
export default CategoryHeader;