// Secure Environment Configuration
// This module provides a secure way to load API keys

import Constants from 'expo-constants';

// Priority order for loading API keys:
// 1. Environment variables (from .env files via Expo's native support)
// 2. Build-time constants (from app.json for fallback)
// 3. Development fallback (local configuration)

const getSecureApiKey = () => {
  // Expo SDK 53+ automatically loads EXPO_PUBLIC_ variables from .env files
  const fromEnv = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  
  // Fallback to app.json extra section
  const fromConstants = Constants.expoConfig?.extra?.EXPO_PUBLIC_GROQ_API_KEY;
  
  // Development fallback (only in development builds)
  const devKey = __DEV__ ? 'groq_api_key' : null;
  
  const apiKey = fromEnv || fromConstants || devKey;
  
  // Security check - don't use placeholder values
  if (apiKey === 'your-api-key-here' || !apiKey) {
    console.warn('⚠️ No valid API key found. Please check your environment configuration.');
    return null;
  }
  
  return apiKey;
};

export { getSecureApiKey };

