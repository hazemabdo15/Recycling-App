import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from "expo-router";
import DynamicStatusBar from '../components/common/DynamicStatusBar';
import GlobalCartValidator from '../components/common/GlobalCartValidator';
import GlobalToast from '../components/common/GlobalToast';
import SplashController from '../components/common/SplashController';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { ChatProvider } from "../context/ChatContext";
import { LocalizationProvider } from '../context/LocalizationContext';
import { NotificationProvider } from '../context/NotificationContext';
import { StockProvider } from '../context/StockContext';
import { ThemeProvider } from '../context/ThemeContext';
import '../localization/i18n'; // MUST BE THE FIRST IMPORT

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 2,
    },
    mutations: {
      retry: 1,
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LocalizationProvider>
          <AuthProvider>
            <StockProvider>
              <CartProvider>
                <NotificationProvider>
                  <ChatProvider>
                    <SplashController>
                      <DynamicStatusBar />
                      <GlobalToast />
                      <GlobalCartValidator />
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
        </StockProvider>
    </AuthProvider>
    </LocalizationProvider>
    </ThemeProvider>
    </QueryClientProvider>
  );
}