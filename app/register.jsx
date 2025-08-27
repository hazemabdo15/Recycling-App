import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import RegisterForm from '../components/auth/RegisterForm';
import { useAuth } from '../context/AuthContext';
import { initialSetupForRegister } from '../services/auth';
import { useGoogleAuth } from '../services/googleAuth';
import deliveryDataStorage from '../utils/deliveryDataStorage';
import DeliveryInfoForm from './deliveryInfoForm';

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { login } = useAuth();
  const { registerWithGoogle } = useGoogleAuth();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [registrationData, setRegistrationData] = useState(null);

  // Check if this is a Google registration flow
  const isGoogleRegistration = params?.provider === 'google';

  useEffect(() => {
    if (isGoogleRegistration && params) {
      // Pre-fill registration data from Google
      setRegistrationData({
        name: params.name || '',
        email: params.email || '',
        image: params.image || '',
        provider: 'google',
        idToken: params.idToken,
      });
    }
  }, [isGoogleRegistration, params]);

  const validateEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const validatePassword = (password) =>
    /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,20}$/.test(password.trim());

  const handleInitialRegister = async ({ name, email, password, confirmPassword, role, number }) => {
    email = email.trim().toLowerCase();
    number = number.trim();

    if (loading) return;

    // Basic validation
    if (!name || !email || !password || !confirmPassword || !role || !number) {
      Alert.alert("Invalid input", "Please fill all fields correctly.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Password mismatch", "Passwords do not match.");
      return;
    }

    if (!validateEmail(email) || !validatePassword(password)) {
      Alert.alert("Invalid input", "Please enter valid email and password.");
      return;
    }

    // Store registration data
    const userData = { name, email, number, password, role };
    setRegistrationData(userData);

    // If delivery role, show additional form
    if (role === 'delivery') {
      setCurrentStep(2);
      return;
    }

    // For non-delivery roles, proceed directly to OTP
    await proceedToOTP(userData);
  };

  const handleDeliveryDetails = async ({
    licenseNumber,
    vehicleType,
    vehicleImage,
    deliveryImage,
    criminalRecord,
    nationalId,
    emergencyNumber
  }) => {
    if (!licenseNumber || !vehicleType || !vehicleImage || !deliveryImage || 
        !criminalRecord || !nationalId || !emergencyNumber) {
      Alert.alert("Invalid input", "Please complete all required fields.");
      return;
    }

    const deliveryInfo = {
      licenseNumber,
      vehicleType,
      vehicleImage,
      deliveryImage,
      criminalRecord,
      nationalId,
      emergencyNumber
    };

    // Store delivery images and data temporarily
    deliveryDataStorage.storeDeliveryData(deliveryInfo);

    const completeData = {
      ...registrationData,
      ...deliveryInfo
    };

    await proceedToOTP(completeData);
  };

  const proceedToOTP = async (userData) => {
    if (!userData) {
      console.error('[Register] userData is null or undefined');
      Alert.alert("Error", "Registration data is missing. Please try again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    
    try {
      // Handle Google registration
      if (userData.provider === 'google') {
        if (!userData.name || !userData.email) {
          Alert.alert("Error", "Google registration data is incomplete. Please try again.");
          setLoading(false);
          return;
        }

        const response = await registerWithGoogle(userData.idToken, {
          name: userData.name,
          email: userData.email,
          phoneNumber: userData.number,
          role: userData.role,
          imgUrl: userData.image,
          ...(userData.licenseNumber && {
            attachments: {
              licenseNumber: userData.licenseNumber,
              vehicleType: userData.vehicleType,
              nationalId: userData.nationalId,
              emergencyNumber: userData.emergencyNumber,
              hasDeliveryImages: true,
            }
          })
        });

        // Login the user after successful registration
        const { user, accessToken } = response;
        await login(user, accessToken);
        
        if (user.role === "delivery") {
          router.replace("/waitingForApproval");
        } else {
          router.replace("/home");
        }
        
        Alert.alert("Success", "Registration successful! Welcome!");
        return;
      }

      // Regular registration flow
      await initialSetupForRegister(userData.email);

      const params = {
        name: userData.name,
        email: userData.email,
        number: userData.number,
        password: userData.password,
        role: userData.role,
      };

      // Add delivery-specific data if present
      if (userData.licenseNumber) {
        params.licenseNumber = userData.licenseNumber;
        params.vehicleType = userData.vehicleType;
        params.nationalId = userData.nationalId;
        params.emergencyNumber = userData.emergencyNumber;
        params.hasDeliveryImages = 'true';
      }

      router.push({
        pathname: '/otp',
        params,
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

  const goBackToFirstStep = () => {
    setCurrentStep(1);
    setRegistrationData(null);
  };

  return (
    <View style={{ flex: 1 }}>
      {currentStep === 1 ? (
        <RegisterForm 
          onSubmit={handleInitialRegister} 
          loading={loading} 
          initialData={registrationData}
        />
      ) : (
        <DeliveryInfoForm 
          registrationData={registrationData}
          onSubmit={handleDeliveryDetails} 
          onBack={goBackToFirstStep}
          loading={loading}
          isFromRegistration={true}
        />
      )}
    </View>
  );
}