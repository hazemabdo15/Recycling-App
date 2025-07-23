import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import { isAuthenticated, logoutUser } from '../services/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [accessToken, setAccessToken] = useState(null);

    useEffect(() => {
        const loadUser = async () => {
            try {
                console.log('[AuthContext] Starting user load...');
                
                // Get stored user data
                const storedUser = await AsyncStorage.getItem('user');
                console.log('[AuthContext] Stored user:', storedUser ? 'present' : 'null');
                
                // Get stored token directly from AsyncStorage to avoid race conditions
                const storedToken = await AsyncStorage.getItem('accessToken');
                console.log('[AuthContext] Stored token:', storedToken ? 'present' : 'null');
                
                if (storedUser && storedToken) {
                    console.log('[AuthContext] Both user and token found, checking authentication...');
                    
                    // Set the token in API service first
                    const apiService = (await import('../services/api/apiService')).default;
                    await apiService.setAccessToken(storedToken);
                    
                    // Check if authenticated (this will try to refresh if token is expired)
                    let authStatus = await isAuthenticated();
                    console.log('[AuthContext] Initial authentication status:', authStatus);
                    
                    // If authentication failed but we have a refresh token, try refreshing
                    if (!authStatus) {
                        console.log('[AuthContext] Token expired, attempting refresh...');
                        try {
                            const newToken = await apiService.refreshToken();
                            if (newToken) {
                                console.log('[AuthContext] Token refreshed successfully');
                                authStatus = true; // Refresh was successful
                                await AsyncStorage.setItem('accessToken', newToken);
                            } else {
                                console.log('[AuthContext] Token refresh failed');
                                authStatus = false;
                            }
                        } catch (error) {
                            console.log('[AuthContext] Token refresh error:', error.message);
                            authStatus = false;
                        }
                    }
                    
                    if (authStatus) {
                        console.log('[AuthContext] User authenticated successfully');
                        const currentToken = await apiService.getAccessToken();
                        setUser(JSON.parse(storedUser));
                        setAccessToken(currentToken);
                        setIsLoggedIn(true);
                    } else {
                        console.log('[AuthContext] Authentication failed, clearing session');
                        // Clear invalid session
                        await AsyncStorage.multiRemove(['user', 'accessToken']);
                        setUser(null);
                        setAccessToken(null);
                        setIsLoggedIn(false);
                    }
                } else {
                    console.log('[AuthContext] No stored user or token found');
                    // Clear any partial data
                    await AsyncStorage.multiRemove(['user', 'accessToken']);
                    setUser(null);
                    setAccessToken(null);
                    setIsLoggedIn(false);
                }
            } catch (error) {
                console.error('[AuthContext] Error loading user:', error);
                setUser(null);
                setAccessToken(null);
                setIsLoggedIn(false);
            } finally {
                setLoading(false);
            }
        };
        loadUser();
    }, []);

    const login = async (userData, token) => {
        try {
            console.log('[AuthContext] Login function called');
            console.log('[AuthContext] User data:', userData ? 'present' : 'null');
            console.log('[AuthContext] Token:', token ? 'present' : 'null');
            
            // Store user data
            await AsyncStorage.setItem('user', JSON.stringify(userData));
            
            // Set the token in API service
            const apiService = (await import('../services/api/apiService')).default;
            await apiService.setAccessToken(token);
            
            // Update context state
            setUser(userData);
            setAccessToken(token);
            setIsLoggedIn(true);
            
            console.log('[AuthContext] Login completed successfully');
        } catch (error) {
            console.error('[AuthContext] Error in login function:', error);
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
            console.error('Logout error:', error);
            // Force logout locally even if backend call fails
            setUser(null);
            setAccessToken(null);
            setIsLoggedIn(false);
        }
    };

    const updateToken = (newToken) => {
        setAccessToken(newToken);
    };

    const value = { 
        user, 
        setUser, 
        loading, 
        logout, 
        login,
        isLoggedIn, 
        accessToken,
        updateToken
    };
    
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return useContext(AuthContext);
}
