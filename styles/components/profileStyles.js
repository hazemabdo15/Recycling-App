import { StyleSheet } from 'react-native';
import { colors, spacing } from '../theme';

export const profileStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base100,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: spacing.lg,
    paddingBottom: 130,
  },
});
