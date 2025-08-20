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
  disabled: "#9CA3AF",
};

// Dark theme colors (new) - Enhanced for better contrast
export const darkColors = {
  primary: "#22c55e", // Brighter green for better visibility
  secondary: "#65a30d", // Enhanced green
  accent: "#fbbf24", // Bright yellow
  neutral: "#94a3b8",
  base50: "#0f172a", // Very dark blue-gray
  base100: "#1e293b", // Dark blue-gray
  base200: "#334155", // Medium dark blue-gray
  base300: "#475569", // Medium blue-gray
  base400: "#64748b", // Light blue-gray
  white: "#1e293b", // Card backgrounds in dark mode
  black: "#f8fafc", // Text color in dark mode
  error: "#f87171", // Bright red
  warning: "#fbbf24", // Bright yellow
  success: "#22c55e", // Bright green
  info: "#60a5fa", // Bright blue
  background: "#0f172a", // Main background
  text: "#f8fafc", // Primary text
  textSecondary: "#cbd5e1", // Secondary text - brighter for better contrast
  textTertiary: "#94a3b8", // Tertiary text
  shadow: "#000000",
  disabled: "#64748b",
};

// Function to get colors based on theme
export const getColors = (isDarkMode = false) => {
  const baseColors = isDarkMode ? darkColors : lightColors;
  
  return {
    ...baseColors,
    // Card specific colors
    cardBackground: baseColors.white,
    cardGradient: isDarkMode 
      ? [baseColors.base100, baseColors.base200] 
      : [baseColors.white, '#f8fafc'],
    cardBorder: isDarkMode 
      ? 'rgba(148, 163, 184, 0.2)' 
      : 'rgba(255,255,255,0.5)',
    shadowColor: baseColors.shadow,
    
    // Avatar specific colors
    avatarGradient: isDarkMode 
      ? ['#1e40af', '#3b82f6'] 
      : ['#e3f2fd', '#bbdefb'],
    overlayBg: isDarkMode 
      ? 'rgba(30, 41, 91, 0.7)' 
      : 'rgba(255,255,255,0.7)',
    
    // Stats card colors
    statCardBg: isDarkMode 
      ? 'rgba(30, 41, 91, 0.4)' 
      : 'rgba(255,255,255,0.7)',
    
    // Stat specific gradients
    recycleStatGradient: isDarkMode 
      ? ['#047857', '#065f46'] 
      : ['#e8f5e8', '#f1f8e9'],
    recycleStatIcon: isDarkMode ? '#10b981' : '#2e7d32',
    
    pointsStatGradient: isDarkMode 
      ? ['#b45309', '#92400e'] 
      : ['#fff3e0', '#fce4ec'],
    pointsStatIcon: isDarkMode ? '#fbbf24' : '#f57c00',
    
    tierStatGradient: isDarkMode 
      ? ['#1e40af', '#7c3aed'] 
      : ['#e3f2fd', '#f3e5f5'],
    
    // Modal specific colors
    modalOverlay: isDarkMode 
      ? 'rgba(0, 0, 0, 0.85)' 
      : 'rgba(0, 0, 0, 0.7)',
    modalButtonBg: isDarkMode 
      ? 'rgba(55, 65, 81, 0.8)' 
      : 'rgba(0, 0, 0, 0.5)',
    modalImageBg: isDarkMode 
      ? 'rgba(55, 65, 81, 0.2)' 
      : 'rgba(255, 255, 255, 0.1)',
    modalText: isDarkMode ? baseColors.white : 'white',
    modalSubText: isDarkMode 
      ? 'rgba(203, 213, 225, 0.9)' 
      : 'rgba(255, 255, 255, 0.7)',
    
    // Achievement specific colors
    achievementCardBg: isDarkMode ? baseColors.base100 : baseColors.white,
    achievementCompletedBorder: isDarkMode ? baseColors.success : '#10b981',
    achievementIconBg: isDarkMode 
      ? [baseColors.base200, baseColors.base300] 
      : ['#e5e7eb', '#f3f4f6'],
    achievementIconCompleted: isDarkMode 
      ? [baseColors.success, '#16a34a'] 
      : ['#10b981', '#34d399'],
    
    // Help & Support specific colors
    helpCardBg: isDarkMode ? baseColors.base100 : baseColors.white,
    helpSectionBg: isDarkMode ? baseColors.base50 : '#f8fafc',
    helpBorderColor: isDarkMode ? baseColors.base300 : '#e2e8f0',
    
    // Home screen specific colors
    heroGradient: [baseColors.primary, baseColors.neutral],
    notificationButtonBg: isDarkMode 
      ? 'rgba(148, 163, 184, 0.15)' 
      : 'rgba(255, 255, 255, 0.15)',
    textLight: baseColors.textSecondary,
    
    // Header specific colors
    headerButtonBg: isDarkMode ? baseColors.base200 : '#F5F5F5',
    
    // Category specific colors
    surface: baseColors.white,
    
    // Profile specific colors
    border: isDarkMode ? baseColors.base300 : '#e2e8f0',
    primaryLight: isDarkMode ? baseColors.base200 : '#bbf7d0',
    primaryDark: isDarkMode ? '#047857' : '#065f46',
    primarySurface: isDarkMode ? baseColors.base100 : '#f0fdf4',
    errorLight: isDarkMode ? '#7f1d1d' : '#fee2e2',
    errorBorder: isDarkMode ? '#b91c1c' : '#fecaca',
    infoLight: isDarkMode ? '#1e3a8a' : '#e0f2fe',
    infoBorder: isDarkMode ? '#3b82f6' : '#bae6fd',
    
    // StatusBar style
    statusBarStyle: isDarkMode ? 'light' : 'dark',
  };
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
