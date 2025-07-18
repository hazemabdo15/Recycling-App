import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

const ProfileMenu = ({ onItemPress }) => {
    const menuItems = [
        {
            id: 'edit-profile',
            icon: 'account-edit',
            title: 'Edit Profile',
            subtitle: 'Update your personal information',
            color: colors.primary,
        },
        {
            id: 'recycling-history',
            icon: 'history',
            title: 'Recycling History',
            subtitle: 'View your past recycling activities',
            color: colors.secondary,
        },
        {
            id: 'achievements',
            icon: 'trophy',
            title: 'Achievements',
            subtitle: 'See your recycling milestones',
            color: colors.accent,
        },
        {
            id: 'notifications',
            icon: 'bell',
            title: 'Notifications',
            subtitle: 'Manage your notification settings',
            color: '#3B82F6',
        },
        {
            id: 'help',
            icon: 'help-circle',
            title: 'Help & Support',
            subtitle: 'Get help and contact support',
            color: '#8B5CF6',
        },
        {
            id: 'settings',
            icon: 'cog',
            title: 'Settings',
            subtitle: 'App preferences and privacy',
            color: colors.neutral,
        },
    ];

    const handleItemPress = (item) => {
        onItemPress?.(item);
        console.log(`Pressed: ${item.title}`);
    };

    return (
        <View style={styles.container}>
            {menuItems.map((item, index) => (
                <TouchableOpacity
                    key={item.id}
                    style={[
                        styles.menuItem,
                        index === menuItems.length - 1 && styles.lastMenuItem
                    ]}
                    onPress={() => handleItemPress(item)}
                    activeOpacity={0.7}
                >
                    <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
                        <MaterialCommunityIcons 
                            name={item.icon} 
                            size={24} 
                            color={item.color} 
                        />
                    </View>
                    
                    <View style={styles.textContainer}>
                        <Text style={styles.title}>{item.title}</Text>
                        <Text style={styles.subtitle}>{item.subtitle}</Text>
                    </View>
                    
                    <MaterialCommunityIcons 
                        name="chevron-right" 
                        size={20} 
                        color={colors.base300} 
                    />
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        marginHorizontal: 16,
        marginBottom: 16,
        shadowColor: colors.black,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.base100,
    },
    lastMenuItem: {
        borderBottomWidth: 0,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: borderRadius.sm,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.black,
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 14,
        color: colors.neutral,
        lineHeight: 18,
    },
});

export default ProfileMenu;
