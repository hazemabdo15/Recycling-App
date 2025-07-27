import { Image, Text, View } from 'react-native';
import { colors } from '../../styles/theme';

const UserAvatar = ({ user, size = 40 }) => {
    const getInitials = (name) => {
        if (!name) return '?';
        const names = name.split(' ');
        let initials = names[0].substring(0, 1).toUpperCase();
        if (names.length > 1) {
            initials += names[names.length - 1].substring(0, 1).toUpperCase();
        }
        return initials;
    };

    if (user?.profileImage) {
        return (
            <Image
                source={{ uri: user.profileImage }}
                style={{
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: colors.base200,
                }}
            />
        );
    }

    return (
        <View
            style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: colors.primary,
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: size * 0.4 }}>
                {getInitials(user?.name)}
            </Text>
        </View>
    );
};

export default UserAvatar;