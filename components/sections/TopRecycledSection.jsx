import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { memo, useCallback, useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalization } from "../../context/LocalizationContext";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { orderService } from "../../services/api/orders";
import coldStartHandler, { isColdStartError } from "../../utils/coldStartHandler";
import { scaleSize } from "../../utils/scale";
import { extractNameFromMultilingual } from "../../utils/translationHelpers";

const getTopRecycledSectionStyles = (colors) =>
  StyleSheet.create({
    section: {
      marginBottom: scaleSize(15),
      paddingBottom: scaleSize(8),
      marginHorizontal: scaleSize(-20),
      paddingHorizontal: scaleSize(20),
    },
    headerContainer: {
      flexDirection: "row",
      justifyContent: "flex-start",
      alignItems: "center",
      marginBottom: scaleSize(12),
      paddingHorizontal: 0,
    },
    sectionTitle: {
      fontSize: scaleSize(16),
      fontWeight: "700",
      color: colors.primary,
      letterSpacing: -0.3,
      lineHeight: scaleSize(22),
      marginBottom: 0,
    },
    scrollContainer: {
      paddingLeft: scaleSize(20),
      paddingRight: scaleSize(20),
      paddingBottom: scaleSize(10),
    },
    itemCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: scaleSize(18),
      padding: scaleSize(10),
      marginRight: scaleSize(12),
      width: scaleSize(120),
      minHeight: scaleSize(120),
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: scaleSize(2),
      },
      shadowOpacity: 0.08,
      shadowRadius: scaleSize(6),
      elevation: 3,
      borderWidth: 1,
      borderColor: colors.border,
    },
    rankBadge: {
      position: "absolute",
      top: scaleSize(8),
      right: scaleSize(8),
      backgroundColor: colors.primary,
      borderRadius: scaleSize(6),
      paddingHorizontal: scaleSize(6),
      paddingVertical: scaleSize(2),
    },
    rankText: {
      color: colors.white,
      fontSize: scaleSize(10),
      fontWeight: "bold",
    },
    itemImage: {
      width: scaleSize(56),
      height: scaleSize(56),
      borderRadius: scaleSize(10),
      alignSelf: "center",
      marginTop: scaleSize(8),
      marginBottom: scaleSize(4),
      backgroundColor: colors.itemCardBg,
    },
    iconContainer: {
      alignItems: "center",
      marginVertical: scaleSize(6),
    },
    itemName: {
      fontSize: scaleSize(14),
      fontWeight: "600",
      color: colors.text,
      textAlign: "center",
      marginBottom: scaleSize(12),
      lineHeight: scaleSize(18),
    },
    statsContainer: {
      gap: scaleSize(8),
    },
    statItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: scaleSize(4),
    },
    recycleCount: {
      fontSize: scaleSize(12),
      color: colors.textSecondary,
      fontWeight: "500",
    },
    pointsBadge: {
      backgroundColor: colors.warning + "20",
      borderRadius: scaleSize(12),
      paddingHorizontal: scaleSize(8),
      paddingVertical: scaleSize(4),
      alignItems: "center",
    },
    pointsText: {
      fontSize: scaleSize(11),
      color: colors.warning,
      fontWeight: "bold",
    },
  });

