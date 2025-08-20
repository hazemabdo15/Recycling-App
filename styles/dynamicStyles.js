import { StyleSheet } from 'react-native';

/**
 * Creates themed styles that automatically update when theme changes
 * @param {Function} styleFunction - Function that receives colors and returns style object
 * @returns {Function} - Function that returns themed styles
 */
export const createThemedStyles = (styleFunction) => {
  return (colors) => StyleSheet.create(styleFunction(colors));
};

/**
 * Common themed style patterns
 */
export const themedStyles = {
  // Card components
  card: (colors) => ({
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  }),

  // Text styles
  primaryText: (colors) => ({
    color: colors.text,
    fontSize: 16,
  }),

  secondaryText: (colors) => ({
    color: colors.textSecondary,
    fontSize: 14,
  }),

  // Button styles
  primaryButton: (colors) => ({
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  }),

  secondaryButton: (colors) => ({
    backgroundColor: colors.base200,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: colors.base300,
  }),

  // Container styles
  container: (colors) => ({
    backgroundColor: colors.background,
    flex: 1,
  }),

  // Input styles
  textInput: (colors) => ({
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.base300,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
  }),
};

/**
 * Helper to merge themed styles with custom styles
 * @param {Object} themedStyle - Themed style object
 * @param {Object} customStyle - Custom style object
 * @returns {Object} - Merged style object
 */
export const mergeThemedStyle = (themedStyle, customStyle = {}) => {
  return { ...themedStyle, ...customStyle };
};
