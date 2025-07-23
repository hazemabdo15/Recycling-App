import { Alert } from 'react-native';
import apiService from './api/apiService';

/**
 * Enhanced Authentication Service with proper JWT token handling
 * Integrates with backend API specification
 */

export const loginUser = async ({ email, password }) => {
  try {
    console.log('[Auth] Sending login request for:', email);
    
    const response = await apiService.post('/auth/login', {
      email,
      password,
    });

    console.log('[Auth] Login successful');
    
    // Store access token
    if (response.accessToken) {
      await apiService.setAccessToken(response.accessToken);
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
    
    // Store access token
    if (response.accessToken) {
      await apiService.setAccessToken(response.accessToken);
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
    console.log('[Auth] Logging out user');
    
    // Try to logout from backend (this will clear refresh token cookie)
    try {
      await apiService.post('/auth/logout');
    } catch (_error) {
      // Even if backend logout fails, we should clear local tokens
      console.warn('[Auth] Backend logout failed, clearing local tokens anyway');
    }
    
    // Clear local tokens
    await apiService.clearTokens();
    console.log('[Auth] Logout successful');
    
  } catch (error) {
    console.error('[Auth] Logout error:', error.message);
    // Still clear local tokens even if there's an error
    await apiService.clearTokens();
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