import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Image, TextInput, ScrollView, Modal, ActivityIndicator,
  StyleSheet, Alert
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../../services/api/apiService';
import { colors } from '../../styles/theme';

const CompleteOrderModal = ({ 
  visible, 
  selectedOrder, 
  onClose, 
  onOrderCompleted 
}) => {
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
      if (selectedOrder.user.role == 'customer' && selectedOrder.items) {
        const initialQuantities = {};
        
        selectedOrder.items.forEach((item) => {
          const correctUnit = item.measurement_unit === 1 ? 'kg' : 'piece';
          const isUnitMismatch = item.unit !== correctUnit;
          
          initialQuantities[item._id] = {
            originalQuantity: item.quantity,
            actualQuantity: item.quantity,
            name: item.itemName || item.name || item.productName || 'Item',
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
  }, [selectedOrder, visible]);

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
          'Permission Required', 
          'Camera permission is required to take photos.',
          [{ text: 'OK' }]
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
      Alert.alert('Error', 'Failed to open camera. Please try again.');
    }
  };

  const completeOrder = async () => {
    if (!photo) {
      Alert.alert('Photo Required', 'Please take a delivery proof photo');
      return;
    }

    // Validate quantities for non-customer orders only
    if (userRole == 'customer' && showQuantityForm) {
      const hasChanges = Object.values(quantities).some((item) => {
        const actualQty = item.actualQuantity === '' ? 0 : Number(item.actualQuantity);
        return item.originalQuantity !== actualQty;
      });
      
      if (hasChanges && !quantityNotes.trim()) {
        Alert.alert('Notes Required', 'Please add notes about the quantity changes');
        return;
      }

      const hasEmptyQuantities = Object.values(quantities).some((item) => 
        item.actualQuantity === '' || item.actualQuantity === null || item.actualQuantity === undefined
      );

      if (hasEmptyQuantities) {
        Alert.alert('Quantities Required', 'Please enter actual quantities for all items');
        return;
      }
    }

    // Validate weight for customer orders
    if (userRole === 'customer' && !notes.trim()) {
      Alert.alert('Weight Required', 'Please enter the estimated weight');
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
    if (userRole == 'customer') {
      formData.append('updatedQuantities', JSON.stringify(quantities));
      formData.append('quantityNotes', quantityNotes);
    }

    try {
      const response = await apiService.post(`/${selectedOrder._id}/complete-with-proof`, formData);
      if (response.message === 'Order completed successfully with delivery proof') {
        Alert.alert(
          'Delivery Completed',
          'Your delivery has been successfully completed.',
          [{ text: 'OK' }]
        );
        onOrderCompleted?.();
        resetModal();
      }
    } catch (err) {
      console.error('Error submitting proof', err);
      Alert.alert('Error', 'Failed to complete order. Please try again.');
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Complete Delivery</Text>
          <TouchableOpacity onPress={resetModal}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalContent}>
          <View style={styles.orderSummary}>
            <Text style={styles.orderSummaryTitle}>
              Order #{selectedOrder._id?.slice(-8)}
            </Text>
            <Text style={styles.orderSummaryCustomer}>
              Customer: {selectedOrder.user?.userName}
            </Text>
          </View>

          {/* Quantity Review Form for Non-Customer Orders Only */}
          {userRole == 'customer' && showQuantityForm && (
            <View style={styles.quantitySection}>
              <View style={styles.quantitySectionHeader}>
                <Ionicons name="create-outline" size={20} color="#d97706" />
                <Text style={styles.quantitySectionTitle}>Verify Quantities</Text>
              </View>
              
              {Object.entries(quantities).map(([itemId, item]) => (
                <View key={itemId} style={styles.quantityItem}>
                  <Text style={styles.quantityItemName}>
                    {item.name} ({item.unit})
                  </Text>
                  <View style={styles.quantityInputs}>
                    <View style={styles.quantityInputGroup}>
                      <Text style={styles.quantityLabel}>Original</Text>
                      <TextInput
                        value={item.originalQuantity.toString()}
                        editable={false}
                        style={[styles.quantityInput, styles.quantityInputDisabled]}
                      />
                    </View>
                    <View style={styles.quantityInputGroup}>
                      <Text style={styles.quantityLabel}>Actual *</Text>
                      <TextInput
                        value={item.actualQuantity.toString()}
                        onChangeText={(value) => handleQuantityChange(itemId, value, item.measurement_unit)}
                        keyboardType="numeric"
                        style={styles.quantityInput}
                      />
                    </View>
                  </View>
                  {(item.originalQuantity !== item.actualQuantity && item.actualQuantity !== '') && (
                    <View style={styles.quantityDiff}>
                      <Text style={styles.quantityDiffText}>
                        Diff: {item.measurement_unit === 2 
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
                  <Text style={styles.quantityNotesLabel}>Reason for Changes *</Text>
                  <TextInput
                    value={quantityNotes}
                    onChangeText={setQuantityNotes}
                    placeholder="Explain quantity differences..."
                    placeholderTextColor={colors.placeholder}
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
            {userRole === 'customer' ? 'Estimated Weight (kg) *' : 'Estimated Weight'}
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder={userRole === 'customer' ? "e.g. 2.5" : "Order weight"}
            placeholderTextColor={colors.placeholder}
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
              <Ionicons name="camera" size={48} color={colors.placeholder} />
              <Text style={styles.placeholderText}>No photo taken</Text>
            </View>
          )}

          <TouchableOpacity
            onPress={pickImage}
            style={styles.cameraButton}
          >
            <Ionicons
              name="camera"
              size={20}
              color="white"
              style={styles.buttonIcon}
            />
            <Text style={styles.buttonText}>
              {photo ? 'Retake Photo' : `Take ${userRole === 'customer' ? 'Collection' : 'Delivery'} Photo`}
            </Text>
          </TouchableOpacity>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              onPress={resetModal}
              style={[styles.button, styles.cancelButton]}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={completeOrder}
              style={[styles.button, styles.submitButton]}
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
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.buttonText}>
                    {userRole === 'customer' ? 'Mark as Collected' : 'Mark as Delivered'}
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

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: 'white',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  modalContent: {
    padding: 16,
  },
  orderSummary: {
    backgroundColor: 'white',
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
    backgroundColor: '#fef3c7',
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
  quantitySectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d97706',
  },
  quantityItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
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
  quantityLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: 'white',
  },
  quantityInputDisabled: {
    backgroundColor: '#f9fafb',
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
    color: '#dc2626',
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
    backgroundColor: 'white',
    textAlignVertical: 'top',
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: 'white',
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 16,
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
    backgroundColor: '#f9fafb',
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
    color: colors.placeholder,
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
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  submitButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

export default CompleteOrderModal;