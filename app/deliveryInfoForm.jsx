import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Alert, Dimensions, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../styles/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scaleSize = (size) => (SCREEN_WIDTH / 375) * size;

const DeliveryInfoForm = ({ 
  registrationData, 
  onSubmit, 
  onBack, 
  loading, 
  isFromRegistration = false 
}) => {
  const insets = useSafeAreaInsets();

  const [licenseNumber, setLicenseNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [vehicleImage, setVehicleImage] = useState(null);
  const [deliveryImage, setDeliveryImage] = useState(null);
  const [criminalRecord, setCriminalRecord] = useState(null);
  const [nationalId, setNationalId] = useState('');
  const [emergencyNumber, setEmergencyNumber] = useState('');

  const pickImage = async (setImage) => {
    const result = await ImagePicker.launchImageLibraryAsync({ 
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    const licenseRegex = /^\d{10}$/;
    const nationalIdRegex = /^\d{14}$/;
    const emergencyNumberRegex = /^01\d{9}$/;

    if (
      !licenseNumber ||
      !vehicleType ||
      !vehicleImage ||
      !deliveryImage ||
      !criminalRecord ||
      !nationalId ||
      !emergencyNumber
    ) {
      Alert.alert('Missing Fields', 'Please complete all fields before submitting');
      return;
    }

    if (!licenseRegex.test(licenseNumber.trim())) {
      Alert.alert('Invalid License Number', 'License number must be 3 or 4 digits followed by 3 letters');
      return;
    }

    if (!nationalIdRegex.test(nationalId.trim())) {
      Alert.alert('Invalid National ID', 'National ID must be exactly 14 digits');
      return;
    }

    if (!emergencyNumberRegex.test(emergencyNumber.trim())) {
      Alert.alert('Invalid Emergency Number', 'Emergency number must be 11 digits and start with 01');
      return;
    }

    // If this is from registration flow, just collect data and pass to parent
    if (isFromRegistration && onSubmit) {
      onSubmit({
        licenseNumber,
        vehicleType,
        vehicleImage,
        deliveryImage,
        criminalRecord,
        nationalId,
        emergencyNumber
      });
      return;
    }

    // Original submission logic for standalone use
    try {
      const formData = new FormData();
      // ... rest of the original submission logic
    } catch (err) {
      console.error(err);
      Alert.alert('Submission Failed', err?.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Header Section */}
      <View style={[styles.headerSection, { paddingTop: insets.top + scaleSize(20) }]}>
        {/* Back Button for registration flow */}
        {isFromRegistration && onBack && (
          <Pressable style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={scaleSize(24)} color={colors.white} />
          </Pressable>
        )}
        
        <View style={styles.logoContainer}>
          <MaterialCommunityIcons name="truck-delivery" size={scaleSize(50)} color={colors.white} />
        </View>
        <Text style={styles.title}>
          {isFromRegistration ? 'Complete Your Registration' : 'Delivery Registration'}
        </Text>
        <Text style={styles.subtitle}>
          {isFromRegistration 
            ? 'Provide delivery documents to continue'
            : 'Submit your documents to become a delivery partner'
          }
        </Text>
      </View>

      {/* Form Card */}
      <ScrollView
        style={styles.formCard}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.formContent}>
          {/* License Number Input */}
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="card-account-details" size={scaleSize(20)} color={colors.neutral} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="License Number"
              keyboardType='numeric'
              placeholderTextColor={colors.neutral}
              value={licenseNumber}
              onChangeText={setLicenseNumber}
            />
          </View>

          {/* Vehicle Type Input */}
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="car" size={scaleSize(20)} color={colors.neutral} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Vehicle Type (e.g. Car, Bike, Van)"
              placeholderTextColor={colors.neutral}
              value={vehicleType}
              onChangeText={setVehicleType}
            />
          </View>

          {/* National ID Input */}
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="card-account-details-outline" size={scaleSize(20)} color={colors.neutral} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="National ID"
              placeholderTextColor={colors.neutral}
              value={nationalId}
              onChangeText={setNationalId}
            />
          </View>

          {/* Emergency Contact Input */}
          <View style={styles.inputWrapper}>
            <Ionicons name="call-outline" size={scaleSize(20)} color={colors.neutral} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Emergency Contact Number"
              placeholderTextColor={colors.neutral}
              keyboardType="phone-pad"
              value={emergencyNumber}
              onChangeText={setEmergencyNumber}
            />
          </View>

          {/* Image Uploaders */}
          <Text style={styles.sectionLabel}>Required Documents</Text>
          
          <ImageUploader 
            label="Vehicle Image" 
            icon="car"
            image={vehicleImage} 
            onPick={() => pickImage(setVehicleImage)} 
          />
          
          <ImageUploader 
            label="Your Photo" 
            icon="account"
            image={deliveryImage} 
            onPick={() => pickImage(setDeliveryImage)} 
          />
          
          <ImageUploader 
            label="Criminal Record" 
            icon="file-document"
            image={criminalRecord} 
            onPick={() => pickImage(setCriminalRecord)} 
          />

          {/* Submit Button */}
          <Pressable
            disabled={loading}
            onPress={handleSubmit}
            style={[styles.registerButton, loading && styles.registerButtonDisabled]}
            android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
          >
            <LinearGradient
              colors={loading ? [colors.neutral, colors.neutral] : [colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.registerButtonGradient}
            >
              {loading && <View style={styles.loadingSpinner} />}
              <Text style={styles.registerText}>
                {loading 
                  ? "Processing..." 
                  : isFromRegistration 
                    ? "Continue to Verification" 
                    : "Submit Documents"
                }
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

const ImageUploader = ({ label, icon, image, onPick }) => (
  <View style={styles.uploadSection}>
    <Text style={styles.uploadLabel}>{label}</Text>
    <Pressable 
      style={[styles.uploadButton, image && styles.uploadButtonActive]}
      onPress={onPick}
    >
      <MaterialCommunityIcons 
        name={icon} 
        size={scaleSize(24)} 
        color={image ? colors.white : colors.primary} 
      />
      <Text style={[styles.uploadButtonText, image && styles.uploadButtonTextActive]}>
        {image ? 'Change Image' : 'Select Image'}
      </Text>
    </Pressable>
    {image && (
      <Image 
        source={{ uri: image }} 
        style={styles.imagePreview} 
        resizeMode="cover"
      />
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base100,
  },
  backButton: {
    position: 'absolute',
    top: scaleSize(60),
    left: scaleSize(20),
    width: scaleSize(44),
    height: scaleSize(44),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: scaleSize(22),
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  headerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scaleSize(20),
    paddingBottom: scaleSize(20),
    minHeight: scaleSize(200),
  },
  logoContainer: {
    width: scaleSize(80),
    height: scaleSize(80),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: scaleSize(40),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scaleSize(16),
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: scaleSize(4) },
    shadowOpacity: 0.3,
    shadowRadius: scaleSize(8),
    elevation: 50,
  },
  title: {
    fontSize: scaleSize(26),
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    marginBottom: scaleSize(8),
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: scaleSize(15),
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: scaleSize(20),
  },
  formCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: scaleSize(25),
    borderTopRightRadius: scaleSize(25),
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -scaleSize(4) },
    shadowOpacity: 0.1,
    shadowRadius: scaleSize(12),
    elevation: 12,
  },
  formContent: {
    paddingHorizontal: scaleSize(24),
    paddingTop: scaleSize(24),
    paddingBottom: scaleSize(40),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.base50,
    borderRadius: scaleSize(14),
    marginBottom: scaleSize(14),
    paddingHorizontal: scaleSize(16),
    paddingVertical: scaleSize(4),
    borderWidth: 1,
    borderColor: colors.base200,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: scaleSize(2) },
    shadowOpacity: 0.05,
    shadowRadius: scaleSize(4),
    elevation: 2,
  },
  inputIcon: {
    marginRight: scaleSize(12),
  },
  input: {
    flex: 1,
    fontSize: scaleSize(15),
    color: colors.black,
    paddingVertical: scaleSize(14),
  },
  sectionLabel: {
    fontSize: scaleSize(16),
    fontWeight: '600',
    color: colors.black,
    marginTop: scaleSize(20),
    marginBottom: scaleSize(12),
  },
  uploadSection: {
    marginBottom: scaleSize(20),
  },
  uploadLabel: {
    fontSize: scaleSize(14),
    fontWeight: '500',
    color: colors.neutral,
    marginBottom: scaleSize(8),
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.base50,
    borderRadius: scaleSize(12),
    paddingVertical: scaleSize(14),
    paddingHorizontal: scaleSize(16),
    borderWidth: 2,
    borderColor: colors.base200,
  },
  uploadButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  uploadButtonText: {
    fontSize: scaleSize(15),
    fontWeight: '600',
    color: colors.primary,
    marginLeft: scaleSize(10),
  },
  uploadButtonTextActive: {
    color: colors.white,
  },
  imagePreview: {
    width: '100%',
    height: scaleSize(200),
    borderRadius: scaleSize(12),
    marginTop: scaleSize(12),
    borderWidth: 1,
    borderColor: colors.base200,
  },
  registerButton: {
    borderRadius: scaleSize(16),
    marginTop: scaleSize(20),
    marginBottom: scaleSize(20),
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: scaleSize(4) },
    shadowOpacity: 0.3,
    shadowRadius: scaleSize(8),
    elevation: 8,
  },
  registerButtonDisabled: {
    shadowOpacity: 0.1,
    elevation: 2,
  },
  registerButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleSize(16),
    borderRadius: scaleSize(16),
  },
  loadingSpinner: {
    width: scaleSize(20),
    height: scaleSize(20),
    borderRadius: scaleSize(10),
    borderWidth: 2,
    borderColor: colors.white,
    borderTopColor: 'transparent',
    marginRight: scaleSize(8),
    animationKeyframes: {
      '0%': { transform: [{ rotate: '0deg' }] },
      '100%': { transform: [{ rotate: '360deg' }] },
    },
    animationDuration: '1s',
    animationIterationCount: 'infinite',
  },
  registerText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: scaleSize(16),
    letterSpacing: 0.5,
  },
});

export default DeliveryInfoForm;