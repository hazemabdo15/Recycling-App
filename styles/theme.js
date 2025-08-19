// Light theme colors (existing)
export const lightColors = {
  primary: "#0E9F6E",
  secondary: "#8BC34A",
  accent: "#FFC107",
  neutral: "#607D8B",
  base50: "#FAFAFA",
  base100: "#F8FFFE",
  base200: "#F1F5F9",
  base300: "#E0E0E0",
  base400: "#B0BEC5",
  white: "#ffffff",
  black: "#171717",
  error: "#EF4444",
  warning: "#F59E0B", // More vibrant orange for better visibility
  success: "#10B981",
  info: "#3B82F6",
  background: "#FAFAFA",
  text: "#171717",
  textSecondary: "#607D8B",
  textTertiary: "#9CA3AF",
  shadow: "#000000",
};

// Dark theme colors (new)
export const darkColors = {
  primary: "#10B981",
  secondary: "#34D399",
  accent: "#FBBF24",
  neutral: "#94A3B8",
  base50: "#0F172A",
  base100: "#1E293B",
  base200: "#334155",
  base300: "#475569",
  base400: "#64748B",
  white: "#1E293B",
  black: "#F8FAFC",
  error: "#F87171",
  warning: "#FBBF24",
  success: "#34D399",
  info: "#60A5FA",
  background: "#0F172A",
  text: "#F8FAFC",
  textSecondary: "#94A3B8",
  textTertiary: "#64748B",
  shadow: "#000000",
};

// Function to get colors based on theme
export const getColors = (isDarkMode = false) => {
  return isDarkMode ? darkColors : lightColors;
};

// Backward compatibility - keep existing export
export const colors = lightColors;
export const borderRadius = {
  xs: 6,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
};
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};
export const shadows = {
  small: (shadowColor = "#000000") => ({
    shadowColor,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  }),
  medium: (shadowColor = "#000000") => ({
    shadowColor,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 16,
  }),
  large: (shadowColor = "#000000") => ({
    shadowColor,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 22,
  }),
};
export const getTypography = (colors) => ({
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  body: {
    fontSize: 14,
    color: colors.text,
  },
  caption: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

// Backward compatibility
export const typography = {
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: lightColors.black,
  },
  subtitle: {
    fontSize: 16,
    color: lightColors.neutral,
    lineHeight: 22,
  },
  body: {
    fontSize: 14,
    color: lightColors.black,
  },
  caption: {
    fontSize: 12,
    color: lightColors.neutral,
  },
};
