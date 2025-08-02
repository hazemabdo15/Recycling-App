import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, Image, TextInput, ScrollView, FlatList, Modal, ActivityIndicator,
  StyleSheet, SafeAreaView,
  Alert
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../../services/api/apiService';
import OrderCard from '../../components/cards/OrderCard';
import { colors } from '../../styles/theme';
import { useRouter } from 'expo-router';

export default function DeliveryDashboard() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showProofModal, setShowProofModal] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { logout } = useAuth();
  const router = useRouter();

  const getAssignedOrders = async () => {
    try {
      const res = await apiService.get('/my-orders');
      setOrders(res.orders);
    } catch (err) {
      console.log('Error loading orders', err);
    }
  };

  useEffect(() => {
    getAssignedOrders();
  }, []);

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
    if (!photo) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('proofPhoto', {
      uri: photo.uri,
      name: 'proof.jpg',
      type: 'image/jpeg',
    });
    formData.append('notes', notes);

    try {
      const response = await apiService.post(`/${selectedOrder._id}/complete-with-proof`, formData);
      if (response.message === 'Order completed successfully with delivery proof') {
        Alert.alert(
        'Delivery Completed',
        'Your delivery has been successfully completed.',
        [{ text: 'OK' }]
        );
        setShowProofModal(false);
        setPhoto(null);
        setNotes('');
        getAssignedOrders();
    }
    } catch (err) {
      console.error('Error submitting proof', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
      try {
        console.log("Logging out user...");
        await logout();
        router.replace("/login");
      } catch (error) {
        console.error("Logout failed", error);
        Alert.alert(
          "Logout Failed",
          "There was an error logging out. Please try again."
        );
  }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Deliveries</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color={colors.danger} />
        </TouchableOpacity>
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cube-outline" size={48} color={colors.primary} />
          <Text style={styles.emptyText}>No deliveries assigned</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <OrderCard
              item={item}
              setSelectedOrder={setSelectedOrder}
              setShowProofModal={setShowProofModal}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      <Modal
        visible={showProofModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Complete Delivery</Text>
            <TouchableOpacity onPress={() => setShowProofModal(false)}>
              <Ionicons name="checkmark-circle" size={15} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {photo ? (
              <Image
                source={{ uri: photo.uri }}
                style={styles.photoPreview}
              />
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
                {photo ? 'Retake Photo' : 'Take Delivery Photo'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.notesLabel}>Delivery Notes (Optional)</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any notes about the delivery..."
              placeholderTextColor={colors.placeholder}
              style={styles.notesInput}
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setShowProofModal(false)}
                style={[styles.button, styles.cancelButton]}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={completeOrder}
                style={[styles.button, styles.submitButton]}
                disabled={loading || !photo}
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
                    <Text style={styles.buttonText}>Complete Delivery</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.primary,
  },
  logoutButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    color: colors.textSecondary,
  },
  listContent: {
    padding: 16,
  },
  separator: {
    height: 12,
  },
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
  },
  modalTitle: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  modalContent: {
    padding: 8,
  },
  photoPreview: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: 16,
  },
  photoPlaceholder: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.lightBackground,
    borderRadius: 12,
    marginBottom: 16,
  },
  placeholderText: {
    marginTop: 8,
    color: colors.placeholder,
  },
  cameraButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 8,
    marginBottom: 20,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
    color: colors.text,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
    borderRadius: 8,
    flex: 1,
  },
  cancelButton: {
    backgroundColor: colors.base200,
    marginRight: 10,
  },
  cancelButtonText: {
    color: colors.error,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: colors.primary,
    marginLeft: 10,
    opacity: 1,
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
});