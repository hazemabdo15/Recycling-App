import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions
} from 'react-native';
import { useLocalization } from '../../context/LocalizationContext';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import apiService from '../../services/api/apiService';

const { width: screenWidth } = Dimensions.get('window');

// Enhanced dynamic styles function for CompleteOrderModal
const getCompleteOrderModalStyles = (colors) => StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  rtlContainer: {
    direction: 'rtl',
  },
  
  // Header Styles - Enhanced
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '30',
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rtlHeader: {
    flexDirection: 'row-reverse',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.3,
  },
  closeButton: {
    padding: 12,
    borderRadius: 20,
    backgroundColor: colors.surfaceVariant + '40',
  },
  
  // Content Styles - Enhanced
  modalContent: {
    padding: 20,
    paddingBottom: 40,
  },
  
  // Order Summary - Redesigned
  orderSummary: {
    backgroundColor: colors.primary + '15',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  orderSummaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 6,
  },
  orderSummaryCustomer: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  
  // Section Styles - Enhanced
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  
  // Quantity Section - Redesigned
  quantitySection: {
    backgroundColor: colors.warning + '12',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  quantitySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  rtlRow: {
    flexDirection: 'row-reverse',
  },
  quantitySectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.warning,
    flex: 1,
  },
  quantitySectionIcon: {
    backgroundColor: colors.warning + '20',
    padding: 8,
    borderRadius: 12,
  },
  
  // Quantity Items - Enhanced
  quantityItem: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border + '40',
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  quantityItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 14,
    letterSpacing: 0.1,
  },
  quantityInputs: {
    flexDirection: 'row',
    gap: 16,
  },
  quantityInputGroup: {
    flex: 1,
  },
  quantityLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quantityInput: {
    borderWidth: 2,
    borderColor: colors.border + '60',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
    fontWeight: '500',
  },
  quantityInputDisabled: {
    backgroundColor: colors.surfaceVariant + '60',
    color: colors.textSecondary,
    borderColor: colors.border + '30',
  },
  quantityDiff: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border + '40',
  },
  quantityDiffText: {
    fontSize: 13,
    color: colors.error,
    fontWeight: '600',
    backgroundColor: colors.error + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    textAlign: 'center',
  },
  
  // Notes Section - Enhanced
  quantityNotesSection: {
    marginTop: 20,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border + '40',
  },
  quantityNotesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  quantityNotesInput: {
    borderWidth: 2,
    borderColor: colors.border + '60',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: colors.surface,
    textAlignVertical: 'top',
    color: colors.text,
    minHeight: 80,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    letterSpacing: 0.1,
  },
  notesInput: {
    borderWidth: 2,
    borderColor: colors.border + '60',
    borderRadius: 16,
    padding: 16,
    textAlignVertical: 'top',
    minHeight: 100,
    color: colors.text,
    backgroundColor: colors.surface,
    fontSize: 15,
    marginBottom: 24,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  
  // Photo Section - Redesigned
  photoContainer: {
    width: '100%',
    height: 240,
    borderRadius: 20,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    padding: 10,
  },
  photoPlaceholder: {
    height: 160,
    backgroundColor: colors.surfaceVariant + '60',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.border + '40',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 12,
    fontWeight: '500',
  },
  
  // Camera Button - Enhanced
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 32,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cameraButtonPressed: {
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.2,
    elevation: 2,
  },
  
  // Button Styles - Enhanced
  button: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  cancelButton: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border + '60',
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  buttonDisabled: {
    backgroundColor: colors.surfaceVariant,
    shadowOpacity: 0,
    elevation: 0,
  },
  
  // Loading and Icon Styles
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 4,
  },
  rtlButtonIcon: {
    marginRight: 0,
    marginLeft: 4,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
    letterSpacing: 0.2,
  },
  
  // Footer Styles - Enhanced
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border + '30',
    padding: 20,
    backgroundColor: colors.surface,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  rtlButton: {
    flexDirection: 'row-reverse',
  },
  
  // Additional Utility Styles
  quantityItemContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border + '40',
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  
  // Focus States
  inputFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  
  // New Gradient-like Effects (using backgroundColor with opacity)
  headerGradient: {
    backgroundColor: colors.primary + '05',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.border + '20',
    marginVertical: 20,
  },
});

