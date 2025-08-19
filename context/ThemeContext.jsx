import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [themePreference, setThemePreference] = useState('system'); // 'light', 'dark', 'system'

  const loadThemePreference = useCallback(async () => {
    try {
      const savedPreference = await AsyncStorage.getItem('themePreference');
      if (savedPreference) {
        const preference = JSON.parse(savedPreference);
        setThemePreference(preference);
        
        if (preference === 'system') {
          setIsDarkMode(systemColorScheme === 'dark');
        } else {
          setIsDarkMode(preference === 'dark');
        }
      } else {
        // Default to system preference if no saved preference
        setThemePreference('system');
        setIsDarkMode(systemColorScheme === 'dark');
      }
    } catch (error) {
      console.warn('Failed to load theme preference:', error);
      // Fallback to system theme
      setThemePreference('system');
      setIsDarkMode(systemColorScheme === 'dark');
    }
  }, [systemColorScheme]);

  // Load saved theme preference on app start
  useEffect(() => {
    loadThemePreference();
  }, [loadThemePreference]);

  // Update theme when system preference changes and user has 'system' selected
  useEffect(() => {
    if (themePreference === 'system') {
      setIsDarkMode(systemColorScheme === 'dark');
    }
  }, [systemColorScheme, themePreference]);

  const setTheme = async (preference) => {
    try {
      setThemePreference(preference);
      await AsyncStorage.setItem('themePreference', JSON.stringify(preference));
      
      if (preference === 'system') {
        setIsDarkMode(systemColorScheme === 'dark');
      } else {
        setIsDarkMode(preference === 'dark');
      }
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  };

  const toggleTheme = async () => {
    const newPreference = isDarkMode ? 'light' : 'dark';
    await setTheme(newPreference);
  };

  const value = {
    isDarkMode,
    themePreference,
    setTheme,
    toggleTheme,
    isSystemTheme: themePreference === 'system',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
