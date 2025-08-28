import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { completeRegister } from '../services/auth';
import { colors } from '../styles/theme';
import deliveryDataStorage from '../utils/deliveryDataStorage';
import optimizedApiService from '../services/api/apiService';

export default function OtpScreen() {
  const router = useRouter();
  const { 
    name, 
    email, 
    password, 
    number, 
    role, 
    licenseNumber,
    vehicleType,
    nationalId,
    emergencyNumber,
    hasDeliveryImages 
  } = useLocalSearchParams();
  
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);

  console.log('OTP Screen Params:', { 
    name, email, password, number, role, 
    licenseNumber, vehicleType, nationalId, emergencyNumber, hasDeliveryImages 
  });

  const handleVerify = async () => {
    if (loading) return;
    setLoading(true);

    try {
      // Check if this is a delivery user with complete data (from multi-step flow)
      if (role === 'delivery' && hasDeliveryImages === 'true') {
        const deliveryData = deliveryDataStorage.getDeliveryData();
        
        if (!deliveryData) {
          Alert.alert("Error", "Delivery information not found. Please start registration again.");
          router.replace('/register');
          return;
        }

        // Register delivery user with complete data and OTP
        await registerDeliveryUser({
          name,
          email,
          password,
          number,
          role,
          otp: otpCode,
          ...deliveryData
        });

        // Clear temporary delivery data
        deliveryDataStorage.clearDeliveryData();
        
        Alert.alert('Success', 'Delivery registration submitted for approval!', [
          { text: 'OK', onPress: () => router.replace('/waitingForApproval') }
        ]);

      } else {
        // Regular registration flow
        await completeRegister(name, email, password, number, otpCode, role || 'customer');
        
        if ((role || 'customer') === 'delivery') {
          // Old flow - redirect to delivery info form after basic registration
          console.log('Redirecting to delivery info form', { name, email, password, number, role });
          router.replace({
            pathname: '/deliveryInfoForm', 
            params: { name, email, password, number, role }
          });
        } else {
          Alert.alert('Success', 'Account created successfully!', [
            { text: 'OK', onPress: () => router.replace('/login') }
          ]);
        }
      }

    } catch (error) {
      console.error('OTP verification error:', error);
      Alert.alert('Error', error.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const registerDeliveryUser = async (userData) => {
    const formData = new FormData();
    
    // Add basic user data
    formData.append('name', userData.name);
    formData.append('email', userData.email);
    formData.append('password', userData.password);
    formData.append('number', userData.number);
    formData.append('role', userData.role);
    formData.append('otp', userData.otp);
    
    // Add delivery-specific data
    formData.append('licenseNumber', userData.licenseNumber);
    formData.append('vehicleType', userData.vehicleType);
    formData.append('nationalId', userData.nationalId);
    formData.append('phoneNumber', userData.emergencyNumber);
    
    // Add attachments info
    formData.append('attachments', JSON.stringify({
      licenseNumber: userData.licenseNumber,
      vehicleType: userData.vehicleType,
      emergencyContact: userData.emergencyNumber,
      nationalId: userData.nationalId,
    }));

    // Add images
    if (userData.vehicleImage) {
      formData.append('vehicleImage', {
        uri: userData.vehicleImage,
        type: 'image/jpeg',
        name: 'vehicle.jpg',
      });
    }

    if (userData.deliveryImage) {
      formData.append('deliveryImage', {
        uri: userData.deliveryImage,
        type: 'image/jpeg',
        name: 'delivery.jpg',
      });
    }

    if (userData.criminalRecord) {
      formData.append('criminalRecord', {
        uri: userData.criminalRecord,
        type: 'image/jpeg',
        name: 'criminal.jpg',
      });
    }

    const response = await optimizedApiService.post('/registerDelivery', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify OTP</Text>
      <Text style={styles.subtitle}>
        Enter the 6-digit code sent to your email
        {role === 'delivery' && hasDeliveryImages === 'true' && 
          '\n\nYour delivery documents will be submitted after verification.'
        }
      </Text>
      
      <TextInput
        style={styles.input}
        placeholder="Enter OTP"
        placeholderTextColor={colors.neutral}
        onChangeText={setOtpCode}
        value={otpCode}
        keyboardType="number-pad"
        maxLength={6}
        autoFocus
      />
      
      <Pressable
        style={({ pressed }) => [
          styles.button,
          { opacity: pressed || loading ? 0.8 : 1 },
        ]}
        onPress={handleVerify}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Verifying...' : 'Verify OTP'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: colors.base100,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.neutral,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 20,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.base300,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 24,
    fontSize: 16,
    backgroundColor: colors.white,
    color: colors.black,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
  },
  buttonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
});