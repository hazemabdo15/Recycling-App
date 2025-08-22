import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useStockManager } from '../../hooks/useStockManager';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { spacing } from '../../styles/theme';
import { scaleSize } from '../../utils/scale';

const StockStatusIndicator = ({ style }) => {
  const { colors } = useThemedStyles();
  const { isConnected, lastUpdated } = useStockManager();
  const styles = getStyles(colors);

  if (!isConnected && !lastUpdated) {
    return null; // Don't show anything if never connected
  }

  const getStatusInfo = () => {
    if (isConnected) {
      return {
        icon: 'wifi',
        text: 'Stock Live',
        color: colors.success,
        bgColor: colors.success + '20'
      };
    } else {
      return {
        icon: 'wifi-off',
        text: 'Stock Offline',
        color: colors.warning,
        bgColor: colors.warning + '20'
      };
    }
  };

  const status = getStatusInfo();

  return (
    <View style={[styles.container, style, { backgroundColor: status.bgColor }]}>
      <MaterialCommunityIcons 
        name={status.icon} 
        size={scaleSize(12)} 
        color={status.color} 
      />
      <Text style={[styles.text, { color: status.color }]}>
        {status.text}
      </Text>
      {lastUpdated && (
        <Text style={styles.timestamp}>
          {new Date(lastUpdated).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      )}
    </View>
  );
};

const getStyles = (colors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleSize(spacing.sm),
    paddingVertical: scaleSize(spacing.xs),
    borderRadius: scaleSize(12),
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: scaleSize(10),
    fontWeight: '600',
    marginLeft: scaleSize(spacing.xs),
  },
  timestamp: {
    fontSize: scaleSize(8),
    color: colors.textSecondary,
    marginLeft: scaleSize(spacing.xs),
  },
});

export default StockStatusIndicator;
