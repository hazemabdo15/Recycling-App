import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EarnPointsCard } from "../../components/cards";
import { ErrorBoundary } from "../../components/common";
import { TopRecycledSection } from "../../components/sections";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { colors, spacing } from "../../styles/theme";
import { getLabel } from "../../utils/roleLabels";

const Index = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const { unreadCount, fetchNotifications } = useNotifications();
  const fetchNotificationsRef = useRef(fetchNotifications);

  useEffect(() => {
    fetchNotificationsRef.current = fetchNotifications;
  }, [fetchNotifications]);

  const handleNotificationPress = () => {
    console.log("Navigate to notifications");
    router.push("/notifications");
  };

  const tabBarHeight = 140 + insets.bottom;

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />

        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroSection, { paddingTop: insets.top + 20 }]}
        >
          <View style={styles.headerRow}>
            <Text style={styles.appName}>{getLabel('appName', user?.role)}</Text>
            {isLoggedIn && user && !user.isGuest && !authLoading && (
              <TouchableOpacity
                style={styles.notificationButton}
                onPress={handleNotificationPress}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color={colors.white}
                />
                {unreadCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.badgeText}>
                      {unreadCount > 99 ? "99+" : unreadCount.toString()}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.heroContent}>
            <Text style={styles.welcomeText}>Welcome Back!</Text>
            <Text style={styles.heroTitle}>Make Every Item Count</Text>
            <Text style={styles.heroSubtitle}>
              {getLabel('welcomeMessage', user?.role)}
            </Text>
          </View>
        </LinearGradient>

        <View
          style={[styles.contentContainer, { paddingBottom: tabBarHeight }]}
        >
          <View style={styles.statsSection}>
            <EarnPointsCard />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🔥 Trending This Week</Text>
              <Text style={styles.sectionSubtitle}>
                Most recycled items in your area
              </Text>
            </View>
            <TopRecycledSection />
          </View>
        </View>
      </View>
    </ErrorBoundary>
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
  appName: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.white,
    letterSpacing: -0.5,
  },
  notificationButton: {
    position: "relative",
    padding: spacing.sm,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  notificationBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: colors.accent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.white,
  },
  badgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "bold",
  },
  heroContent: {
    alignItems: "center",
    paddingTop: spacing.sm,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.white,
    opacity: 0.9,
    marginBottom: spacing.xs,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.white,
    textAlign: "center",
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    color: colors.white,
    textAlign: "center",
    opacity: 0.85,
    lineHeight: 22,
    maxWidth: 280,
  },
  contentContainer: {
    flex: 1,
    paddingTop: spacing.md,
    justifyContent: "space-between",
  },
  statsSection: {
    paddingHorizontal: spacing.lg,
  },
  section: {
    paddingHorizontal: spacing.lg,
    maxHeight: 280,
    justifyContent: "flex-start",
  },
  sectionHeader: {
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.base200,
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: spacing.xs / 2,
    letterSpacing: -0.3,
    textAlign: "center",
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    fontWeight: "400",
    textAlign: "center",
  },
});

export default Index;
