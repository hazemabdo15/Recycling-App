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

const ProfileHeader = ({ name = "John Doe", email = "john.doe@email.com", points = 1250, level = "Eco Warrior" }) => {
    return (
        <View style={styles.container}>
            <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                    <MaterialCommunityIcons name="account" size={60} color={colors.white} />
                </View>
                <TouchableOpacity style={styles.editButton}>
                    <MaterialCommunityIcons name="pencil" size={16} color={colors.primary} />
                </TouchableOpacity>
            </View>

            <Text style={styles.name}>{name}</Text>
            <Text style={styles.email}>{email}</Text>
            
            <View style={styles.levelBadge}>
                <MaterialCommunityIcons name="leaf" size={16} color={colors.primary} />
                <Text style={styles.levelText}>{level}</Text>
            </View>

            <View style={styles.pointsContainer}>
                <MaterialCommunityIcons name="star-circle" size={20} color={colors.accent} />
                <Text style={styles.pointsText}>{points.toLocaleString()} Points</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: 24,
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
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.black,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    editButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.black,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    name: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.black,
        marginBottom: 4,
    },
    email: {
        fontSize: 16,
        color: colors.neutral,
        marginBottom: 16,
    },
    levelBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.base100,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: borderRadius.xl,
        marginBottom: 12,
    },
    levelText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.primary,
        marginLeft: 6,
    },
    pointsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pointsText: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.black,
        marginLeft: 6,
    },
});

export default ProfileHeader;
