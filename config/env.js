
import Constants from 'expo-constants';

const getSecureApiKey = () => {

  const fromEnv = process.env.EXPO_PUBLIC_GROQ_API_KEY;

  const fromConstants = Constants.expoConfig?.extra?.EXPO_PUBLIC_GROQ_API_KEY;

  const devKey = __DEV__ ? 'groq_api_key' : null;
  
  const apiKey = fromEnv || fromConstants || devKey;

  if (apiKey === 'your-api-key-here' || !apiKey) {
    console.warn('⚠️ No valid API key found. Please check your environment configuration.');
    return null;
  }
  
  return apiKey;
};

export { getSecureApiKey };
