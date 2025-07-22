import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity, View, Pressable} from 'react-native';
import { colors } from '../../styles/theme';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLoggedInUser } from '../../utils/authUtils';
import { useEffect, useState } from 'react';

const Header = () => {
    const router = useRouter();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const loadUser = async () => {
            const user = await getLoggedInUser();
            setUser(user);
            console.log('Header user:', user);
        };
        loadUser();
    }, []);


    const handleLoginPress = () => {
        router.push('/login');
    };

    const handleLogoutPress = async () => {
        try {
            await AsyncStorage.multiRemove(['accessToken', 'user']);
            router.replace('/login');
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    return (
        <View style={styles.header}>
            <TouchableOpacity style={styles.headerButton}>
                <Ionicons name="menu" size={24} color="#333" />
            </TouchableOpacity>
            <View style={styles.headerRight}>
                <TouchableOpacity style={styles.headerButton}>
                    <Ionicons name="notifications-outline" size={24} color="#333" />
                </TouchableOpacity>
                {user ? (
                        <Pressable style={styles.headerButton} onPress={handleLogoutPress}>
                            <Ionicons name="log-out" size={24} color={colors.error} />
                        </Pressable>
                    ) : (
                        <Pressable style={styles.headerButton} onPress={handleLoginPress}>
                            <Ionicons name="log-in" size={24} color="#333" />
                        </Pressable>
                )}
                </View>
        </View>
    );
};
const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: colors.base100,
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerRight: {
        flexDirection: 'row',
        gap: 12,
    },
});
export default Header;