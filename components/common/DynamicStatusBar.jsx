import { StatusBar } from 'expo-status-bar';
import { useThemedStyles } from '../../hooks/useThemedStyles';

export default function DynamicStatusBar() {
  const { isDarkMode } = useThemedStyles();

  return (
    <StatusBar
      style={isDarkMode ? "light" : "dark"}
      // Removed backgroundColor and translucent props to avoid conflicts with edge-to-edge
    />
  );
}
