import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
const colors = {
  primary: "#0E9F6E",
  secondary: "#8BC34A",
  accent: "#FFC107",
  neutral: "#607D8B",
  base100: "#F8F9FA",
  base300: "#E0E0E0",
  white: "#ffffff",
  black: "#171717",
};
const borderRadius = {
  xs: 6,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
};
const TopRecycledSection = memo(() => {
    const topItems = [
        {
            id: 1,
            name: 'Plastic Bottles',
            iconName: 'bottle-soda',
            iconColor: '#FF69B4',
            recycleCount: '2.3M',
            points: '+15 pts'
        },
        {
            id: 2,
            name: 'Aluminum Cans',
            iconName: 'cup',
            iconColor: '#9E9E9E',
            recycleCount: '1.8M',
            points: '+12 pts'
        },
        {
            id: 3,
            name: 'Cardboard',
            iconName: 'package-variant',
            iconColor: '#8BC34A',
            recycleCount: '1.5M',
            points: '+10 pts'
        },
        {
            id: 4,
            name: 'Glass Jars',
            iconName: 'glass-fragile',
            iconColor: '#4FC3F7',
            recycleCount: '1.2M',
            points: '+18 pts'
        },
        {
            id: 5,
            name: 'Paper',
            iconName: 'file-document',
            iconColor: '#FF9800',
            recycleCount: '980K',
            points: '+8 pts'
        },
    ];
    const handleItemPress = (item) => {
        console.log(`${item.name} pressed`);
    };
    return (
        <View style={styles.section}>
            <View style={styles.headerContainer}>
            </View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContainer}
            >
                {topItems.map((item, index) => (
                    <TouchableOpacity
                        key={item.id}
                        style={[
                            styles.itemCard,
                            index === topItems.length - 1 && { marginRight: 0 }
                        ]}
                        onPress={() => handleItemPress(item)}
                        activeOpacity={0.8}
                    >
                        <View style={styles.rankBadge}>
                            <Text style={styles.rankText}>#{index + 1}</Text>
                        </View>
                        <View style={styles.iconContainer}>
                            <MaterialCommunityIcons
                                name={item.iconName}
                                size={28}
                                color={item.iconColor}
                            />
                        </View>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <View style={styles.statsContainer}>
                            <View style={styles.statItem}>
                                <MaterialCommunityIcons
                                    name="recycle"
                                    size={14}
                                    color={colors.primary}
                                />
                                <Text style={styles.recycleCount}>{item.recycleCount}</Text>
                            </View>
                            <View style={styles.pointsBadge}>
                                <Text style={styles.pointsText}>{item.points}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
});

TopRecycledSection.displayName = 'TopRecycledSection';
const styles = StyleSheet.create({
    section: {
        marginBottom: 15,
        paddingBottom: 8,
        marginHorizontal: -20,
        paddingHorizontal: 20,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 0,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.primary,
        letterSpacing: -0.3,
        lineHeight: 22,
        marginBottom: 0,
    },
    scrollContainer: {
        paddingLeft: 20,
        paddingRight: 20,
        paddingBottom: 10,
    },
    itemCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: borderRadius.lg,
        padding: 16,
        marginRight: 15,
        width: 150,
        minHeight: 160,
        shadowColor: colors.black,
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    rankBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: colors.primary,
        borderRadius: borderRadius.xs,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    rankText: {
        color: colors.white,
        fontSize: 10,
        fontWeight: 'bold',
    },
    iconContainer: {
        alignItems: 'center',
        marginVertical: 12,
    },
    itemName: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.black,
        textAlign: 'center',
        marginBottom: 12,
        lineHeight: 18,
    },
    statsContainer: {
        gap: 8,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    recycleCount: {
        fontSize: 12,
        color: colors.neutral,
        fontWeight: '500',
    },
    pointsBadge: {
        backgroundColor: colors.accent + '20',
        borderRadius: borderRadius.sm,
        paddingHorizontal: 8,
        paddingVertical: 4,
        alignItems: 'center',
    },
    pointsText: {
        fontSize: 11,
        color: colors.accent,
        fontWeight: 'bold',
    },
});
export default TopRecycledSection;