import { View, StyleSheet, Alert} from 'react-native';
import LoginForm from '../components/auth/LoginForm';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import { loginUser } from '../services/auth';
import { router } from 'expo-router';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  

  const handleLogin = async ({ email, password }) => {
    if (loading) return;
    setLoading(true);
    console.log('Login attempt with:', { email, password });
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Email and password are required.');
      setLoading(false);
      return;
    }
    try {
      console.log('Attempting to log in with:', { email, password });
      const { user, accessToken } = await loginUser({ email, password });

      await AsyncStorage.multiSet([
        ['accessToken', accessToken],
        ['user', JSON.stringify(user)]
      ]);
      console.log('Login successful:', user);
      Alert.alert('Login Successful', `Welcome back, ${user.name || user.email}!`);
      setLoading(false);
      router.push('/home');
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Login failed', 'Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <LoginForm onSubmit={handleLogin} loading={loading}/>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
