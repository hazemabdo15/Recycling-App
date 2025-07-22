import { View, StyleSheet, Alert } from 'react-native';
import LoginForm from '../components/auth/LoginForm';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useCallback } from 'react';
import { loginUser } from '../services/auth';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { getLoggedInUser } from '../utils/authUtils';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [checkingUser, setCheckingUser] = useState(true);
  const { setUser } = useAuth();

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
    }, [])
  );

  if (checkingUser) return null;

  const handleLogin = async ({ email, password }) => {
    if (loading) return;
    setLoading(true);

    if (!email || !password) {
      Alert.alert('Missing Fields', 'Email and password are required.');
      setLoading(false);
      return;
    }

    try {
      const { user, accessToken } = await loginUser({ email, password });

      await AsyncStorage.multiSet([
        ['accessToken', accessToken],
        ['user', JSON.stringify(user)],
      ]);

      setUser(user);

      router.replace('/home');
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Login failed', error.message || 'Please check your credentials and try again.');
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
