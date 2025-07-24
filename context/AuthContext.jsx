import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";
import apiService from "../services/api/apiService";
import { isAuthenticated, logoutUser } from "../services/auth";

const AuthContext = createContext(null);

// Global token expiration listener
let authContextInstance = null;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [periodicCheckRunning, setPeriodicCheckRunning] = useState(false);

  // Create stable auth context methods
  const handleTokenExpired = () => {
    console.log("[AuthContext] Token expired - clearing session");
    setUser(null);
    setAccessToken(null);
    setIsLoggedIn(false);
  };

  // Set global reference for APIService to use
  useEffect(() => {
    authContextInstance = { handleTokenExpired };
    return () => {
      authContextInstance = null;
    };
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      try {
        console.log("[AuthContext] Starting user load...");

        // Get stored user data
        const storedUser = await AsyncStorage.getItem("user");
        console.log(
          "[AuthContext] Stored user:",
          storedUser ? "present" : "null"
        );

        // Get stored token directly from AsyncStorage to avoid race conditions
        const storedToken = await AsyncStorage.getItem("accessToken");
        console.log(
          "[AuthContext] Stored token:",
          storedToken ? "present" : "null"
        );

        if (storedUser && storedToken) {
          console.log(
            "[AuthContext] Both user and token found, checking authentication..."
          );

          // Set the token in API service first
          const apiService = (await import("../services/api/apiService"))
            .default;
          await apiService.setAccessToken(storedToken);

          // Check if authenticated (this will try to refresh if token is expired)
          let authStatus = await isAuthenticated();
          console.log(
            "[AuthContext] Initial authentication status:",
            authStatus
          );

          // If authentication failed but we have a refresh token, try refreshing
          if (!authStatus) {
            console.log("[AuthContext] Token expired, attempting refresh...");
            try {
              const newToken = await apiService.refreshToken();
              if (newToken) {
                console.log("[AuthContext] Token refreshed successfully");
                authStatus = true; // Refresh was successful
                await AsyncStorage.setItem("accessToken", newToken);
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
            setUser(JSON.parse(storedUser));
            setAccessToken(currentToken);
            setIsLoggedIn(true);
          } else {
            console.log(
              "[AuthContext] Authentication failed, clearing session"
            );
            // Clear invalid session
            await AsyncStorage.multiRemove(["user", "accessToken"]);
            setUser(null);
            setAccessToken(null);
            setIsLoggedIn(false);
          }
        } else {
          console.log("[AuthContext] No stored user or token found");
          // Clear any partial data
          await AsyncStorage.multiRemove(["user", "accessToken"]);
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

  // Periodic token refresh (every 5 minutes when user is logged in)
  useEffect(() => {
    if (!isLoggedIn || !accessToken) return;

    const interval = setInterval(async () => {
      // Prevent multiple simultaneous checks
      if (periodicCheckRunning) return;
      
      try {
        setPeriodicCheckRunning(true);
        console.log("[AuthContext] Performing periodic token refresh check...");
        
        // Try to proactively refresh the token if needed
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
        // If there's an error, do a final auth check
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
    }, 5 * 60 * 1000); // Check every 5 minutes (more reasonable interval)

    return () => clearInterval(interval);
  }, [isLoggedIn, accessToken, periodicCheckRunning]);

  const login = async (userData, token) => {
    try {
      console.log("[AuthContext] Login function called");
      console.log("[AuthContext] User data:", userData ? "present" : "null");
      console.log("[AuthContext] Token:", token ? "present" : "null");

      // Store user data
      await AsyncStorage.setItem("user", JSON.stringify(userData));

      // Set the token in API service
      const apiService = (await import("../services/api/apiService")).default;
      await apiService.setAccessToken(token);

      // Update context state
      setUser(userData);
      setAccessToken(token);
      setIsLoggedIn(true);

      console.log("[AuthContext] Login completed successfully");
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
      // Force logout locally even if backend call fails
      setUser(null);
      setAccessToken(null);
      setIsLoggedIn(false);
    }
  };

  const updateToken = (newToken) => {
    setAccessToken(newToken);
  };

  // Helper function to get session info
  const getSessionInfo = () => {
    if (!accessToken) return null;
    
    try {
      // Decode JWT to get expiration time
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

// Export function for APIService to notify token expiration
export const notifyTokenExpired = () => {
  if (authContextInstance && authContextInstance.handleTokenExpired) {
    authContextInstance.handleTokenExpired();
  }
};
