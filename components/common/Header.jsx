import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, typography } from '../../styles/theme';
import { getLoggedInUser } from '../../utils/authUtils';

const Header = () => {
    const router = useRouter();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const loadUser = async () => {
            const user = await getLoggedInUser();
            setUser(user);
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
            <View style={styles.brandContainer}>
                <MaterialCommunityIcons name="recycle" size={28} color={colors.primary} />
                <Text style={styles.brandText}>EcoPickup</Text>
            </View>
            <View style={styles.headerRight}>
                <TouchableOpacity style={styles.headerButton}>
                    <MaterialCommunityIcons name="bell-outline" size={24} color="#333" />
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
    brandContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    brandText: {
        ...typography.title,
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.primary,
        marginLeft: 8,
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