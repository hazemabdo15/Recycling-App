import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
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

const NotificationsScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    refreshNotifications,
    markAsRead,
    markNotificationAsRead,
    deleteNotification,
  } = useNotifications();

  // Get notification icon based on type
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

  // Get notification color based on type
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

      {/* Hero Section with Gradient - Same as Home */}
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
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
          
          {/* Empty view to balance the layout */}
          <View style={styles.headerSpacer} />
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

      {/* Content Container */}
      <View style={styles.contentContainer}>
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
              refreshing={false}
              onRefresh={refreshNotifications}
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  backButton: {
    padding: spacing.sm,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.white,
    textAlign: "center",
    letterSpacing: -0.5,
    flex: 1,
  },
  headerSpacer: {
    width: 40, // Same width as back button to balance layout
  },
  heroContent: {
    alignItems: "center",
    paddingTop: spacing.sm,
  },
  heroSubtitle: {
    fontSize: 14,
    color: colors.white,
    textAlign: "center",
    opacity: 0.85,
    lineHeight: 22,
    maxWidth: 280,
    marginBottom: spacing.xs,
  },
  unreadText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.white,
    opacity: 0.9,
  },
  contentContainer: {
    flex: 1,
    paddingTop: spacing.md,
  },
  unreadBanner: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  unreadBannerText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
  },
  readAllButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
  },
  readAllButtonText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: "600",
  },
  listContainer: {
    flexGrow: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  separator: {
    height: spacing.xs,
  },
  notificationWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  notificationItem: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  notificationContent: {
    padding: spacing.md,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  iconContainer: {
    marginTop: 2,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: spacing.sm,
    lineHeight: 22,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 7,
  },
  notificationBody: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  notificationFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  notificationDate: {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: "500",
  },
  deleteButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.base100,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },
});

export default NotificationsScreen;
