import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { clearSession, setAccessToken, setDeliveryStatus } from '../utils/authUtils';
import apiService from './api/apiService';
import { API_ENDPOINTS } from './api/config';

export const loginUser = async ({ email, password }) => {
  try {
    console.log('[Auth] Sending login request for:', email);

    // Ensure login request is sent without any stale Authorization header.
    const previousToken = apiService.accessToken;
    let response = null;
    try {
      apiService.accessToken = null;
      response = await apiService.post(API_ENDPOINTS.AUTH.LOGIN, {
        email,
        password,
      });
    } finally {
      // always restore previous token
      apiService.accessToken = previousToken;
    }
    console.log('[Auth] Login successful');
    console.log('[Auth] Full login response:', JSON.stringify(response, null, 2));

    let deliveryStatus = null;
    let sessionDeliveryData = null;

    if (response.user?.role === 'delivery') {
      console.log('[Auth] Delivery user detected');

      if (response.message === 'Delivery application declined') {
        deliveryStatus = 'declined';
        console.log('[Auth] Delivery application declined');

        sessionDeliveryData = {
          deliveryStatus: 'declined',
          reason: response.declineReason,
          declinedAt: response.declinedAt,
          canReapply: response.canReapply,
          user: response.user,
        };

        await AsyncStorage.setItem('deliveryUserData', JSON.stringify(sessionDeliveryData));
      } else if (response.message === 'Delivery application pending approval') {
        deliveryStatus = 'pending';
        console.log('[Auth] Delivery application pending');

        sessionDeliveryData = {
          deliveryStatus: 'pending',
          user: response.user,
        };

        await AsyncStorage.setItem('deliveryUserData', JSON.stringify(sessionDeliveryData));
      } else if (response.user?.isApproved) {
        deliveryStatus = 'approved';
        console.log('[Auth] Delivery application approved');
      }

      if (deliveryStatus) {
        await setDeliveryStatus(deliveryStatus);
      }
    }

    if (response.accessToken) {
      await setAccessToken(response.accessToken);
      await apiService.setAccessToken(response.accessToken);
      console.log('[Auth] Token set in both AsyncStorage and APIService');
    }

    return {
      user: response.user,
      accessToken: response.accessToken,
      deliveryStatus,
    };
  } catch (error) {
  // Avoid noisy console.error for expected login failures (wrong credentials).
  // Log as a warning for developers but do not treat it as a crash-level error.
  console.warn('[Auth] Login failed');
  // Re-throw the original error so callers can handle it and show friendly UI messages.
  throw error;
  }
};


export const initialSetupForRegister = async (email) => {
  try {
    console.log('[Auth] Initiating signup for:', email);
    
    const response = await apiService.post(API_ENDPOINTS.AUTH.REGISTER_INIT, { email });
    console.log('[Auth] OTP sent successfully');
    
    return response;
  } catch (error) {
    console.error('[Auth] Initiate signup error:', error.message);
    throw error;
  }
};

export const completeRegister = async (
  fullName,
  email,
  password,
  number,
  otpCode,
  role = 'customer',
  provider = 'none'
) => {
  try {
    console.log('[Auth] Completing registration for:', email);
    console.log('[Auth] Step 1: Verifying OTP...');
    console.log('[Auth] OTP endpoint:', API_ENDPOINTS.AUTH.REGISTER_VERIFY_OTP);
    
    // Step 1: Verify the OTP
    await apiService.post(API_ENDPOINTS.AUTH.REGISTER_VERIFY_OTP, {
      email,
      otpCode,
    });
    
    console.log('[Auth] OTP verified successfully');
    
    // Step 2: Create the user account
    console.log('[Auth] Step 2: Creating user account...');
    console.log('[Auth] Create user endpoint:', API_ENDPOINTS.AUTH.REGISTER_CREATE_USER);
    const response = await apiService.post(API_ENDPOINTS.AUTH.REGISTER_CREATE_USER, {
      name: fullName,
      email,
      password,
      phoneNumber: number,
      role,
      provider,
    });

    console.log('[Auth] Registration successful');
    console.log('[Auth] Registration response:', response);

    if (response.accessToken) {
      await setAccessToken(response.accessToken);
    }

    return response;
  } catch (error) {
    console.error('[Auth] Registration error:', error.message);
    console.error('[Auth] Error details:', error);
    Alert.alert('Error', error.message || 'Registration failed');
    throw error;
  }
};

export const forgotPassword = async (email) => {
  try {
    console.log('[Auth] Requesting password reset for:', email);
    
    const response = await apiService.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
    console.log('[Auth] Password reset OTP sent');
    
    return response;
  } catch (error) {
    console.error('[Auth] Forgot password error:', error.message);
    throw error;
  }
};

export const resetPassword = async ({ email, otpCode, newPassword }) => {
  try {
    console.log('[Auth] Resetting password for:', email);
    console.log("email: ", email)
    console.log("otp: ", otpCode)
    console.log("newPassword: ", newPassword)
    const response = await apiService.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
      email,
      otpCode: otpCode,
      newPassword
    });
    
    console.log('[Auth] Password reset successful');
    return response;
  } catch (error) {
    console.error('[Auth] Reset password error:', error.message);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    console.log('[Auth] Starting logout process...');

    try {
      await apiService.post(API_ENDPOINTS.AUTH.LOGOUT);
      console.log('[Auth] Backend logout successful');
    } catch (backendError) {
      console.warn('[Auth] Backend logout failed, continuing with local cleanup:', backendError.message);
    }

    await clearSession();

    if (apiService.resetAuthState) {
      apiService.resetAuthState();
    }
    
    console.log('[Auth] Logout process completed');
  } catch (error) {
    console.error('[Auth] Critical error during logout, forcing cleanup:', error.message);

    await clearSession();
    
    if (apiService.resetAuthState) {
      apiService.resetAuthState();
    }
    
    throw error;
  }
};

export const refreshAccessToken = async () => {
  try {
    console.log('[Auth] Refreshing access token');
    
    const newToken = await apiService.refreshToken();
    if (newToken) {
      console.log('[Auth] Token refreshed successfully');
      return newToken;
    } else {
      console.warn('[Auth] Token refresh failed');
      return null;
    }
  } catch (error) {
    console.error('[Auth] Token refresh error:', error.message);
    return null;
  }
};

export const getCurrentToken = async () => {
  return await apiService.getAccessToken();
};

export const isAuthenticated = async () => {
  return await apiService.isAuthenticated();
};
