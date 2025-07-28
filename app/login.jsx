import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import LoginForm from '../components/auth/LoginForm';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../services/auth';
import { getLoggedInUser } from '../utils/authUtils';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [checkingUser, setCheckingUser] = useState(true);
  const { login, setUser, isLoggedIn, user } = useAuth();

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const checkUser = async () => {
        try {
          console.log('[LoginScreen] Checking auth state...');
          console.log('[LoginScreen] AuthContext isLoggedIn:', isLoggedIn);
          console.log('[LoginScreen] AuthContext user:', user);
          
          // If already logged in according to AuthContext, redirect
          if (isLoggedIn && user) {
            console.log('[LoginScreen] User already logged in, redirecting to home');
            if (user.role === 'delivery') {
              router.replace('/delivery/dashboard');
            } else {
              router.replace('/home');
            }
            return;
          }
          
          // Check AsyncStorage as fallback
          const savedUser = await getLoggedInUser();
          console.log('[LoginScreen] Saved user result:', savedUser);
          
          if (isActive && savedUser && !isLoggedIn) {
            // Stale user in storage, clear it and show login form
            console.log('[LoginScreen] Found stale user in storage but not logged in, clearing and showing login form');
            await AsyncStorage.removeItem('user');
            setCheckingUser(false);
            return;
          }

          setCheckingUser(false);
        } catch (err) {
          console.error('[LoginScreen] Error checking user:', err);
          setCheckingUser(false);
        }
      };

      checkUser();

      return () => {
        isActive = false;
      };
    }, [isLoggedIn, user])
  );

  if (checkingUser) return null;

  const handleLogin = async ({ email, password }) => {
    email = email.trim().toLowerCase();
    if (loading) {
      console.log('[Login] Already processing login, ignoring duplicate request');
      return;
    }

    setLoading(true);
    console.log('[Login] Starting login process for:', email);

    if (!email || !password) {
      Alert.alert('Missing Fields', 'Email and password are required.');
      setLoading(false);
      return;
    }

    try {
      const { user, accessToken } = await loginUser({ email, password });
      console.log('[Login] Login API call successful');

      await login(user, accessToken);
      console.log('[Login] AuthContext updated successfully');
      if (user.role === 'delivery') {
        console.log('[Login] Redirecting to delivery dashboard');
        router.replace('/delivery/dashboard');
        return;
      }
      else {
        router.replace('/home');
      }
    } catch (_error) {
      // console.error('[Login] Login failed:', error?.message || 'Unknown error');
      Alert.alert('Login failed', 'Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <LoginForm onSubmit={handleLogin} loading={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
