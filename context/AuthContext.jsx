import { createContext, useCallback, useContext, useEffect, useState } from "react";
import apiService from "../services/api/apiService";
import { isAuthenticated, logoutUser } from "../services/auth";
import { clearSession, getAccessToken, getLoggedInUser, setLoggedInUser } from '../utils/authUtils';

const AuthContext = createContext(null);

let authContextInstance = null;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [periodicCheckRunning, setPeriodicCheckRunning] = useState(false);

  const handleTokenExpired = useCallback(() => {
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
    const loadUser = async () => {
      try {
        console.log("[AuthContext] Starting user load...");

        const storedUser = await getLoggedInUser();
        const storedToken = await getAccessToken();

        if (storedUser && storedToken) {
          console.log(
            "[AuthContext] Both user and token found, checking authentication..."
          );

          const apiService = (await import("../services/api/apiService"))
            .default;
          await setAccessToken(storedToken);

          let authStatus = await isAuthenticated();
          console.log(
            "[AuthContext] Initial authentication status:",
            authStatus
          );

          if (!authStatus) {
            console.log("[AuthContext] Token expired, attempting refresh...");
            try {
              const newToken = await apiService.refreshToken();
              if (newToken) {
                console.log("[AuthContext] Token refreshed successfully");
                authStatus = true;
            await setAccessToken(newToken);
              } else {
                console.log("[AuthContext] Token refresh failed");
                authStatus = false;
              }
            } catch (error) {
              console.log("[AuthContext] Token refresh error:", error.message);
              authStatus = false;
            }
          }

          if (authStatus) {
            console.log("[AuthContext] User authenticated successfully");
            const currentToken = await apiService.getAccessToken();
            setUser(storedUser);
            setAccessToken(currentToken);
            setIsLoggedIn(true);
          } else {
            console.log(
              "[AuthContext] Authentication failed, clearing session"
            );

            await clearSession();
            setUser(null);
            setAccessToken(null);
            setIsLoggedIn(false);
          }
        } else {
          console.log("[AuthContext] No stored user or token found");

          await clearSession();
          setUser(null);
          setAccessToken(null);
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error("[AuthContext] Error loading user:", error);
        setUser(null);
        setAccessToken(null);
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !accessToken) return;

    console.log("[AuthContext] Setting up periodic token refresh (10 min intervals)");

    const interval = setInterval(async () => {

      if (periodicCheckRunning) {
        console.log("[AuthContext] Periodic check already running, skipping");
        return;
      }
      
      try {
        setPeriodicCheckRunning(true);
        console.log("[AuthContext] Performing periodic token refresh check...");

        const refreshSuccess = await apiService.refreshIfNeeded();
        
        if (!refreshSuccess) {
          console.log("[AuthContext] Token refresh failed - checking authentication");
          const authStatus = await isAuthenticated();
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

    return () => {
      console.log("[AuthContext] Clearing periodic token refresh interval");
      clearInterval(interval);
    };
  }, [isLoggedIn, accessToken, periodicCheckRunning, handleTokenExpired]);

  const login = async (userData, token) => {
    try {

      await setLoggedInUser(userData);
      await setAccessToken(token);

      setUser(userData);
      setAccessToken(token);
      setIsLoggedIn(true);
    } catch (error) {
      console.error("[AuthContext] Error in login function:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      setUser(null);
      setAccessToken(null);
      setIsLoggedIn(false);
    } catch (error) {
      console.error("Logout error:", error);

      setUser(null);
      setAccessToken(null);
      setIsLoggedIn(false);
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
  if (authContextInstance && authContextInstance.handleTokenExpired) {
    authContextInstance.handleTokenExpired();
  }
};
