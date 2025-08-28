import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { ActivityIndicator, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useLocalization } from '../../context/LocalizationContext';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { isBuyer, isCustomer } from '../../utils/roleUtils';
import { scaleSize } from '../../utils/scale';
import { calculateUserTier, getTierColors } from '../../utils/tiers';
import TierBadge from '../achievements/TierBadge';


export default function ProfileCard({ user, points = 0, tier = '', onLogout, onRedeem, showRedeem, onEditAvatar, style, avatarLoading }) {
  const [showImagePreview, setShowImagePreview] = useState(false);
  const { colors } = useThemedStyles();
  const avatarUri = user?.avatarUri;
  const totalRecycles = user?.totalRecycles ?? 0;
  const userTier = calculateUserTier(totalRecycles);
  const tierColors = getTierColors(userTier.name);
  const { t } = useLocalization();

  const styles = getStyles(colors);
  
  return (
    <LinearGradient
      colors={colors.cardGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, style]}
    >
      {/* Background decorative elements */}
      <View style={styles.backgroundPattern}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={tierColors.gradient}
              style={styles.avatarGradientBorder}
            >
              <TouchableOpacity 
                style={styles.avatar} 
                onPress={() => avatarUri && setShowImagePreview(true)}
                disabled={!avatarUri}
              >
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                ) : (
                  <LinearGradient
                    colors={colors.avatarGradient}
                    style={styles.defaultAvatarGradient}
                  >
                    <MaterialCommunityIcons name="account" size={scaleSize(40)} color={colors.primary} />
                  </LinearGradient>
                )}
                {avatarLoading && (
                  <View style={styles.avatarLoadingOverlay}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                )}
              </TouchableOpacity>
            </LinearGradient>
            
            <TouchableOpacity style={styles.editAvatarButton} onPress={onEditAvatar} accessibilityLabel="Edit Profile Image">
              <LinearGradient
                colors={colors.cardGradient}
                style={styles.editButtonGradient}
              >
                <MaterialCommunityIcons name="camera-plus" size={scaleSize(16)} color={colors.primary} />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.userInfo}>
            <View style={styles.nameSection}>
              <Text style={styles.userName}>{user?.name || 'Guest'}</Text>
              <TierBadge tierName={userTier.name} size="small" showName={false} />
            </View>
            <Text style={styles.userEmail}>{user?.email || t('profile.noEmailAvailable')}</Text>
            <View style={styles.tierInfo}>
              <MaterialCommunityIcons name="star-circle" size={scaleSize(14)} color={tierColors.primary} />
              <Text style={[styles.tierText, { color: tierColors.primary }]}>
                {t(`tiers.${userTier.name}`, userTier.name)}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.statCardBg }]}>
              <LinearGradient
                colors={colors.recycleStatGradient}
                style={styles.statIconContainer}
              >
                <MaterialCommunityIcons name="recycle" size={scaleSize(20)} color={colors.recycleStatIcon} />
              </LinearGradient>
              <Text style={[styles.statNumber, { color: colors.text }]}>{user?.totalRecycles ?? 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t("common.recycled")}</Text>
            </View>

            {!isBuyer(user) && (
              <View style={[styles.statCard, { backgroundColor: colors.statCardBg }]}>
                <LinearGradient
                  colors={colors.pointsStatGradient}
                  style={styles.statIconContainer}
                >
                  <MaterialCommunityIcons name="diamond-stone" size={scaleSize(20)} color={colors.pointsStatIcon} />
                </LinearGradient>
                <Text style={[styles.statNumber, { color: colors.text }]}>{(points || 0).toLocaleString()}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t("wallet.pointsEarned")}</Text>
              </View>
            )}

            <View style={[styles.statCard, { backgroundColor: colors.statCardBg }]}>
              <LinearGradient
                colors={tierColors.lightGradient || colors.tierStatGradient}
                style={styles.statIconContainer}
              >
                <MaterialCommunityIcons name="trophy" size={scaleSize(20)} color={tierColors.primary} />
              </LinearGradient>
              <Text style={[styles.statNumber, { color: colors.text }]}>#{userTier.id}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t("common.tierLevel")}</Text>
            </View>
          </View>
        </View>

        {/* Action Button */}
        {showRedeem && isCustomer(user) && (
          <TouchableOpacity style={styles.actionButton} onPress={onRedeem}>
            <LinearGradient
              colors={[colors.primary, colors.neutral]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionButtonGradient}
            >
              <MaterialCommunityIcons name="gift" size={scaleSize(18)} color="white" />
              <Text style={styles.actionButtonText}>{t("common.redeemPoints")}</Text>
              <MaterialCommunityIcons name="arrow-right" size={scaleSize(16)} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* Image Preview Modal */}
      <Modal
        visible={showImagePreview}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImagePreview(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalCloseArea} 
            activeOpacity={1} 
            onPress={() => setShowImagePreview(false)}
          >
            <View style={styles.imagePreviewContainer}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowImagePreview(false)}
              >
                <MaterialCommunityIcons name="close" size={scaleSize(24)} color="white" />
              </TouchableOpacity>
              
              {avatarUri && (
                <Image 
                  source={{ uri: avatarUri }} 
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              )}
              
              <View style={styles.previewInfo}>
                <Text style={styles.previewTitle}>{user?.name || 'Profile Image'}</Text>
                <Text style={styles.previewSubtitle}>Tap anywhere to close</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </LinearGradient>

);
}

