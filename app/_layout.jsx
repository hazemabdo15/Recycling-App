import { Stack } from "expo-router";
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { ChatProvider } from "../context/ChatContext";
import { NotificationProvider } from '../context/NotificationContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <NotificationProvider>
          <ChatProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                animationDuration: 300,
                gestureEnabled: true,
                gestureDirection: 'horizontal',
              }}
            >
            <Stack.Screen
              name="login"
              options={{ 
                headerShown: false,
                animation: 'fade',
              }}
            />
            <Stack.Screen
              name="register"
              options={{ 
                headerShown: false,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="otp"
              options={{ 
                headerShown: false,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen 
              name="(tabs)" 
              options={{ 
                headerShown: false,
                animation: 'fade',
              }} 
            />
            <Stack.Screen
              name="category-details"
              options={{
                headerShown: false,
                animation: 'slide_from_right',
                gestureEnabled: true,
                gestureDirection: 'horizontal',
              }}
            />
            <Stack.Screen
              name="notifications"
              options={{
                headerShown: false,
                animation: 'slide_from_right',
                gestureEnabled: true,
                gestureDirection: 'horizontal',
              }}
            />
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
            <Stack.Screen
              name="chat-modal"
              options={{
                presentation: 'containedTransparentModal',
                headerShown: false,
                animation: 'slide_from_bottom',
                gestureEnabled: true,
                gestureDirection: 'vertical',
              }}
            />
          </Stack>
        </ChatProvider>
        </NotificationProvider>
        </CartProvider>
    </AuthProvider>
  );
}