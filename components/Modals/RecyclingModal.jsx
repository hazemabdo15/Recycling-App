import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../../context/AuthContext';
import { useUserPoints } from '../../hooks/useUserPoints';
import apiService from '../../services/api/apiService';
import { colors } from '../../styles/theme';
import { isBuyer } from '../../utils/roleLabels';

const vouchers = [
  { id: '1', name: 'Talabat Mart', value: '50 EGP', points: 500, icon: 'local-grocery-store' },
  { id: '2', name: 'Breadfast', value: '30 EGP', points: 300, icon: 'free-breakfast' },
  { id: '3', name: 'Seoudi', value: '20 EGP', points: 250, icon: 'store' },
];

const RecyclingModal = ({ visible, onClose, onPointsUpdated }) => {
  const [activeOption, setActiveOption] = useState('voucher');
  const [amount, setAmount] = useState('');
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [qrVisible, setQrVisible] = useState(false);
  const [qrValue, setQrValue] = useState('');
  const [redeemedVouchers, setRedeemedVouchers] = useState([]);

  const { user, isLoggedIn } = useAuth();
  const { userPoints, getUserPoints } = useUserPoints({
    userId: isLoggedIn && user?._id ? user._id : null,
    name: isLoggedIn && user?.name ? user.name : null,
    email: isLoggedIn && user?.email ? user.email : null,
  });

  const totalPoints = userPoints || 0;
  const requiredPoints = parseInt(amount) ? parseInt(amount) * 19 : 0;
  const remainingPoints = totalPoints - requiredPoints;

  useEffect(() => {
    if (visible) getUserPoints();
  }, [visible, getUserPoints]);

  // Don't render the modal for buyers as they don't have access to points
  if (isBuyer(user)) {
    return null;
  }

  const handleRedeem = async () => {
    if (!activeOption) return;

    if (activeOption === 'money') {
      if (!amount || requiredPoints > totalPoints) {
        Alert.alert('Invalid Amount', 'You do not have enough points');
        return;
      }
      try {
        await apiService.post(`/users/${user._id}/points/deduct`, {
          points: requiredPoints,
          reason: `Cashback for ${amount} EGP`,
        });
        await getUserPoints();
        onPointsUpdated?.();
        Alert.alert('Success', 'Cashback redeemed');
        setQrVisible(false);
      } catch (error) {
        Alert.alert('Error', error?.response?.data?.message || 'Could not deduct points');
      }
    }

    if (activeOption === 'voucher') {
      const voucher = vouchers.find((v) => v.id === selectedVoucher);
      if (!voucher) return Alert.alert('Select a voucher');

      try {
        await apiService.post(`/users/${user._id}/points/deduct`, {
          points: voucher.points,
          reason: `Voucher redeemed: ${voucher.name}`,
        });
        await getUserPoints();
        onPointsUpdated?.();
        setQrValue(`Voucher: ${voucher.name} - Value: ${voucher.value}`);
        setQrVisible(true);
        setRedeemedVouchers([...redeemedVouchers, voucher.id]);
      } catch (error) {
        Alert.alert('Error', error?.response?.data?.message || 'Could not deduct points');
      }
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.header}>
        <Text style={styles.title}>Redeem Eco Points</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <MaterialIcons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.pointsContainer}>
          <Text style={styles.pointsLabel}>Your Balance</Text>
          <Text style={styles.pointsValue}>{totalPoints.toLocaleString()} Points</Text>
        </View>

        <View style={styles.optionContainer}>
          <TouchableOpacity 
            onPress={() => { setActiveOption('voucher'); setQrVisible(false); }} 
            style={[styles.option, activeOption === 'voucher' && styles.activeOption]}
          >
            <MaterialIcons name="card-giftcard" size={20} color={activeOption === 'voucher' ? colors.primary : '#666'} />
            <Text style={[styles.optionText, activeOption === 'voucher' && styles.activeOptionText]}>Vouchers</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => { setActiveOption('money'); setQrVisible(false); }} 
            style={[styles.option, activeOption === 'money' && styles.activeOption]}
          >
            <MaterialIcons name="attach-money" size={20} color={activeOption === 'money' ? colors.primary : '#666'} />
            <Text style={[styles.optionText, activeOption === 'money' && styles.activeOptionText]}>Cash Out</Text>
          </TouchableOpacity>
        </View>

        {activeOption === 'voucher' && (
          <View style={styles.voucherContainer}>
            <Text style={styles.sectionTitle}>Available Vouchers</Text>
            {vouchers.map((voucher) => {
              const canRedeem = totalPoints >= voucher.points && !redeemedVouchers.includes(voucher.id);
              return (
                <TouchableOpacity
                  key={voucher.id}
                  onPress={() => canRedeem && setSelectedVoucher(voucher.id)}
                  disabled={!canRedeem}
                  style={[
                    styles.voucherCard,
                    selectedVoucher === voucher.id && styles.selectedVoucherCard,
                    !canRedeem && styles.disabledVoucherCard,
                  ]}
                >
                  <View style={styles.voucherIcon}>
                    <MaterialIcons name={voucher.icon} size={24} color={colors.primary} />
                  </View>
                  <View style={styles.voucherDetails}>
                    <Text style={styles.voucherName}>{voucher.name}</Text>
                    <Text style={styles.voucherValue}>{voucher.value}</Text>
                  </View>
                  <View style={styles.voucherPoints}>
                    <Text style={styles.voucherPointsText}>{voucher.points} pts</Text>
                    {!canRedeem && (
                      <Text style={styles.voucherUnavailable}>
                        {redeemedVouchers.includes(voucher.id) ? 'Redeemed' : 'Not enough points'}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {activeOption === 'money' && (
          <View style={styles.moneyContainer}>
            <Text style={styles.sectionTitle}>Cash Out</Text>
            <Text style={styles.inputLabel}>Amount to Redeem (EGP)</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="Enter amount"
              keyboardType="numeric"
              style={styles.input}
            />
            <View style={styles.pointsInfo}>
              <View style={styles.pointsInfoRow}>
                <Text style={styles.pointsInfoLabel}>Required Points:</Text>
                <Text style={styles.pointsInfoValue}>{requiredPoints.toLocaleString()}</Text>
              </View>
              <View style={styles.pointsInfoRow}>
                <Text style={styles.pointsInfoLabel}>Remaining Points:</Text>
                <Text style={[styles.pointsInfoValue, { color: remainingPoints >= 0 ? colors.primary : colors.error }]}>
                  {remainingPoints.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        )}

        {qrVisible && (
          <View style={styles.qrContainer}>
            <Text style={styles.qrTitle}>Your Voucher</Text>
            <View style={styles.qrCodeWrapper}>
              <QRCode value={qrValue} size={200} />
            </View>
            <Text style={styles.qrText}>{qrValue}</Text>
            <Text style={styles.qrInstructions}>Show this QR code to the merchant to redeem</Text>
          </View>
        )}

        {!qrVisible && (
          <TouchableOpacity 
            onPress={handleRedeem} 
            style={[
              styles.redeemButton,
              { backgroundColor: activeOption === 'voucher' && !selectedVoucher ? '#BDBDBD' : colors.primary }
            ]}
            disabled={activeOption === 'voucher' && !selectedVoucher}
          >
            <Text style={styles.redeemButtonText}>
              {activeOption === 'voucher' ? 'Redeem Voucher' : 'Redeem Cash'}
            </Text>
          </TouchableOpacity>
        )}

        {qrVisible && (
          <TouchableOpacity onPress={onClose} style={styles.doneButton}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: colors.primary,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 5,
  },
  pointsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pointsLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  pointsValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  optionContainer: {
    flexDirection: 'row',
    marginVertical: 16,
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  option: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  activeOption: {
    backgroundColor: '#E8F5E9',
  },
  optionText: {
    marginLeft: 8,
    color: '#666',
    fontWeight: '500',
  },
  activeOptionText: {
    color: colors.primary,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  voucherContainer: {
    marginTop: 10,
  },
  voucherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedVoucherCard: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: '#E8F5E9',
  },
  disabledVoucherCard: {
    opacity: 0.6,
  },
  voucherIcon: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 10,
    marginRight: 15,
  },
  voucherDetails: {
    flex: 1,
  },
  voucherName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 3,
  },
  voucherValue: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  voucherPoints: {
    alignItems: 'flex-end',
  },
  voucherPointsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  voucherUnavailable: {
    fontSize: 12,
    color: colors.error,
    marginTop: 3,
  },
  moneyContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 16,
    marginBottom: 15,
  },
  pointsInfo: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
  },
  pointsInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pointsInfoLabel: {
    fontSize: 14,
    color: '#666',
  },
  pointsInfoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  qrContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 25,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  qrCodeWrapper: {
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 15,
  },
  qrText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 5,
  },
  qrInstructions: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  redeemButton: {
    marginTop: 25,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  redeemButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  doneButton: {
    marginTop: 25,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RecyclingModal;