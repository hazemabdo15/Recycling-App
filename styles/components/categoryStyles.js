import { StyleSheet } from 'react-native';
import { borderRadius, getColors, shadows, spacing } from '../theme';

// Dynamic style functions for category components
export const getCategoryHeaderStyles = (isDarkMode = false) => {
    const colors = getColors(isDarkMode);
    return StyleSheet.create({
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
};

export const getItemCardStyles = (isDarkMode = false) => {
    const colors = getColors(isDarkMode);
    return StyleSheet.create({
        itemCard: {
            backgroundColor: colors.surface,
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
};

export const getItemImageStyles = (isDarkMode = false) => {
    const colors = getColors(isDarkMode);
    return StyleSheet.create({
        itemImageContainer: {
            position: 'relative',
        },
        itemImage: {
            width: 80,
            height: 80,
            borderRadius: borderRadius.md,
            marginRight: spacing.md,
            backgroundColor: colors.base200,
        },
        placeholderImage: {
            width: 80,
            height: 80,
            borderRadius: borderRadius.md,
            marginRight: spacing.md,
            backgroundColor: colors.base200,
            justifyContent: 'center',
            alignItems: 'center',
        },
        pointsBadge: {
            position: 'absolute',
            top: -8,
            right: spacing.md - 8,
            backgroundColor: colors.primary,
            borderRadius: borderRadius.sm,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.xs,
            paddingVertical: 2,
            minWidth: 24,
        },
        pointsText: {
            color: colors.white,
            fontSize: 10,
            fontWeight: 'bold',
            marginLeft: 2,
        },
        noImagePlaceholder: {
            width: 80,
            height: 80,
            borderRadius: borderRadius.md,
            marginRight: spacing.md,
            backgroundColor: colors.base200,
            justifyContent: 'center',
            alignItems: 'center',
        },
        noImageText: {
            color: colors.textSecondary,
            fontSize: 12,
            textAlign: 'center',
            fontWeight: '500',
        },
    });
};

export const getItemInfoStyles = (isDarkMode = false) => {
    const colors = getColors(isDarkMode);
    return StyleSheet.create({
        itemInfo: {
            flex: 1,
            paddingRight: spacing.sm,
        },
        itemName: {
            fontSize: 18,
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: spacing.xs,
        },
        itemDetails: {
            flexDirection: 'row',
            alignItems: 'center',
            flexWrap: 'wrap',
        },
        priceContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.base200,
            borderRadius: borderRadius.sm,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
            marginRight: spacing.xs,
            marginBottom: spacing.xs,
        },
        unitContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.base200,
            borderRadius: borderRadius.sm,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
            marginBottom: spacing.xs,
        },
        itemDescription: {
            fontSize: 14,
            color: colors.textSecondary,
            marginBottom: spacing.xs,
            lineHeight: 20,
        },
        itemPriceWrapper: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: spacing.xs,
        },
        itemPriceLabel: {
            fontSize: 14,
            color: colors.textSecondary,
            marginRight: spacing.xs,
        },
        itemPrice: {
            fontSize: 16,
            fontWeight: 'bold',
            color: colors.primary,
        },
        itemUnit: {
            fontSize: 12,
            color: colors.textSecondary,
            fontWeight: '500',
        },
        stockStatus: {
            fontSize: 12,
            fontWeight: '500',
            paddingVertical: 2,
            paddingHorizontal: spacing.xs,
            borderRadius: borderRadius.sm,
            overflow: 'hidden',
        },
        inStock: {
            backgroundColor: colors.success + '20',
            color: colors.success,
        },
        lowStock: {
            backgroundColor: colors.warning + '20',
            color: colors.warning,
        },
        outOfStock: {
            backgroundColor: colors.error + '20',
            color: colors.error,
        },
    });
};

export const getQuantityControlsStyles = (isDarkMode = false) => {
    const colors = getColors(isDarkMode);
    return StyleSheet.create({
        quantityControlsContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: spacing.sm,
        },
        mainControls: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
        },
        quantityControls: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: spacing.sm,
        },
        quantitySection: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.base200,
            borderRadius: borderRadius.md,
            padding: spacing.xs,
        },
        quantityButton: {
            width: 32,
            height: 32,
            borderRadius: borderRadius.sm,
            backgroundColor: colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
        },
        quantityButtonDisabled: {
            backgroundColor: colors.base200,
        },
        quantityButtonText: {
            color: colors.white,
            fontSize: 18,
            fontWeight: 'bold',
        },
        quantityButtonTextDisabled: {
            color: colors.textSecondary,
        },
        quantityDisplay: {
            marginHorizontal: spacing.md,
            backgroundColor: colors.surface,
            borderRadius: borderRadius.md,
            minWidth: 80,
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            borderWidth: 1,
            borderColor: colors.primary,
        },
        quantityText: {
            fontSize: 16,
            fontWeight: 'bold',
            color: colors.text,
            textAlign: 'center',
        },
        unitText: {
            fontSize: 11,
            color: colors.textSecondary,
            fontWeight: '500',
            textAlign: 'center',
            marginTop: 2,
        },
        quantity: {
            marginHorizontal: spacing.md,
            fontSize: 16,
            fontWeight: 'bold',
            color: colors.text,
            minWidth: 30,
            textAlign: 'center',
        },
        fastButton: {
            backgroundColor: colors.primary,
            borderRadius: borderRadius.md,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.sm,
            marginHorizontal: spacing.xs,
            minWidth: 50,
            alignItems: 'center',
            justifyContent: 'center',
        },
        fastButtonDecrease: {
            backgroundColor: colors.error,
        },
        fastButtonIncrease: {
            backgroundColor: colors.success,
        },
        fastButtonContent: {
            alignItems: 'center',
            justifyContent: 'center',
        },
        fastButtonText: {
            color: colors.white,
            fontSize: 10,
            fontWeight: 'bold',
            textAlign: 'center',
            marginTop: 2,
        },
        addToCartButton: {
            backgroundColor: colors.primary,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            borderRadius: borderRadius.md,
            flexDirection: 'row',
            alignItems: 'center',
        },
        addToCartButtonDisabled: {
            backgroundColor: colors.base200,
        },
        addToCartText: {
            color: colors.white,
            fontSize: 14,
            fontWeight: 'bold',
            marginLeft: spacing.xs,
        },
        addToCartTextDisabled: {
            color: colors.textSecondary,
        },
    });
};

