import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
const borderRadius = {
  xs: 6,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
};
const colors = {
  primary: "#0E9F6E",
  secondary: "#8BC34A", 
  accent: "#FFC107",
  neutral: "#607D8B",
  base100: "#F8FFFE",
  base300: "#E0E0E0",
  white: "#ffffff",
  black: "#171717",
};
const StatsCard = () => {
    const stats = [
        {
            icon: "recycle",
            title: "Items Recycled",
            value: "142",
            color: colors.primary,
        },
        {
            icon: "earth",
            title: "CO₂ Saved",
            value: "89 kg",
            color: colors.secondary,
        },
        {
            icon: "water",
            title: "Water Saved",
            value: "234 L",
            color: "#3B82F6",
        },
        {
            icon: "tree",
            title: "Trees Saved",
            value: "12",
            color: colors.accent,
        },
    ];
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Your Impact</Text>
            <View style={styles.statsGrid}>
                {stats.map((stat, index) => (
                    <View key={index} style={styles.statItem}>
                        <View style={[styles.iconContainer, { backgroundColor: `${stat.color}15` }]}>
                            <MaterialCommunityIcons 
                                name={stat.icon} 
                                size={24} 
                                color={stat.color} 
                            />
                        </View>
                        <Text style={styles.statValue}>{stat.value}</Text>
                        <Text style={styles.statTitle}>{stat.title}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};
const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 20,
        shadowColor: colors.black,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.black,
        marginBottom: 16,
        textAlign: 'center',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    statItem: {
        width: '48%',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: borderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.black,
        marginBottom: 4,
    },
    statTitle: {
        fontSize: 12,
        color: colors.neutral,
        textAlign: 'center',
        lineHeight: 16,
    },
});
export default StatsCard;

