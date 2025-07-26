import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';
export const exploreStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base100,
    paddingBottom: spacing.lg,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    backgroundColor: colors.base100,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.title,
    marginBottom: spacing.sm,
    fontSize: 32,
    fontWeight: '800',
  },
  subtitle: {
    ...typography.subtitle,
    fontSize: 16,
    opacity: 0.8,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.base100,
  },
});