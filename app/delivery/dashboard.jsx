import { useState } from 'react';
import {
  View, Text, TouchableOpacity, Image, TextInput, ScrollView, FlatList, Modal, ActivityIndicator,
  StyleSheet, SafeAreaView, Alert, Pressable
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/theme';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import useOrders from '../../hooks/useOrders';
import OrderCard from '../../components/cards/OrderCardDelivery';
import OrderDetailsModal from '../../components/Modals/OrderDetailsModal';
import CompleteOrderModal from '../../components/Modals/CompleteOrderModal';
import { useLocalization } from '../../context/LocalizationContext';

export default function DeliveryDashboard() {
  const { orders, getAssignedOrders, refreshing, fetchingOrders } = useOrders();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const { currentLanguage, changeLanguage, t, isRTL } = useLocalization(); 
  const [showMenu, setShowMenu] = useState(false);
  
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
        t('auth.logout_failed'),
        t('auth.logout_error_message')
      );
    }
  };

  const toggleLanguage = () => {
    const newLanguage = currentLanguage === 'en' ? 'ar' : 'en';
    changeLanguage(newLanguage);
  };

  // Dynamic styles for RTL
  const dynamicStyles = {
    container: [styles.container, isRTL && styles.rtlContainer],
    header: [styles.header, isRTL && styles.rtlHeader],
    headerLeft: [styles.headerLeft, isRTL && styles.rtlHeaderLeft],
    headerRight: [styles.headerRight, isRTL && styles.rtlHeaderRight],
    orderCount: [styles.orderCount, isRTL && styles.rtlOrderCount],
    menuOverlay: [styles.menuOverlay, isRTL && styles.rtlMenuOverlay],
    menuItem: [styles.menuItem, isRTL && styles.rtlMenuItem],
  };

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <StatusBar style="dark" backgroundColor="#ffffff" />
      
      {/* Fixed Header */}
      <View style={dynamicStyles.header}>
        {/* Left Side - Title and Icon */}
        <View style={dynamicStyles.headerLeft}>
          <View style={styles.headerIcon}>
            <Ionicons name="car" size={20} color="white" />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {t('dashboard.delivery_dashboard')}
            </Text>
          </View>
        </View>

        {/* Right Side - Action Buttons */}
        <View style={dynamicStyles.headerRight}>
          {/* Order Count Badge */}
          <View style={dynamicStyles.orderCount}>
            <Ionicons 
              name="cube" 
              size={14} 
              color={colors.primary}
              style={[styles.orderCountIcon, isRTL && styles.rtlIcon]}
            />
            <Text style={styles.orderCountText}>
              {orders.length}
            </Text>
          </View>
          
          {/* Refresh Button */}
          <TouchableOpacity 
            onPress={handleManualRefresh} 
            style={[styles.actionButton, styles.refreshButton, fetchingOrders && styles.refreshButtonDisabled]}
            disabled={fetchingOrders}
          >
            {fetchingOrders ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons 
                name="refresh" 
                size={18} 
                color={colors.primary} 
              />
            )}
          </TouchableOpacity>
          
          {/* Menu Button */}
          <TouchableOpacity 
            onPress={() => setShowMenu(true)} 
            style={[styles.actionButton, styles.menuButton]}
          >
            <Ionicons name="ellipsis-vertical" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Orders List */}
      {orders.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="car-outline" size={64} color={colors.primary} />
          <Text style={styles.emptyTitle}>{t('orders.no_orders_assigned')}</Text>
          <Text style={styles.emptyText}>{t('orders.orders_will_appear_here')}</Text>
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
          contentContainerStyle={styles.listContainer}
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
          <View style={[styles.modalHeader, isRTL && styles.rtlModalHeader]}>
            <Text style={styles.modalTitle}>{t('orders.order_details')}</Text>
            <TouchableOpacity onPress={() => setShowOrderDetailsModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.orderDetailsContent}>
            {selectedOrderDetails && (
              <View style={styles.orderDetailsCard}>
                <Text style={styles.orderDetailTitle}>
                  {t('order.order_number', { id: selectedOrderDetails._id?.slice(-8) })}
                </Text>
                <Text style={styles.orderDetailCustomer}>
                  {t('order.customer')}: {selectedOrderDetails.user?.userName}
                </Text>
                {/* Add more order details here as needed */}
                {selectedOrderDetails.items && selectedOrderDetails.items.length > 0 && (
                  <View style={styles.itemsList}>
                    <Text style={styles.itemsTitle}>{t('orders.items')}:</Text>
                    {selectedOrderDetails.items.map((item, index) => (
                      <View key={index} style={styles.itemRow}>
                        <Text style={styles.itemName}>
                          {item.name?.[currentLanguage] || item.itemName || item.name || item.productName || t('common.item')}
                        </Text>
                        <Text style={styles.itemQuantity}>
                          {item.quantity} {item.measurement_unit === 1 ? t('units.kg') : t('units.piece')}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
                <View style={styles.orderMeta}>
                  <Text style={styles.orderMetaLabel}>{t('orders.status')}:</Text>
                  <Text style={styles.orderMetaValue}>
                    {selectedOrderDetails.status === 'assigntocourier' ? t('orders.ready_for_delivery') : 
                     selectedOrderDetails.status.charAt(0).toUpperCase() + selectedOrderDetails.status.slice(1)}
                  </Text>
                </View>
                <View style={styles.orderMeta}>
                  <Text style={styles.orderMetaLabel}>{t('orders.created')}:</Text>
                  <Text style={styles.orderMetaValue}>
                    {new Date(selectedOrderDetails.createdAt).toLocaleDateString(currentLanguage === 'ar' ? 'ar-EG' : 'en-GB', {
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

      {/* Menu Modal */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <Pressable 
          style={dynamicStyles.menuOverlay} 
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuContainer}>
            {/* Language Option */}
            <TouchableOpacity 
              style={dynamicStyles.menuItem}
              onPress={() => {
                toggleLanguage();
                setShowMenu(false);
              }}
            >
              <Ionicons 
                name="language" 
                size={20} 
                color={colors.text}
                style={[styles.menuIcon, isRTL && styles.rtlMenuIcon]}
              />
              <Text style={styles.menuText}>
                {currentLanguage === 'en' ? t('menu.switch_to_arabic') : t('menu.switch_to_english')}
              </Text>
            </TouchableOpacity>
            
            {/* Logout Option */}
            <TouchableOpacity 
              style={dynamicStyles.menuItem}
              onPress={() => {
                setShowMenu(false);
                handleLogout();
              }}
            >
              <Ionicons 
                name="log-out-outline" 
                size={20} 
                color={colors.danger}
                style={[styles.menuIcon, isRTL && styles.rtlMenuIcon]}
              />
              <Text style={[styles.menuText, { color: colors.danger }]}>
                {t('auth.logout')}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 35,
  },
  rtlContainer: {
    direction: 'rtl',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 56,
  },
  rtlHeader: {
    flexDirection: 'row-reverse',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  rtlHeaderLeft: {
    flexDirection: 'row-reverse',
    marginRight: 0,
    marginLeft: 12,
  },
  headerIcon: {
    width: 32,
    height: 32,
    backgroundColor: colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rtlHeaderRight: {
    flexDirection: 'row-reverse',
  },
  orderCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 40,
    justifyContent: 'center',
  },
  rtlOrderCount: {
    flexDirection: 'row-reverse',
  },
  orderCountIcon: {
    marginRight: 4,
  },
  rtlIcon: {
    marginRight: 0,
    marginLeft: 4,
  },
  orderCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButton: {
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  refreshButtonDisabled: {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
  },
  menuButton: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  listContainer: {
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
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
  rtlModalHeader: {
    flexDirection: 'row-reverse',
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
    paddingVertical: 8,
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
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: 16,
  },
  rtlMenuOverlay: {
    alignItems: 'flex-start',
    paddingRight: 0,
    paddingLeft: 16,
  },
  menuContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 8,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  rtlMenuItem: {
    flexDirection: 'row-reverse',
  },
  menuIcon: {
    marginRight: 10,
  },
  rtlMenuIcon: {
    marginRight: 0,
    marginLeft: 10,
  },
  menuText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
});