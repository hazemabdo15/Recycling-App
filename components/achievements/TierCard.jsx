import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalization } from '../../context/LocalizationContext';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { getTierColors, getTierIcon } from '../../utils/tiers';

const TierCard = ({ tier, isCurrentTier = false, isUnlocked = false, onPress }) => {
  const { t } = useLocalization();
  const { colors } = useThemedStyles();
  const styles = getStyles(colors);
  const tierColors = getTierColors(tier.name);
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
        colors={isUnlocked ? tierColors.gradient : [colors.achievementCardBg, colors.achievementCardBg]}
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
            color={isUnlocked ? 'white' : colors.textSecondary}
          />
        </View>
        
        <Text style={[
          styles.tierName,
          { color: isUnlocked ? 'white' : colors.text }
        ]}>
          {t(`tiers.${tier.name}`, tier.name)}
        </Text>
        
        <View style={styles.benefitsContainer}>
          <View style={styles.benefitRow}>
            <MaterialCommunityIcons
              name="gift-outline"
              size={14}
              color={isUnlocked ? 'rgba(255,255,255,0.8)' : colors.textSecondary}
            />
            <Text style={[
              styles.benefitText,
              { color: isUnlocked ? 'rgba(255,255,255,0.8)' : colors.textSecondary }
            ]}>
              +{tier.bonusPerOrder} {t("units.pointsPerOrder")}
            </Text>
          </View>
          
          <View style={styles.benefitRow}>
            <MaterialCommunityIcons
              name="star-outline"
              size={14}
              color={isUnlocked ? 'rgba(255,255,255,0.8)' : colors.textSecondary}
            />
            <Text style={[
              styles.benefitText,
              { color: isUnlocked ? 'rgba(255,255,255,0.8)' : colors.textSecondary }
            ]}>
              {tier.bonusPerReachedTier} {t("units.pointsBonus")}
            </Text>
          </View>
        </View>
        
        <Text style={[
          styles.requirementText,
          { color: isUnlocked ? 'rgba(255,255,255,0.6)' : colors.textSecondary }
        ]}>
          {tier.minRecycles === 0 
            ? `${tier.maxRecycles + 1} ${t("units.orders")}` 
            : `${tier.minRecycles}+ ${t("units.orders")}`}
        </Text>
        
        {!isUnlocked && (
          <View style={styles.lockOverlay}>
            <MaterialCommunityIcons
              name="lock"
              size={20}
              color={colors.textSecondary}
            />
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    margin: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  currentTierContainer: {
    shadowColor: colors.text,
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
    backgroundColor: colors.achievementCardBg,
    borderRadius: 12,
    padding: 4,
  },
});

export default TierCard;
