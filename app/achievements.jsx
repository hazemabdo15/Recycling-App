import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  FlatList,
  I18nManager,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import ProgressBar from '../components/achievements/ProgressBar';
import TierBadge from '../components/achievements/TierBadge';
import TierCard from '../components/achievements/TierCard';
import Loader from '../components/common/Loader';
import { useAuth } from '../context/AuthContext';
import { useLocalization } from '../context/LocalizationContext';
import { useUserPoints } from '../hooks/useUserPoints';
import {
  achievementMilestones,
  calculateEnvironmentalImpact,
  getCompletedAchievements
} from '../utils/achievements';
import {
  calculateProgress,
  calculateUserTier,
  getNextTier,
  getTierColors,
  rewardLevels
} from '../utils/tiers';

const AchievementsScreen = () => {
  const { user, isLoggedIn } = useAuth();
  const { t, isRTL } = useLocalization();
  const [selectedTier, setSelectedTier] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Handle RTL setup
  useEffect(() => {
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(isRTL);
      // Note: You might need to restart the app for changes to take full effect
    }
  }, [isRTL]);

  // Always call the hook, but conditionally fetch data
  const { userPoints, totalRecycled, pointsLoading } = useUserPoints(
    isLoggedIn && user?._id ? {
      userId: user._id,
      name: user.name,
      email: user.email
    } : {}
  );

  console.log('AchievementsScreen - user:', user ? 'available' : 'null');
  console.log('AchievementsScreen - userPoints:', userPoints);
  console.log('AchievementsScreen - totalRecycled:', totalRecycled);
  console.log('AchievementsScreen - pointsLoading:', pointsLoading);

  // Handle case where user is not available or not logged in
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, isRTL && styles.rtlText]}>{t('achievements.pleaseLogin')}</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={[styles.backButtonText, isRTL && styles.rtlText]}>{t('common.goBack')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Show loading while user data is being fetched
  // We need to wait until we have a valid userId AND the data has been loaded
  const isDataLoading = !user?._id || pointsLoading || (user?._id && totalRecycled === undefined);
  
  if (isDataLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Loader />
        </View>
      </SafeAreaView>
    );
  }

  // Get total recycling orders (completed orders) directly from hook
  const totalRecycles = totalRecycled || 0;
  
  console.log('AchievementsScreen - totalRecycles for tier calculation:', totalRecycles);
  
  // Calculate tier information
  const currentTier = calculateUserTier(totalRecycles);
  const nextTier = getNextTier(currentTier);
  const progress = calculateProgress(totalRecycles, currentTier, nextTier);
  
  console.log('AchievementsScreen - currentTier:', currentTier);
  console.log('AchievementsScreen - nextTier:', nextTier);
  console.log('AchievementsScreen - progress:', progress);
  
  // Get achievements
  const completedAchievements = getCompletedAchievements(totalRecycles);
  
  // Environmental impact
  const environmentalImpact = calculateEnvironmentalImpact(totalRecycles);

  const handleTierPress = (tier) => {
    setSelectedTier(tier);
    setModalVisible(true);
  };

  const renderTierCard = ({ item, index }) => {
    const isCurrentTier = item.id === currentTier.id;
    const isUnlocked = totalRecycles >= item.minRecycles;
    
    return (
      <TierCard
        tier={item}
        isCurrentTier={isCurrentTier}
        isUnlocked={isUnlocked}
        onPress={() => handleTierPress(item)}
      />
    );
  };

  const renderAchievement = ({ item }) => {
    const isCompleted = completedAchievements.some(completed => completed.id === item.id);
    
    return (
      <View style={[
        styles.achievementItem, 
        isCompleted && styles.completedAchievement,
        isRTL && styles.achievementItemRTL
      ]}>
        <LinearGradient
          colors={isCompleted ? ['#10B981', '#34D399'] : ['#E5E7EB', '#F3F4F6']}
          style={[styles.achievementIcon, isRTL && styles.achievementIconRTL]}
        >
          <MaterialCommunityIcons
            name={item.icon}
            size={24}
            color={isCompleted ? 'white' : '#9CA3AF'}
          />
        </LinearGradient>
        <View style={[styles.achievementInfo, isRTL && styles.achievementInfoRTL]}>
          <Text style={[
            styles.achievementName, 
            !isCompleted && styles.lockedText, 
            isRTL && styles.rtlText
          ]}>
            {t(`achievements.milestones.${item.id}.name`, item.name)}
          </Text>
          <Text style={[
            styles.achievementDescription, 
            !isCompleted && styles.lockedText, 
            isRTL && styles.rtlText
          ]}>
            {t(`achievements.milestones.${item.id}.description`, item.description)}
          </Text>
          <Text style={[
            styles.achievementPoints, 
            !isCompleted && styles.lockedText, 
            isRTL && styles.rtlText
          ]}>
            {t('achievements.points', { points: item.points })}
          </Text>
        </View>
        {isCompleted && (
          <MaterialCommunityIcons
            name="check-circle"
            size={24}
            color="#10B981"
            style={isRTL && styles.checkIconRTL}
          />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={getTierColors(currentTier.name).gradient}
          style={styles.header}
        >
          <TouchableOpacity
            style={[styles.headerBackButton, isRTL && styles.headerBackButtonRTL]}
            onPress={() => router.back()}
          >
            <MaterialIcons 
              name={isRTL ? "arrow-forward-ios" : "arrow-back-ios"} 
              size={24} 
              color="white" 
            />
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, isRTL && styles.rtlText]}>
            {t('achievements.title')}
          </Text>
          
          <View style={styles.currentTierSection}>
            <TierBadge tierName={currentTier.name} size="large" showName={false} />
            <Text style={[styles.currentTierName, isRTL && styles.rtlText]}>
              {t(`tiers.${currentTier.name}`, currentTier.name)}
            </Text>
            <Text style={[styles.currentTierSubtitle, isRTL && styles.rtlText]}>
              {t('achievements.ordersCompleted', { count: totalRecycles })}
            </Text>
          </View>
          
          {nextTier && (
            <View style={styles.progressSection}>
              <View style={[styles.progressHeader, isRTL && styles.progressHeaderRTL]}>
                <Text style={[styles.progressText, isRTL && styles.rtlText]}>
                  {t('achievements.progressTo', { tier: t(`tiers.${nextTier.name}`, nextTier.name) })}
                </Text>
                <Text style={[styles.progressNumbers, isRTL && styles.rtlText]}>
                  {isRTL ? `${nextTier.minRecycles}/${totalRecycles}` : `${totalRecycles}/${nextTier.minRecycles}`}
                </Text>
              </View>
              <ProgressBar
                progress={progress}
                colors={['rgba(255,255,255,0.8)', 'white']}
                height={12}
              />
              <Text style={[styles.ordersNeeded, isRTL && styles.rtlText]}>
                {t('achievements.ordersToUnlock', { count: nextTier.minRecycles - totalRecycles })}
              </Text>
            </View>
          )}
        </LinearGradient>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statsGrid, isRTL && styles.statsGridRTL]}>
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="leaf" size={24} color="#10B981" />
              <Text style={[styles.statNumber, isRTL && styles.rtlText]}>
                {environmentalImpact.co2Saved}{t('achievements.stats.kg')}
              </Text>
              <Text style={[styles.statLabel, isRTL && styles.rtlText]}>
                {t('achievements.stats.co2Saved')}
              </Text>
            </View>
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="tree" size={24} color="#10B981" />
              <Text style={[styles.statNumber, isRTL && styles.rtlText]}>
                {environmentalImpact.treesEquivalent}
              </Text>
              <Text style={[styles.statLabel, isRTL && styles.rtlText]}>
                {t('achievements.stats.treesPlanted')}
              </Text>
            </View>
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="water" size={24} color="#3B82F6" />
              <Text style={[styles.statNumber, isRTL && styles.rtlText]}>
                {environmentalImpact.waterSaved}{t('achievements.stats.liters')}
              </Text>
              <Text style={[styles.statLabel, isRTL && styles.rtlText]}>
                {t('achievements.stats.waterSaved')}
              </Text>
            </View>
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="flash" size={24} color="#F59E0B" />
              <Text style={[styles.statNumber, isRTL && styles.rtlText]}>
                {environmentalImpact.energySaved}
              </Text>
              <Text style={[styles.statLabel, isRTL && styles.rtlText]}>
                {t('achievements.stats.kwhSaved')}
              </Text>
            </View>
          </View>
        </View>

        {/* Tiers Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>
            {t('achievements.allTiers')}
          </Text>
          <FlatList
            data={rewardLevels}
            renderItem={renderTierCard}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* Achievements Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isRTL && styles.rtlText]}>
            {t('achievements.title')}
          </Text>
          <FlatList
            data={achievementMilestones}
            renderItem={renderAchievement}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </ScrollView>

      {/* Tier Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedTier && (
              <>
                <View style={styles.modalHeader}>
                  <TierBadge tierName={selectedTier.name} size="large" showName={false} />
                  <Text style={[styles.modalTitle, isRTL && styles.rtlText]}>
                    {t(`tiers.${selectedTier.name}`, selectedTier.name)}
                  </Text>
                  <TouchableOpacity
                    style={[styles.modalCloseButton, isRTL && styles.modalCloseButtonRTL]}
                    onPress={() => setModalVisible(false)}
                  >
                    <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.modalBody}>
                  <Text style={[styles.modalSectionTitle, isRTL && styles.rtlText]}>
                    {t('achievements.modal.benefits')}
                  </Text>
                  <View style={styles.benefitsList}>
                    <View style={[styles.benefitItem, isRTL && styles.benefitItemRTL]}>
                      <MaterialCommunityIcons name="gift" size={20} color="#10B981" />
                      <Text style={[styles.benefitText, isRTL && styles.benefitTextRTL, isRTL && styles.rtlText]}>
                        {t('achievements.modal.bonusPerOrder', { bonus: selectedTier.bonusPerOrder })}
                      </Text>
                    </View>
                    <View style={[styles.benefitItem, isRTL && styles.benefitItemRTL]}>
                      <MaterialCommunityIcons name="star" size={20} color="#F59E0B" />
                      <Text style={[styles.benefitText, isRTL && styles.benefitTextRTL, isRTL && styles.rtlText]}>
                        {t('achievements.modal.bonusPerTier', { bonus: selectedTier.bonusPerReachedTier })}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={[styles.modalSectionTitle, isRTL && styles.rtlText]}>
                    {t('achievements.modal.requirements')}
                  </Text>
                  <Text style={[styles.requirementDescription, isRTL && styles.rtlText]}>
                    {selectedTier.minRecycles === 0 
                      ? t('achievements.modal.requirementRange', { range: '0-4' })
                      : t('achievements.modal.requirementMin', { count: selectedTier.minRecycles })
                    }
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerBackButton: {
    alignSelf: 'flex-start',
    marginTop: 28,
    marginBottom: 20,
  },
  headerBackButtonRTL: {
    alignSelf: 'flex-end',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
  rtlText: {
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  currentTierSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  currentTierName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 12,
    textAlign: 'center',
  },
  currentTierSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    textAlign: 'center',
  },
  progressSection: {
    marginTop: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  progressNumbers: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  ordersNeeded: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 8,
  },
  statsContainer: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statsGridRTL: {
    flexDirection: 'row-reverse',
  },
  statCard: {
    width: '48%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  achievementItemRTL: {
    flexDirection: 'row-reverse',
  },
  completedAchievement: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  achievementIconRTL: {
    marginRight: 0,
    marginLeft: 16,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementInfoRTL: {
    alignItems: 'flex-end',
  },
  achievementName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  achievementDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  achievementPoints: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 4,
  },
  lockedText: {
    color: '#9CA3AF',
  },
  checkIconRTL: {
    marginRight: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    maxWidth: 350,
    width: '90%',
    // Enhanced shadow for the tier card
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 24,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 12,
    textAlign: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 4,
  },
  modalCloseButtonRTL: {
    right: 'auto',
    left: 0,
  },
  modalBody: {
    marginTop: 10,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  benefitsList: {
    marginBottom: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitItemRTL: {
    flexDirection: 'row-reverse',
  },
  benefitText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
  benefitTextRTL: {
    marginLeft: 0,
    marginRight: 12,
  },
  requirementDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});

export default AchievementsScreen;