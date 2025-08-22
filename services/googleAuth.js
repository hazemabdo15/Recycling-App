import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as React from 'react';
import { AppState, Platform } from 'react-native';
import { APP_CONFIG } from '../config/env';
import optimizedApiService from './api/apiService';

// Essential for proper session handling
WebBrowser.maybeCompleteAuthSession();

// Enhanced token extraction utility
const extractTokensFromUrl = (url) => {
  try {
    console.log('[GoogleAuth] Extracting tokens from URL:', url);
    
    // Handle both Expo auth proxy URLs and app scheme URLs
    let queryString = '';
    
    if (url.includes('auth.expo.io')) {
      // Expo auth proxy format: https://auth.expo.io/@user/app?id_token=...&access_token=...
      if (url.includes('#')) {
        queryString = url.split('#')[1];
      } else if (url.includes('?')) {
        queryString = url.split('?')[1];
      }
    } else if (url.includes('://oauth')) {
      // App scheme format: com.recyclecrew.karakeeb://oauth?id_token=...&access_token=...
      if (url.includes('?')) {
        queryString = url.split('?')[1];
      }
    } else {
      // Fallback: try to extract from hash or query parameters
      if (url.includes('#')) {
        queryString = url.split('#')[1];
      } else if (url.includes('?')) {
        queryString = url.split('?')[1];
      } else {
        console.log('[GoogleAuth] URL format not recognized:', url);
        return null;
      }
    }
    
    if (!queryString) {
      console.log('[GoogleAuth] No query parameters found in URL');
      return null;
    }

    const params = new URLSearchParams(queryString);
    const idToken = params.get('id_token');
    const accessToken = params.get('access_token');
    const state = params.get('state');
    
    console.log('[GoogleAuth] Token extraction results:', {
      hasIdToken: !!idToken,
      hasAccessToken: !!accessToken,
      state: state
    });
    
    if (idToken) {
      try {
        // Decode JWT to verify it's valid
        const payload = JSON.parse(atob(idToken.split('.')[1]));
        console.log('[GoogleAuth] Decoded token payload:', {
          email: payload.email,
          name: payload.name,
          exp: new Date(payload.exp * 1000).toISOString()
        });
        
        return {
          type: 'success',
          params: {
            id_token: idToken,
            access_token: accessToken,
            state: state
          },
          userData: payload
        };
      } catch (decodeError) {
        console.error('[GoogleAuth] Failed to decode token:', decodeError);
        return null;
      }
    }
    
    return null;
  } catch (error) {
    console.error('[GoogleAuth] Error extracting tokens from URL:', error);
    return null;
  }
};

