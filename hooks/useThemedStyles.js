import { useTheme } from '../context/ThemeContext';
import { borderRadius, getColors, getTypography, shadows, spacing } from '../styles/theme';

export const useThemedStyles = () => {
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);
  const typography = getTypography(colors);
  
  return {
    colors,
    typography,
    shadows,
    borderRadius,
    spacing,
    isDarkMode,
  };
};
