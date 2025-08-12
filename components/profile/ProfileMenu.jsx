import { Feather, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../styles';
import { scaleSize } from '../../utils/scale';

const menuItems = [
  {
    key: 'recyclingHistory',
    icon: <MaterialIcons name="history" size={scaleSize(24)} color={colors.primary} />,
    label: 'Recycling History',
    subtitle: 'View your past recycling activities',
  },
  {
    key: 'eWallet',
    icon: <FontAwesome5 name="wallet" size={scaleSize(22)} color={colors.yellow} />,
    label: 'E-Wallet',
    subtitle: 'Coming soon',
  },
  {
    key: 'helpSupport',
    icon: <Feather name="help-circle" size={scaleSize(24)} color={colors.purple} />,
    label: 'Help & Support',
    subtitle: 'Coming soon',
  },
  {
    key: 'logout',
    icon: <MaterialIcons name="logout" size={scaleSize(24)} color={colors.red} />,
    label: 'Log Out',
    subtitle: 'Sign out of your account',
  },
];

export default function ProfileMenu({
  onRecyclingHistory,
  onEWallet,
  onHelpSupport,
  onLogout,
  style,
}) {
  const handlePress = (key) => {
    switch (key) {
      case 'recyclingHistory':
        onRecyclingHistory && onRecyclingHistory();
        break;
      case 'eWallet':
        onEWallet ? onEWallet() : Alert.alert('Coming soon');
        break;
      case 'helpSupport':
        onHelpSupport ? onHelpSupport() : Alert.alert('Coming soon');
        break;
      case 'logout':
        onLogout && onLogout();
        break;
      default:
        break;
    }
  };

  return (
    <View style={[styles.menuCard, style]}>
      {menuItems.map((item, idx) => (
        <TouchableOpacity
          key={item.key}
          style={[styles.menuItem, idx === menuItems.length - 1 && { borderBottomWidth: 0 }]}
          onPress={() => handlePress(item.key)}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>{item.icon}</View>
          <View style={styles.textContainer}>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
          <MaterialIcons name="keyboard-arrow-right" size={scaleSize(24)} color={colors.gray} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  menuCard: {
    backgroundColor: colors.white,
    borderRadius: scaleSize(18),
    marginHorizontal: 16,
    marginTop: scaleSize(8),
    marginBottom: scaleSize(16),
    paddingVertical: scaleSize(2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleSize(14),
    paddingHorizontal: scaleSize(12),
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  iconContainer: {
    width: scaleSize(38),
    height: scaleSize(38),
    borderRadius: scaleSize(12),
    backgroundColor: colors.lightest,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scaleSize(14),
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    fontSize: scaleSize(15),
    fontWeight: '600',
    color: colors.primary,
  },
  subtitle: {
    fontSize: scaleSize(11),
    color: colors.gray,
    marginTop: scaleSize(2),
  },
});
