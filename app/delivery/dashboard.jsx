import { useState } from 'react';
import {
  View, Text, TouchableOpacity, Image, TextInput, ScrollView, FlatList, Modal, ActivityIndicator,
  StyleSheet, SafeAreaView, Alert, Pressable
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import useOrders from '../../hooks/useOrders';
import OrderCard from '../../components/cards/OrderCardDelivery';
import OrderDetailsModal from '../../components/Modals/OrderDetailsModal';
import CompleteOrderModal from '../../components/Modals/CompleteOrderModal';
import { useLocalization } from '../../context/LocalizationContext';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme } from '../../context/ThemeContext';

export default function DeliveryDashboard() {
  const { orders, getAssignedOrders, refreshing, fetchingOrders } = useOrders();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const { currentLanguage, changeLanguage, t, isRTL } = useLocalization(); 
  const [showMenu, setShowMenu] = useState(false);
  const { colors, isDarkMode } = useThemedStyles();
  const { toggleTheme } = useTheme();
  
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

  const handleThemeToggle = () => {
    toggleTheme();
    setShowMenu(false);
  };

  // Dynamic styles for RTL and theming
  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: 35,
      ...(isRTL && { direction: 'rtl' }),
    },
    header: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.surface || colors.white,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '40',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 3,
      minHeight: 56,
    },
    headerLeft: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: isRTL ? 0 : 12,
      marginLeft: isRTL ? 12 : 0,
    },
    headerIcon: {
      width: 36,
      height: 36,
      backgroundColor: colors.primary,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isRTL ? 0 : 10,
      marginLeft: isRTL ? 10 : 0,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
    },
    titleContainer: {
      flex: 1,
    },
    title: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      letterSpacing: 0.2,
    },
    headerRight: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 10,
    },
    orderCount: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      backgroundColor: colors.primary + '20',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 16,
      minWidth: 45,
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.primary + '30',
    },
    orderCountIcon: {
      marginRight: isRTL ? 0 : 4,
      marginLeft: isRTL ? 4 : 0,
    },
    orderCountText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.primary,
    },
    actionButton: {
      width: 36,
      height: 36,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    refreshButton: {
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.primary + '25',
    },
    refreshButtonDisabled: {
      backgroundColor: colors.disabled + '40',
      borderColor: colors.disabled + '50',
    },
    menuButton: {
      backgroundColor: colors.surface || colors.base200,
      borderWidth: 1,
      borderColor: colors.border + '40',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    emptyTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      marginTop: 20,
      marginBottom: 10,
      textAlign: 'center',
      letterSpacing: 0.3,
    },
    emptyText: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
      maxWidth: 300,
      lineHeight: 22,
    },
    listContainer: {
      padding: 16,
      paddingBottom: 40,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    modalHeader: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '30',
      backgroundColor: colors.surface || colors.white,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: 0.2,
    },
    orderDetailsContent: {
      flex: 1,
      padding: 16,
    },
    orderDetailsCard: {
      backgroundColor: colors.surface || colors.white,
      borderRadius: 16,
      padding: 20,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    orderDetailTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 10,
      letterSpacing: 0.2,
    },
    orderDetailCustomer: {
      fontSize: 15,
      color: colors.textSecondary,
      marginBottom: 20,
      fontWeight: '500',
    },
    itemsList: {
      marginBottom: 20,
    },
    itemsTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
      letterSpacing: 0.1,
    },
    itemRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '30',
    },
    itemName: {
      fontSize: 14,
      color: colors.text,
      flex: 1,
      fontWeight: '500',
    },
    itemQuantity: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    orderMeta: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '30',
    },
    orderMetaLabel: {
      fontSize: 15,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    orderMetaValue: {
      fontSize: 15,
      color: colors.text,
      fontWeight: '600',
    },
    menuOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'flex-start',
      alignItems: isRTL ? 'flex-start' : 'flex-end',
      paddingTop: 105,
      paddingHorizontal: 16,
    },
    menuContainer: {
      backgroundColor: colors.surface || colors.white,
      borderRadius: 16,
      padding: 8,
      minWidth: 200,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 12,
      borderWidth: 1,
      borderColor: colors.border + '20',
    },
    menuItem: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 12,
      marginVertical: 2,
    },
    menuItemActive: {
      backgroundColor: colors.primary + '10',
    },
    menuIcon: {
      marginRight: isRTL ? 0 : 12,
      marginLeft: isRTL ? 12 : 0,
    },
    menuText: {
      fontSize: 13,
      color: colors.text,
      fontWeight: '500',
      flex: 1,
    },
    menuTextDanger: {
      color: colors.error,
    },
    menuDivider: {
      height: 1,
      backgroundColor: colors.border + '40',
      marginVertical: 8,
      marginHorizontal: 12,
    },
    themeToggle: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 12,
      marginVertical: 2,
    },
    themeToggleSwitch: {
      width: 44,
      height: 24,
      borderRadius: 12,
      backgroundColor: isDarkMode ? colors.primary : colors.base300,
      padding: 2,
      justifyContent: isDarkMode ? 'flex-end' : 'flex-start',
      alignItems: 'center',
      flexDirection: 'row',
    },
    themeToggleThumb: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.white,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
  });

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <StatusBar style={isDarkMode ? "light" : "dark"} backgroundColor={colors.background} />
      
      {/* Fixed Header */}
      <View style={dynamicStyles.header}>
        {/* Left Side - Title and Icon */}
        <View style={dynamicStyles.headerLeft}>
          <View style={dynamicStyles.headerIcon}>
            <Ionicons name="car" size={20} color="white" />
          </View>
          <View style={dynamicStyles.titleContainer}>
            <Text style={dynamicStyles.title} numberOfLines={1}>
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
              style={dynamicStyles.orderCountIcon}
            />
            <Text style={dynamicStyles.orderCountText}>
              {orders.length}
            </Text>
          </View>
          
          {/* Refresh Button */}
          <TouchableOpacity 
            onPress={handleManualRefresh} 
            style={[
              dynamicStyles.actionButton, 
              fetchingOrders ? dynamicStyles.refreshButtonDisabled : dynamicStyles.refreshButton
            ]}
            disabled={fetchingOrders}
            activeOpacity={0.8}
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
            style={[dynamicStyles.actionButton, dynamicStyles.menuButton]}
            activeOpacity={0.8}
          >
            <Ionicons name="ellipsis-vertical" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Orders List */}
      {orders.length === 0 ? (
        <View style={dynamicStyles.emptyState}>
          <Ionicons name="car-outline" size={72} color={colors.primary} />
          <Text style={dynamicStyles.emptyTitle}>{t('orders.no_orders_assigned')}</Text>
          <Text style={dynamicStyles.emptyText}>{t('orders.orders_will_appear_here')}</Text>
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
          contentContainerStyle={dynamicStyles.listContainer}
          showsVerticalScrollIndicator={false}
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
        <View style={dynamicStyles.modalContainer}>
          <View style={dynamicStyles.modalHeader}>
            <Text style={dynamicStyles.modalTitle}>{t('orders.order_details')}</Text>
            <TouchableOpacity 
              onPress={() => setShowOrderDetailsModal(false)}
              style={{ padding: 8, borderRadius: 20, backgroundColor: colors.base200 }}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={dynamicStyles.orderDetailsContent}>
            {selectedOrderDetails && (
              <View style={dynamicStyles.orderDetailsCard}>
                <Text style={dynamicStyles.orderDetailTitle}>
                  {t('order.order_number', { id: selectedOrderDetails._id?.slice(-8) })}
                </Text>
                <Text style={dynamicStyles.orderDetailCustomer}>
                  {t('order.customer')}: {selectedOrderDetails.user?.userName}
                </Text>
                {/* Add more order details here as needed */}
                {selectedOrderDetails.items && selectedOrderDetails.items.length > 0 && (
                  <View style={dynamicStyles.itemsList}>
                    <Text style={dynamicStyles.itemsTitle}>{t('orders.items')}:</Text>
                    {selectedOrderDetails.items.map((item, index) => (
                      <View key={index} style={dynamicStyles.itemRow}>
                        <Text style={dynamicStyles.itemName}>
                          {item.name?.[currentLanguage] || item.itemName || item.name || item.productName || t('common.item')}
                        </Text>
                        <Text style={dynamicStyles.itemQuantity}>
                          {item.quantity} {item.measurement_unit === 1 ? t('units.kg') : t('units.piece')}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
                <View style={dynamicStyles.orderMeta}>
                  <Text style={dynamicStyles.orderMetaLabel}>{t('orders.status')}:</Text>
                  <Text style={dynamicStyles.orderMetaValue}>
                    {selectedOrderDetails.status === 'assigntocourier' ? t('orders.ready_for_delivery') : 
                     selectedOrderDetails.status.charAt(0).toUpperCase() + selectedOrderDetails.status.slice(1)}
                  </Text>
                </View>
                <View style={dynamicStyles.orderMeta}>
                  <Text style={dynamicStyles.orderMetaLabel}>{t('orders.created')}:</Text>
                  <Text style={dynamicStyles.orderMetaValue}>
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

      {/* Enhanced Menu Modal */}
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
          <View style={dynamicStyles.menuContainer}>
            {/* Theme Toggle */}
            <View style={dynamicStyles.themeToggle}>
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', flex: 1 }}>
                <Ionicons 
                  name={isDarkMode ? "moon" : "sunny"} 
                  size={20} 
                  color={colors.text}
                  style={dynamicStyles.menuIcon}
                />
                <Text style={dynamicStyles.menuText}>
                  {isDarkMode ? t('settings.lightMode') : t('settings.darkMode')}
                </Text>
              </View>
              <TouchableOpacity 
                style={dynamicStyles.themeToggleSwitch}
                onPress={handleThemeToggle}
                activeOpacity={0.8}
              >
                <View style={dynamicStyles.themeToggleThumb} />
              </TouchableOpacity>
            </View>
            
            <View style={dynamicStyles.menuDivider} />
            
            {/* Language Option */}
            <TouchableOpacity 
              style={dynamicStyles.menuItem}
              onPress={() => {
                toggleLanguage();
                setShowMenu(false);
              }}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="language" 
                size={20} 
                color={colors.text}
                style={dynamicStyles.menuIcon}
              />
              <Text style={dynamicStyles.menuText}>
                {currentLanguage === 'en' ? t('menu.switch_to_arabic') : t('menu.switch_to_english')}
              </Text>
            </TouchableOpacity>
            
            <View style={dynamicStyles.menuDivider} />
            
            {/* Logout Option */}
            <TouchableOpacity 
              style={dynamicStyles.menuItem}
              onPress={() => {
                setShowMenu(false);
                handleLogout();
              }}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="log-out-outline" 
                size={20} 
                color={colors.error}
                style={dynamicStyles.menuIcon}
              />
              <Text style={[dynamicStyles.menuText, dynamicStyles.menuTextDanger]}>
                {t('auth.logout')}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}