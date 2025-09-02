import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import LoginForm from "../components/auth/LoginForm";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../services/auth";
import { useGoogleAuth } from "../services/googleAuth";
import { getLoggedInUser } from "../utils/authUtils";

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [checkingUser, setCheckingUser] = useState(true);
  const { login, isLoggedIn, user, deliveryStatus, refreshDeliveryStatus, logout } = useAuth();
  const { 
    response, 
    handleGoogleLogin, 
    processGoogleResponse, 
    recoverFromDismiss, 
    getAuthState, 
    extractTokensFromUrl,
    clearResponse,
  } = useGoogleAuth();

  // Track processed Google responses to avoid loops
  const processedGoogleOnceRef = useRef(false);
  const isProcessingRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      const checkUser = async () => {
        try {
          console.log("[LoginScreen] Checking auth state...");
          console.log("[LoginScreen] AuthContext isLoggedIn:", isLoggedIn);
          console.log("[LoginScreen] AuthContext user:", user);

          if (isLoggedIn && user) {
            if (user.role === "delivery") {
              console.log("[LoginScreen] User is delivery, checking delivery status", deliveryStatus);
              const updatedStatus = await refreshDeliveryStatus();
              console.log("[LoginScreen] Delivery status after refresh:", updatedStatus);

              // Check if user is approved (prioritize isApproved field)
              if (user.isApproved === true || (updatedStatus === "approved" && user.isApproved)) {
                router.replace("/delivery/dashboard");
              } else if (updatedStatus === "pending" || updatedStatus === "declined") {
                router.replace("/waitingForApproval");
              } else {
                await logout();
                router.replace("/login");
                Alert.alert(
                  "Access Denied",
                  "Please contact support for assistance."
                );
              }

            } else {
              console.log(
                "[LoginScreen] User already logged in, redirecting to home"
              );
              router.replace("/home");
            }
            return;
          }

          const savedUser = await getLoggedInUser();
          console.log("[LoginScreen] Saved user result:", savedUser)
          setCheckingUser(false);
        } catch (err) {
          console.error("[LoginScreen] Error checking user:", err);
          setCheckingUser(false);
        }
      };

      // Reset processing flags when screen comes into focus
      console.log('[LoginScreen] useFocusEffect - resetting processing flags');
      processedGoogleOnceRef.current = false;
      isProcessingRef.current = false;

      checkUser();
      
      return () => {
        console.log('[LoginScreen] useFocusEffect cleanup - resetting processing flags');
        processedGoogleOnceRef.current = false;
        isProcessingRef.current = false;
      };
    }, [deliveryStatus, isLoggedIn, refreshDeliveryStatus, user, logout])
  );

  // Enhanced Google OAuth response handling
  const processGoogleAuthResponse = useCallback(async (authResponse) => {
    console.log('🔍 [LoginScreen] Processing auth response:', authResponse);
    
    // Prevent concurrent processing
    if (isProcessingRef.current) {
      console.log('⚠️ [LoginScreen] Already processing a Google response, skipping');
      return;
    }
    
    // Enhanced handling for success responses (including extracted token responses)
    if (authResponse?.type === 'success' || authResponse?.userData) {
      console.log('✅ [LoginScreen] Got successful Google response!');
      isProcessingRef.current = true;
      setLoading(true);
      
      try {
        console.log('[LoginScreen] Processing Google response...');
        const backendResponse = await processGoogleResponse(authResponse);
        
        if (backendResponse?.exists) {
          // User exists, log them in
          const { user, accessToken } = backendResponse;
          await login(user, accessToken);
          
          if (user.role === "delivery") {
            const updatedStatus = await refreshDeliveryStatus();
            if (user.isApproved === true || (updatedStatus === "approved" && user.isApproved)) {
              router.replace("/delivery/dashboard");
            } else if (updatedStatus === "pending" || updatedStatus === "declined") {
              router.replace("/waitingForApproval");
            } else {
              await logout();
              Alert.alert("Access Denied", "Please contact support for assistance.");
            }
          } else {
            router.replace("/home");
          }
        } else {
          // New user, redirect to registration with Google data
          console.log('[LoginScreen] New Google user, redirecting to registration...');
          const idToken = authResponse.params?.id_token || authResponse.params?.access_token;
          const serverAuthCode = authResponse.params?.server_auth_code;
          
          console.log('[LoginScreen] Available auth data - idToken:', !!idToken, 'serverAuthCode:', !!serverAuthCode);
          
          // Clear the response before navigation to prevent re-processing
          clearResponse?.();
          
          router.push({
            pathname: '/register',
            params: {
              provider: 'google',
              email: backendResponse.user.email,
              name: backendResponse.user.name,
              image: backendResponse.user.image,
              idToken: idToken,
              serverAuthCode: serverAuthCode || '', // Pass server auth code
            },
          });
        }
      } catch (error) {
        console.error('[LoginScreen] Google login error:', error);
        Alert.alert(
          'Google Login Failed', 
          'Authentication encountered an issue. Please try again.'
        );
      } finally {
        setLoading(false);
        isProcessingRef.current = false;
        // Clear response after handling to avoid re-processing loops
        clearResponse?.();
      }
    } else if (authResponse?.type === 'error') {
      console.error('[LoginScreen] Google auth error:', authResponse.error);
      Alert.alert('Google Login Error', 'Authentication failed. Please try again.');
      isProcessingRef.current = false;
    } else if (authResponse?.type === 'cancel') {
      console.log('⚠️ [LoginScreen] User cancelled Google login');
      isProcessingRef.current = false;
    } else if (authResponse?.type === 'dismiss') {
      console.log('⚠️ [LoginScreen] Google login was dismissed - attempting recovery...');
      
      // Check if this is the special Metro disconnect case
      if (authResponse?.message === 'Metro disconnect detected') {
        console.log('[LoginScreen] Metro disconnect case detected');
        isProcessingRef.current = false;
        // No alert shown for Metro disconnect interruption
        return;
      }
      
      // Enhanced dismiss handling with automatic recovery for cases with URL
      if (authResponse?.url) {
        console.log('[LoginScreen] Attempting to recover from dismissed auth...');
        try {
          const recoveredResponse = recoverFromDismiss(authResponse);
          if (recoveredResponse) {
            console.log('[LoginScreen] Successfully recovered from dismissed auth!');
            // Process the recovered response
            return await processGoogleAuthResponse(recoveredResponse);
          } else {
            console.log('[LoginScreen] Could not recover from dismissed auth');
            isProcessingRef.current = false;
            // No alert shown for interrupted auth
          }
        } catch (recoveryError) {
          console.error('[LoginScreen] Error during dismiss recovery:', recoveryError);
          isProcessingRef.current = false;
        }
      } else {
        console.log('[LoginScreen] Dismiss without URL - development guidance (no alert)');
        isProcessingRef.current = false;
      }
    } else if (authResponse) {
      console.log('🤔 [LoginScreen] Unexpected response type:', authResponse.type);
      
      // Log additional debug information
      console.log('🔍 [LoginScreen] Debug - Auth state:', getAuthState());
      
      if (authResponse.url) {
        console.log('🔍 [LoginScreen] Response contains URL, checking for tokens...');
        const extracted = extractTokensFromUrl(authResponse.url);
        if (extracted) {
          console.log('[LoginScreen] Found tokens in unexpected response, processing...');
          // Process the extracted tokens
          return await processGoogleAuthResponse(extracted);
        }
      }
      isProcessingRef.current = false;
    } else {
      console.log('🔍 [LoginScreen] Response is null/undefined');
      isProcessingRef.current = false;
    }
  }, [processGoogleResponse, login, refreshDeliveryStatus, logout, recoverFromDismiss, getAuthState, extractTokensFromUrl, clearResponse]);
  
  useEffect(() => {
    console.log('🔄 [LoginScreen] useEffect triggered with response:', response, 'processed flag:', processedGoogleOnceRef.current);
    
    if (!response) {
      // Reset processing flag when response is cleared
      processedGoogleOnceRef.current = false;
      console.log('🔄 [LoginScreen] Response is null, reset processed flag');
      return;
    }
    
    if (processedGoogleOnceRef.current) {
      console.log('🔄 [LoginScreen] Google response already processed, skipping');
      return;
    }
    
    console.log('🔄 [LoginScreen] Processing new Google response');
    processedGoogleOnceRef.current = true;
    
    processGoogleAuthResponse(response).catch((error) => {
      console.error('[LoginScreen] Error in Google response processing:', error);
      // Reset flag on error to allow retry
      processedGoogleOnceRef.current = false;
      isProcessingRef.current = false;
    });
  }, [response, processGoogleAuthResponse]);

  const handleLogin = async ({ email, password }) => {
    email = email.trim().toLowerCase();
    if (loading) {
      console.log(
        "[Login] Already processing login, ignoring duplicate request"
      );
      return;
    }

    setLoading(true);
    console.log("[Login] Starting login process for:", email);

    if (!email || !password) {
      Alert.alert("Missing Fields", "Email and password are required.");
      setLoading(false);
      return;
    }

    try {
      const { user, accessToken, deliveryStatus } = await loginUser({ email, password });
      console.log("[Login] Login API call successful");

      console.log("[Login] user:", user);
      console.log("[Login] accessToken:", accessToken);

      await login(user, accessToken, deliveryStatus);
      console.log("[Login] AuthContext updated successfully");
      console.log("[Login] user after await login:", user);

      if (user.role === "delivery") {
        console.log("[Login] User is delivery, checking delivery status");
        console.log("delivertyStatus:", deliveryStatus);
        if (deliveryStatus === 'pending' || deliveryStatus === 'declined') {
          router.replace("/waitingForApproval");
        }
        else if (user.isApproved && deliveryStatus === 'approved') {
          router.replace("/delivery/dashboard");
        } else {
          await logout();
          Alert.alert(
            "Access Denied",
            "Please contact support for assistance."
          );
          router.replace("/login");
        }
      } else {
        router.replace("/home");
      }
    } catch (_error) {
  // Provide a friendly message for authentication failures and avoid spamming the console.
  const err = _error || {};
  const msg = err.response?.data?.message || err.message || 'Please check your credentials and try again.';
  Alert.alert('Login failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginPress = async () => {
    if (loading) return;
    
    try {
      console.log('[LoginScreen] Starting Google login...');
      
      // Reset processing flags before starting new Google sign-in
      console.log('[LoginScreen] Resetting processing flags before Google sign-in');
      processedGoogleOnceRef.current = false;
      isProcessingRef.current = false;
      
      await handleGoogleLogin();
    } catch (error) {
      console.error('[LoginScreen] Google login initiation error:', error);
      Alert.alert('Google Login Error', 'Failed to start Google authentication.');
    }
  };

  // Don't render anything while checking user state
  if (checkingUser) {
    return null;
  }

  const handleForgotPassword = () => {
    router.push("/forgotPassword");
  };

  return (
    <View style={styles.screen}>
      <LoginForm 
        onSubmit={handleLogin} 
        loading={loading} 
        onGoogleLogin={handleGoogleLoginPress}
        handleForgotPassword={handleForgotPassword}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
