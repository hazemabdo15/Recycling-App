import { StyleSheet } from 'react-native';
import { spacing, getColors } from '../theme';

export const getProfileStyles = (isDarkMode = false) => {
  const colors = getColors(isDarkMode);
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingVertical: spacing.lg,
      paddingBottom: 130,
    },
  });
};