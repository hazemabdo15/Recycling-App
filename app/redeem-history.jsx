import { MaterialIcons } from "@expo/vector-icons";
import { format } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useLocalization } from "../context/LocalizationContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import apiService from "../services/api/apiService";

// Arabic month names for date formatting
const arabicMonths = {
  Jan: "يناير",
  Feb: "فبراير",
  Mar: "مارس",
  Apr: "أبريل",
  May: "مايو",
  Jun: "يونيو",
  Jul: "يوليو",
  Aug: "أغسطس",
  Sep: "سبتمبر",
  Oct: "أكتوبر",
  Nov: "نوفمبر",
  Dec: "ديسمبر"
};

const RedeemHistoryScreen = () => {
  const { user, setUser } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();
  const { t, language } = useLocalization();
  const { colors } = useThemedStyles();
  const styles = getStyles(colors);

  const [localPointsHistory, setLocalPointsHistory] = useState(
    user?.pointsHistory || []
  );

  useEffect(() => {
    setLocalPointsHistory(user?.pointsHistory || []);
  }, [user?.pointsHistory]);

  // Helper function to format dates based on language
  const formatLocalizedDate = (date) => {
    if (!date) return t("common.unknownDate");
    
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) return t("common.unknownDate");

    if (language === 'ar') {
      const formatted = format(parsedDate, 'dd MMM yyyy, hh:mm a');
      return formatted.replace(
        /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/, 
        match => arabicMonths[match]
      );
    }
    return format(parsedDate, 'dd MMM yyyy, hh:mm a');
  };

  // Helper function to format numbers for Arabic
  const formatLocalizedNumber = (num) => {
    if (language === 'ar') {
      return num.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
    }
    return num.toString();
  };

  // Filter and sort redeem history
  const redeemHistory = useMemo(() => {
    const filtered = (localPointsHistory || []).filter(
      (entry) =>
        entry.type === "deducted" &&
        entry.reason &&
        (entry.reason.includes("Voucher redeemed") ||
         entry.reason.includes("Cashback") ||
         entry.reason.includes("Points deducted"))
    );

    return filtered.sort((a, b) => {
      const dateA = new Date(a.timestamp?.$date || a.timestamp || a.date);
      const dateB = new Date(b.timestamp?.$date || b.timestamp || b.date);
      return dateB - dateA;
    });
  }, [localPointsHistory]);

  // Format transaction reason with translations
  const formatReason = (reason) => {
    if (!reason) return t("redeemHistory.transactionTypes.default");

    if (reason.includes("Voucher redeemed")) {
      const name = reason.replace("Voucher redeemed: ", "");
      return t("redeemHistory.transactionTypes.voucher", { name });
    }
    if (reason.includes("Cashback")) {
      const amount = reason.match(/\d+/)?.[0] || "";
      return t("redeemHistory.transactionTypes.cashback", { amount });
    }
    return t("redeemHistory.transactionTypes.default");
  };

  const handleRefresh = async () => {
    if (!user?._id) return;
    setIsRefreshing(true);
    try {
      const response = await apiService.get(`/users/${user._id}`);
      if (response?.pointsHistory) {
        setLocalPointsHistory(response.pointsHistory);
        setUser(prev => ({ ...prev, pointsHistory: response.pointsHistory }));
      } else {
        Alert.alert(
          t("modals.error"),
          t("redeemHistory.errors.fetchFailed")
        );
      }
    } catch (_error) {
      Alert.alert(
        t("modals.error"),
        t("redeemHistory.errors.fetchFailed")
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={[
      styles.itemContainer,
      language === 'ar' && styles.rtlItemContainer
    ]}>
      <Text style={[
        styles.reason,
        language === 'ar' && styles.rtlText
      ]}>
        {formatReason(item.reason)}
      </Text>
      <Text style={styles.points}>
        {formatLocalizedNumber(item.points)}
      </Text>
      <Text style={[
        styles.date,
        language === 'ar' && styles.rtlText
      ]}>
        {formatLocalizedDate(item.timestamp?.$date || item.timestamp || item.date)}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors.heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroSection}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityLabel={t("a11y.backButton")}
          >
            <MaterialIcons 
              name="arrow-back-ios" 
              size={22} 
              color="#fff" 
            />
          </TouchableOpacity>
          
          <View style={styles.headerTextContainer}>
            <Text style={styles.heroTitle}>
              {t("redeemHistory.title")}
            </Text>
            <Text style={styles.heroSubtitle}>
              {t("redeemHistory.subtitle")}
            </Text>
          </View>
          
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      <FlatList
        data={redeemHistory}
        keyExtractor={(item, idx) => 
          item.id?.toString() || `item-${idx}`
        }
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {t("redeemHistory.noHistory")}
          </Text>
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
    </View>
  );
};

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white
  },
  heroSection: {
    paddingBottom: 24,
    paddingTop: 40,
    minHeight: 90,
    justifyContent: "flex-end",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 8
  },
  backButton: {
    padding: 4,
    position: 'absolute',
    left: 0
  },
  headerTextContainer: {
    alignItems: 'center',
    flex: 1,
    marginLeft: 36
  },
  headerSpacer: {
    width: 32
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff'
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '400',
    marginTop: 4
  },
  listContent: {
    padding: 16
  },
  itemContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.base200,
    justifyContent: 'space-between'
  },
  rtlItemContainer: {
    flexDirection: 'row-reverse'
  },
  reason: {
    flex: 2,
    fontSize: 16,
    color: colors.text
  },
  rtlText: {
    textAlign: 'right'
  },
  points: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.error
  },
  date: {
    flex: 2,
    textAlign: 'right',
    fontSize: 14,
    color: colors.textSecondary
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    fontSize: 16,
    color: colors.textSecondary
  }
});

export default RedeemHistoryScreen;