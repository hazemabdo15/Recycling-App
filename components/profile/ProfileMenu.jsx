import { Feather, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../styles';
import { scaleSize } from '../../utils/scale';



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
      case 'achievements':
        Alert.alert('Coming soon');
        break;
      case 'notifications':
        Alert.alert('Coming soon');
        break;
      case 'helpSupport':
        onHelpSupport ? onHelpSupport() : Alert.alert('Coming soon');
        break;
      case 'settings':
        Alert.alert('Coming soon');
        break;
      case 'logout':
        onLogout && onLogout();
        break;
      case 'eWallet':
        onEWallet ? onEWallet() : Alert.alert('Coming soon');
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
          style={[
            styles.menuItem,
            idx === 0 && { borderTopLeftRadius: scaleSize(18), borderTopRightRadius: scaleSize(18) },
            idx === menuItems.length - 1 && { borderBottomLeftRadius: scaleSize(18), borderBottomRightRadius: scaleSize(18), borderBottomWidth: 0 },
          ]}
          onPress={() => handlePress(item.key)}
          activeOpacity={0.8}
        >
          {item.icon}
          <View style={styles.textContainer}>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
          <MaterialIcons name="keyboard-arrow-right" size={scaleSize(24)} color={colors.gray} style={{ marginLeft: scaleSize(8) }} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  menuCard: {
    backgroundColor: colors.white,
    borderRadius: scaleSize(22),
    marginHorizontal: scaleSize(10),
    marginTop: scaleSize(10),
    marginBottom: scaleSize(18),
    paddingVertical: scaleSize(2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleSize(18),
    paddingHorizontal: scaleSize(18),
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6', // lighter, less contrast
    backgroundColor: 'transparent',
  },
  iconBg: {
    width: scaleSize(44),
    height: scaleSize(44),
    borderRadius: scaleSize(14),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scaleSize(18),
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    fontSize: scaleSize(16),
    fontWeight: '700',
    color: colors.primary,
    marginBottom: scaleSize(2),
  },
  subtitle: {
    fontSize: scaleSize(12),
    color: colors.gray,
    marginTop: 0,
    fontWeight: '400',
  },
});

const menuItems = [
  {
    key: 'recyclingHistory',
    icon: (
      <View style={[styles.iconBg, { backgroundColor: '#e8f7e5' }]}> 
        <MaterialIcons name="history" size={scaleSize(24)} color={colors.primary} />
      </View>
    ),
    label: 'Recycling History',
    subtitle: 'View your past recycling activities',
  },
    {
      key: 'eWallet',
      icon: (
        <View style={[styles.iconBg, { backgroundColor: '#fffbe6' }]}> 
          <FontAwesome5 name="wallet" size={scaleSize(22)} color={colors.yellow} />
        </View>
      ),
      label: 'E-Wallet',
      subtitle: 'Coming soon',
    },
  {
    key: 'achievements',  
    icon: (
      <View style={[styles.iconBg, { backgroundColor: '#fff7e6' }]}> 
        <FontAwesome5 name="trophy" size={scaleSize(22)} color={colors.yellow} />
      </View>
    ),
    label: 'Achievements',
    subtitle: 'See your recycling milestones',
  },
  {
    key: 'helpSupport',
    icon: (
      <View style={[styles.iconBg, { backgroundColor: '#f3e8ff' }]}> 
        <Feather name="help-circle" size={scaleSize(24)} color={colors.purple} />
      </View>
    ),
    label: 'Help & Support',
    subtitle: 'Get help and contact support',
  },
  {
    key: 'logout',
    icon: (
      <View style={[styles.iconBg, { backgroundColor: '#fff1f2' }]}> 
        <MaterialIcons name="logout" size={scaleSize(24)} color={colors.red} />
      </View>
    ),
    label: 'Log Out',
    subtitle: 'Sign out of your account',
  },
];