const getStyles = (colors) => StyleSheet.create({
  card: {
    borderRadius: scaleSize(24),
    marginHorizontal: scaleSize(16),
    marginTop: scaleSize(44),
    marginBottom: scaleSize(16),
    overflow: 'hidden',
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  circle: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.06,
  },
  circle1: {
    width: scaleSize(120),
    height: scaleSize(120),
    backgroundColor: colors.primary,
    top: -scaleSize(60),
    right: -scaleSize(40),
  },
  circle2: {
    width: scaleSize(80),
    height: scaleSize(80),
    backgroundColor: colors.accent,
    bottom: -scaleSize(40),
    left: -scaleSize(20),
  },
  circle3: {
    width: scaleSize(60),
    height: scaleSize(60),
    backgroundColor: colors.warning,
    top: scaleSize(80),
    right: scaleSize(20),
  },
  content: {
    padding: scaleSize(20),
    position: 'relative',
    zIndex: 1,
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: scaleSize(20),
  },
  avatarContainer: {
    position: 'relative',
    marginRight: scaleSize(16),
  },
  avatarGradientBorder: {
    padding: scaleSize(3),
    borderRadius: scaleSize(32),
  },
  avatar: {
    width: scaleSize(58),
    height: scaleSize(58),
    borderRadius: scaleSize(29),
    overflow: 'hidden',
    backgroundColor: colors.cardBackground,
  },
  defaultAvatarGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: colors.overlayBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scaleSize(29),
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: -scaleSize(2),
    right: -scaleSize(2),
    borderRadius: scaleSize(14),
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editButtonGradient: {
    width: scaleSize(28),
    height: scaleSize(28),
    borderRadius: scaleSize(14),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleSize(4),
  },
  userName: {
    fontSize: scaleSize(20),
    fontWeight: '700',
    color: colors.text,
    marginRight: scaleSize(8),
  },
  userEmail: {
    fontSize: scaleSize(14),
    color: colors.textSecondary,
    marginBottom: scaleSize(6),
  },
  tierInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tierText: {
    fontSize: scaleSize(12),
    fontWeight: '600',
    marginLeft: scaleSize(4),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsSection: {
    marginBottom: scaleSize(20),
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: scaleSize(4),
    paddingVertical: scaleSize(12),
    paddingHorizontal: scaleSize(8),
    borderRadius: scaleSize(16),
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  statIconContainer: {
    width: scaleSize(36),
    height: scaleSize(36),
    borderRadius: scaleSize(18),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scaleSize(6),
  },
  statNumber: {
    fontSize: scaleSize(16),
    fontWeight: '700',
    marginBottom: scaleSize(2),
  },
  statLabel: {
    fontSize: scaleSize(10),
    fontWeight: '500',
    textAlign: 'center',
  },
  actionButton: {
    borderRadius: scaleSize(14),
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleSize(14),
    paddingHorizontal: scaleSize(20),
    borderRadius: scaleSize(14),
  },
  actionButtonText: {
    color: 'white',
    fontSize: scaleSize(15),
    fontWeight: '600',
    marginHorizontal: scaleSize(8),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreviewContainer: {
    width: '90%',
    maxWidth: scaleSize(350),
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: -scaleSize(50),
    right: scaleSize(10),
    zIndex: 1,
    backgroundColor: colors.modalButtonBg,
    borderRadius: scaleSize(20),
    width: scaleSize(40),
    height: scaleSize(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: scaleSize(300),
    height: scaleSize(300),
    borderRadius: scaleSize(20),
    backgroundColor: colors.modalImageBg,
  },
  previewInfo: {
    marginTop: scaleSize(20),
    alignItems: 'center',
  },
  previewTitle: {
    color: colors.modalText,
    fontSize: scaleSize(18),
    fontWeight: '600',
    marginBottom: scaleSize(4),
  },
  previewSubtitle: {
    color: colors.modalSubText,
    fontSize: scaleSize(14),
    textAlign: 'center',
  },
});
