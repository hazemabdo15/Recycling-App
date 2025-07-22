import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const loadUser = async () => {
            const storedUser = await AsyncStorage.getItem('user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
                setIsLoggedIn(true);
            } else {
                setIsLoggedIn(false);
            }
            setLoading(false);
        };
        loadUser();
    }, []);

    const logout = async () => {
        await AsyncStorage.multiRemove(['user', 'accessToken']);
        setUser(null);
        setIsLoggedIn(false);
    };

    const value = { user, setUser, loading, logout, isLoggedIn };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return useContext(AuthContext);
}
