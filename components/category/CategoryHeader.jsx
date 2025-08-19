import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Dimensions, Text, View, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useLocalization } from '../../context/LocalizationContext';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { borderRadius, shadows, spacing } from '../../styles/theme';
import { isBuyer } from '../../utils/roleUtils';
import { scaleSize } from '../../utils/scale';
import { t } from 'i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = (size) => (SCREEN_WIDTH / 375) * size;

const getStyles = (colors) => StyleSheet.create({
    header: {
        padding: spacing.lg,
        paddingBottom: spacing.sm,
        backgroundColor: colors.background,
    },
    headerContentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: spacing.sm,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 18,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    headerStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        ...shadows.small,
        elevation: 4,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
        marginTop: spacing.xs,
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '500',
    },
});

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
    const { tRole } = useLocalization();
    const { colors } = useThemedStyles();
    const styles = getStyles(colors);
    
    return (
        <View
            style={[
                styles.header,
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
                    styles.headerContentRow,
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
                        styles.title,
                        { fontSize: scale(32), marginBottom: scale(8), letterSpacing: scale(-0.5) },
                    ]}>{categoryName}</Text>
                </View>
                <View style={[
                    styles.headerStats,
                    { borderRadius: scale(18), padding: scale(16) },
                ]}> 
                    <View style={styles.statItem}>
                        <MaterialCommunityIcons
                            name="package-variant"
                            size={scale(20)}
                            color={colors.primary}
                        />
                        <Text style={[
                            styles.statText,
                            { fontSize: scale(20), marginTop: scale(4), marginBottom: scale(2) },
                        ]}>{totalItems}</Text>
                        <Text style={[
                            styles.statLabel,
                            { fontSize: scale(12) },
                        ]}>Items</Text>
                    </View>
                    {!isBuyer(user) && (
                        <View style={styles.statItem}>
                            <MaterialCommunityIcons
                                name="star"
                                size={scale(20)}
                                color={colors.accent}
                            />
                            <Text style={[
                                styles.statText,
                                { fontSize: scale(20), marginTop: scale(4), marginBottom: scale(2) },
                            ]}>{totalPoints}</Text>
                            <Text style={[
                                styles.statLabel,
                                { fontSize: scale(12) },
                            ]}>{t("common.points")}</Text>
                        </View>
                    )}
                    <View style={styles.statItem}>
                        <MaterialCommunityIcons
                            name="cash"
                            size={scale(20)}
                            color={colors.secondary}
                        />
                        <Text style={[
                            styles.statText,
                            { fontSize: scale(20), marginTop: scale(4), marginBottom: scale(2) },
                        ]}>{totalValue} EGP</Text>
                        <Text style={[
                            styles.statLabel,
                            { fontSize: scale(12) },
                        ]}>{tRole("money", user?.role)}</Text>
                    </View>
                </View>
            </View>
        </View>
    );
}
export default CategoryHeader;