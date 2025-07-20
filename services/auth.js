import { Alert } from 'react-native';
import api from './api/api';

export const loginUser = async ({ email, password }) => {
    console.log('Sending login request:', { email, password });
  const response = await api.post('/auth/login', {
    email,
    password,
  });
  console.log(response.data)
  return response.data; // Returns { user, accessToken }
};

export const initialSetupForRegister = async (email) => {
  try {
    const response = await api.post('/auth/initiateSignup', { email });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const completeRegister = async (
  fullName,
  email,
  password,
  number,
  otpCode,
  role = 'customer',
  provider = 'none'
) => {
  try {
    const response = await api.post('/auth/verifyRegisterToken', {
      name: fullName,
      email,
      password,
      phoneNumber: number,
      otpCode,
      role,
      provider,
    });

    return response.data;
  } catch (error) {
    console.error('Register Error:', error);
    Alert.alert('Error', 'Registration failed');
    throw error;
  }
};