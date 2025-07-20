import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, TouchableOpacity, View } from 'react-native';
import { profileHeaderStyles } from '../../styles/components/profileHeaderStyles';
import { colors } from '../../styles/theme';
const ProfileHeader = ({ name = "John Doe", email = "john.doe@email.com", points = 1250, level = "Eco Warrior" }) => {
    return (
        <View style={profileHeaderStyles.container}>
            <View style={profileHeaderStyles.avatarContainer}>
                <View style={profileHeaderStyles.avatar}>
                    <MaterialCommunityIcons name="account" size={60} color={colors.white} />
                </View>
                <TouchableOpacity style={profileHeaderStyles.editButton}>
                    <MaterialCommunityIcons name="pencil" size={16} color={colors.primary} />
                </TouchableOpacity>
            </View>
            <Text style={profileHeaderStyles.name}>{name}</Text>
            <Text style={profileHeaderStyles.email}>{email}</Text>
            <View style={profileHeaderStyles.levelBadge}>
                <MaterialCommunityIcons name="leaf" size={16} color={colors.primary} />
                <Text style={profileHeaderStyles.levelText}>{level}</Text>
            </View>
            <View style={profileHeaderStyles.pointsContainer}>
                <MaterialCommunityIcons name="star-circle" size={20} color={colors.accent} />
                <Text style={profileHeaderStyles.pointsText}>{points.toLocaleString()} Points</Text>
            </View>
        </View>
    );
};
export default ProfileHeader;

