import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from "expo-router";
import { useEffect, useState } from 'react';
import { CartProvider } from '../context/CartContext';

export default function RootLayout() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        setIsLoggedIn(!!token);
        console.log('[RootLayout] Auth status checked, isLoggedIn:', !!token);
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsLoggedIn(false);
      } finally {
        setIsInitialized(true);
      }
    };
    
    checkAuthStatus();
  }, []);

  if (!isInitialized) {
    return null;
  }

  return (
    <CartProvider isLoggedIn={isLoggedIn}>
    <Stack>
      <Stack.Screen
        name="login"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="register"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="otp"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="voice-modal"
        options={{
          presentation: 'containedTransparentModal',
          headerShown: false,
          animation: 'slide_from_bottom',
          gestureEnabled: true,
          gestureDirection: 'vertical',
        }}
      />
      <Stack.Screen
        name="ai-results-modal"
        options={{
          presentation: 'containedTransparentModal',
          headerShown: false,
          animation: 'slide_from_bottom',
          gestureEnabled: true,
          gestureDirection: 'vertical',
        }}
      />
    </Stack>
    </CartProvider>
  );
}