const TopRecycledSection = memo(() => {
  const router = useRouter();
  const { t, currentLanguage } = useLocalization();
  const { colors } = useThemedStyles();
  const styles = getTopRecycledSectionStyles(colors);
  const [topItems, setTopItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasFailedOnce, setHasFailedOnce] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [isColdStart, setIsColdStart] = useState(false);

  // Function to fetch top materials with cold start handling
  const fetchTopMaterials = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setRetryAttempt(0);
      setIsColdStart(false);

      const result = await coldStartHandler.executeWithRetry(
        'top-materials',
        () => orderService.getTopMaterials(),
        {
          maxRetries: 3,
          onColdStartDetected: () => {
            console.log('[TopRecycledSection] Cold start detected, warming up server...');
            setIsColdStart(true);
            setError(t('topRecycled.coldStartMessage', 'Server is starting up, please wait...'));
          },
          onRetry: (attempt, delay, isColdStartError) => {
            console.log(`[TopRecycledSection] Retry attempt ${attempt}, delay: ${delay}ms, cold start: ${isColdStartError}`);
            setRetryAttempt(attempt);
            setError(
              isColdStartError 
                ? t('topRecycled.retryingColdStart', `Server warming up... Retrying in ${Math.ceil(delay/1000)}s (${attempt}/3)`)
                : t('topRecycled.retrying', `Retrying... (${attempt}/3)`)
            );
          },
          fallbackData: {
            success: false,
            data: [],
            message: t('topRecycled.serverUnavailable', 'Server is temporarily unavailable. Please try again later.')
          }
        }
      );

      if (result?.success) {
        setTopItems(result.data || []);
        setError(null);
        setHasFailedOnce(false);
        setIsColdStart(false);
      } else if (
        result?.data &&
        Array.isArray(result.data) &&
        result.data.length === 0
      ) {
        // Handle offline case with empty data but no error message
        setTopItems([]);
        setError(result.message || t('topRecycled.noData', 'No data available'));
        setHasFailedOnce(true);
      } else {
        setTopItems([]);
        setError(result.message || t('topRecycled.loadFailed', 'Failed to load data'));
        setHasFailedOnce(true);
      }
    } catch (err) {
      console.error('[TopRecycledSection] Final error after all retries:', err);
      setTopItems([]);
      setError(
        isColdStartError(err)
          ? t('topRecycled.coldStartFailed', 'Server is not responding. Please try again in a few minutes.')
          : t('topRecycled.loadFailed', 'Failed to load data')
      );
      setHasFailedOnce(true);
    } finally {
      setLoading(false);
      setRetryAttempt(0);
    }
  }, [t]);

  // Initial load
  useEffect(() => {
    fetchTopMaterials();
  }, [fetchTopMaterials]);

  // Network monitoring for auto-retry
  useEffect(() => {
    const handleNetworkChange = (isOnline) => {
      console.log("[TopRecycledSection] Network status changed:", isOnline);
      // Only retry if we previously failed and now have connection
      if (isOnline && hasFailedOnce && !loading) {
        console.log(
          "[TopRecycledSection] Auto-retrying data fetch after reconnection"
        );
        fetchTopMaterials();
      }
    };
  }, [hasFailedOnce, loading, fetchTopMaterials]);

  // Helper function to get translated item name
  const getTranslatedItemName = useCallback(
    (item) => {
      if (!item || !t) return item?._id || item?.displayName || "Unknown Item";

      // New API structure: item has name object with multilingual support
      if (item.name && typeof item.name === "object") {
        return extractNameFromMultilingual(item.name, currentLanguage);
      }

      // Fallback to displayName or _id
      return item.displayName || item._id || "Unknown Item";
    },
    [t, currentLanguage]
  );

  const handleItemPress = (item) => {
    if (!item.categoryName) return;

    // Pass the entire multilingual categoryName object as JSON
    // This preserves all language variants
    const categoryNameParam =
      typeof item.categoryName === "object"
        ? JSON.stringify(item.categoryName)
        : item.categoryName;

    router.push({
      pathname: "/category-details",
      params: {
        categoryName: categoryNameParam,
      },
    });
  };
  return (
    <View style={styles.section}>
      <View style={styles.headerContainer}></View>
      {loading ? (
        <Text
          style={{
            textAlign: "center",
            color: colors.neutral,
            marginVertical: 16,
          }}
        >
          {isColdStart 
            ? t('topRecycled.warmingUp', 'Warming up server...') 
            : retryAttempt > 0 
              ? t('topRecycled.retrying', `Retrying... (${retryAttempt}/3)`)
              : t('topRecycled.loading', 'Loading...')
          }
        </Text>
      ) : error ? (
        <View style={{ alignItems: 'center', marginVertical: 16 }}>
          <Text
            style={{ 
              textAlign: "center", 
              color: isColdStart ? colors.warning : "#dc2626", 
              marginBottom: 8 
            }}
          >
            {error}
          </Text>
          {hasFailedOnce && (
            <TouchableOpacity
              onPress={fetchTopMaterials}
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
                marginTop: 4,
              }}
            >
              <Text style={{ color: colors.white, fontWeight: '600' }}>
                {t('topRecycled.tryAgain', 'Try Again')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : topItems.length === 0 ? (
        <Text
          style={{
            textAlign: "center",
            color: colors.neutral,
            marginVertical: 16,
          }}
        >
          No data available.
        </Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {topItems.map((item, index) => {
            return (
              <TouchableOpacity
                key={item._id || index}
                style={[
                  styles.itemCard,
                  index === topItems.length - 1 && { marginRight: 0 },
                ]}
                onPress={() => handleItemPress(item)}
                activeOpacity={0.8}
              >
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>#{index + 1}</Text>
                </View>
                {item.image ? (
                  <Image
                    source={{ uri: item.image }}
                    style={styles.itemImage}
                    resizeMode="cover"
                  />
                ) : null}
                <Text style={styles.itemName}>
                  {getTranslatedItemName(item)}
                </Text>
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <MaterialCommunityIcons
                      name="recycle"
                      size={14}
                      color={colors.primary}
                    />
                    <Text style={styles.recycleCount}>
                      {item.totalQuantity} • {item.unit ? item.unit.toUpperCase() : ''}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
});

TopRecycledSection.displayName = "TopRecycledSection";

export default TopRecycledSection;
