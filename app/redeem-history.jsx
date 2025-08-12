import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../styles';
import styles from '../styles/redeemHistory';

const filterRedeemHistory = (pointsHistory = []) => {
  return pointsHistory.filter(entry =>
    entry.type === 'deducted' &&
    (
      (entry.reason && (
        entry.reason.includes('Voucher redeemed') ||
        entry.reason.includes('Cashback') ||
        entry.reason.includes('Points deducted')
      ))
    )
  );
};

export default function RedeemHistoryScreen() {
  const { user } = useAuth();
  const redeemHistory = useMemo(() => {
    const filtered = filterRedeemHistory(user?.pointsHistory);
    // Sort by timestamp descending (newest first)
    return filtered.slice().sort((a, b) => {
      const dateA = new Date(a.timestamp?.$date || a.timestamp || a.date);
      const dateB = new Date(b.timestamp?.$date || b.timestamp || b.date);
      return dateB - dateA;
    });
  }, [user]);

  const renderItem = ({ item }) => {
    let dateStr = 'Unknown date';
    // Support both MongoDB extended JSON and plain ISO string
    const rawDate = item.timestamp?.$date || item.timestamp || item.date;
    if (rawDate) {
      const parsedDate = new Date(rawDate);
      if (!isNaN(parsedDate.getTime())) {
        dateStr = format(parsedDate, 'dd MMM yyyy, hh:mm a');
      }
    }
    return (
      <View style={styles.itemContainer}>
        <Text style={styles.reason}>{item.reason}</Text>
        <Text style={styles.points}>-{item.points}</Text>
        <Text style={styles.date}>{dateStr}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors?.primary || '#4CAF50', colors?.neutral || '#2196F3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroSection}
      >
        <Text style={styles.heroTitle}>Redeem History</Text>
        <Text style={styles.heroSubtitle}>All your redeemed points in one place</Text>
      </LinearGradient>
      <FlatList
        data={redeemHistory}
        keyExtractor={(item, idx) => item.id?.toString() || idx.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>No redeem history found.</Text>}
      />
    </View>
  );
}
