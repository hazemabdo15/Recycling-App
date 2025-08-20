import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from "react";
import { Alert, Dimensions, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RecyclingModal from "../../components/Modals/RecyclingModal";
import ProfileCard from "../../components/profile/ProfileCard";
import ProfileMenu from "../../components/profile/ProfileMenu";
import { useAuth } from "../../context/AuthContext";
import { useLocalization } from "../../context/LocalizationContext";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { useUserPoints } from "../../hooks/useUserPoints";
import apiService from "../../services/api/apiService";
import { isCustomer } from "../../utils/roleUtils";
import { scaleSize } from "../../utils/scale";


export default function Profile() {
  return <ProfileContent />;
}

function ProfileContent() {
  const windowHeight = Dimensions.get('window').height;
  // Estimate ProfileCard height (adjust as needed)
  const PROFILE_CARD_HEIGHT = 220;
  const insets = useSafeAreaInsets();
  const { user, logout, isLoggedIn } = useAuth();
  const { t } = useLocalization();
  const { colors } = useThemedStyles();
  const styles = getStyles(colors);
  const router = useRouter();
  // const [allOrders, setAllOrders] = useState([]); // No longer used
  const [avatarUri, setAvatarUri] = useState(null);
  const [avatarLoading, setAvatarLoading] = useState(false); // New state for avatar upload
  // Edit avatar with image picker and upload to backend
  const { setUser } = useAuth(); // Assumes setUser is available in context
  // Only update avatar locally and in user context, do not trigger global loading or re-fetch orders
  // Only update avatar fields in-place to avoid triggering useEffect on user object change
  const handleEditAvatar = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          t('profile.permissionRequired'),
          t('profile.allowPhotoAccess')
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setAvatarLoading(true);
        try {
          const uri = result.assets[0].uri;
          const formData = new FormData();
          formData.append("image", {
            uri,
            name: "avatar.jpg",
            type: "image/jpeg",
          });
          const updatedUser = await apiService.put("/profile", formData, {
            headers: {},
          });
          // Only update avatar fields in user context, do not change object reference
          if (setUser) {
            setUser((prevUser) => {
              if (!prevUser) return prevUser;
              prevUser.imgUrl = updatedUser.imgUrl;
              prevUser.avatarUri = updatedUser.imgUrl;
              return prevUser;
            });
          }
          setAvatarUri(updatedUser.imgUrl); // Immediate UI update
        } catch (_) {
          Alert.alert("Error", "Could not change profile picture.");
        } finally {
          setAvatarLoading(false);
        }
      }
    } catch (_) {
      Alert.alert("Error", "Could not change profile picture.");
    }
  };
  const hasUserId = isLoggedIn && user && user._id;
  const { userPoints, totalRecycled, getUserPoints, pointsLoading } = useUserPoints(
    hasUserId
      ? {
          userId: user._id,
          name: user.name,
          email: user.email,
        }
      : { userId: null, name: null, email: null }
  );
  console.log("userPoints in ProfileContent:", userPoints, "totalRecycled:", totalRecycled);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    console.log("AuthContext user:", user);
    console.log("AuthContext isLoggedIn:", isLoggedIn);
    console.log("User role:", user?.role);

    if (isLoggedIn && user?.email) {
      console.log(`[Profile] ${user?.role} role detected, fetching orders`);
      // fetchOrders();
  }
  }, [user, isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn && user?._id) {
      console.log("[Profile] User is logged in, fetching points");
      getUserPoints();
    } else {
      console.log(
        "[Profile] User not logged in or no user ID, skipping points fetch"
      );
    }
  }, [isLoggedIn, user?._id, getUserPoints]);
  const handleLogout = async () => {
    try {
      console.log("Logging out user...");
      router.replace("/login");
      await logout();
    } catch (error) {
      console.error("Logout failed", error);
      Alert.alert(
        "Logout Failed",
        "There was an error logging out. Please try again."
      );
    }
  };

  const confirmLogout = () => {
    Alert.alert(t("auth.logout"), t("auth.logoutConfirmation"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("common.yes"), style: "destructive", onPress: handleLogout },
    ]);
  };

  const stats = {
    totalRecycles: totalRecycled,
    points: userPoints?.totalPoints ?? userPoints ?? 0,
    tier: 50,
  };
  // Pull to refresh state
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    setRefreshing(true);
    await getUserPoints();
    setRefreshing(false);
  };

  const isGuest = !isLoggedIn || !user?.email;

  if (isGuest) {
    return (
      <View style={styles.guestContainer}>
        <View style={styles.guestContent}>
          <View style={styles.guestIcon}>
            <Text style={styles.guestIconText}>👤</Text>
          </View>
          <Text style={styles.guestTitle}>Welcome, Guest!</Text>
          <Text style={styles.guestSubtitle}>
            You&apos;re browsing in guest mode
          </Text>
          <View style={styles.benefitsContainer}>
            <Text style={styles.benefitsTitle}>Join us to enjoy:</Text>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>♻️</Text>
              <Text style={styles.benefitText}>
                Track your recycling impact
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>🎯</Text>
              <Text style={styles.benefitText}>
                Earn points for every order
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>📱</Text>
              <Text style={styles.benefitText}>Manage orders easily</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>🏆</Text>
              <Text style={styles.benefitText}>Unlock membership tiers</Text>
            </View>
          </View>
          <View style={styles.guestActions}>
            <TouchableOpacity
              onPress={() => {
                router.push("/login");
              }}
              style={styles.loginButton}
            >
              <Text style={styles.loginButtonText}>Login to Your Account</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                router.push("/register");
              }}
              style={styles.signupButton}
            >
              <Text style={styles.signupButtonText}>Create New Account</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.guestBrowse}>
            <Text style={styles.guestBrowseText}>
              Or continue browsing as guest
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/home")}
              style={styles.browseButton}
            >
              <Text style={styles.browseButtonText}>Browse Services</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ListHeaderComponent for tabs only (profile card is fixed above)

  // Remove full-page Loader. Loader will be shown only in the FlatList/ListEmptyComponent area below.

  // Determine avatar source: prefer user.imgUrl, then avatarUri, then fallback
  const avatarSource = user?.imgUrl || avatarUri || undefined;

  // Menu handlers
  const handleRecyclingHistory = () => router.push("/recycling-history");
  const handleEWallet = () => router.push("/e-wallet");
  const handleHelpSupport = () => router.push("/help-support");
  const handleRedeemHistory = () => router.push("/redeem-history");

  return (
  <View style={{ flex: 1, backgroundColor: colors.primarySurface}}>
      <StatusBar style={colors.statusBarStyle} backgroundColor={colors.background} />
      <ProfileCard
        user={{
          ...user,
          totalRecycles: stats.totalRecycles,
          avatarUri: avatarSource,
        }}
        points={userPoints ?? 0}
        tier={stats.tier}
        onRedeem={() => setModalVisible(true)}
        showRedeem={isCustomer(user)}
        onEditAvatar={handleEditAvatar}
        avatarLoading={avatarLoading}
      />
      <ScrollView
        style = {{ flex: 1}}
        contentContainerStyle={{
          minHeight: windowHeight - PROFILE_CARD_HEIGHT,
          paddingBottom: insets.bottom + scaleSize(100),
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || pointsLoading}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <ProfileMenu
          user={user}
          onRecyclingHistory={handleRecyclingHistory}
          onEWallet={handleEWallet}
          onHelpSupport={handleHelpSupport}
          onRedeemHistory={handleRedeemHistory}
          onLogout={confirmLogout}
        />
      </ScrollView>
     
      <RecyclingModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        totalPoints={userPoints}
        onPointsUpdated={getUserPoints}
      />
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    padding: scaleSize(35),
    backgroundColor: colors.background,
    paddingBottom: scaleSize(40),
    flexGrow: 1,
  },
  centered: { justifyContent: "center", alignItems: "center" },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scaleSize(16),
    gap: scaleSize(12),
  },
  userName: { fontSize: scaleSize(20), fontWeight: "600", color: colors.text },
  userInfo: { fontSize: scaleSize(14), color: colors.textSecondary },
  userInfoSmall: { fontSize: scaleSize(12), color: colors.accent },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: scaleSize(16),
  },
  statBox: {
    backgroundColor: colors.cardBackground,
    padding: scaleSize(12),
    borderRadius: scaleSize(12),
    alignItems: "center",
    flex: 1,
    marginHorizontal: scaleSize(4),
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: { fontSize: scaleSize(20), fontWeight: "700", color: colors.primary },
  statLabel: { fontSize: scaleSize(12), color: colors.textSecondary },
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: colors.primaryLight,
    marginBottom: scaleSize(16),
    backgroundColor: colors.primarySurface,
    borderRadius: scaleSize(12),
    marginHorizontal: scaleSize(4),
    paddingHorizontal: scaleSize(4),
  },
  tab: {
    flex: 1,
    paddingVertical: scaleSize(10),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: scaleSize(8),
    marginHorizontal: scaleSize(2),
    backgroundColor: "transparent",
    minWidth: 0,
  },
  activeTab: {
    flex: 1,
    paddingVertical: scaleSize(10),
    borderBottomWidth: 3,
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
    borderRadius: scaleSize(8),
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: scaleSize(2),
    minWidth: 0,
  },
  tabText: {
    color: colors.primary,
    fontWeight: "500",
    fontSize: scaleSize(15),
    textAlign: "center",
    width: "100%",
    minWidth: scaleSize(90),
    maxWidth: scaleSize(120),
    lineHeight: scaleSize(18),
    flexWrap: "wrap",
  },
  activeTabText: {
    color: colors.primaryDark,
    fontWeight: "700",
    fontSize: scaleSize(15),
    textAlign: "center",
    width: "100%",
    minWidth: scaleSize(90),
    maxWidth: scaleSize(120),
    lineHeight: scaleSize(18),
    flexWrap: "wrap",
  },
  emptyText: {
    textAlign: "center",
    color: colors.textSecondary,
    marginTop: scaleSize(20),
    fontWeight: "600",
  },
  emptyStateContainer: { alignItems: "center", marginTop: scaleSize(20) },
  emptySubtext: {
    textAlign: "center",
    color: colors.textTertiary,
    marginTop: scaleSize(8),
    fontSize: scaleSize(14),
  },
  buyerMessageContainer: {
    alignItems: "center",
    marginTop: scaleSize(30),
    paddingHorizontal: scaleSize(20),
    backgroundColor: colors.cardBackground,
    borderRadius: scaleSize(12),
    padding: scaleSize(20),
    marginBottom: scaleSize(20),
    borderWidth: 1,
    borderColor: colors.border,
  },
  buyerMessageTitle: {
    textAlign: "center",
    color: colors.text,
    fontSize: scaleSize(16),
    fontWeight: "600",
    marginBottom: scaleSize(8),
  },
  buyerMessageSubtitle: {
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: scaleSize(14),
    marginBottom: scaleSize(16),
  },
  startShoppingButton: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: scaleSize(20),
    paddingVertical: scaleSize(10),
    borderRadius: scaleSize(8),
    marginTop: scaleSize(8),
  },
  startShoppingButtonText: {
    color: colors.primary,
    fontSize: scaleSize(14),
    fontWeight: "600",
  },
  orderCard: {
    backgroundColor: colors.surface,
    padding: scaleSize(12),
    borderRadius: scaleSize(12),
    marginBottom: scaleSize(12),
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  orderText: { fontSize: scaleSize(12), color: colors.textSecondary },
  orderStatus: { fontSize: scaleSize(14), fontWeight: "600", color: colors.primary },
  orderItem: {
    flexDirection: "row",
    gap: scaleSize(10),
    backgroundColor: colors.cardBackground,
    padding: scaleSize(8),
    borderRadius: scaleSize(8),
    marginVertical: scaleSize(4),
  },
  itemImage: {
    width: scaleSize(64),
    height: scaleSize(64),
    borderRadius: scaleSize(6),
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemDetails: { flex: 1 },
  itemName: { fontWeight: "600", color: colors.text },
  itemInfo: { fontSize: scaleSize(12), color: colors.textSecondary },
  addressText: {
    fontSize: scaleSize(12),
    color: colors.textSecondary,
    marginTop: scaleSize(6),
  },
  cancelButton: {
    marginTop: scaleSize(12),
    marginBottom: scaleSize(8),
    backgroundColor: colors.errorLight,
    padding: scaleSize(12),
    borderRadius: scaleSize(6),
    alignSelf: "stretch",
    borderWidth: 1,
    borderColor: colors.errorBorder,
  },
  cancelButtonText: {
    color: colors.error,
    textAlign: "center",
    fontSize: scaleSize(12),
    fontWeight: "700",
  },
  guestContainer: {
    backgroundColor: colors.background,
    paddingHorizontal: scaleSize(30),
    paddingVertical: scaleSize(10),
    paddingBottom: scaleSize(40),
    flexGrow: 1,
  },
  guestContent: {
    alignItems: "center",
    maxWidth: scaleSize(400),
    alignSelf: "stretch",
  },
  guestIcon: {
    width: scaleSize(80),
    height: scaleSize(80),
    borderRadius: scaleSize(40),
    backgroundColor: colors.infoLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: scaleSize(24),
    borderWidth: 2,
    borderColor: colors.infoBorder,
  },
  guestIconText: {
    fontSize: scaleSize(40),
  },
  guestTitle: {
    fontSize: scaleSize(28),
    fontWeight: "700",
    color: colors.text,
    marginBottom: scaleSize(8),
    textAlign: "center",
  },
  guestSubtitle: {
    fontSize: scaleSize(16),
    color: colors.textSecondary,
    marginBottom: scaleSize(32),
    textAlign: "center",
  },
  benefitsContainer: {
    width: "100%",
    backgroundColor: colors.cardBackground,
    borderRadius: scaleSize(16),
    padding: scaleSize(24),
    marginBottom: scaleSize(32),
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: scaleSize(2) },
    shadowOpacity: 0.06,
    shadowRadius: scaleSize(4),
    borderWidth: 1,
    borderColor: colors.border,
  },
  benefitsTitle: {
    fontSize: scaleSize(18),
    fontWeight: "600",
    color: colors.text,
    marginBottom: scaleSize(16),
    textAlign: "center",
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scaleSize(12),
    paddingHorizontal: scaleSize(8),
  },
  benefitIcon: {
    fontSize: scaleSize(20),
    marginRight: scaleSize(12),
    width: scaleSize(24),
  },
  benefitText: {
    fontSize: scaleSize(15),
    color: colors.textSecondary,
    flex: 1,
  },
  guestActions: {
    width: "100%",
    gap: scaleSize(12),
    marginBottom: scaleSize(24),
  },
  loginButton: {
    backgroundColor: colors.secondary,
    paddingVertical: scaleSize(16),
    paddingHorizontal: scaleSize(32),
    borderRadius: scaleSize(12),
    elevation: 2,
    shadowColor: colors.primaryLight,
    shadowOffset: { width: 0, height: scaleSize(2) },
    shadowOpacity: 0.08,
    shadowRadius: scaleSize(4),
  },
  loginButtonText: {
    color: colors.primaryDark,
    fontSize: scaleSize(16),
    fontWeight: "600",
    textAlign: "center",
  },
  signupButton: {
    backgroundColor: colors.infoLight,
    paddingVertical: scaleSize(16),
    paddingHorizontal: scaleSize(32),
    borderRadius: scaleSize(12),
    borderWidth: 2,
    borderColor: colors.infoBorder,
  },
  signupButtonText: {
    color: colors.info,
    fontSize: scaleSize(16),
    fontWeight: "600",
    textAlign: "center",
  },
  guestBrowse: {
    alignItems: "center",
    paddingTop: scaleSize(16),
    borderTopWidth: 1,
    borderTopColor: colors.border,
    width: "100%",
  },
  guestBrowseText: {
    fontSize: scaleSize(14),
    color: colors.textSecondary,
    marginBottom: scaleSize(12),
    textAlign: "center",
  },
  browseButton: {
    paddingVertical: scaleSize(8),
    paddingHorizontal: scaleSize(16),
  },
  browseButtonText: {
    color: colors.primary,
    fontSize: scaleSize(14),
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  menuButton: {
    padding: scaleSize(8),
    position: "relative",
  },
  menuIcon: {
    fontSize: scaleSize(20),
    color: colors.textSecondary,
  },
  menuDropdown: {
    position: "absolute",
    top: scaleSize(35),
    right: 0,
    backgroundColor: colors.surface,
    borderRadius: scaleSize(6),
    elevation: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: scaleSize(2) },
    shadowOpacity: 0.08,
    shadowRadius: scaleSize(4),
    paddingVertical: scaleSize(4),
    paddingHorizontal: scaleSize(12),
    zIndex: 1000,
    minWidth: scaleSize(80),
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuItemButton: {
    paddingVertical: scaleSize(8),
  },
  menuItem: {
    fontSize: scaleSize(14),
    color: colors.error,
    fontWeight: "700",
  },
  redeemButton: {
    backgroundColor: colors.primary,
    padding: scaleSize(16),
    borderRadius: scaleSize(12),
    marginVertical: scaleSize(16),
    alignItems: "center",
    elevation: 2,
    shadowColor: colors.primaryLight,
    shadowOffset: { width: 0, height: scaleSize(2) },
    shadowOpacity: 0.08,
    shadowRadius: scaleSize(4),
  },
  redeemButtonText: {
    color: colors.primaryDark,
    fontSize: scaleSize(16),
    fontWeight: "700",
  },
});
