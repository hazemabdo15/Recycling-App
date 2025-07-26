import { StyleSheet } from 'react-native';
import { borderRadius, colors, shadows, spacing } from '../theme';
export const layoutStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.base100,
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing.lg,
    },
    listContainer: {
        paddingBottom: 120,
        paddingTop: spacing.sm,
        paddingHorizontal: spacing.sm,
    },
    separator: {
        height: spacing.xs,
    },
});
export const loadingStateStyles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.base100,
    },
    loadingText: {
        marginTop: spacing.lg,
        fontSize: 18,
        color: colors.neutral,
        fontWeight: '500',
    },
});
export const errorStateStyles = StyleSheet.create({
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.base100,
        paddingHorizontal: 40,
    },
    errorText: {
        fontSize: 18,
        color: colors.secondary,
        textAlign: 'center',
        fontWeight: '500',
        lineHeight: 24,
    },
});
export const buttonStyles = StyleSheet.create({
    primaryButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.small,
        elevation: 4,
    },
    primaryButtonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        backgroundColor: colors.white,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.primary,
        ...shadows.small,
        elevation: 2,
    },
    secondaryButtonText: {
        color: colors.primary,
        fontSize: 16,
        fontWeight: '600',
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.white,
        ...shadows.small,
        elevation: 3,
    },
});
export const cardStyles = StyleSheet.create({
    card: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        ...shadows.medium,
        elevation: 6,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.black,
    },
    cardSubtitle: {
        fontSize: 14,
        color: colors.neutral,
        marginTop: spacing.xs,
    },
    cardContent: {
        marginTop: spacing.sm,
    },
});
export const badgeStyles = StyleSheet.create({
    badge: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 24,
        minHeight: 24,
    },
    badgeText: {
        color: colors.white,
        fontSize: 12,
        fontWeight: 'bold',
    },
    badgeSecondary: {
        backgroundColor: colors.accent,
    },
    badgeNeutral: {
        backgroundColor: colors.neutral,
    },
});