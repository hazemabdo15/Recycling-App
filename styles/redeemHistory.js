import { StyleSheet } from 'react-native';
import { getColors } from '../styles/theme';

export const getRedeemHistoryStyles = (isDarkMode = false) => {
  const colors = getColors(isDarkMode);
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    heroSection: {
      paddingTop: 60,
      paddingBottom: 32,
      paddingHorizontal: 24,
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
      marginBottom: 16,
      alignItems: 'center',
      backgroundColor: colors.primary,
    },
    heroTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.white,
      marginBottom: 8,
    },
    heroSubtitle: {
      fontSize: 16,
      color: colors.primaryLight,
    },
    listContent: {
      padding: 16,
    },
    itemContainer: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 14,
      shadowColor: colors.shadow,
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    reason: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 6,
    },
    points: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.error,
      marginBottom: 4,
    },
    date: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    emptyText: {
      textAlign: 'center',
      color: colors.textSecondary,
      marginTop: 40,
      fontSize: 16,
    },
  });
};
