import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWallet } from "../hooks/useWallet";
import { colors, shadows, spacing } from "../styles";
import { scaleSize } from "../utils/scale";

export default function EWallet() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const {
    balance,
    transactions,
    loading,
    transactionsLoading,
    refreshing,
    createWithdrawal,
    refreshWalletData,
    formatCurrency,
    formatDate,
  } = useWallet();
  
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedGateway, setSelectedGateway] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const paymentGateways = [
    { id: "paypal", name: "PayPal", icon: "logo-paypal", color: "#0070ba" },
    { id: "vodafone", name: "Vodafone Cash", icon: "phone-portrait", color: "#e60000" },
    { id: "orange", name: "Orange Money", icon: "phone-portrait", color: "#ff7900" },
    { id: "etisalat", name: "Etisalat Cash", icon: "phone-portrait", color: "#5cb85c" },
    { id: "bank", name: "Bank Transfer", icon: "card", color: "#2c3e50" },
  ];

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid withdrawal amount.");
      return;
    }

    if (parseFloat(withdrawAmount) > balance) {
      Alert.alert("Insufficient Balance", "You don't have enough balance for this withdrawal.");
      return;
    }

    if (!selectedGateway) {
      Alert.alert("Select Gateway", "Please select a payment gateway.");
      return;
    }

    try {
      setSubmitting(true);
      
      const transactionData = {
        type: "withdrawal",
        amount: parseFloat(withdrawAmount),
        gateway: selectedGateway.name,
      };

      await createWithdrawal(transactionData);
      
      // Reset form and close modal
      setWithdrawAmount("");
      setSelectedGateway(null);
      setWithdrawModalVisible(false);
      
    } catch (_error) {
      // Error is already handled in the hook
    } finally {
      setSubmitting(false);
    }
  };

  const getTransactionIcon = (type) => {
    // Transaction types:
    // - withdrawal: User withdraws money (subtraction) - red
    // - cashback: User earns money from recycling (addition) - green
    // - deposit: User deposits money (addition) - green
    // - reward: User gets reward money (addition) - green
    switch (type?.toLowerCase()) {
      case 'withdrawal':
        return 'arrow-up-circle-outline';
      case 'cashback':
        return 'arrow-down-circle-outline';
      case 'deposit':
        return 'add-circle-outline';
      case 'reward':
        return 'gift-outline';
      default:
        return 'swap-horizontal-outline';
    }
  };

  const getTransactionColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'withdrawal':
        return colors.error;
      case 'cashback':
      case 'deposit':
      case 'reward':
        return colors.success;
      default:
        return colors.neutral;
    }
  };

  const getTransactionPrefix = (type) => {
    switch (type?.toLowerCase()) {
      case 'withdrawal':
        return '-';
      case 'cashback':
      case 'deposit':
      case 'reward':
        return '+';
      default:
        return '';
    }
  };

  const getTransactionBackgroundColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'withdrawal':
        return colors.error + '10'; // 10% opacity
      case 'cashback':
      case 'deposit':
      case 'reward':
        return colors.success + '10'; // 10% opacity
      default:
        return colors.base100;
    }
  };

  const renderTransaction = ({ item }) => (
    <View style={[
      styles.transactionItem,
      { backgroundColor: getTransactionBackgroundColor(item.type) }
    ]}>
      <View style={[
        styles.transactionIcon,
        { backgroundColor: getTransactionColor(item.type) + '20' }
      ]}>
        <Ionicons
          name={getTransactionIcon(item.type)}
          size={24}
          color={getTransactionColor(item.type)}
        />
      </View>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionType}>
          {item.type?.charAt(0).toUpperCase() + item.type?.slice(1) || 'Transaction'}
        </Text>
        <Text style={styles.transactionDescription}>
          {item.type === 'withdrawal' ? `Withdrawal via ${item.gateway}` : 
           item.type === 'cashback' ? 'Cashback earned' : 
           `${item.gateway || 'Transaction'}`}
        </Text>
        <Text style={styles.transactionDate}>
          {formatDate(item.date || item.createdAt || new Date())}
        </Text>
      </View>
      <View style={styles.transactionAmount}>
        <Text style={[
          styles.amountText,
          { 
            color: getTransactionColor(item.type),
            fontWeight: item.type?.toLowerCase() === 'cashback' ? '700' : '600'
          }
        ]}>
          {getTransactionPrefix(item.type)}{formatCurrency(item.amount || 0)}
        </Text>
        {item.type?.toLowerCase() === 'cashback' && (
          <Text style={styles.cashbackLabel}>Cashback</Text>
        )}
        {item.type?.toLowerCase() === 'withdrawal' && (
          <Text style={styles.withdrawalLabel}>Withdrawal</Text>
        )}
      </View>
    </View>
  );

  const renderGateway = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.gatewayItem,
        selectedGateway?.id === item.id && styles.selectedGateway
      ]}
      onPress={() => setSelectedGateway(item)}
    >
      <Ionicons name={item.icon} size={24} color={item.color} />
      <Text style={styles.gatewayName}>{item.name}</Text>
      {selectedGateway?.id === item.id && (
        <Ionicons name="checkmark-circle" size={20} color={colors.success} />
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <StatusBar style="dark" backgroundColor="#ffffff" />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading wallet...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="transparent" />
      
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.neutral]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 25 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.heroBackButton}
          >
            <MaterialIcons
              name="arrow-back-ios"
              size={scaleSize(22)}
              color="#fff"
            />
          </TouchableOpacity>
          <View style={styles.headerTextFlex}>
            <Text style={styles.title}>E-Wallet</Text>
            <Text style={styles.subtitle}>Manage your digital wallet</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>
        <TouchableOpacity
          style={styles.withdrawButton}
          onPress={() => setWithdrawModalVisible(true)}
        >
          <Ionicons name="wallet" size={20} color={colors.white} />
          <Text style={styles.withdrawButtonText}>Withdraw</Text>
        </TouchableOpacity>
      </View>

      {/* Transactions */}
      <View style={styles.transactionsContainer}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        
        {transactionsLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="wallet-outline" size={48} color={colors.textTertiary} />
            <Text style={styles.emptyStateText}>No transactions yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Your transaction history will appear here
            </Text>
          </View>
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={(item, index) => item._id || item.id || `transaction-${index}`}
            renderItem={renderTransaction}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refreshWalletData}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          />
        )}
      </View>

      {/* Withdraw Modal */}
      <Modal
        visible={withdrawModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setWithdrawModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Withdraw Funds</Text>
              <TouchableOpacity
                onPress={() => setWithdrawModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalBalance}>
                Available Balance: {formatCurrency(balance)}
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Withdrawal Amount</Text>
                <TextInput
                  style={styles.amountInput}
                  value={withdrawAmount}
                  onChangeText={setWithdrawAmount}
                  placeholder="Enter amount"
                  keyboardType="numeric"
                  editable={!submitting}
                />
              </View>

              <View style={styles.gatewayContainer}>
                <Text style={styles.inputLabel}>Select Payment Gateway</Text>
                <FlatList
                  data={paymentGateways}
                  keyExtractor={(item) => item.id}
                  renderItem={renderGateway}
                  showsVerticalScrollIndicator={false}
                  style={styles.gatewayList}
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setWithdrawModalVisible(false)}
                disabled={submitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleWithdraw}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.confirmButtonText}>Withdraw</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: scaleSize(16),
  },
  header: {
    paddingTop: 32,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroBackButton: {
    marginRight: scaleSize(12),
    padding: scaleSize(6),
    alignSelf: 'center',
  },
  headerTextFlex: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -scaleSize(36), // adjust for centering
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: scaleSize(2),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#e0f2f1',
    marginTop: 0,
    textAlign: 'center',
  },
  balanceCard: {
    backgroundColor: colors.white,
    marginTop: spacing.xs,
    margin: spacing.lg,
    padding: spacing.xl,
    borderRadius: 16,
    alignItems: "center",
    ...shadows.medium,
  },
  balanceLabel: {
    fontSize: scaleSize(16),
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  balanceAmount: {
    fontSize: scaleSize(32),
    fontWeight: "700",
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  withdrawButton: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  withdrawButtonText: {
    color: colors.white,
    fontSize: scaleSize(16),
    fontWeight: "600",
  },
  transactionsContainer: {
    flex: 1,
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: 16,
    padding: spacing.lg,
    ...shadows.medium,
  },
  sectionTitle: {
    fontSize: scaleSize(18),
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.lg,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.base200,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.base100,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionType: {
    fontSize: scaleSize(16),
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  transactionDescription: {
    fontSize: scaleSize(14),
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  transactionDate: {
    fontSize: scaleSize(12),
    color: colors.textTertiary,
  },
  transactionAmount: {
    alignItems: "flex-end",
  },
  amountText: {
    fontSize: scaleSize(16),
    fontWeight: "600",
  },
  cashbackLabel: {
    fontSize: scaleSize(10),
    color: colors.success,
    fontWeight: "500",
    textTransform: "uppercase",
    marginTop: spacing.xs / 2,
  },
  withdrawalLabel: {
    fontSize: scaleSize(10),
    color: colors.error,
    fontWeight: "500",
    textTransform: "uppercase",
    marginTop: spacing.xs / 2,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
  },
  emptyStateText: {
    fontSize: scaleSize(16),
    fontWeight: "600",
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyStateSubtext: {
    fontSize: scaleSize(14),
    color: colors.textTertiary,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.base200,
  },
  modalTitle: {
    fontSize: scaleSize(18),
    fontWeight: "600",
    color: colors.text,
  },
  modalCloseButton: {
    padding: spacing.xs,
  },
  modalBody: {
    padding: spacing.lg,
    maxHeight: 400,
  },
  modalBalance: {
    fontSize: scaleSize(16),
    color: colors.primary,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: scaleSize(16),
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: colors.base300,
    borderRadius: 12,
    padding: spacing.md,
    fontSize: scaleSize(16),
    backgroundColor: colors.base100,
  },
  gatewayContainer: {
    marginBottom: spacing.lg,
  },
  gatewayList: {
    maxHeight: 200,
  },
  gatewayItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.base300,
    borderRadius: 12,
    marginBottom: spacing.sm,
    backgroundColor: colors.base50,
  },
  selectedGateway: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + "10",
  },
  gatewayName: {
    flex: 1,
    marginLeft: spacing.md,
    fontSize: scaleSize(16),
    color: colors.text,
  },
  modalFooter: {
    flexDirection: "row",
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.base200,
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: colors.base200,
  },
  cancelButtonText: {
    fontSize: scaleSize(16),
    fontWeight: "600",
    color: colors.textSecondary,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  confirmButtonText: {
    fontSize: scaleSize(16),
    fontWeight: "600",
    color: colors.white,
  },
});
