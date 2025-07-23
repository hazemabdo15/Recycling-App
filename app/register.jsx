import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import RegisterForm from '../components/auth/RegisterForm';
import { initialSetupForRegister } from '../services/auth';

export default function RegisterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const validatePassword = (password) =>
    /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,20}$/.test(password.trim());

  const handleRegister = async ({ name, email, password, confirmPassword, role, number }) => {
    email = email.trim().toLowerCase();
    number = number.trim();
    console.log('Registering with:', { name, email, password, confirmPassword, role, number });
    if (loading) return;
    setLoading(true);

    if (!name || !email || !password || password !== confirmPassword || !role || !number) {
      Alert.alert("Invalid input", "Please fill all fields correctly.");
      setLoading(false);
      return;
    }

    if (!validateEmail(email) || !validatePassword(password)) {
      Alert.alert("Invalid input", "Please enter valid email and password.");
      setLoading(false);
      return;
    }

    try {
      console.log('Registering:', { name, email, password, role });
      await initialSetupForRegister(email);
      router.push({
        pathname: '/otp',
        params: {
          name,
          email,
          number,
          password,
        },
      });

      Alert.alert("Success", "Registration initiated. Please check your email for the OTP.");
    } catch (error) {
      const message = error?.response?.data?.message || error.message || '';
      if (message === "Email already registered") {
        Alert.alert("Error", "This email is already registered. Try logging in or use a different email.");
      } else {
        Alert.alert("Registration failed", "Something went wrong. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <RegisterForm onSubmit={handleRegister} loading={loading} />
    </View>
  );
}