// Metro connection monitoring
const checkMetroConnection = async () => {
  // Optimization: Only check the most likely endpoint and use a shorter timeout
  // Allow skipping the check via env variable for advanced users
  if (process.env.SKIP_METRO_CHECK === '1') {
    console.log('[GoogleAuth] Metro check skipped by env variable');
    return true;
  }
  const endpoint = 'http://localhost:8081/status'; // Most common Metro endpoint
  try {
    console.log(`[GoogleAuth] Checking Metro connection: ${endpoint}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 400); // 400ms timeout
    const response = await fetch(endpoint, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (response.ok || response.status < 500) {
      console.log(`[GoogleAuth] Metro connected via: ${endpoint}`);
      return true;
    }
    return false;
  } catch (error) {
    console.log(`[GoogleAuth] Metro connection failed:`, error.message);
    return false;
  }
};


export const useGoogleAuth = () => {
  // State for tracking auth flow
  const [authAttempts, setAuthAttempts] = React.useState(0);
  const [lastAuthError, setLastAuthError] = React.useState(null);
  const [isRetrying, setIsRetrying] = React.useState(false);
  
  // Use proper redirect URI based on environment
  let redirectUri;
  
  if (__DEV__) {
    // Use Expo auth proxy for development
    redirectUri = 'https://auth.expo.io/@recyclecrew/Karakeeb';
    console.log('🔗 [GoogleAuth] Using Expo auth proxy URI for development');
  } else {
    // For production, we still need to use the Expo auth proxy
    // Google OAuth only accepts http/https schemes, not custom app schemes
    redirectUri = 'https://auth.expo.io/@recyclecrew/Karakeeb';
    console.log('🔗 [GoogleAuth] Using Expo auth proxy URI for production (Google OAuth requirement)');
  }
  
  console.log('🔗 [GoogleAuth] Final redirect URI:', redirectUri);
  console.log('📝 [GoogleAuth] Development mode:', __DEV__);
  console.log('📝 [GoogleAuth] Platform:', Platform.OS);
  
  // Use the Google provider for better reliability with enhanced configuration
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(
    {
      clientId: APP_CONFIG.GOOGLE_MOBILE_CLIENT_ID,
      redirectUri,
      scopes: ['openid', 'profile', 'email'],
      additionalParameters: {},
      prompt: AuthSession.Prompt.SelectAccount, // Force account selection
    }
  );

  // Enhanced response monitoring with Metro disconnect detection
  React.useEffect(() => {
    console.log('🔄 [GoogleAuth] Response state changed:', response);
    if (response) {
      console.log('🔄 [GoogleAuth] Response type:', response.type);
      console.log('🔄 [GoogleAuth] Full response object:', JSON.stringify(response, null, 2));
      
      if (response.type === 'success') {
        console.log('✅ [GoogleAuth] Success! ID Token:', response.params?.id_token ? 'Present' : 'Missing');
        console.log('✅ [GoogleAuth] Full response params:', response.params);
        setLastAuthError(null);
        setAuthAttempts(0);
      } else if (response.type === 'error') {
        console.log('❌ [GoogleAuth] Error:', response.error);
        console.log('❌ [GoogleAuth] Error details:', JSON.stringify(response.error, null, 2));
        setLastAuthError(response.error);
      } else if (response.type === 'cancel') {
        console.log('⚠️  [GoogleAuth] User cancelled');
        setLastAuthError(null);
      } else if (response.type === 'dismiss') {
        console.log('⚠️  [GoogleAuth] Auth dismissed - this might be due to Metro disconnect');
        console.log('⚠️  [GoogleAuth] Response URL:', response.url);
        
        // Immediate token extraction attempt
        if (response.url) {
          const extractedResult = extractTokensFromUrl(response.url);
          if (extractedResult) {
            console.log('🎯 [GoogleAuth] Successfully extracted tokens from dismissed URL!');
            // We'll handle this in the calling component
          }
        }
      }
    }
  }, [response]);

  // App state monitoring for Metro disconnect detection
  React.useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      console.log('[GoogleAuth] App state changed to:', nextAppState);
      
      if (nextAppState === 'active' && response?.type === 'dismiss' && !isRetrying) {
        console.log('[GoogleAuth] App became active after dismiss - checking for completed auth');
        
        // Check if auth actually completed during backgrounding
        if (response.url) {
          const extractedResult = extractTokensFromUrl(response.url);
          if (extractedResult) {
            console.log('[GoogleAuth] Found valid tokens after app became active');
            // Update the response to success type
            // This will be handled by the calling component
          }
        }
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [response, isRetrying]);

  const handleGoogleLogin = async () => {
    try {
      console.log('[GoogleAuth] Initiating Google login...');
      setAuthAttempts(prev => prev + 1);
      setLastAuthError(null);
      
      // Pre-flight Metro connection check in development
      if (__DEV__) {
        const isMetroConnected = await checkMetroConnection();
        console.log('[GoogleAuth] Pre-flight Metro check:', isMetroConnected);
        
        if (!isMetroConnected) {
          console.warn('[GoogleAuth] Metro not detected - auth may be dismissed');
        }
      }
      
      // Enhanced prompt configuration
      const result = await promptAsync({
        showInRecents: false,
        preferEphemeralSession: false, // Keep session data
        createTask: false, // Don't create new task on Android
      });
      
      console.log('[GoogleAuth] Prompt result:', result);
      console.log('[GoogleAuth] Result type:', result?.type);
      
      // Enhanced handling for dismiss case
      if (result?.type === 'dismiss') {
        console.log('[GoogleAuth] Dismiss detected');
        console.log('[GoogleAuth] Dismiss result URL:', result?.url || 'NO URL PROVIDED');
        
        if (result?.url) {
          console.log('[GoogleAuth] Dismiss has URL, attempting token extraction...');
          
          // Immediate token extraction attempt
          const extractedResult = extractTokensFromUrl(result.url);
          if (extractedResult) {
            console.log('[GoogleAuth] Successfully extracted tokens from dismissed URL');
            return extractedResult;
          }
          
          console.log('[GoogleAuth] Token extraction failed, trying retry mechanism');
        } else {
          console.log('[GoogleAuth] Dismiss has no URL - OAuth likely interrupted before completion');
          console.log('[GoogleAuth] This indicates Metro disconnect happened during OAuth redirect');
        }
        
        // For both cases (with or without URL), try retry mechanism
        console.log('[GoogleAuth] Initiating retry mechanism for dismissed auth');
        setIsRetrying(true);
        
      } else if (result?.type === 'dismiss') {
        // Special handling for dismiss without URL (common in development)
        console.log('[GoogleAuth] Dismiss without URL detected - likely Metro disconnect during OAuth');
        
        return {
          type: 'dismiss',
          message: 'Metro disconnect detected',
          suggestion: 'Try production mode: npm run start:prod'
        };
      }
      
      return result;
    } catch (error) {
      console.error('[GoogleAuth] Error initiating Google login:', error);
      setLastAuthError(error);
      throw error;
    }
  };

  const processGoogleResponse = async (authResponse) => {
    // Handle both normal success responses and extracted token responses
    if (authResponse?.type !== 'success' && !authResponse?.userData) {
      console.log('[GoogleAuth] Login cancelled or failed:', authResponse?.type);
      return null;
    }

    try {
      console.log('[GoogleAuth] Processing Google response...');
      
      // Handle extracted token response (from URL parsing)
      if (authResponse.userData) {
        console.log('[GoogleAuth] Processing extracted token response');
        const { id_token } = authResponse.params;
        
        if (!id_token) {
          throw new Error('No ID token in extracted response');
        }

        console.log('[GoogleAuth] Sending extracted ID token to backend...');
        const backendResponse = await optimizedApiService.post('/auth/provider/google', {
          idToken: id_token,
        });

        console.log('[GoogleAuth] Backend response for extracted token:', backendResponse);
        return backendResponse;
      }
      
      // Handle normal success response
      const { id_token } = authResponse.params;
      
      if (!id_token) {
        throw new Error('No ID token received from Google');
      }

      console.log('[GoogleAuth] Sending ID token to backend...');
      const backendResponse = await optimizedApiService.post('/auth/provider/google', {
        idToken: id_token,
      });

      console.log('[GoogleAuth] Backend response:', backendResponse);
      return backendResponse;
    } catch (error) {
      console.error('[GoogleAuth] Error processing Google response:', error);
      
      // Enhanced error handling with specific suggestions
      if (error.message?.includes('Network')) {
        console.log('[GoogleAuth] Network error detected - retrying might help');
      } else if (error.message?.includes('token')) {
        console.log('[GoogleAuth] Token error - authentication may need to be restarted');
      }
      
      throw error;
    }
  };

  const registerWithGoogle = async (idToken, additionalInfo) => {
    try {
      console.log('[GoogleAuth] Registering new user with Google...');
      const registrationData = {
        ...additionalInfo,
        provider: 'google',
        idToken,
      };

      const response = await optimizedApiService.post('/auth/register', registrationData);
      console.log('[GoogleAuth] Registration successful:', response);
      return response;
    } catch (error) {
      console.error('[GoogleAuth] Registration error:', error);
      throw error;
    }
  };

  // Helper function to handle URL-based auth completion
  const handleUrlBasedAuth = (url) => {
    return extractTokensFromUrl(url);
  };

  // Enhanced error recovery function
  const recoverFromDismiss = async (dismissedResponse) => {
    console.log('[GoogleAuth] Attempting to recover from dismissed auth...');
    
    if (!dismissedResponse?.url) {
      console.log('[GoogleAuth] No URL in dismissed response, cannot recover');
      return null;
    }
    
    const extracted = extractTokensFromUrl(dismissedResponse.url);
    if (extracted) {
      console.log('[GoogleAuth] Successfully recovered auth from dismissed URL');
      return extracted;
    }
    
    console.log('[GoogleAuth] Could not extract valid tokens from dismissed URL');
    return null;
  };

  // Debug helper to get current auth state
  const getAuthState = () => ({
    hasResponse: !!response,
    responseType: response?.type,
    hasRequest: !!request,
    attempts: authAttempts,
    lastError: lastAuthError,
    isRetrying
  });

  return {
    request,
    response,
    handleGoogleLogin,
    processGoogleResponse,
    registerWithGoogle,
    handleUrlBasedAuth,
    recoverFromDismiss,
    getAuthState,
    // Expose utilities for advanced usage
    extractTokensFromUrl,
    checkMetroConnection
  };
};
