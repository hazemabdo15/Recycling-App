/**
 * Google OAuth Configuration - CORRECTED VERSION
 * 
 * Google OAuth only accepts http/https schemes, not custom app schemes.
 * Therefore, both development and production must use Expo's auth proxy.
 */

// Correct: Use Expo Auth Proxy for both environments
export const getOAuthRedirectUri = () => {
  // Google OAuth requires http/https schemes only
  // Custom schemes like com.recyclecrew.karakeeb://oauth are NOT allowed
  return 'https://auth.expo.io/@recyclecrew/Karakeeb';
};

// WRONG - This doesn't work with Google OAuth
export const getCustomSchemeUri = () => {
  // ❌ This is INVALID for Google OAuth
  // Google rejects custom schemes with error: "Must use either http or https as the scheme"
  return 'com.recyclecrew.karakeeb://oauth';
};

export const GOOGLE_CONSOLE_SETUP_INSTRUCTIONS = {
  step1: "Go to https://console.cloud.google.com/apis/credentials",
  step2: "Find your OAuth 2.0 client ID: 330056808594-aqkfehg0apfa7v00hv8ndf7t30ikrjha.apps.googleusercontent.com",
  step3: "IMPORTANT: Only add this ONE redirect URI:",
  redirectUri: "https://auth.expo.io/@recyclecrew/Karakeeb",
  step4: "Remove any custom scheme URIs (com.recyclecrew.karakeeb://oauth)",
  step5: "Save the configuration",
  step6: "Rebuild your app with 'eas build --platform android --profile preview'",
  
  // Important notes
  notes: {
    why_expo_proxy: "Google OAuth only accepts http/https schemes, not custom app schemes",
    is_safe: "Expo auth proxy is safe and used by many production React Native apps",
    how_it_works: "Expo's servers handle the OAuth redirect and deep link back to your app"
  }
};

console.log('📋 CORRECTED Google Console Setup Instructions:', GOOGLE_CONSOLE_SETUP_INSTRUCTIONS);
