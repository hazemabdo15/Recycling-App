import { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, Image, TextInput, ScrollView, FlatList, Modal, ActivityIndicator,
  StyleSheet, SafeAreaView, Alert, Pressable
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../../services/api/apiService';
import { colors } from '../../styles/theme';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import useOrders from '../../hooks/useOrders';
import OrderCard from '../../components/cards/OrderCardDelivery';
import OrderDetailsModal from '../../components/Modals/OrderDetailsModal';
import CompleteOrderModal from '../../components/Modals/CompleteOrderModal';

export default function DeliveryDashboard() {
  const { orders, getAssignedOrders, refreshing, fetchingOrders } = useOrders();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  
  const { logout } = useAuth();
  const router = useRouter();

  const openDetails = (order) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  const openComplete = (order) => {
    setSelectedOrder(order);
    setShowProofModal(true);
  };

  // Handle order details view
  const handleViewOrderDetails = async (order) => {
    try {
      const detailedOrder = order; // Assuming the order already contains all needed details
      setSelectedOrderDetails(detailedOrder);
      setShowOrderDetailsModal(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
      Alert.alert('Error', 'Failed to load order details. Please try again.');
    }
  };

  // Manual refresh handler
  const handleManualRefresh = async () => {
    await getAssignedOrders(true);
  };

  // Handle order completion success
  const handleOrderCompleted = async () => {
    await getAssignedOrders();
    setShowProofModal(false);
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
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Enhanced Header */}
      <View style={styles.header}>
        <StatusBar style="dark" backgroundColor="#ffffff" />
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <Ionicons name="car" size={24} color="white" />
          </View>
          <View>
            <Text style={styles.title}>Delivery Dashboard</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.orderCount}>
            <Ionicons name="cube" size={16} color={colors.primary} />
            <Text style={styles.orderCountText}>{orders.length} Orders</Text>
          </View>
          
          {/* Refresh Button */}
          <TouchableOpacity 
            onPress={handleManualRefresh} 
            style={[styles.refreshButton, fetchingOrders && styles.refreshButtonDisabled]}
            disabled={fetchingOrders}
          >
            {fetchingOrders ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons 
                name="refresh" 
                size={20} 
                color={colors.primary} 
                style={fetchingOrders ? styles.refreshIconDisabled : null}
              />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Orders List */}
      {orders.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="car-outline" size={64} color={colors.primary} />
          <Text style={styles.emptyTitle}>No orders assigned yet</Text>
          <Text style={styles.emptyText}>Once orders are assigned to you, they will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          refreshing={refreshing}
          onRefresh={() => getAssignedOrders(false)}
          renderItem={({ item }) => (
            <OrderCard
              item={item}
              onViewDetails={openDetails}
              onComplete={openComplete}
            />
          )}
        />
      )}

      {/* Order Details Modal */}
      <OrderDetailsModal 
        visible={showDetails} 
        onClose={() => setShowDetails(false)} 
        order={selectedOrder} 
      />

      {/* Alternative Order Details Modal (if needed) */}
      <Modal
        visible={showOrderDetailsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Order Details</Text>
            <TouchableOpacity onPress={() => setShowOrderDetailsModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.orderDetailsContent}>
            {selectedOrderDetails && (
              <View style={styles.orderDetailsCard}>
                <Text style={styles.orderDetailTitle}>
                  Order #{selectedOrderDetails._id?.slice(-8)}
                </Text>
                <Text style={styles.orderDetailCustomer}>
                  Customer: {selectedOrderDetails.user?.userName}
                </Text>
                {/* Add more order details here as needed */}
                {selectedOrderDetails.items && selectedOrderDetails.items.length > 0 && (
                  <View style={styles.itemsList}>
                    <Text style={styles.itemsTitle}>Items:</Text>
                    {selectedOrderDetails.items.map((item, index) => (
                      <View key={index} style={styles.itemRow}>
                        <Text style={styles.itemName}>
                          {item.itemName || item.name || item.productName || 'Item'}
                        </Text>
                        <Text style={styles.itemQuantity}>
                          {item.quantity} {item.unit}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
                <View style={styles.orderMeta}>
                  <Text style={styles.orderMetaLabel}>Status:</Text>
                  <Text style={styles.orderMetaValue}>
                    {selectedOrderDetails.status === 'assigntocourier' ? 'Ready for Delivery' : 
                     selectedOrderDetails.status.charAt(0).toUpperCase() + selectedOrderDetails.status.slice(1)}
                  </Text>
                </View>
                <View style={styles.orderMeta}>
                  <Text style={styles.orderMetaLabel}>Created:</Text>
                  <Text style={styles.orderMetaValue}>
                    {new Date(selectedOrderDetails.createdAt).toLocaleDateString("en-GB", {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Complete Order Modal */}
      <CompleteOrderModal
        visible={showProofModal}
        selectedOrder={selectedOrder}
        onClose={() => setShowProofModal(false)}
        onOrderCompleted={handleOrderCompleted}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 35,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIcon: {
    width: 38,
    height: 38,
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  orderCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  orderCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  refreshButtonDisabled: {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
  },
  refreshIconDisabled: {
    opacity: 0.5,
  },
  logoutButton: {
    padding: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 250,
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
    backgroundColor: 'white',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  orderDetailsContent: {
    flex: 1,
    padding: 16,
  },
  orderDetailsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  orderDetailTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  orderDetailCustomer: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  itemsList: {
    marginBottom: 16,
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemName: {
    fontSize: 13,
    color: colors.text,
    flex: 1,
  },
  itemQuantity: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  orderMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  orderMetaLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  orderMetaValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
});