export const getEmptyStateStyles = (isDarkMode = false) => {
    const colors = getColors(isDarkMode);
    return StyleSheet.create({
        emptyState: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.xxl,
        },
        emptyStateText: {
            fontSize: 18,
            color: colors.textSecondary,
            textAlign: 'center',
            marginTop: spacing.lg,
            lineHeight: 24,
        },
        emptyStateSubtext: {
            fontSize: 14,
            color: colors.textSecondary,
            textAlign: 'center',
            marginTop: spacing.sm,
            opacity: 0.7,
        },
    });
};

export const getGridLayoutStyles = (isDarkMode = false) => {
    const colors = getColors(isDarkMode);
    return StyleSheet.create({
        gridContainer: {
            flex: 1,
            paddingHorizontal: spacing.md,
        },
        gridItem: {
            flex: 1,
            margin: spacing.xs,
            backgroundColor: colors.surface,
            borderRadius: borderRadius.md,
            padding: spacing.md,
            ...shadows.medium,
            elevation: 4,
        },
        gridItemImage: {
            width: '100%',
            height: 120,
            borderRadius: borderRadius.sm,
            marginBottom: spacing.sm,
            backgroundColor: colors.base200,
        },
        gridItemName: {
            fontSize: 14,
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: spacing.xs,
            textAlign: 'center',
        },
        gridItemPrice: {
            fontSize: 12,
            color: colors.primary,
            fontWeight: '600',
            textAlign: 'center',
        },
    });
};
