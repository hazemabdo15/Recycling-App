import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors } from '../../styles/theme';
import { isBuyer, isCustomer } from '../../utils/roleLabels';
import { scaleSize } from '../../utils/scale';


export default function ProfileCard({ user, points = 0, tier = '', onLogout, onRedeem, showRedeem, onEditAvatar, style, avatarLoading }) {
  const avatarUri = user?.avatarUri;
  console.log('ProfileCard points prop:', points);
  return (
    <View style={[styles.card, style]}>
      <View style={styles.headerRow}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <MaterialCommunityIcons name="account" size={44} color={colors.white} />
              )}
              {avatarLoading && (
                <View style={styles.avatarLoadingOverlay}>
                  <ActivityIndicator size="small" color="#059669" />
                </View>
              )}
            </View>
            <TouchableOpacity style={styles.editAvatarButton} onPress={onEditAvatar} accessibilityLabel="Edit Profile Image">
              <MaterialCommunityIcons name="pencil" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.name}>{user?.name || 'Guest'}</Text>
            <Text style={styles.email}>{user?.email || 'No email available'}</Text>
          </View>
        </View>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <MaterialCommunityIcons name="recycle" size={20} color={colors.primary} />
          <Text style={styles.statValue}>{user?.totalRecycles ?? 0}</Text>
          <Text style={styles.statLabel}>Total Recycled</Text>
        </View>
        {!isBuyer(user) && (
          <View style={styles.statBox}>
            <MaterialCommunityIcons name="star-circle" size={20} color={colors.accent} />
            <Text style={styles.statValue}>{(points || 0).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
        )}
        <View style={styles.statBox}>
          <MaterialCommunityIcons name="leaf" size={20} color={colors.primary} />
          <Text style={styles.statValue}>{tier || '—'}</Text>
          <Text style={styles.statLabel}>Tier</Text>
        </View>
      </View>
      {showRedeem && isCustomer(user) && (
        <TouchableOpacity style={styles.redeemButton} onPress={onRedeem}>
          <Text style={styles.redeemButtonText}>Redeem Your Points</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: scaleSize(27),
    resizeMode: 'cover',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: scaleSize(18),
    padding: scaleSize(18),
    marginHorizontal: 16, // Match FlatList contentContainerStyle for order cards
    marginTop: scaleSize(24),
    marginBottom: scaleSize(10),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scaleSize(10),
    paddingRight: scaleSize(8), // Add right padding for logout icon spacing
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: scaleSize(12),
  },
  avatar: {
    width: scaleSize(54),
    height: scaleSize(54),
    borderRadius: scaleSize(27),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scaleSize(27),
    zIndex: 2,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.white,
    borderRadius: scaleSize(12),
    padding: scaleSize(2),
    borderWidth: 1,
    borderColor: colors.primary,
    elevation: 2,
  },
  infoContainer: {
    justifyContent: 'center',
  },
  name: {
    fontSize: scaleSize(18),
    fontWeight: '700',
    color: colors.primary,
  },
  email: {
    fontSize: scaleSize(13),
    color: colors.gray,
  },
  logoutButton: {
    padding: scaleSize(6),
    marginLeft: scaleSize(8),
    marginRight: scaleSize(2), // Add right margin to keep away from card border
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: scaleSize(8),
    marginBottom: scaleSize(6),
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: scaleSize(6),
  },
  statValue: {
    fontSize: scaleSize(16),
    fontWeight: '600',
    color: colors.primary,
    marginTop: scaleSize(2),
  },
  statLabel: {
    fontSize: scaleSize(11),
    color: colors.gray,
    marginTop: scaleSize(1),
  },
  redeemButton: {
    backgroundColor: colors.primary,
    borderRadius: scaleSize(10),
    paddingVertical: scaleSize(10),
    marginTop: scaleSize(10),
    alignItems: 'center',
  },
  redeemButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: scaleSize(14),
  },
});
