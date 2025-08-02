import { Alert } from 'react-native';
import { clearSession, setAccessToken } from '../utils/authUtils';
import apiService from './api/apiService';

export const loginUser = async ({ email, password }) => {
  try {
    console.log('[Auth] Sending login request for:', email);
    
    const response = await apiService.post('/auth/login', {
      email,
      password,
    });

    console.log('[Auth] Login successful');
    console.log('[Auth] Login response user data:', response.user);
    console.log('[Auth] User role from backend:', response.user?.role);
    console.log('[Auth] Full login response:', JSON.stringify(response, null, 2));

    if (response.accessToken) {
      await setAccessToken(response.accessToken);

      await apiService.setAccessToken(response.accessToken);
      console.log('[Auth] Token set in both AsyncStorage and APIService');
    }

    return response;
  } catch (error) {
    console.error('[Auth] Login error:', error.message);
    throw error;
  }
};

export const initialSetupForRegister = async (email) => {
  try {
    console.log('[Auth] Initiating signup for:', email);
    
    const response = await apiService.post('/auth/initiateSignup', { email });
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
    console.log('[Auth] Registration data:', { 
      name: fullName, 
      email, 
      phoneNumber: number, 
      otpCode, 
      role, 
      provider 
    });
    
    const response = await apiService.post('/auth/verifyRegisterToken', {
      name: fullName,
      email,
      password,
      phoneNumber: number,
      otpCode,
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
    Alert.alert('Error', error.message || 'Registration failed');
    throw error;
  }
};

export const forgotPassword = async (email) => {
  try {
    console.log('[Auth] Requesting password reset for:', email);
    
    const response = await apiService.post('/auth/forgotPassword', { email });
    console.log('[Auth] Password reset OTP sent');
    
    return response;
  } catch (error) {
    console.error('[Auth] Forgot password error:', error.message);
    throw error;
  }
};

export const resetPassword = async (email, otpCode, newPassword) => {
  try {
    console.log('[Auth] Resetting password for:', email);
    
    const response = await apiService.post('/auth/resetPassword', {
      email,
      otpCode,
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
      await apiService.post('/auth/logout');
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