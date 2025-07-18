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
    paddingVertical: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.base300,
  },
  title: {
    ...typography.title,
    marginBottom: 8,
  },
  subtitle: {
    ...typography.subtitle,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
});
