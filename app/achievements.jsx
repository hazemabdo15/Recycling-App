import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    FlatList,
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
  const [selectedTier, setSelectedTier] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

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
          <Text style={styles.errorText}>Please log in to view achievements</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
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
      <View style={[styles.achievementItem, isCompleted && styles.completedAchievement]}>
        <LinearGradient
          colors={isCompleted ? ['#10B981', '#34D399'] : ['#E5E7EB', '#F3F4F6']}
          style={styles.achievementIcon}
        >
          <MaterialCommunityIcons
            name={item.icon}
            size={24}
            color={isCompleted ? 'white' : '#9CA3AF'}
          />
        </LinearGradient>
        <View style={styles.achievementInfo}>
          <Text style={[styles.achievementName, !isCompleted && styles.lockedText]}>
            {item.name}
          </Text>
          <Text style={[styles.achievementDescription, !isCompleted && styles.lockedText]}>
            {item.description}
          </Text>
          <Text style={[styles.achievementPoints, !isCompleted && styles.lockedText]}>
            +{item.points} points
          </Text>
        </View>
        {isCompleted && (
          <MaterialCommunityIcons
            name="check-circle"
            size={24}
            color="#10B981"
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
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Achievements</Text>
          
          <View style={styles.currentTierSection}>
            <TierBadge tierName={currentTier.name} size="large" showName={false} />
            <Text style={styles.currentTierName}>{currentTier.name}</Text>
            <Text style={styles.currentTierSubtitle}>
              {totalRecycles} recycling orders completed
            </Text>
          </View>
          
          {nextTier && (
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressText}>
                  Progress to {nextTier.name}
                </Text>
                <Text style={styles.progressNumbers}>
                  {totalRecycles}/{nextTier.minRecycles}
                </Text>
              </View>
              <ProgressBar
                progress={progress}
                colors={['rgba(255,255,255,0.8)', 'white']}
                height={12}
              />
              <Text style={styles.ordersNeeded}>
                {nextTier.minRecycles - totalRecycles} more orders to unlock
              </Text>
            </View>
          )}
        </LinearGradient>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="leaf" size={24} color="#10B981" />
              <Text style={styles.statNumber}>{environmentalImpact.co2Saved}kg</Text>
              <Text style={styles.statLabel}>CO₂ Saved</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="tree" size={24} color="#10B981" />
              <Text style={styles.statNumber}>{environmentalImpact.treesEquivalent}</Text>
              <Text style={styles.statLabel}>Trees Planted</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="water" size={24} color="#3B82F6" />
              <Text style={styles.statNumber}>{environmentalImpact.waterSaved}L</Text>
              <Text style={styles.statLabel}>Water Saved</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="flash" size={24} color="#F59E0B" />
              <Text style={styles.statNumber}>{environmentalImpact.energySaved}</Text>
              <Text style={styles.statLabel}>kWh Saved</Text>
            </View>
          </View>
        </View>

        {/* Tiers Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Tiers</Text>
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
          <Text style={styles.sectionTitle}>Milestones</Text>
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
                  <Text style={styles.modalTitle}>{selectedTier.name}</Text>
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.modalBody}>
                  <Text style={styles.modalSectionTitle}>Benefits</Text>
                  <View style={styles.benefitsList}>
                    <View style={styles.benefitItem}>
                      <MaterialCommunityIcons name="gift" size={20} color="#10B981" />
                      <Text style={styles.benefitText}>
                        +{selectedTier.bonusPerOrder} points per recycling order
                      </Text>
                    </View>
                    <View style={styles.benefitItem}>
                      <MaterialCommunityIcons name="star" size={20} color="#F59E0B" />
                      <Text style={styles.benefitText}>
                        {selectedTier.bonusPerReachedTier} bonus points when tier is reached
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.modalSectionTitle}>Requirements</Text>
                  <Text style={styles.requirementDescription}>
                    Complete {selectedTier.minRecycles === 0 ? '0-4' : `${selectedTier.minRecycles}+`} recycling orders
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
  backButtonText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
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
  },
  currentTierSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
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
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
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
  achievementInfo: {
    flex: 1,
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
  },
  modalCloseButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 4,
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
  benefitText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
  requirementDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});

export default AchievementsScreen;
