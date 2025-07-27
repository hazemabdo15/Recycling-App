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
  const { login, setUser } = useAuth();

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const checkUser = async () => {
        try {
          const savedUser = await getLoggedInUser();
          if (isActive && savedUser) {
            setUser(savedUser);
            router.replace('/home');
          } else {
            setCheckingUser(false);
          }
        } catch (err) {
          console.error('Error checking user:', err);
          setCheckingUser(false);
        }
      };

      checkUser();

      return () => {
        isActive = false;
      };
    }, [setUser])
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
    } catch (error) {
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
