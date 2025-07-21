import { Stack } from "expo-router";

export default function RootLayout() {
  return (
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
  );
}