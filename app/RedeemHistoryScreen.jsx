import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { useContext, useMemo } from 'react';
import { FlatList, Text, View, StyleSheet } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useLocalization } from '../context/LocalizationContext';

// Arabic month names for RTL support
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
  const { user } = useContext(AuthContext);
  const { t, language } = useLocalization();

  const redeemHistory = useMemo(() => filterRedeemHistory(user?.pointsHistory), [user]);

  // Format date based on current language
  const formatLocalizedDate = (date) => {
    if (!date) return t('common.unknownDate');
    
    const formatted = format(new Date(date), 'dd MMM yyyy, hh:mm a');
    
    if (language === 'ar') {
      return formatted.replace(
        /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/, 
        match => arabicMonths[match]
      );
    }
    return formatted;
  };

  // Format transaction reason with translations
  const formatReason = (reason) => {
    if (!reason) return t('redeemHistory.transactionTypes.default');

    if (reason.includes('Voucher redeemed')) {
      const name = reason.replace('Voucher redeemed: ', '');
      return t('redeemHistory.transactionTypes.voucher', { name });
    }
    if (reason.includes('Cashback')) {
      const amount = reason.match(/\d+/)?.[0] || '';
      return t('redeemHistory.transactionTypes.cashback', { amount });
    }
    return t('redeemHistory.transactionTypes.default');
  };

  const renderItem = ({ item }) => (
    <View style={[
      styles.itemContainer,
      language === 'ar' && styles.rtlContainer
    ]}>
      <Text style={[
        styles.reason,
        language === 'ar' && styles.rtlText
      ]}>
        {formatReason(item.reason)}
      </Text>
      <Text style={styles.points}>-{item.points}</Text>
      <Text style={[
        styles.date,
        language === 'ar' && styles.rtlText
      ]}>
        {formatLocalizedDate(item.date)}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={['#4CAF50', '#2196F3']} 
        style={styles.heroSection}
      >
        <Text style={styles.heroTitle}>{t('redeemHistory.title')}</Text>
        <Text style={styles.heroSubtitle}>{t('redeemHistory.subtitle')}</Text>
      </LinearGradient>
      
      <FlatList
        data={redeemHistory}
        keyExtractor={(item, idx) => item.id?.toString() || idx.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {t('redeemHistory.noHistory')}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  heroSection: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 30
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center'
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center'
  },
  listContent: {
    padding: 16
  },
  itemContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    justifyContent: 'space-between'
  },
  rtlContainer: {
    flexDirection: 'row-reverse'
  },
  reason: {
    flex: 2,
    fontSize: 16
  },
  rtlText: {
    textAlign: 'right'
  },
  points: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f44336'
  },
  date: {
    flex: 2,
    textAlign: 'right',
    fontSize: 14,
    color: '#666'
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    fontSize: 16,
    color: '#666'
  }
});