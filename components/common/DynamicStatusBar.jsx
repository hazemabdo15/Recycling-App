import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useThemedStyles } from '../../hooks/useThemedStyles';

export default function DynamicStatusBar() {
  const { isDarkMode, colors } = useThemedStyles();
  
  return (
    <StatusBar 
      style={isDarkMode ? "light" : "dark"}
      backgroundColor={colors.background}
      translucent={false}
    />
  );
}
