import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useStock } from "../../context/StockContext";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { spacing } from "../../styles/theme";
import { scaleSize } from "../../utils/scale";

// Global ref to track the last actual stock update timestamp
// This prevents false positives when components remount
let lastGlobalStockUpdate = 0;
// Global map to persist change directions across component remounts
const globalChangeDirections = new Map();

const RealTimeStockIndicator = ({
  itemId,
  quantity,
  style,
  showConnectionStatus = false,
  showChangeIndicator = false,
  size = "small",
}) => {
  const { colors } = useThemedStyles();
  const { lastUpdated, getStockQuantity } = useStock();
  const [isRecentlyUpdated, setIsRecentlyUpdated] = useState(false);
  const [previousStock, setPreviousStock] = useState(null);
  const [changeDirection, setChangeDirection] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const styles = getStyles(colors, size);

  // Use getStockQuantity for consistent real-time stock data
  const currentStock = getStockQuantity(itemId, quantity);

  // Initialize with current stock on first mount to avoid false positive updates
  useEffect(() => {
    if (!isInitialized && currentStock !== undefined) {
      setPreviousStock(currentStock);
      setIsInitialized(true);
      
      // Check if there's a persisted change direction for this item
      const persistedDirection = globalChangeDirections.get(itemId);
      if (persistedDirection) {
        setChangeDirection(persistedDirection.direction);
        const timeLeft = persistedDirection.expiry - Date.now();
        if (timeLeft > 0) {
          setIsRecentlyUpdated(true);
          const timer = setTimeout(() => {
            setIsRecentlyUpdated(false);
            setChangeDirection(null);
            globalChangeDirections.delete(itemId);
          }, timeLeft);
          return () => clearTimeout(timer);
        } else {
          // Expired, clean up
          globalChangeDirections.delete(itemId);
        }
      }
    }
  }, [currentStock, isInitialized, itemId]);

  // Track stock changes for visual feedback - only after initialization
  useEffect(() => {
    if (isInitialized && previousStock !== null && currentStock !== previousStock) {
      const direction = currentStock > previousStock ? "up" : "down";
      setChangeDirection(direction);
      setIsRecentlyUpdated(true);

      // Persist change direction globally for 5 seconds (longer duration)
      const expiry = Date.now() + 5000;
      globalChangeDirections.set(itemId, { direction, expiry });

      const timer = setTimeout(() => {
        setIsRecentlyUpdated(false);
        setChangeDirection(null);
        globalChangeDirections.delete(itemId);
      }, 5000); // Increased from 3000 to 5000ms

      return () => clearTimeout(timer);
    }
    if (isInitialized) {
      setPreviousStock(currentStock);
    }
  }, [currentStock, previousStock, isInitialized, itemId]);

  // Show visual feedback for recent updates - only if recently updated and initialized
  useEffect(() => {
    if (isInitialized && lastUpdated) {
      const updateTimestamp = lastUpdated.getTime();
      const now = Date.now();
      const timeDiff = now - updateTimestamp;
      
      // Update global timestamp on actual stock updates
      if (timeDiff < 1000) { // Very recent update
        lastGlobalStockUpdate = updateTimestamp;
      }
      
      // Only show update indicator if the update was very recent (within last 5 seconds)
      // and it's newer than the last time this component was mounted
      if (timeDiff < 5000 && updateTimestamp > lastGlobalStockUpdate - 3000) {
        setIsRecentlyUpdated(true);
        const timer = setTimeout(() => setIsRecentlyUpdated(false), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [lastUpdated, isInitialized]);

  const getStockStatus = () => {
    if (currentStock === 0) {
      return {
        color: colors.error,
        icon: "package-variant-closed",
        text: "Out of Stock",
        bgColor: colors.error + "15",
      };
    } else if (currentStock <= 5) {
      return {
        color: colors.warning,
        icon: "alert",
        text: `Low Stock (${currentStock})`,
        bgColor: colors.warning + "15",
      };
    } else {
      return {
        color: colors.success,
        icon: "check-circle",
        text: `In Stock (${currentStock})`,
        bgColor: colors.success + "15",
      };
    }
  };

  const status = getStockStatus();

  return (
    <View
      style={[styles.container, style, { backgroundColor: status.bgColor }]}
    >
      <MaterialCommunityIcons
        name={status.icon}
        size={scaleSize(size === "large" ? 16 : 12)}
        color={status.color}
      />

      <Text style={[styles.text, { color: status.color }]}>{status.text}</Text>

      {showChangeIndicator && changeDirection && (
        <MaterialCommunityIcons
          name={changeDirection === "up" ? "trending-up" : "trending-down"}
          size={scaleSize(10)}
          color={changeDirection === "up" ? colors.success : colors.warning}
          style={styles.changeIcon}
        />
      )}

      {isRecentlyUpdated && (
        <View
          style={[styles.updatePulse, { backgroundColor: colors.primary }]}
        />
      )}
    </View>
  );
};

const getStyles = (colors, size) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: scaleSize(spacing.xs),
      paddingVertical: scaleSize(spacing.xs / 2),
      borderRadius: scaleSize(size === "large" ? 8 : 6),
      alignSelf: "flex-start",
    },
    connectionIcon: {
      marginRight: scaleSize(4),
    },
    text: {
      fontSize: scaleSize(size === "large" ? 12 : 10),
      fontWeight: "600",
      marginLeft: scaleSize(4),
    },
    changeIcon: {
      marginLeft: scaleSize(4),
    },
    updatePulse: {
      position: "absolute",
      top: 0,
      right: 0,
      width: scaleSize(6),
      height: scaleSize(6),
      borderRadius: scaleSize(3),
    },
  });

export default RealTimeStockIndicator;
