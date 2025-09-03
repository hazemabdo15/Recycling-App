import { createContext, useCallback, useContext, useEffect, useState } from "react";
import optimizedApiService from "../services/api/apiService";
import { isAuthenticated, logoutUser } from "../services/auth";
import { clearSession, getAccessToken, getLoggedInUser, setLoggedInUser, setAccessToken as storeAccessToken } from '../utils/authUtils';
import { smartWarmServer } from '../utils/serverWarming';

const AuthContext = createContext(null);

let authContextInstance = null;


const checkPublicDeliveryStatus = async (email) => {
  if (!email) {
    console.warn("[AuthContext] No delivery ID provided for public status check");
    return null;
  }

  try {
    console.log("[AuthContext] Checking public delivery status for:", email);
    const statusData = await optimizedApiService.post("/auth/check-delivery-status", { email });
    console.log("[AuthContext] Public delivery status check result:", statusData);
    return statusData.deliveryStatus || null;
  } catch (error) {
    console.error("[AuthContext] Error checking public delivery status:", error);
    return null;
  }
};


export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [periodicCheckRunning, setPeriodicCheckRunning] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState(null);

  // Persist user to AsyncStorage whenever setUser is called
  const setUser = useCallback(
    async (newUserOrUpdater) => {
      // Support function updater (like React's setState)
      setUserState((prevUser) => {
        const newUser = typeof newUserOrUpdater === 'function' ? newUserOrUpdater(prevUser) : newUserOrUpdater;
        console.log('[AuthContext] setUser called. New user:', newUser);
        // Persist only if not undefined/null
        if (newUser) {
          setLoggedInUser(newUser, deliveryStatus).catch((e) => {
            console.error('[AuthContext] Failed to persist user to storage:', e);
          });
        }
        return newUser;
      });
    },
    [deliveryStatus]
  );

  const refreshDeliveryStatus = async () => {
  if (!user || !user._id) {
    console.warn("[AuthContext] Cannot refresh delivery status without a valid user");
    return null;
  }

  try {
    const response = await optimizedApiService.get("/delivery-status");
    console.log("[AuthContext] Refreshed delivery status:", response);

    const updatedStatus = response?.deliveryStatus || null;
    setDeliveryStatus(updatedStatus);
    
    // Update user object and persist to storage
    const updatedUser = { ...user, deliveryStatus: updatedStatus };
    setUser(updatedUser);

    return updatedStatus;
  } catch (error) {
    console.error("[AuthContext] Error refreshing delivery status:", error);
    return null;
  }
};

  const handleTokenExpired = useCallback(async () => {
    console.log('[AuthContext] handleTokenExpired() called - clearing auth state');
    console.log('[AuthContext] Stack trace:', new Error().stack);
    
    setUser(null);
    setAccessToken(null);
    setIsLoggedIn(false);
    
    // Clear token from API service
    try {
      await optimizedApiService.setAccessToken(null);
      console.log('[AuthContext] API service token cleared in handleTokenExpired');
    } catch (error) {
      console.error('[AuthContext] Error clearing API service token:', error);
    }
  }, [setUser]);

  useEffect(() => {
    authContextInstance = { handleTokenExpired };
    return () => {
      authContextInstance = null;
    };
  }, [handleTokenExpired]);

  useEffect(() => {
    const loadStoredUser = async () => {
      try {
        console.log('[AuthContext] Loading stored auth state...');
        const [storedUser, storedToken] = await Promise.all([
          getLoggedInUser(),
          getAccessToken(),
        ]);

        console.log('[AuthContext] Retrieved stored user:', storedUser ? 'present' : 'null');
        console.log('[AuthContext] Retrieved stored token:', storedToken ? 'present' : 'null', 'length:', storedToken?.length || 0);

        // Normalize user object: ensure _id exists
        let normalizedUser = storedUser;
        if (storedUser && !storedUser._id && storedUser.id) {
          normalizedUser = { ...storedUser, _id: storedUser.id };
          console.log('[AuthContext] Normalized user object to add _id:', normalizedUser);
        }

        console.log('[AuthContext] Loading stored user:', normalizedUser);
        console.log('[AuthContext] Stored user role:', normalizedUser?.role);
        if (normalizedUser && storedToken) {
          console.log('[AuthContext] Both user and token found, setting auth state');
          console.log('[AuthContext] About to set user from storage. User:', normalizedUser);
          
          // Update API service with the stored token
          await optimizedApiService.setAccessToken(storedToken);
          console.log('[AuthContext] API service updated with stored token');
          
          setUser(normalizedUser);
          setAccessToken(storedToken);
          setIsLoggedIn(true);
          
          // Set delivery status if user is a delivery user
          if (normalizedUser.role === 'delivery' && normalizedUser.deliveryStatus) {
            console.log('[AuthContext] Setting delivery status from stored user:', normalizedUser.deliveryStatus);
            setDeliveryStatus(normalizedUser.deliveryStatus);
          }
          
          // Warm up server in background after successful auth
          console.log('[AuthContext] Starting server warming for role:', normalizedUser.role);
          smartWarmServer({ 
            role: normalizedUser.role || 'customer', 
            silent: true 
          }).catch(error => {
            console.log('[AuthContext] Server warming failed (non-critical):', error.message);
          });
        } else {
          console.log('[AuthContext] Missing user or token, staying logged out');
          console.log('[AuthContext] - User present:', !!normalizedUser);
          console.log('[AuthContext] - Token present:', !!storedToken);
          
          // Even for guests, try to warm the server with default role
          console.log('[AuthContext] Starting server warming for guest user');
          smartWarmServer({ 
            role: 'customer', 
            silent: true 
          }).catch(error => {
            console.log('[AuthContext] Server warming failed (non-critical):', error.message);
          });
        }
      } catch (error) {
        console.error("[AuthContext] Error loading stored user:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadStoredUser();
  }, [setUser]);

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

          const refreshSuccess = await optimizedApiService.refreshIfNeeded();
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

  const login = async (userData, token, deliveryStatus = null) => {
    try {
      console.log('[AuthContext] Login called with userData:', userData);
      console.log('[AuthContext] User role from login:', userData?.role);
      console.log('[AuthContext] Access token provided:', token ? 'yes' : 'no', 'length:', token?.length || 0);
      console.log('[AuthContext] Full user data:', JSON.stringify(userData, null, 2));

      await setLoggedInUser(userData, deliveryStatus);
      console.log('[AuthContext] User data stored successfully');
      
      await storeAccessToken(token);
      console.log('[AuthContext] Access token stored in SecureStore');

      // Update API service with the new token
      await optimizedApiService.setAccessToken(token);
      console.log('[AuthContext] API service updated with new token');

      setUser(userData);
      setAccessToken(token);
      console.log('[AuthContext] User and token set in state');
      
      setIsLoggedIn(true);
      console.log('[AuthContext] Login state set to true');
      
      // Warm up server for the newly logged in user
      console.log('[AuthContext] Starting server warming after login for role:', userData?.role);
      smartWarmServer({ 
        role: userData?.role || 'customer', 
        silent: true 
      }).catch(error => {
        console.log('[AuthContext] Server warming after login failed (non-critical):', error.message);
      });
      
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

      // Clear token from API service
      await optimizedApiService.setAccessToken(null);
      console.log("[AuthContext] API service cleared");

      // Clear all session data including session ID
      await clearSession();
      console.log("[AuthContext] Session data cleared");

      await logoutUser();
      
      console.log("[AuthContext] Logout completed successfully");
    } catch (error) {
      console.error("Logout error:", error);

      console.log("[AuthContext] Ensuring local state is cleared despite logout error...");
      setUser(null);
      setAccessToken(null);
      setIsLoggedIn(false);
      
      // Ensure session is cleared even on error
      try {
        await clearSession();
        console.log("[AuthContext] Session data cleared despite error");
      } catch (clearError) {
        console.error("[AuthContext] Error clearing session:", clearError);
      }
      
      console.log("[AuthContext] Logout completed with errors (local state cleared)");
    }
  };

  const updateToken = useCallback(async (newToken) => {
    if (newToken !== accessToken) {
      console.log('[AuthContext] Updating token:', newToken ? `${newToken.substring(0, 20)}...` : 'null');
      
      // Update both SecureStore and API service
      if (newToken) {
        await storeAccessToken(newToken);
        await optimizedApiService.setAccessToken(newToken);
        console.log('[AuthContext] Token updated in storage and API service');
      }
      
      setAccessToken(newToken);
    }
  }, [accessToken]);

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
    deliveryStatus,
    setDeliveryStatus,
    checkPublicDeliveryStatus,
    refreshDeliveryStatus,
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
