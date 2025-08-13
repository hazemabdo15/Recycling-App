import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { getTierColors, getTierIcon } from '../../utils/tiers';

const TierBadge = ({ tierName, size = 'medium', showName = true, style }) => {
  const colors = getTierColors(tierName);
  const icon = getTierIcon(tierName);
  
  const badgeSize = {
    small: 30,
    medium: 40,
    large: 60
  };
  
  const iconSize = {
    small: 16,
    medium: 20,
    large: 28
  };
  
  const textSize = {
    small: 10,
    medium: 12,
    large: 14
  };

  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={colors.gradient}
        style={[
          styles.badge,
          {
            width: badgeSize[size],
            height: badgeSize[size],
            borderRadius: badgeSize[size] / 2,
          }
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <MaterialCommunityIcons
          name={icon}
          size={iconSize[size]}
          color="white"
        />
      </LinearGradient>
      {showName && (
        <Text style={[styles.tierName, { fontSize: textSize[size] }]}>
          {tierName}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tierName: {
    marginTop: 4,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
});

export default TierBadge;
