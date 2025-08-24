import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useStock } from '../../context/StockContext';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { spacing } from '../../styles/theme';
import { scaleSize } from '../../utils/scale';

const StockMonitoringDebug = ({ visible = false }) => {
  const { colors } = useThemedStyles();
  const { 
    stockQuantities, 
    isConnected, 
    lastUpdated,
    stockSocketConnected 
  } = useStock();
  
  const styles = getStyles(colors);

  if (!visible) return null;

  const stockCount = Object.keys(stockQuantities).length;
  const lowStockItems = Object.entries(stockQuantities).filter(([, quantity]) => quantity <= 5);
  const outOfStockItems = Object.entries(stockQuantities).filter(([, quantity]) => quantity === 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons 
          name="monitor-dashboard" 
          size={scaleSize(20)} 
          color={colors.primary} 
        />
        <Text style={styles.title}>Stock Monitor (Backend Compliant)</Text>
      </View>

      <View style={styles.statusSection}>
        <Text style={styles.sectionTitle}>Backend Events Supported:</Text>
        <View style={styles.eventList}>
          <Text style={styles.eventItem}>✅ stock:updated (individual items)</Text>
          <Text style={styles.eventItem}>✅ stock:category-updated (category changes)</Text>
          <Text style={styles.eventItem}>✅ stock:category-added (new categories)</Text>
          <Text style={styles.eventItem}>✅ stock:category-deleted (deletions)</Text>
          <Text style={styles.eventItem}>✅ stock:full-state (initial/subscribe)</Text>
          <Text style={styles.eventItem}>✅ itemUpdated (legacy support)</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <View style={[styles.statusDot, { 
            backgroundColor: isConnected ? colors.success : colors.error 
          }]} />
          <Text style={styles.statLabel}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stockCount}</Text>
          <Text style={styles.statLabel}>Items Tracked</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.warning }]}>
            {lowStockItems.length}
          </Text>
          <Text style={styles.statLabel}>Low Stock</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.error }]}>
            {outOfStockItems.length}
          </Text>
          <Text style={styles.statLabel}>Out of Stock</Text>
        </View>
      </View>

      {lastUpdated && (
        <Text style={styles.lastUpdate}>
          Last Change Stream Update: {lastUpdated.toLocaleTimeString()}
        </Text>
      )}

      <View style={styles.complianceSection}>
        <Text style={styles.complianceTitle}>MongoDB Change Streams Ready</Text>
        <Text style={styles.complianceText}>
          • Only updates on actual DB changes{'\n'}
          • Supports bilingual item names{'\n'}
          • Tracks quantity change amounts{'\n'}
          • Handles category-level operations{'\n'}
          • Buyer-only stock validation
        </Text>
      </View>

      {outOfStockItems.length > 0 && (
        <View style={styles.alertSection}>
          <Text style={styles.alertTitle}>⚠️ Out of Stock Items:</Text>
          <ScrollView style={styles.alertList} showsVerticalScrollIndicator={false}>
            {outOfStockItems.slice(0, 5).map(([itemId]) => (
              <Text key={itemId} style={styles.alertItem}>
                • Item ID: {itemId}
              </Text>
            ))}
            {outOfStockItems.length > 5 && (
              <Text style={styles.alertItem}>
                + {outOfStockItems.length - 5} more items
              </Text>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const getStyles = (colors) => StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 10,
    backgroundColor: colors.surface,
    borderRadius: scaleSize(8),
    padding: scaleSize(spacing.sm),
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: scaleSize(280),
    maxWidth: scaleSize(320),
    elevation: 5,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 9999,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleSize(spacing.xs),
  },
  title: {
    fontSize: scaleSize(12),
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: scaleSize(spacing.xs),
  },
  statusSection: {
    marginBottom: scaleSize(spacing.xs),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: scaleSize(spacing.xs),
  },
  sectionTitle: {
    fontSize: scaleSize(11),
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: scaleSize(4),
  },
  eventList: {
    marginLeft: scaleSize(spacing.xs),
  },
  eventItem: {
    fontSize: scaleSize(9),
    color: colors.textSecondary,
    marginBottom: scaleSize(1),
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: scaleSize(spacing.xs),
  },
  statItem: {
    alignItems: 'center',
    marginBottom: scaleSize(spacing.xs),
    minWidth: scaleSize(50),
  },
  statusDot: {
    width: scaleSize(8),
    height: scaleSize(8),
    borderRadius: scaleSize(4),
    marginBottom: scaleSize(2),
  },
  statValue: {
    fontSize: scaleSize(16),
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: scaleSize(9),
    color: colors.textSecondary,
    textAlign: 'center',
  },
  lastUpdate: {
    fontSize: scaleSize(9),
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: scaleSize(spacing.xs),
  },
  complianceSection: {
    marginTop: scaleSize(spacing.xs),
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: scaleSize(spacing.xs),
  },
  complianceTitle: {
    fontSize: scaleSize(11),
    fontWeight: 'bold',
    color: colors.success,
    marginBottom: scaleSize(spacing.xs),
  },
  complianceText: {
    fontSize: scaleSize(9),
    color: colors.textSecondary,
    lineHeight: scaleSize(12),
  },
  alertSection: {
    marginTop: scaleSize(spacing.xs),
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: scaleSize(spacing.xs),
  },
  alertTitle: {
    fontSize: scaleSize(11),
    fontWeight: 'bold',
    color: colors.error,
    marginBottom: scaleSize(spacing.xs),
  },
  alertList: {
    maxHeight: scaleSize(60),
  },
  alertItem: {
    fontSize: scaleSize(9),
    color: colors.textSecondary,
    marginBottom: scaleSize(2),
  },
});

export default StockMonitoringDebug;
