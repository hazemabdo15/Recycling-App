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
  View
} from 'react-native';
import { useLocalization } from '../../context/LocalizationContext';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import apiService from '../../services/api/apiService';

// Dynamic styles function for CompleteOrderModal
const getCompleteOrderModalStyles = (colors) => StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  rtlContainer: {
    direction: 'rtl',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  rtlHeader: {
    flexDirection: 'row-reverse',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  quantityItem: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quantityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  quantityLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 8,
    minWidth: 80,
  },
  quantityInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  pointsInfo: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  confirmButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 8,
    color: colors.white,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    textAlignVertical: 'top',
    minHeight: 100,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  photoSection: {
    alignItems: 'center',
  },
  photoContainer: {
    width: 200,
    height: 200,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  photoText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  addPhotoButton: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  addPhotoButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  quantityFormContainer: {
    backgroundColor: colors.warning + '15',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  quantityFormTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.warning,
    marginBottom: 8,
  },
  quantityFormText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  toggleButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  toggleButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  orderSummary: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  orderSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  orderSummaryCustomer: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  quantitySection: {
    backgroundColor: colors.warning + '15',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  quantitySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  rtlRow: {
    flexDirection: 'row-reverse',
  },
  quantitySectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.warning,
  },
  quantityItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  quantityInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  quantityInputGroup: {
    flex: 1,
  },
  quantityInputDisabled: {
    backgroundColor: colors.surfaceVariant,
    color: colors.textSecondary,
  },
  quantityDiff: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  quantityDiffText: {
    fontSize: 12,
    color: colors.error,
    fontWeight: '500',
  },
  quantityNotesSection: {
    marginTop: 16,
  },
  quantityNotesLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  quantityNotesInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: colors.surface,
    textAlignVertical: 'top',
    color: colors.text,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  photoPlaceholder: {
    height: 120,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 24,
  },
  buttonIcon: {
    marginRight: 4,
  },
  rtlButtonIcon: {
    marginRight: 0,
    marginLeft: 4,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  submitButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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

  // Initialize modal data when order changes
  useEffect(() => {
    if (selectedOrder && visible) {
      setUserRole(selectedOrder.user.role);
      
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
        quality: 0.7,
        allowsEditing: true,
        aspect: [4, 3],
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
      setLoading(false);
      resetModal();
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
    onClose?.();
  };

  if (!selectedOrder) return null;

  const dynamicStyles = {
    modalContainer: [styles.modalContainer, isRTL && styles.rtlContainer],
    modalHeader: [styles.modalHeader, isRTL && styles.rtlHeader],
    quantitySectionHeader: [styles.quantitySectionHeader, isRTL && styles.rtlRow],
    quantityInputs: [styles.quantityInputs, isRTL && styles.rtlRow],
    cameraButton: [styles.cameraButton, isRTL && styles.rtlRow],
    modalButtons: [styles.modalButtons, isRTL && styles.rtlRow],
    submitButton: [styles.button, styles.submitButton, isRTL && styles.rtlRow],
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
          <TouchableOpacity onPress={resetModal}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalContent}>
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
                <Ionicons name="create-outline" size={20} color={colors.warning} />
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
                        keyboardType="numeric"
                        style={styles.quantityInput}
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
                    placeholder={t('delivery.explain_quantity_differences')}
                    placeholderTextColor={colors.textSecondary}
                    style={styles.quantityNotesInput}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              )}
            </View>
          )}

          {/* Weight/Notes Input */}
          <Text style={styles.notesLabel}>
            {userRole === 'customer' ? t('delivery.estimated_weight_required') : t('delivery.estimated_weight')}
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder={userRole === 'customer' ? t('delivery.weight_placeholder') : t('delivery.order_weight')}
            placeholderTextColor={colors.textSecondary}
            style={styles.notesInput}
            keyboardType={userRole === 'customer' ? "numeric" : "default"}
            multiline={userRole !== 'customer'}
            numberOfLines={userRole === 'customer' ? 1 : 3}
          />

          {/* Photo Section */}
          {photo ? (
            <View style={styles.photoContainer}>
              <Image
                source={{ uri: photo.uri }}
                style={styles.photoPreview}
              />
              <TouchableOpacity
                onPress={() => setPhoto(null)}
                style={styles.removePhotoButton}
              >
                <Ionicons name="close" size={20} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="camera" size={48} color={colors.textSecondary} />
              <Text style={styles.placeholderText}>{t('camera.no_photo_taken')}</Text>
            </View>
          )}

          <TouchableOpacity
            onPress={pickImage}
            style={dynamicStyles.cameraButton}
          >
            <Ionicons
              name="camera"
              size={20}
              color="white"
              style={[styles.buttonIcon, isRTL && styles.rtlButtonIcon]}
            />
            <Text style={styles.buttonText}>
              {photo ? t('camera.retake_photo') : userRole === 'customer' ? t('camera.take_collection_photo') : t('camera.take_delivery_photo')}
            </Text>
          </TouchableOpacity>

          <View style={dynamicStyles.modalButtons}>
            <TouchableOpacity
              onPress={resetModal}
              style={[styles.button, styles.cancelButton]}
            >
              <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={completeOrder}
              style={dynamicStyles.submitButton}
              disabled={loading || !photo }
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
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
        </ScrollView>
      </View>
    </Modal>
  );
};

export default CompleteOrderModal;
