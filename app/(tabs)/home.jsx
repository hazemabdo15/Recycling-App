import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EarnPointsCard } from "../../components/cards";
import { ErrorBoundary } from "../../components/common";
import { TopRecycledSection } from "../../components/sections";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { colors, spacing } from "../../styles/theme";
import { getLabel } from "../../utils/roleLabels";
import { scaleSize } from "../../utils/scale";

const Index = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const { unreadCount, refreshNotifications, isConnected } = useNotifications();
  const refreshNotificationsRef = useRef(refreshNotifications);

  useEffect(() => {
    refreshNotificationsRef.current = refreshNotifications;
  }, [refreshNotifications]);

  const handleNotificationPress = () => {
    console.log("Navigate to notifications");
    router.push("/notifications");
  };

  return (
    <View style={styles.container}>
      <ErrorBoundary>
        <LinearGradient
          colors={[colors.primary, colors.neutral]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroSection, { paddingTop: insets.top + 20 }]}
        >
          <View style={styles.headerRow}>
            <Text style={styles.appName}>
              {getLabel("appName", user?.role)}
            </Text>
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
                <View
                  style={[
                    styles.connectionDot,
                    {
                      backgroundColor: isConnected ? "#10B981" : "#EF4444",
                    },
                  ]}
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
              {getLabel("welcomeMessage", user?.role)}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.contentSection}>
          <View style={styles.statsSection}>
            <EarnPointsCard />
          </View>

          <View style={[styles.section, { marginBottom: scaleSize(160) + insets.bottom }]}> 
            <View style={[styles.sectionHeader, styles.centeredHeader]}>
              <Text style={styles.sectionTitle}>🔥 Trending This Week</Text>
              <Text style={styles.sectionSubtitle}>
                Most recycled items in your area
              </Text>
            </View>
            <TopRecycledSection />
            {/* Spacer to ensure margin between the list and the tab bar */}
            <View style={{ height: scaleSize(40) + insets.bottom }} />
          </View>
        </View>
      </ErrorBoundary>
    </View>
  );
};

const styles = StyleSheet.create({
  lastSection: {

  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroSection: {
    paddingHorizontal: scaleSize(spacing.lg),
    paddingBottom: scaleSize(spacing.xl),
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  appName: {
    fontSize: scaleSize(24),
    fontWeight: "bold",
    color: colors.white,
    letterSpacing: -0.5,
  },
  notificationButton: {
    position: "relative",
    padding: scaleSize(spacing.sm),
    borderRadius: scaleSize(20),
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  connectionDot: {
    position: "absolute",
    bottom: scaleSize(2),
    left: scaleSize(2),
    width: scaleSize(8),
    height: scaleSize(8),
    borderRadius: scaleSize(4),
    borderWidth: 1,
    borderColor: colors.white,
  },
  notificationBadge: {
    position: "absolute",
    top: scaleSize(2),
    right: scaleSize(2),
    backgroundColor: colors.accent,
    borderRadius: scaleSize(10),
    minWidth: scaleSize(20),
    height: scaleSize(20),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.white,
  },
  badgeText: {
    color: colors.white,
    fontSize: scaleSize(12),
    fontWeight: "bold",
  },
  heroContent: {
    alignItems: "center",
    paddingTop: scaleSize(spacing.sm),
  },
  welcomeText: {
    fontSize: scaleSize(16),
    color: colors.white,
    opacity: 0.9,
    marginBottom: scaleSize(spacing.xs),
  },
  heroTitle: {
    fontSize: scaleSize(32),
    fontWeight: "bold",
    color: colors.white,
    textAlign: "center",
    marginBottom: scaleSize(spacing.sm),
    letterSpacing: -1,
  },
  heroSubtitle: {
    fontSize: scaleSize(16),
    color: colors.white,
    textAlign: "center",
    opacity: 0.85,
    lineHeight: scaleSize(24),
    maxWidth: scaleSize(280),
  },
  contentSection: {
    backgroundColor: colors.background,
    borderTopLeftRadius: scaleSize(24),
    borderTopRightRadius: scaleSize(24),
    marginTop: scaleSize(-24),
    paddingHorizontal: scaleSize(spacing.md),
    paddingTop: scaleSize(spacing.lg),
    paddingBottom: scaleSize(24),
  },
  statsSection: {
    marginBottom: scaleSize(spacing.sm),
  },
  section: {
    marginBottom: scaleSize(30),
  },
  sectionHeader: {
    marginBottom: scaleSize(spacing.md),
  },
  centeredHeader: {
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: scaleSize(20),
    fontWeight: "bold",
    color: colors.text,
    marginBottom: scaleSize(spacing.xs),
    textAlign: "center",
  },
  sectionSubtitle: {
    fontSize: scaleSize(14),
    color: colors.textLight,
    lineHeight: scaleSize(20),
    textAlign: "center",
  },
});

export default Index;
