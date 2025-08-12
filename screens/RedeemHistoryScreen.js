import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { useContext, useMemo } from 'react';
import { FlatList, Text, View } from 'react-native';
import { AuthContext } from '../context/AuthContext';
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

const RedeemHistoryScreen = () => {
  const { user } = useContext(AuthContext);
  const redeemHistory = useMemo(() => filterRedeemHistory(user?.pointsHistory), [user]);

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.reason}>{item.reason}</Text>
      <Text style={styles.points}>-{item.points}</Text>
      <Text style={styles.date}>{format(new Date(item.date), 'dd MMM yyyy, hh:mm a')}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#4CAF50', '#2196F3']} style={styles.heroSection}>
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
};

export default RedeemHistoryScreen;
