import { StyleSheet } from 'react-native';
import { borderRadius, colors, shadows, spacing } from '../theme';

// Category Header Styles
export const categoryHeaderStyles = StyleSheet.create({
    header: {
        padding: spacing.lg,
        paddingBottom: spacing.sm,
        backgroundColor: colors.base100,
    },
    headerContent: {
        marginBottom: spacing.lg,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: colors.black,
        marginBottom: spacing.sm,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 18,
        color: colors.neutral,
        fontWeight: '500',
    },
    headerStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: colors.white,
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
        color: colors.black,
        marginTop: spacing.xs,
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 12,
        color: colors.neutral,
        fontWeight: '500',
    },
});

// Item Card Styles
export const itemCardStyles = StyleSheet.create({
    itemCard: {
        backgroundColor: colors.white,
        marginVertical: spacing.sm,
        borderRadius: borderRadius.md,
        overflow: 'hidden',
        ...shadows.large,
        elevation: 8,
        padding: spacing.md,
    },
    itemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
});

// Item Image Styles
export const itemImageStyles = StyleSheet.create({
    itemImageContainer: {
        width: 80,
        height: 80,
        borderRadius: borderRadius.sm,
        overflow: 'hidden',
        marginRight: spacing.md,
        position: 'relative',
    },
    itemImage: {
        width: '100%',
        height: '100%',
        backgroundColor: colors.base300,
    },
    placeholderImage: {
        width: '100%',
        height: '100%',
        backgroundColor: colors.base100,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.base300,
        borderStyle: 'dashed',
    },
    pointsBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
        minWidth: 36,
        justifyContent: 'center',
    },
    pointsText: {
        color: colors.white,
        fontSize: 10,
        fontWeight: 'bold',
        marginLeft: 2,
    },
});

// Item Info Styles
export const itemInfoStyles = StyleSheet.create({
    itemInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    itemName: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.black,
        marginBottom: spacing.sm,
        lineHeight: 24,
    },
    itemDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.base100,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: spacing.sm,
        flex: 1,
        marginRight: spacing.sm,
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.secondary,
        marginLeft: spacing.xs,
    },
    unitContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.base100,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: spacing.sm,
        flex: 1,
    },
    itemUnit: {
        fontSize: 12,
        color: colors.neutral,
        marginLeft: spacing.xs,
        fontWeight: '500',
    },
});

// Quantity Controls Styles
export const quantityControlsStyles = StyleSheet.create({
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.base100,
        borderRadius: borderRadius.sm,
        padding: spacing.xs,
    },
    quantityButton: {
        backgroundColor: colors.primary,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.small,
        elevation: 3,
    },
    quantityButtonDisabled: {
        backgroundColor: colors.base300,
        ...shadows.small,
        elevation: 1,
    },
    quantityDisplay: {
        minWidth: 80,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.md,
    },
    quantityText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.black,
    },
});

// Empty State Styles
export const emptyStateStyles = StyleSheet.create({
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingTop: 60,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.black,
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
    },
    emptySubtitle: {
        fontSize: 16,
        color: colors.neutral,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 30,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.sm,
        borderRadius: 25,
        ...shadows.small,
        elevation: 4,
    },
    addButtonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '600',
        marginLeft: spacing.sm,
    },
});
