import { Stack } from "expo-router";
import GlobalToast from '../components/common/GlobalToast';
import SplashController from '../components/common/SplashController';
import DynamicStatusBar from '../components/common/DynamicStatusBar';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { ChatProvider } from "../context/ChatContext";
import { LocalizationProvider } from '../context/LocalizationContext';
import { NotificationProvider } from '../context/NotificationContext';
import { ThemeProvider } from '../context/ThemeContext';
import '../localization/i18n'; // MUST BE THE FIRST IMPORT

export default function RootLayout() {
  return (
    <ThemeProvider>
      <LocalizationProvider>
        <AuthProvider>
          <CartProvider>
            <NotificationProvider>
              <ChatProvider>
                <SplashController>
                  <DynamicStatusBar />
                  <GlobalToast />
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
              name="help-support"
              options={{
                headerShown: false,
                animation: 'slide_from_right',
                gestureEnabled: true,
                gestureDirection: 'horizontal',
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
            </SplashController>
        </ChatProvider>
        </NotificationProvider>
        </CartProvider>
    </AuthProvider>
    </LocalizationProvider>
    </ThemeProvider>
  );
}