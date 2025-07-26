import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../../styles/theme';

export default function LoginForm({ onSubmit, loading }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (loading) return;
    console.log('Login button pressed', email, password);
    await onSubmit({ email, password });
  };

  const handleSkip = () => {
    router.push('/home');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back!</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <Pressable
          onPress={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 10, top: 12 }}
          accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
        >
          <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#666" />
        </Pressable>
      </View>
      <Pressable
        style={[styles.loginButton, loading && { opacity: 0.5 }]}
        onPress={handleLogin}
        disabled={loading}
        android_ripple={{ color: 'rgba(255,255,255,0.3)' }}
      >
        <Text style={styles.loginText}>{loading ? 'Please Wait..' : 'Login'}</Text>
      </Pressable>

      <Pressable
        onPress={() => router.push('/register')}>
        <Text style={styles.linkText}>Dont have an account? Register</Text>
      </Pressable>

      <Pressable onPress={handleSkip} style={styles.skipButton}>
        <Text style={styles.skipText}>Skip for now</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.base100
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    color: colors.primary
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: colors.neutral
  },
  input: {
    width: '100%',
    maxWidth: 350,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 12,
    marginBottom: 15
  },
  loginButton: {
    width: '100%',
    maxWidth: 350,
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 5,
    alignItems: 'center'
  },
  loginText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  linkText: {
    marginTop: 15,
    textAlign: 'center',
    color: colors.primary,
    textDecorationLine: 'underline'
  },
  skipButton: {
    marginTop: 20,
  },
  skipText: {
    color: colors.neutral,
    textDecorationLine: 'underline',
  },
  passwordContainer: {
    width: '100%',
    maxWidth: 350,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 15,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
  },
});