const CompleteOrderModal = ({ 
  visible, 
  selectedOrder, 
  onClose, 
  onOrderCompleted 
}) => {
  const { t, currentLanguage, isRTL } = useLocalization();
  const { colors } = useThemedStyles();
  const styles = getCompleteOrderModalStyles(colors);
  const [photo, setPhoto] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [quantities, setQuantities] = useState({});
  const [showQuantityForm, setShowQuantityForm] = useState(false);
  const [quantityNotes, setQuantityNotes] = useState('');
  const [userRole, setUserRole] = useState(null);
  const [focusedInput, setFocusedInput] = useState(null);

  // Initialize modal data when order changes
  useEffect(() => {
    if (selectedOrder && visible) {
      const role = selectedOrder.user?.role;
      setUserRole(role);
      
      // Only show quantity form for non-customer orders
      if (selectedOrder.user.role === 'customer' && selectedOrder.items) {
        const initialQuantities = {};
        
        selectedOrder.items.forEach((item) => {
          const correctUnit = item.measurement_unit === 1 ? t('units.kg') : t('units.piece');
          const isUnitMismatch = item.unit !== correctUnit;
          
          initialQuantities[item._id] = {
            originalQuantity: item.quantity,
            actualQuantity: item.quantity,
            name: item.name?.[currentLanguage] || item.itemName || item.name || item.productName || t('common.item'),
            unit: correctUnit,
            measurement_unit: item.measurement_unit,
            hasUnitMismatch: isUnitMismatch,
            originalUnit: item.unit,
            pointsPerUnit: item.points,
            originalPoints: item.points * item.quantity,
            currentPoints: item.points * item.quantity
          };
        });
        
        setQuantities(initialQuantities);
        setShowQuantityForm(true);
      } else {
        setShowQuantityForm(false);
      }
    }
  }, [selectedOrder, visible, currentLanguage, t]);

  // Calculate total points
  const calculateTotalPoints = () => {
    return Object.values(quantities).reduce((total, item) => {
      const actualQty = item.actualQuantity === '' ? 0 : Number(item.actualQuantity);
      return total + (item.pointsPerUnit * actualQty);
    }, 0);
  };

  // Handle quantity changes
  const handleQuantityChange = (itemId, value, measurementUnit) => {
    if (value === '') {
      setQuantities(prev => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          actualQuantity: '',
          currentPoints: 0
        }
      }));
      return;
    }

    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) return;

    let adjustedQuantity;
    if (measurementUnit === 2) {
      adjustedQuantity = Math.max(0, Math.round(numericValue));
    } else {
      adjustedQuantity = Math.max(0, numericValue);
    }
    
    setQuantities(prev => {
      const item = prev[itemId];
      const newPoints = item.pointsPerUnit * adjustedQuantity;
      
      return {
        ...prev,
        [itemId]: {
          ...prev[itemId],
          actualQuantity: adjustedQuantity,
          currentPoints: newPoints
        }
      };
    });
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('permissions.camera_required'), 
          t('permissions.camera_required_message'),
          [{ text: t('common.ok') }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        quality: 0.8,
        allowsEditing: true,
        aspect: [16, 9],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhoto(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t('common.error'), t('camera.failed_to_open'));
    }
  };

  const completeOrder = async () => {
    if (!photo) {
      Alert.alert(t('delivery.photo_required'), t('delivery.photo_required_message'));
      return;
    }

    // Validate quantities for non-customer orders only
    if (userRole === 'customer' && showQuantityForm) {
      const hasChanges = Object.values(quantities).some((item) => {
        const actualQty = item.actualQuantity === '' ? 0 : Number(item.actualQuantity);
        return item.originalQuantity !== actualQty;
      });
      
      if (hasChanges && !quantityNotes.trim()) {
        Alert.alert(t('delivery.notes_required'), t('delivery.notes_required_message'));
        return;
      }

      const hasEmptyQuantities = Object.values(quantities).some((item) => 
        item.actualQuantity === '' || item.actualQuantity === null || item.actualQuantity === undefined
      );

      if (hasEmptyQuantities) {
        Alert.alert(t('delivery.quantities_required'), t('delivery.quantities_required_message'));
        return;
      }
    }

    // Validate weight for customer orders
    if (userRole === 'customer' && !notes.trim()) {
      Alert.alert(t('delivery.weight_required'), t('delivery.weight_required_message'));
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('proofPhoto', {
      uri: photo.uri,
      name: 'proof.jpg',
      type: 'image/jpeg',
    });
    formData.append('notes', notes);

    // Add quantity data for non-customer orders only
    if (userRole === 'customer') {
      formData.append('updatedQuantities', JSON.stringify(quantities));
      formData.append('quantityNotes', quantityNotes);
    }

    try {
      const response = await apiService.post(`/${selectedOrder._id}/complete-with-proof`, formData);
      if (response.message === 'Order completed successfully with delivery proof') {
        Alert.alert(
          t('delivery.delivery_completed'),
          t('delivery.delivery_completed_message'),
          [{ text: t('common.ok') }]
        );
        onOrderCompleted?.();
        resetModal();
      }
    } catch (err) {
      console.error('Error submitting proof', err);
      Alert.alert(t('common.error'), t('delivery.failed_to_complete'));
    } finally {
      resetModal();
      setLoading(false);
    }
  };

  // Reset modal state
  const resetModal = () => {
    setPhoto(null);
    setNotes('');
    setQuantities({});
    setShowQuantityForm(false);
    setQuantityNotes('');
    setUserRole(null);
    setFocusedInput(null);
    onClose?.();
  };

  if (!selectedOrder) return null;

  const dynamicStyles = {
    modalContainer: [styles.modalContainer, isRTL && styles.rtlContainer],
    modalHeader: [styles.modalHeader, isRTL && styles.rtlHeader, styles.headerGradient],
    quantitySectionHeader: [styles.quantitySectionHeader, isRTL && styles.rtlRow],
    quantityInputs: [styles.quantityInputs, isRTL && styles.rtlRow],
    cameraButton: [styles.cameraButton, isRTL && styles.rtlRow],
    modalButtons: [styles.modalButtons, isRTL && styles.rtlRow],
    submitButton: [
      styles.button, 
      styles.submitButton, 
      isRTL && styles.rtlRow,
      (!photo || loading) && styles.buttonDisabled
    ],
    closeButton: [styles.closeButton, isRTL && styles.rtlButton],
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={dynamicStyles.modalContainer}>
        <View style={dynamicStyles.modalHeader}>
          <Text style={styles.modalTitle}>{t('delivery.complete_delivery')}</Text>
          <TouchableOpacity onPress={resetModal} style={dynamicStyles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          contentContainerStyle={styles.modalContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.orderSummary}>
            <Text style={styles.orderSummaryTitle}>
              {t('order.order_number', { id: selectedOrder._id?.slice(-8) })}
            </Text>
            <Text style={styles.orderSummaryCustomer}>
              {t('order.customer')}: {selectedOrder.user?.userName}
            </Text>
          </View>

          {/* Quantity Review Form for Non-Customer Orders Only */}
          {userRole === 'customer' && showQuantityForm && (
            <View style={styles.quantitySection}>
              <View style={dynamicStyles.quantitySectionHeader}>
                <View style={styles.quantitySectionIcon}>
                  <Ionicons name="create-outline" size={20} color={colors.warning} />
                </View>
                <Text style={styles.quantitySectionTitle}>{t('delivery.verify_quantities')}</Text>
              </View>
              
              {Object.entries(quantities).map(([itemId, item]) => (
                <View key={itemId} style={styles.quantityItem}>
                  <Text style={styles.quantityItemName}>
                    {item.name} ({item.unit})
                  </Text>
                  <View style={dynamicStyles.quantityInputs}>
                    <View style={styles.quantityInputGroup}>
                      <Text style={styles.quantityLabel}>{t('delivery.original')}</Text>
                      <TextInput
                        value={item.originalQuantity.toString()}
                        editable={false}
                        style={[styles.quantityInput, styles.quantityInputDisabled]}
                        placeholderTextColor={colors.textSecondary}
                      />
                    </View>
                    <View style={styles.quantityInputGroup}>
                      <Text style={styles.quantityLabel}>{t('delivery.actual')} *</Text>
                      <TextInput
                        value={item.actualQuantity.toString()}
                        onChangeText={(value) => handleQuantityChange(itemId, value, item.measurement_unit)}
                        onFocus={() => setFocusedInput(`quantity-${itemId}`)}
                        onBlur={() => setFocusedInput(null)}
                        keyboardType="numeric"
                        style={[
                          styles.quantityInput,
                          focusedInput === `quantity-${itemId}` && styles.inputFocused
                        ]}
                        placeholderTextColor={colors.textSecondary}
                      />
                    </View>
                  </View>
                  {(item.originalQuantity !== item.actualQuantity && item.actualQuantity !== '') && (
                    <View style={styles.quantityDiff}>
                      <Text style={styles.quantityDiffText}>
                        {t('delivery.difference')}: {item.measurement_unit === 2 
                          ? `${Math.round(Number(item.actualQuantity) - item.originalQuantity)} ${item.unit}`
                          : `${(Number(item.actualQuantity) - item.originalQuantity).toFixed(1)} ${item.unit}`
                        }
                      </Text>
                    </View>
                  )}
                </View>
              ))}

              {/* Quantity Notes */}
              {Object.values(quantities).some((item) => {
                const actualQty = item.actualQuantity === '' ? 0 : Number(item.actualQuantity);
                return item.originalQuantity !== actualQty;
              }) && (
                <View style={styles.quantityNotesSection}>
                  <Text style={styles.quantityNotesLabel}>{t('delivery.reason_for_changes')} *</Text>
                  <TextInput
                    value={quantityNotes}
                    onChangeText={setQuantityNotes}
                    onFocus={() => setFocusedInput('quantity-notes')}
                    onBlur={() => setFocusedInput(null)}
                    placeholder={t('delivery.explain_quantity_differences')}
                    placeholderTextColor={colors.textSecondary}
                    style={[
                      styles.quantityNotesInput,
                      focusedInput === 'quantity-notes' && styles.inputFocused
                    ]}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              )}
            </View>
          )}

          <View style={styles.sectionDivider} />

          {/* Weight/Notes Input */}
          <View style={styles.section}>
            <Text style={styles.notesLabel}>
              {userRole === 'customer' ? t('delivery.estimated_weight_required') : t('delivery.estimated_weight')}
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              onFocus={() => setFocusedInput('notes')}
              onBlur={() => setFocusedInput(null)}
              placeholder={userRole === 'customer' ? t('delivery.weight_placeholder') : t('delivery.order_weight')}
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.notesInput,
                focusedInput === 'notes' && styles.inputFocused
              ]}
              keyboardType={userRole === 'customer' ? "numeric" : "default"}
              multiline={userRole !== 'customer'}
              numberOfLines={userRole === 'customer' ? 1 : 3}
            />
          </View>

          {/* Photo Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {userRole === 'customer' ? t('camera.collection_photo') : t('camera.delivery_photo')}
            </Text>
            
            {photo ? (
              <View style={styles.photoContainer}>
                <Image
                  source={{ uri: photo.uri }}
                  style={styles.photoPreview}
                />
                <TouchableOpacity
                  onPress={() => setPhoto(null)}
                  style={styles.removePhotoButton}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close" size={20} color="white" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera" size={56} color={colors.textSecondary} />
                <Text style={styles.placeholderText}>{t('camera.no_photo_taken')}</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={pickImage}
              style={dynamicStyles.cameraButton}
              activeOpacity={0.8}
            >
              <Ionicons
                name="camera"
                size={22}
                color="white"
                style={[styles.buttonIcon, isRTL && styles.rtlButtonIcon]}
              />
              <Text style={styles.buttonText}>
                {photo ? t('camera.retake_photo') : userRole === 'customer' ? t('camera.take_collection_photo') : t('camera.take_delivery_photo')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <View style={dynamicStyles.modalButtons}>
            <TouchableOpacity
              onPress={resetModal}
              style={[styles.button, styles.cancelButton]}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={completeOrder}
              style={dynamicStyles.submitButton}
              disabled={loading || !photo}
              activeOpacity={0.8}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="white" />
                  <Text style={styles.loadingText}>{t('common.processing')}</Text>
                </View>
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color="white"
                    style={[styles.buttonIcon, isRTL && styles.rtlButtonIcon]}
                  />
                  <Text style={styles.buttonText}>
                    {userRole === 'customer' ? t('delivery.mark_as_collected') : t('delivery.mark_as_delivered')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CompleteOrderModal;