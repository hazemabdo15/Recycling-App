import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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
    extractTokensFromUrl 
  } = useGoogleAuth();

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

      checkUser();
    }, [deliveryStatus, isLoggedIn, refreshDeliveryStatus, user, logout])
  );

  // Enhanced Google OAuth response handling
  const processGoogleAuthResponse = useCallback(async (authResponse) => {
    console.log('🔍 [LoginScreen] Processing auth response:', authResponse);
    
    // Enhanced handling for success responses (including extracted token responses)
    if (authResponse?.type === 'success' || authResponse?.userData) {
      console.log('✅ [LoginScreen] Got successful Google response!');
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
          router.push({
            pathname: '/register',
            params: {
              provider: 'google',
              email: backendResponse.user.email,
              name: backendResponse.user.name,
              image: backendResponse.user.image,
              idToken: idToken,
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
      }
    } else if (authResponse?.type === 'error') {
      console.error('[LoginScreen] Google auth error:', authResponse.error);
      Alert.alert('Google Login Error', 'Authentication failed. Please try again.');
    } else if (authResponse?.type === 'cancel') {
      console.log('⚠️ [LoginScreen] User cancelled Google login');
    } else if (authResponse?.type === 'dismiss') {
      console.log('⚠️ [LoginScreen] Google login was dismissed - attempting recovery...');
      
      // Check if this is the special Metro disconnect case
      if (authResponse?.message === 'Metro disconnect detected') {
  console.log('[LoginScreen] Metro disconnect case detected');
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
            // No alert shown for interrupted auth
          }
        } catch (recoveryError) {
          console.error('[LoginScreen] Error during dismiss recovery:', recoveryError);
        }
      } else {
  console.log('[LoginScreen] Dismiss without URL - development guidance (no alert)');
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
    } else {
      console.log('🔍 [LoginScreen] Response is null/undefined');
    }
  }, [processGoogleResponse, login, refreshDeliveryStatus, logout, recoverFromDismiss, getAuthState, extractTokensFromUrl]);
  
  useEffect(() => {
    if (response) {
      processGoogleAuthResponse(response);
    }
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

      Alert.alert(
        "Login failed",
        "Please check your credentials and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginPress = async () => {
    if (loading) return;
    
    try {
      console.log('[LoginScreen] Starting Google login...');
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
