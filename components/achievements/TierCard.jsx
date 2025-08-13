import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getTierColors, getTierIcon } from '../../utils/tiers';

const TierCard = ({ tier, isCurrentTier = false, isUnlocked = false, onPress }) => {
  const colors = getTierColors(tier.name);
  const icon = getTierIcon(tier.name);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isCurrentTier && styles.currentTierContainer,
        !isUnlocked && styles.lockedContainer
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={isUnlocked ? colors.gradient : ['#E5E7EB', '#F3F4F6']}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {isCurrentTier && (
          <View style={styles.currentBadge}>
            <Text style={styles.currentBadgeText}>CURRENT</Text>
          </View>
        )}
        
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name={icon}
            size={32}
            color={isUnlocked ? 'white' : '#9CA3AF'}
          />
        </View>
        
        <Text style={[
          styles.tierName,
          { color: isUnlocked ? 'white' : '#6B7280' }
        ]}>
          {tier.name}
        </Text>
        
        <View style={styles.benefitsContainer}>
          <View style={styles.benefitRow}>
            <MaterialCommunityIcons
              name="gift-outline"
              size={14}
              color={isUnlocked ? 'rgba(255,255,255,0.8)' : '#9CA3AF'}
            />
            <Text style={[
              styles.benefitText,
              { color: isUnlocked ? 'rgba(255,255,255,0.8)' : '#9CA3AF' }
            ]}>
              +{tier.bonusPerOrder} pts/order
            </Text>
          </View>
          
          <View style={styles.benefitRow}>
            <MaterialCommunityIcons
              name="star-outline"
              size={14}
              color={isUnlocked ? 'rgba(255,255,255,0.8)' : '#9CA3AF'}
            />
            <Text style={[
              styles.benefitText,
              { color: isUnlocked ? 'rgba(255,255,255,0.8)' : '#9CA3AF' }
            ]}>
              {tier.bonusPerReachedTier} pts bonus
            </Text>
          </View>
        </View>
        
        <Text style={[
          styles.requirementText,
          { color: isUnlocked ? 'rgba(255,255,255,0.6)' : '#9CA3AF' }
        ]}>
          {tier.minRecycles === 0 
            ? `${tier.maxRecycles + 1} orders` 
            : `${tier.minRecycles}+ orders`}
        </Text>
        
        {!isUnlocked && (
          <View style={styles.lockOverlay}>
            <MaterialCommunityIcons
              name="lock"
              size={20}
              color="#9CA3AF"
            />
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  currentTierContainer: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  lockedContainer: {
    opacity: 0.7,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    minHeight: 160,
    justifyContent: 'space-between',
    position: 'relative',
  },
  currentBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  currentBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  tierName: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  benefitsContainer: {
    marginBottom: 8,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  benefitText: {
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '500',
  },
  requirementText: {
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '500',
  },
  lockOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    padding: 4,
  },
});

export default TierCard;
