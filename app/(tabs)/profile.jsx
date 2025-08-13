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
import { useUserPoints } from "../../hooks/useUserPoints";
import apiService from "../../services/api/apiService";
import { colors } from "../../styles";
import { isCustomer } from "../../utils/roleLabels";
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
          "Permission required",
          "Please allow access to your photos."
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
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Yes", style: "destructive", onPress: handleLogout },
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
  <View style={{ flex: 1, backgroundColor: "#f0fdf4"}}>
      <StatusBar style="dark" backgroundColor="#ffffff" />
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
        contentContainerStyle={{
          minHeight: windowHeight - PROFILE_CARD_HEIGHT,
          paddingBottom: insets.bottom + scaleSize(16),
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

const styles = StyleSheet.create({
  container: {
    padding: scaleSize(35),
    backgroundColor: "#f8fafc", // very light neutral background
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
  userName: { fontSize: scaleSize(20), fontWeight: "600", color: "#1e293b" },
  userInfo: { fontSize: scaleSize(14), color: "#64748b" },
  userInfoSmall: { fontSize: scaleSize(12), color: "#a7f3d0" },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: scaleSize(16),
  },
  statBox: {
    backgroundColor: "#f1f5f9", // very light gray
    padding: scaleSize(12),
    borderRadius: scaleSize(12),
    alignItems: "center",
    flex: 1,
    marginHorizontal: scaleSize(4),
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  statValue: { fontSize: scaleSize(20), fontWeight: "700", color: "#059669" },
  statLabel: { fontSize: scaleSize(12), color: "#64748b" },
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: "#bbf7d0",
    marginBottom: scaleSize(16),
    backgroundColor: "#f0fdf4",
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
    borderColor: "#059669",
    backgroundColor: "#bbf7d0",
    borderRadius: scaleSize(8),
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: scaleSize(2),
    minWidth: 0,
  },
  tabText: {
    color: "#059669",
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
    color: "#065f46",
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
    color: "#64748b",
    marginTop: scaleSize(20),
    fontWeight: "600",
  },
  emptyStateContainer: { alignItems: "center", marginTop: scaleSize(20) },
  emptySubtext: {
    textAlign: "center",
    color: "#94a3b8",
    marginTop: scaleSize(8),
    fontSize: scaleSize(14),
  },
  buyerMessageContainer: {
    alignItems: "center",
    marginTop: scaleSize(30),
    paddingHorizontal: scaleSize(20),
    backgroundColor: "#f1f5f9",
    borderRadius: scaleSize(12),
    padding: scaleSize(20),
    marginBottom: scaleSize(20),
    borderWidth: 1,
    borderColor: "#e0e7ef",
  },
  buyerMessageTitle: {
    textAlign: "center",
    color: "#334155",
    fontSize: scaleSize(16),
    fontWeight: "600",
    marginBottom: scaleSize(8),
  },
  buyerMessageSubtitle: {
    textAlign: "center",
    color: "#64748b",
    fontSize: scaleSize(14),
    marginBottom: scaleSize(16),
  },
  startShoppingButton: {
    backgroundColor: "#a7f3d0",
    paddingHorizontal: scaleSize(20),
    paddingVertical: scaleSize(10),
    borderRadius: scaleSize(8),
    marginTop: scaleSize(8),
  },
  startShoppingButtonText: {
    color: "#059669",
    fontSize: scaleSize(14),
    fontWeight: "600",
  },
  orderCard: {
    backgroundColor: "#fff",
    padding: scaleSize(12),
    borderRadius: scaleSize(12),
    marginBottom: scaleSize(12),
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  orderText: { fontSize: scaleSize(12), color: "#64748b" },
  orderStatus: { fontSize: scaleSize(14), fontWeight: "600", color: "#059669" },
  orderItem: {
    flexDirection: "row",
    gap: scaleSize(10),
    backgroundColor: "#f8fafc",
    padding: scaleSize(8),
    borderRadius: scaleSize(8),
    marginVertical: scaleSize(4),
  },
  itemImage: {
    width: scaleSize(64),
    height: scaleSize(64),
    borderRadius: scaleSize(6),
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  itemDetails: { flex: 1 },
  itemName: { fontWeight: "600", color: "#334155" },
  itemInfo: { fontSize: scaleSize(12), color: "#64748b" },
  addressText: {
    fontSize: scaleSize(12),
    color: "#64748b",
    marginTop: scaleSize(6),
  },
  cancelButton: {
    marginTop: scaleSize(12),
    marginBottom: scaleSize(8),
    backgroundColor: "#fee2e2",
    padding: scaleSize(12),
    borderRadius: scaleSize(6),
    alignSelf: "stretch",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  cancelButtonText: {
    color: "#dc2626",
    textAlign: "center",
    fontSize: scaleSize(12),
    fontWeight: "700",
  },
  guestContainer: {
    backgroundColor: "#f8fafc", // match main container
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
    backgroundColor: "#e0f2fe",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: scaleSize(24),
    borderWidth: 2,
    borderColor: "#bae6fd",
  },
  guestIconText: {
    fontSize: scaleSize(40),
  },
  guestTitle: {
    fontSize: scaleSize(28),
    fontWeight: "700",
    color: "#334155",
    marginBottom: scaleSize(8),
    textAlign: "center",
  },
  guestSubtitle: {
    fontSize: scaleSize(16),
    color: "#64748b",
    marginBottom: scaleSize(32),
    textAlign: "center",
  },
  benefitsContainer: {
    width: "100%",
    backgroundColor: "#f1f5f9",
    borderRadius: scaleSize(16),
    padding: scaleSize(24),
    marginBottom: scaleSize(32),
    elevation: 2,
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: scaleSize(2) },
    shadowOpacity: 0.06,
    shadowRadius: scaleSize(4),
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  benefitsTitle: {
    fontSize: scaleSize(18),
    fontWeight: "600",
    color: "#334155",
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
    color: "#64748b",
    flex: 1,
  },
  guestActions: {
    width: "100%",
    gap: scaleSize(12),
    marginBottom: scaleSize(24),
  },
  loginButton: {
    backgroundColor: "#34d399",
    paddingVertical: scaleSize(16),
    paddingHorizontal: scaleSize(32),
    borderRadius: scaleSize(12),
    elevation: 2,
    shadowColor: "#a7f3d0",
    shadowOffset: { width: 0, height: scaleSize(2) },
    shadowOpacity: 0.08,
    shadowRadius: scaleSize(4),
  },
  loginButtonText: {
    color: "#065f46",
    fontSize: scaleSize(16),
    fontWeight: "600",
    textAlign: "center",
  },
  signupButton: {
    backgroundColor: "#e0f2fe",
    paddingVertical: scaleSize(16),
    paddingHorizontal: scaleSize(32),
    borderRadius: scaleSize(12),
    borderWidth: 2,
    borderColor: "#bae6fd",
  },
  signupButtonText: {
    color: "#0284c7",
    fontSize: scaleSize(16),
    fontWeight: "600",
    textAlign: "center",
  },
  guestBrowse: {
    alignItems: "center",
    paddingTop: scaleSize(16),
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    width: "100%",
  },
  guestBrowseText: {
    fontSize: scaleSize(14),
    color: "#64748b",
    marginBottom: scaleSize(12),
    textAlign: "center",
  },
  browseButton: {
    paddingVertical: scaleSize(8),
    paddingHorizontal: scaleSize(16),
  },
  browseButtonText: {
    color: "#059669",
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
    color: "#64748b",
  },
  menuDropdown: {
    position: "absolute",
    top: scaleSize(35),
    right: 0,
    backgroundColor: "#fff",
    borderRadius: scaleSize(6),
    elevation: 4,
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: scaleSize(2) },
    shadowOpacity: 0.08,
    shadowRadius: scaleSize(4),
    paddingVertical: scaleSize(4),
    paddingHorizontal: scaleSize(12),
    zIndex: 1000,
    minWidth: scaleSize(80),
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  menuItemButton: {
    paddingVertical: scaleSize(8),
  },
  menuItem: {
    fontSize: scaleSize(14),
    color: "#dc2626",
    fontWeight: "700",
  },
  redeemButton: {
    backgroundColor: "#a7f3d0",
    padding: scaleSize(16),
    borderRadius: scaleSize(12),
    marginVertical: scaleSize(16),
    alignItems: "center",
    elevation: 2,
    shadowColor: "#a7f3d0",
    shadowOffset: { width: 0, height: scaleSize(2) },
    shadowOpacity: 0.08,
    shadowRadius: scaleSize(4),
  },
  redeemButtonText: {
    color: "#059669",
    fontSize: scaleSize(16),
    fontWeight: "700",
  },
});
