import { createContext, useCallback, useContext, useEffect, useState } from "react";
import apiService from "../services/api/apiService";
import { isAuthenticated, logoutUser } from "../services/auth";
import { getAccessToken, getLoggedInUser, setLoggedInUser } from '../utils/authUtils';

const AuthContext = createContext(null);

let authContextInstance = null;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [periodicCheckRunning, setPeriodicCheckRunning] = useState(false);

  const handleTokenExpired = useCallback(() => {
    console.log('[AuthContext] handleTokenExpired() called - clearing auth state');
    console.log('[AuthContext] Stack trace:', new Error().stack);
    
    setUser(null);
    setAccessToken(null);
    setIsLoggedIn(false);
  }, []);

  useEffect(() => {
    authContextInstance = { handleTokenExpired };
    return () => {
      authContextInstance = null;
    };
  }, [handleTokenExpired]);

  useEffect(() => {
    const loadStoredUser = async () => {
      try {
        const [storedUser, storedToken] = await Promise.all([
          getLoggedInUser(),
          getAccessToken(),
        ]);

        console.log('[AuthContext] Loading stored user:', storedUser);
        console.log('[AuthContext] Stored user role:', storedUser?.role);

        if (storedUser && storedToken) {
          setUser(storedUser);
          setAccessToken(storedToken);
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error("[AuthContext] Error loading stored user:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadStoredUser();
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !accessToken) return;

    console.log("[AuthContext] Setting up periodic token refresh (10 min intervals)");

    const initialDelay = setTimeout(() => {
      const interval = setInterval(async () => {

        if (periodicCheckRunning) {
          console.log("[AuthContext] Periodic check already running, skipping");
          return;
        }
        
        try {
          setPeriodicCheckRunning(true);
          console.log("[AuthContext] Performing periodic token refresh check...");

          const refreshSuccess = await apiService.refreshIfNeeded();
          console.log("[AuthContext] Periodic refreshIfNeeded result:", refreshSuccess);
          
          if (!refreshSuccess) {
            console.log("[AuthContext] Token refresh failed - checking authentication");
            const authStatus = await isAuthenticated();
            console.log("[AuthContext] Authentication status after refresh failure:", authStatus);
            if (!authStatus) {
              console.log("[AuthContext] Authentication failed during periodic check - clearing session");
              handleTokenExpired();
            }
          } else {
            console.log("[AuthContext] Periodic token check completed successfully");
          }
        } catch (error) {
          console.error("[AuthContext] Error during periodic token check:", error);

          try {
            const authStatus = await isAuthenticated();
            console.log("[AuthContext] Authentication status after error:", authStatus);
            if (!authStatus) {
              console.log("[AuthContext] Authentication failed after error - clearing session");
              handleTokenExpired();
            }
          } catch (finalError) {
            console.error("[AuthContext] Final auth check failed:", finalError);
            handleTokenExpired();
          }
        } finally {
          setPeriodicCheckRunning(false);
        }
      }, 10 * 60 * 1000);

      initialDelay.intervalRef = interval;
    }, 30 * 1000);

    return () => {
      console.log("[AuthContext] Clearing periodic token refresh interval and initial delay");
      clearTimeout(initialDelay);
      if (initialDelay.intervalRef) {
        clearInterval(initialDelay.intervalRef);
      }
    };
  }, [isLoggedIn, accessToken, periodicCheckRunning, handleTokenExpired]);

  const login = async (userData, token) => {
    try {
      console.log('[AuthContext] Login called with userData:', userData);
      console.log('[AuthContext] User role from login:', userData?.role);
      console.log('[AuthContext] Full user data:', JSON.stringify(userData, null, 2));

      await setLoggedInUser(userData);
      await setAccessToken(token);

      setUser(userData);
      setAccessToken(token);
      setIsLoggedIn(true);
      
      console.log('[AuthContext] Login completed successfully');
      console.log('[AuthContext] Final user state:', userData);
      console.log('[AuthContext] Final user role:', userData?.role);
    } catch (error) {
      console.error("[AuthContext] Error in login function:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log("[AuthContext] Starting logout process...");
      console.log("[AuthContext] Current user before logout:", user);
      console.log("[AuthContext] Current user role before logout:", user?.role);

      console.log("[AuthContext] Clearing user state immediately...");
      setUser(null);
      setAccessToken(null);
      setIsLoggedIn(false);

      await logoutUser();
      
      console.log("[AuthContext] Logout completed successfully");
    } catch (error) {
      console.error("Logout error:", error);

      console.log("[AuthContext] Ensuring local state is cleared despite logout error...");
      setUser(null);
      setAccessToken(null);
      setIsLoggedIn(false);
      
      console.log("[AuthContext] Logout completed with errors (local state cleared)");
    }
  };

  const updateToken = (newToken) => {
    setAccessToken(newToken);
  };

  const getSessionInfo = () => {
    if (!accessToken) return null;
    
    try {

      const parts = accessToken.split('.');
      if (parts.length !== 3) return null;
      
      const base64Payload = parts[1];
      const paddedPayload = base64Payload + '='.repeat((4 - base64Payload.length % 4) % 4);
      const decoded = atob(paddedPayload);
      const payload = JSON.parse(decoded);
      
      const currentTime = Math.floor(Date.now() / 1000);
      const expirationTime = payload.exp;
      const timeUntilExpiry = expirationTime - currentTime;
      
      return {
        expiresAt: new Date(expirationTime * 1000),
        timeUntilExpiry: timeUntilExpiry > 0 ? timeUntilExpiry : 0,
        isExpired: timeUntilExpiry <= 0
      };
    } catch (error) {
      console.error('[AuthContext] Error getting session info:', error);
      return null;
    }
  };

  const value = {
    user,
    setUser,
    loading,
    logout,
    login,
    isLoggedIn,
    accessToken,
    updateToken,
    getSessionInfo,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export const notifyTokenExpired = () => {
  console.log('[AuthContext] notifyTokenExpired() called');
  console.log('[AuthContext] Stack trace:', new Error().stack);
  
  if (authContextInstance && authContextInstance.handleTokenExpired) {
    console.log('[AuthContext] Calling handleTokenExpired()');
    authContextInstance.handleTokenExpired();
  }
};
