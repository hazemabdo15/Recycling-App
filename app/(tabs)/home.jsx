import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from "react-native";
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
  const { unreadCount, refreshNotifications, isConnected } = useNotifications();
  const refreshNotificationsRef = useRef(refreshNotifications);

  useEffect(() => {
    refreshNotificationsRef.current = refreshNotifications;
  }, [refreshNotifications]);

  const handleNotificationPress = () => {
    console.log("Navigate to notifications");
    router.push("/notifications");
  };

  const tabBarHeight = 140 + insets.bottom;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: tabBarHeight }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ErrorBoundary>
          <LinearGradient
            colors={[colors.primary, colors.neutral]}
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
                  <View style={[styles.connectionDot, { 
                    backgroundColor: isConnected ? '#10B981' : '#EF4444' 
                  }]} />
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

          <View style={styles.contentSection}>
            <View style={styles.statsSection}>
              <EarnPointsCard />
            </View>

            <View style={styles.section}>
              <View style={[styles.sectionHeader, styles.centeredHeader]}>
                <Text style={styles.sectionTitle}>🔥 Trending This Week</Text>
                <Text style={styles.sectionSubtitle}>
                  Most recycled items in your area
                </Text>
              </View>
              <TopRecycledSection />
            </View>
          </View>
        </ErrorBoundary>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
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
  connectionDot: {
    position: "absolute",
    bottom: 2,
    left: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.white,
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
    color: colors.white,
    opacity: 0.9,
    marginBottom: spacing.xs,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.white,
    textAlign: "center",
    marginBottom: spacing.sm,
    letterSpacing: -1,
  },
  heroSubtitle: {
    fontSize: 16,
    color: colors.white,
    textAlign: "center",
    opacity: 0.85,
    lineHeight: 24,
    maxWidth: 280,
  },
  contentSection: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  statsSection: {
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  centeredHeader: {
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
    textAlign: "center",
  },
});

export default Index;