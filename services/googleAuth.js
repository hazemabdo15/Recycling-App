import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import * as React from 'react';
import { APP_CONFIG } from '../config/env';
import optimizedApiService from './api/apiService';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: APP_CONFIG.GOOGLE_WEB_CLIENT_ID, // Web OAuth client ID (required for offline access)
  offlineAccess: true,
  hostedDomain: '',
  forceCodeForRefreshToken: true,
  accountName: '', // This ensures no account is pre-selected
});


export const useGoogleAuth = () => {
  // State for tracking auth flow
  const [authAttempts, setAuthAttempts] = React.useState(0);
  const [lastAuthError, setLastAuthError] = React.useState(null);
  const [isRetrying] = React.useState(false);
  const [response, setResponse] = React.useState(null);
  
  // Ref to prevent multiple simultaneous sign-in attempts
  const isSigningInRef = React.useRef(false);

  // Native Google Sign-In function
  const signIn = React.useCallback(async () => {
    // Prevent multiple simultaneous sign-in attempts
    if (isSigningInRef.current) {
      console.log('🔄 [GoogleAuth] Sign-in already in progress, skipping');
      return response;
    }
    
    isSigningInRef.current = true;
    
    try {
      console.log('🔄 [GoogleAuth] Starting native Google Sign-In...');
      
      // Sign out first to ensure account selection dialog appears
      try {
        await GoogleSignin.signOut();
        console.log('🔄 [GoogleAuth] Signed out from previous session to allow account selection');
      } catch (_signOutError) {
        console.log('ℹ️ [GoogleAuth] No previous session to sign out from, continuing...');
      }
      
      // Check if Google Play Services are available
      await GoogleSignin.hasPlayServices();
      
      // Get user info - this will now show account picker
      const userInfo = await GoogleSignin.signIn();
      console.log('✅ [GoogleAuth] Native sign-in successful:', userInfo);
      console.log('🔍 [GoogleAuth] UserInfo structure:', JSON.stringify(userInfo, null, 2));
      
      // Handle cancelled response
      if (userInfo.type === 'cancelled') {
        console.log('ℹ️ [GoogleAuth] User cancelled the sign-in');
        const cancelResponse = { type: 'cancel', error: 'User cancelled' };
        setResponse(cancelResponse);
        setLastAuthError(null); // Don't treat cancellation as an error
        return cancelResponse; // Return directly without throwing
      }
      
      // Validate the response structure - handle both old and new response formats
      let userData, idToken;
      
      if (userInfo.type === 'success' && userInfo.data) {
        // New format: response has type and data
        userData = userInfo.data.user;
        idToken = userInfo.data.idToken;
      } else if (userInfo.user) {
        // Old format: user data directly in userInfo
        userData = userInfo.user;
        idToken = userInfo.idToken;
      } else {
        throw new Error('Invalid user info received from Google');
      }
      
      if (!userData) {
        throw new Error('No user data received from Google');
      }
      
      // Create response object matching the old format
      const successResponse = {
        type: 'success',
        params: {
          id_token: idToken,
          access_token: userData.id || userData.email, // Fallback to email if ID not available
          server_auth_code: userInfo.data?.serverAuthCode || null, // Include server auth code for registration
        },
        userData: {
          email: userData.email,
          name: userData.name,
          picture: userData.photo,
          given_name: userData.givenName,
          family_name: userData.familyName,
        }
      };
      
      setResponse(successResponse);
      setLastAuthError(null);
      setAuthAttempts(0);
      
      return successResponse;
      
    } catch (error) {
      console.error('❌ [GoogleAuth] Native sign-in error:', error);
      
      let errorResponse;
      
      // Handle Google SDK status codes
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        errorResponse = { type: 'cancel', error: 'User cancelled' };
        setResponse(errorResponse);
        setLastAuthError(null); // Don't treat cancellation as an error
        return errorResponse; // Return instead of throwing for cancellation
      } else if (error.code === statusCodes.IN_PROGRESS) {
        errorResponse = { type: 'error', error: 'Sign in already in progress' };
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        errorResponse = { type: 'error', error: 'Google Play Services not available' };
      } else {
        errorResponse = { type: 'error', error: error.message || 'Unknown error' };
      }
      
      setResponse(errorResponse);
      setLastAuthError(error);
      
      throw error;
    } finally {
      isSigningInRef.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array is correct here as we don't want to recreate this function based on response state

  // Sign out function
  const signOut = React.useCallback(async () => {
    try {
      await GoogleSignin.signOut();
      setResponse(null);
      console.log('✅ [GoogleAuth] User signed out successfully');
    } catch (_error) {
      console.error('❌ [GoogleAuth] Sign out error:', _error);
    }
  }, []);

  // Check if user is already signed in
  const getCurrentUser = React.useCallback(async () => {
    try {
      const userInfo = await GoogleSignin.getCurrentUser();
      return userInfo;
    } catch (_error) {
      return null;
    }
  }, []);

  // Legacy compatibility functions
  const handleGoogleLogin = signIn;
  const promptAsync = signIn;

  // Return the hook interface
  const processGoogleResponse = React.useCallback(async (authResponse) => {
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
      throw error;
    }
  }, []);

  const registerWithGoogle = React.useCallback(async (idToken, additionalInfo, serverAuthCode = null) => {
    try {
      console.log('[GoogleAuth] Registering new user with Google...');
      console.log('[GoogleAuth] Using serverAuthCode:', !!serverAuthCode, 'idToken:', !!idToken);
      
      const registrationData = {
        ...additionalInfo,
        provider: 'google',
        // Backend requires idToken field, but we can also provide serverAuthCode
        idToken: idToken,
        ...(serverAuthCode && { serverAuthCode }),
      };

      console.log('[GoogleAuth] Registration payload keys:', Object.keys(registrationData));
      console.log('[GoogleAuth] Registration data preview:', {
        provider: registrationData.provider,
        hasServerAuthCode: !!registrationData.serverAuthCode,
        hasIdToken: !!registrationData.idToken,
        name: registrationData.name,
        email: registrationData.email
      });
      
      const response = await optimizedApiService.post('/auth/register', registrationData);
      console.log('[GoogleAuth] Registration successful:', response);
      return response;
    } catch (error) {
      console.error('[GoogleAuth] Registration error:', error);
      throw error;
    }
  }, []);

  const getAuthState = React.useCallback(() => ({
    attempts: authAttempts,
    lastError: lastAuthError,
    isRetrying
  }), [authAttempts, lastAuthError, isRetrying]);

  const recoverFromDismiss = signIn; // stable via useCallback
  const extractTokensFromUrl = React.useCallback(() => null, []);
  const clearResponse = React.useCallback(() => {
    console.log('🧹 [GoogleAuth] Clearing response state');
    setResponse(null);
    setLastAuthError(null);
  }, []);

  return {
    response,
    handleGoogleLogin,
    promptAsync,
    signIn,
    signOut,
    getCurrentUser,
    processGoogleResponse,
    registerWithGoogle,
    getAuthState,
    // Legacy compatibility
    recoverFromDismiss,
    extractTokensFromUrl, // Not needed with native implementation
    clearResponse,
  };
};

