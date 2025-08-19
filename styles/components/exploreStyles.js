import { StyleSheet } from 'react-native';
import { spacing, typography, getColors } from '../theme';

export const getExploreStyles = (isDarkMode = false) => {
  const colors = getColors(isDarkMode);
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingBottom: spacing.lg,
    },
    header: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xl,
      backgroundColor: colors.background,
      marginBottom: spacing.md,
    },
    title: {
      ...typography.title,
      marginBottom: spacing.sm,
      fontSize: 32,
      fontWeight: '800',
      color: colors.text,
    },
    subtitle: {
      ...typography.subtitle,
      fontSize: 16,
      opacity: 0.8,
      color: colors.textSecondary,
    },
    content: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      backgroundColor: colors.background,
    },
  });
};