import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLocalization } from "../../context/LocalizationContext";
import { colors } from "../../styles";
import { scaleSize } from "../../utils/scale";

export default function ProfileMenu({
  user,
  onRecyclingHistory,
  onEWallet,
  onHelpSupport,
  onRedeemHistory,
  onLogout,
  style,
}) {
  const { t } = useLocalization();
  
  const handlePress = (key) => {
    switch (key) {
      case "recyclingHistory":
        onRecyclingHistory && onRecyclingHistory();
        break;
      case "achievements":
        router.push('/achievements');
        break;
      case "notifications":
        Alert.alert(t('common.loading'));
        break;
      case "helpSupport":
        if (onHelpSupport) {
          onHelpSupport();
        } else {
          Alert.alert(t('common.loading'));
        }
        break;
      case "redeemHistory":
        if (onRedeemHistory) {
          onRedeemHistory();
        } else {
          Alert.alert(t('common.loading'));
        }
        break;
      case "settings":
        router.push('/language-settings');
        break;
      case "logout":
        onLogout && onLogout();
        break;
      case "eWallet":
        if (onEWallet) {
          onEWallet();
        } else {
          Alert.alert(t('common.loading'));
        }
        break;
      default:
        break;
    }
  };

  const menuItems = [
    {
      key: "eWallet",
      icon: (
        <View style={[styles.iconBg, { backgroundColor: "#fffbe6" }]}>
          <Ionicons name="wallet" size={scaleSize(24)} color="#F59E42" />
        </View>
      ),
      label: t('profile.wallet'),
      subtitle: t('wallet.balance') + ' ' + t('common.and') + ' ' + t('wallet.transactions'),
    },
    {
      key: "redeemHistory",
      icon: (
        <View style={[styles.iconBg, { backgroundColor: "#e0e7ff" }]}>
          <Ionicons name="gift" size={scaleSize(24)} color="#6366F1" />
        </View>
      ),
      label: t('wallet.redeemHistory'),
      subtitle: t('wallet.pointsSpent'),
    },
    {
      key: "recyclingHistory",
      icon: (
        <View style={[styles.iconBg, { backgroundColor: "#e8f7e5" }]}>
          <MaterialCommunityIcons
            name="recycle-variant"
            size={scaleSize(26)}
            color="#34A853"
          />
        </View>
      ),
      label: t('orders.history'),
      subtitle: t('orders.history'),
    },
    {
      key: "achievements",
      icon: (
        <View style={[styles.iconBg, { backgroundColor: "#fff7e6" }]}>
          <MaterialCommunityIcons
            name="medal"
            size={scaleSize(24)}
            color="#F59E42"
          />
        </View>
      ),
      label: t('profile.achievements'),
      subtitle: t('achievements.title'),
    },
    {
      key: "settings",
      icon: (
        <View style={[styles.iconBg, { backgroundColor: "#f0f9ff" }]}>
          <Ionicons name="language" size={scaleSize(24)} color="#0EA5E9" />
        </View>
      ),
      label: t('settings.language'),
      subtitle: t('settings.changeLanguage'),
    },
    {
      key: "helpSupport",
      icon: (
        <View style={[styles.iconBg, { backgroundColor: "#f3e8ff" }]}>
          <Ionicons name="help-circle" size={scaleSize(24)} color="#8B5CF6" />
        </View>
      ),
      label: t('profile.help'),
      subtitle: t('help.contact'),
    },
    {
      key: "logout",
      icon: (
        <View style={[styles.iconBg, { backgroundColor: "#fff1f2" }]}>
          <MaterialCommunityIcons
            name="logout-variant"
            size={scaleSize(24)}
            color="#EF4444"
          />
        </View>
      ),
      label: t('profile.logout'),
      subtitle: t('auth.signIn'),
    },
  ];

  // Filter out E-Wallet and Redeem History for buyers
  const filteredMenuItems =
    user?.role === 'buyer'
      ? menuItems.filter(item => item.key !== 'eWallet' && item.key !== 'redeemHistory')
      : menuItems;


  return (
    <>
      <View style={[styles.menuCard, style]}>
        <View>
          {filteredMenuItems.map((item, idx) => (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.menuItem,
                idx === 0 && {
                  borderTopLeftRadius: scaleSize(18),
                  borderTopRightRadius: scaleSize(18),
                },
                idx === filteredMenuItems.length - 1 && {
                  borderBottomLeftRadius: scaleSize(18),
                  borderBottomRightRadius: scaleSize(18),
                  borderBottomWidth: 0,
                },
              ]}
              onPress={() => handlePress(item.key)}
              activeOpacity={0.8}
            >
              {item.icon}
              <View style={styles.textContainer}>
                <Text style={styles.label}>{item.label}</Text>
                <Text style={styles.subtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={scaleSize(24)}
                color={colors.gray}
                style={{ marginLeft: scaleSize(8) }}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  menuCard: {
    backgroundColor: colors.white,
    borderRadius: scaleSize(22),
    marginHorizontal: scaleSize(18),
    marginTop: scaleSize(10),
    marginBottom: scaleSize(18),
    paddingVertical: scaleSize(2),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: scaleSize(18),
    paddingHorizontal: scaleSize(18),
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    backgroundColor: "transparent",
  },
  iconBg: {
    width: scaleSize(44),
    height: scaleSize(44),
    borderRadius: scaleSize(14),
    alignItems: "center",
    justifyContent: "center",
    marginRight: scaleSize(18),
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  label: {
    fontSize: scaleSize(15),
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: scaleSize(1),
    letterSpacing: 0.1,
  },
  subtitle: {
    fontSize: scaleSize(12),
    color: "#7B8794",
    marginTop: 0,
    fontWeight: "400",
    letterSpacing: 0.05,
  },
});
