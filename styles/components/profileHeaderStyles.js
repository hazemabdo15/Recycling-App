import { StyleSheet } from 'react-native';
import { borderRadius, shadows, spacing, getColors } from '../theme';

export const getProfileHeaderStyles = (isDarkMode = false) => {
  const colors = getColors(isDarkMode);
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      marginHorizontal: spacing.md,
      marginBottom: spacing.md,
      ...shadows.medium,
    },
    avatarContainer: {
      position: 'relative',
      marginBottom: spacing.md,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      ...shadows.large,
    },
    editButton: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      ...shadows.small,
    },
    name: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    email: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: spacing.md,
    },
    levelBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceVariant,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.xl,
      marginBottom: spacing.sm,
    },
    levelText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
      marginLeft: 6,
    },
    pointsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    pointsText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginLeft: 6,
    },
  });
};