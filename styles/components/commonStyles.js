import { StyleSheet } from 'react-native';
import { scaleSize } from '../../utils/scale';
import { borderRadius, colors, shadows, spacing } from '../theme';
export const layoutStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.base100,
    },
    content: {
        flex: 1,
        paddingHorizontal: scaleSize(spacing.lg),
    },
    listContainer: {
        paddingBottom: scaleSize(120),
        paddingTop: scaleSize(spacing.sm),
        paddingHorizontal: scaleSize(spacing.sm),
    },
    separator: {
        height: scaleSize(spacing.xs),
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
        marginTop: scaleSize(spacing.lg),
        fontSize: scaleSize(18),
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
        paddingHorizontal: scaleSize(40),
    },
    errorText: {
        fontSize: scaleSize(18),
        color: colors.secondary,
        textAlign: 'center',
        fontWeight: '500',
        lineHeight: scaleSize(24),
    },
});
export const buttonStyles = StyleSheet.create({
    primaryButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: scaleSize(spacing.xl),
        paddingVertical: scaleSize(spacing.sm),
        borderRadius: scaleSize(borderRadius.lg),
        alignItems: 'center',
        justifyContent: 'center',
        ...shadows.small,
        elevation: 4,
    },
    primaryButtonText: {
        color: colors.white,
        fontSize: scaleSize(16),
        fontWeight: '600',
    },
    secondaryButton: {
        backgroundColor: colors.white,
        paddingHorizontal: scaleSize(spacing.xl),
        paddingVertical: scaleSize(spacing.sm),
        borderRadius: scaleSize(borderRadius.lg),
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.primary,
        ...shadows.small,
        elevation: 2,
    },
    secondaryButtonText: {
        color: colors.primary,
        fontSize: scaleSize(16),
        fontWeight: '600',
    },
    iconButton: {
        width: scaleSize(44),
        height: scaleSize(44),
        borderRadius: scaleSize(22),
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
        borderRadius: scaleSize(borderRadius.md),
        padding: scaleSize(spacing.md),
        ...shadows.medium,
        elevation: 6,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: scaleSize(spacing.sm),
    },
    cardTitle: {
        fontSize: scaleSize(18),
        fontWeight: '600',
        color: colors.black,
    },
    cardSubtitle: {
        fontSize: scaleSize(14),
        color: colors.neutral,
        marginTop: scaleSize(spacing.xs),
    },
    cardContent: {
        marginTop: scaleSize(spacing.sm),
    },
});
export const badgeStyles = StyleSheet.create({
    badge: {
        backgroundColor: colors.primary,
        paddingHorizontal: scaleSize(spacing.sm),
        paddingVertical: scaleSize(spacing.xs),
        borderRadius: scaleSize(borderRadius.lg),
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: scaleSize(24),
        minHeight: scaleSize(24),
    },
    badgeText: {
        color: colors.white,
        fontSize: scaleSize(12),
        fontWeight: 'bold',
    },
    badgeSecondary: {
        backgroundColor: colors.accent,
    },
    badgeNeutral: {
        backgroundColor: colors.neutral,
    },
});