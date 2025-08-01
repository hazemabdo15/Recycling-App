﻿import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNotifications } from "../context/NotificationContext";
import { colors, spacing } from "../styles/theme";
import { scaleSize } from '../utils/scale';

const NotificationsScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const {
    notifications,
    unreadCount,
    refreshNotifications,
    markAsRead,
    markNotificationAsRead,
    deleteNotification,
    isConnected,
    reconnectSocket,
  } = useNotifications();

  useFocusEffect(
    useCallback(() => {
      console.log('📱 Notifications screen focused - refreshing notifications');
      refreshNotifications();
    }, [refreshNotifications])
  );

  useEffect(() => {
    console.log('📱 Notifications updated:', notifications.length, 'total,', unreadCount, 'unread');
  }, [notifications, unreadCount]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshNotifications();
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshNotifications]);

  const getNotificationIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "order_assigned":
      case "order_confirmed":
        return "checkmark-circle";
      case "order_cancelled":
      case "order_failed":
        return "close-circle";
      case "order_completed":
        return "trophy";
      case "order_picked_up":
        return "car";
      case "points_awarded":
        return "gift";
      case "system":
        return "settings";
      case "promotion":
        return "megaphone";
      default:
        return "notifications";
    }
  };

  const getNotificationColor = (type) => {
    switch (type?.toLowerCase()) {
      case "order_assigned":
      case "order_confirmed":
      case "order_completed":
        return colors.success;
      case "order_cancelled":
      case "order_failed":
        return colors.error;
      case "order_picked_up":
        return colors.info;
      case "points_awarded":
        return colors.warning;
      case "system":
        return colors.secondary;
      case "promotion":
        return colors.accent;
      default:
        return colors.primary;
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    console.log('🔄 Marking individual notification as read:', notificationId);
    await markNotificationAsRead(notificationId);
  };

  const handleDeleteNotification = (notificationId) => {
    Alert.alert(
      "Delete Notification",
      "Are you sure you want to delete this notification?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteNotification(notificationId);
          },
        },
      ]
    );
  };

  const handleReadAll = async () => {
    const unreadNotifications = notifications.filter(notif => !notif.read && !notif.isRead);
    if (unreadNotifications.length === 0) {
      Alert.alert("Info", "No unread notifications");
      return;
    }

    Alert.alert(
      "Mark All as Read",
      `Mark ${unreadNotifications.length} notifications as read?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark All",
          onPress: async () => {
            await markAsRead();
          },
        },
      ]
    );
  };

  const renderNotification = ({ item, index }) => {
    const isRead = item.read || item.isRead;
    const notificationColor = getNotificationColor(item.type);
    const iconName = getNotificationIcon(item.type);
    const notificationId = item.id || item._id;
    
    console.log('🔍 Notification data:', {
      id: item.id,
      _id: item._id,
      notificationId,
      isRead,
      read: item.read,
      isReadField: item.isRead
    });
    
    return (
      <View style={styles.notificationWrapper}>
        <TouchableOpacity
          style={[
            styles.notificationItem,
            {
              backgroundColor: isRead
                ? colors.background
                : colors.primary + "08",
              borderLeftColor: notificationColor,
              borderLeftWidth: isRead ? 0 : 4,
            },
          ]}
          onPress={() => handleMarkAsRead(notificationId)}
          activeOpacity={0.7}
        >
          <View style={styles.notificationContent}>
            <View style={styles.notificationHeader}>
              <View style={styles.iconContainer}>
                <View style={[styles.iconCircle, { backgroundColor: notificationColor + "20" }]}>
                  <Ionicons 
                    name={iconName} 
                    size={20} 
                    color={notificationColor} 
                  />
                </View>
              </View>
              
              <View style={styles.textContainer}>
                <View style={styles.titleRow}>
                  <Text style={[styles.notificationTitle, { color: isRead ? colors.textSecondary : colors.text }]}>
                    {item.title || 'No Title'}
                  </Text>
                  {!isRead && <View style={styles.unreadDot} />}
                </View>
                
                <Text style={[styles.notificationBody, { color: isRead ? colors.textTertiary : colors.textSecondary }]}>
                  {item.body || item.message || 'No content'}
                </Text>
                
                <View style={styles.notificationFooter}>
                  <Text style={styles.notificationDate}>
                    {item.createdAt ? (
                      `${new Date(item.createdAt).toLocaleDateString()} • ${new Date(item.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`
                    ) : 'No date'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteNotification(notificationId)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={18} color={colors.error} />
        </TouchableOpacity>
      </View>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons
          name="notifications-outline"
          size={64}
          color={colors.textSecondary}
        />
      </View>
      <Text style={styles.emptyTitle}>No notifications yet</Text>
      <Text style={styles.emptySubtitle}>
        You&apos;ll receive notifications about your orders and account updates here
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <LinearGradient
        colors={[colors.primary, colors.neutral]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.heroSection, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          
          <Text style={styles.heroTitle}>Notifications</Text>
          
          <View style={styles.connectionStatus}>
            <View style={[styles.connectionDot, { 
              backgroundColor: isConnected ? '#10B981' : '#EF4444' 
            }]} />
          </View>
        </View>

        <View style={styles.heroContent}>
          <Text style={styles.heroSubtitle}>
            Stay updated with your recycling activities
          </Text>
          {unreadCount > 0 && (
            <Text style={styles.unreadText}>
              {unreadCount} unread notification{unreadCount > 1 ? "s" : ""}
            </Text>
          )}
        </View>
      </LinearGradient>

      <View style={styles.contentContainer}>
        {!isConnected && (
          <View style={styles.connectionBanner}>
            <View style={styles.connectionBannerContent}>
              <Ionicons name="warning-outline" size={20} color={colors.warning} />
              <Text style={styles.connectionBannerText}>
                Real-time notifications disconnected
              </Text>
              <TouchableOpacity 
                style={styles.reconnectButton}
                onPress={reconnectSocket}
              >
                <Text style={styles.reconnectButtonText}>Reconnect</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {unreadCount > 0 && (
          <View style={styles.unreadBanner}>
            <Text style={styles.unreadBannerText}>
              {unreadCount} unread notification{unreadCount > 1 ? "s" : ""}
            </Text>
            <TouchableOpacity
              style={styles.readAllButton}
              onPress={handleReadAll}
            >
              <Text style={styles.readAllButtonText}>Read All</Text>
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item, index) => item.id || item._id || `notification-${index}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={<EmptyState />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  heroSection: {
    paddingHorizontal: scaleSize(spacing.lg),
    paddingBottom: scaleSize(spacing.lg),
    borderBottomLeftRadius: scaleSize(32),
    borderBottomRightRadius: scaleSize(32),
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: scaleSize(8) },
    shadowOpacity: 0.3,
    shadowRadius: scaleSize(12),
    elevation: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  backButton: {
    padding: scaleSize(spacing.sm),
    borderRadius: scaleSize(20),
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  heroTitle: {
    fontSize: scaleSize(24),
    fontWeight: "bold",
    color: colors.white,
    textAlign: "center",
    letterSpacing: -0.5,
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  connectionStatus: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectionDot: {
    width: scaleSize(10),
    height: scaleSize(10),
    borderRadius: scaleSize(5),
    borderWidth: 2,
    borderColor: colors.white,
  },
  heroContent: {
    alignItems: "center",
    paddingTop: scaleSize(spacing.sm),
  },
  heroSubtitle: {
    fontSize: scaleSize(14),
    color: colors.white,
    textAlign: "center",
    opacity: 0.85,
    lineHeight: scaleSize(22),
    maxWidth: scaleSize(280),
    marginBottom: scaleSize(spacing.xs),
  },
  unreadText: {
    fontSize: scaleSize(16),
    fontWeight: "500",
    color: colors.white,
    opacity: 0.9,
  },
  contentContainer: {
    flex: 1,
    paddingTop: scaleSize(spacing.md),
  },
  connectionBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: scaleSize(8),
    padding: scaleSize(spacing.sm),
    marginHorizontal: scaleSize(spacing.md),
    marginBottom: scaleSize(spacing.md),
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  connectionBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  connectionBannerText: {
    flex: 1,
    fontSize: scaleSize(14),
    color: '#92400E',
    marginLeft: scaleSize(spacing.xs),
    fontWeight: '500',
  },
  reconnectButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: scaleSize(spacing.sm),
    paddingVertical: scaleSize(spacing.xs),
    borderRadius: scaleSize(6),
  },
  reconnectButtonText: {
    color: colors.white,
    fontSize: scaleSize(12),
    fontWeight: '600',
  },
  unreadBanner: {
    backgroundColor: colors.white,
    marginHorizontal: scaleSize(spacing.md),
    marginTop: scaleSize(spacing.md),
    paddingHorizontal: scaleSize(spacing.lg),
    paddingVertical: scaleSize(spacing.md),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: scaleSize(12),
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: scaleSize(2),
    },
    shadowOpacity: 0.1,
    shadowRadius: scaleSize(3.84),
    elevation: 3,
  },
  unreadBannerText: {
    fontSize: scaleSize(14),
    color: colors.primary,
    fontWeight: "600",
  },
  readAllButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: scaleSize(spacing.md),
    paddingVertical: scaleSize(spacing.xs),
    borderRadius: scaleSize(16),
  },
  readAllButtonText: {
    fontSize: scaleSize(12),
    color: colors.white,
    fontWeight: "600",
  },
  listContainer: {
    flexGrow: 1,
    paddingVertical: scaleSize(spacing.sm),
    paddingHorizontal: scaleSize(spacing.md),
  },
  separator: {
    height: scaleSize(spacing.xs),
  },
  notificationWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: scaleSize(12),
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: scaleSize(2),
    },
    shadowOpacity: 0.1,
    shadowRadius: scaleSize(3.84),
    elevation: 3,
  },
  notificationItem: {
    flex: 1,
    borderRadius: scaleSize(12),
    overflow: "hidden",
  },
  notificationContent: {
    padding: scaleSize(spacing.md),
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: scaleSize(spacing.sm),
  },
  iconContainer: {
    marginTop: 2,
  },
  iconCircle: {
    width: scaleSize(40),
    height: scaleSize(40),
    borderRadius: scaleSize(20),
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.xs,
  },
  notificationTitle: {
    fontSize: scaleSize(16),
    fontWeight: "600",
    flex: 1,
    marginRight: scaleSize(spacing.sm),
    lineHeight: scaleSize(22),
  },
  unreadDot: {
    width: scaleSize(8),
    height: scaleSize(8),
    borderRadius: scaleSize(4),
    backgroundColor: colors.primary,
    marginTop: scaleSize(7),
  },
  notificationBody: {
    fontSize: scaleSize(14),
    lineHeight: scaleSize(20),
    marginBottom: scaleSize(spacing.sm),
  },
  notificationFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  notificationDate: {
    fontSize: scaleSize(12),
    color: colors.textTertiary,
    fontWeight: "500",
  },
  deleteButton: {
    padding: scaleSize(spacing.sm),
    marginRight: scaleSize(spacing.sm),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scaleSize(spacing.xl),
    paddingVertical: scaleSize(spacing.xxl),
  },
  emptyIconContainer: {
    width: scaleSize(100),
    height: scaleSize(100),
    borderRadius: scaleSize(50),
    backgroundColor: colors.base100,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: scaleSize(spacing.lg),
  },
  emptyTitle: {
    fontSize: scaleSize(20),
    fontWeight: "600",
    color: colors.text,
    marginBottom: scaleSize(spacing.xs),
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: scaleSize(14),
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: scaleSize(20),
    maxWidth: scaleSize(280),
  },
});

export default NotificationsScreen;
