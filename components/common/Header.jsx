import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, typography } from '../../styles/theme';
import { getLoggedInUser } from '../../utils/authUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const scale = (size) => (SCREEN_WIDTH / 375) * size;

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
        <View style={[styles.header, { paddingHorizontal: scale(20), paddingVertical: scale(15) }]}> 
            <View style={styles.brandContainer}>
                <MaterialCommunityIcons name="recycle" size={scale(28)} color={colors.primary} />
                <Text style={[styles.brandText, { fontSize: scale(20), marginLeft: scale(8) }]}>EcoPickup</Text>
            </View>
            <View style={[styles.headerRight, { gap: scale(12) }]}> 
                <TouchableOpacity style={[styles.headerButton, { width: scale(40), height: scale(40), borderRadius: scale(12) }]}> 
                    <MaterialCommunityIcons name="bell-outline" size={scale(24)} color="#333" />
                </TouchableOpacity>
                {user ? (
                        <Pressable style={[styles.headerButton, { width: scale(40), height: scale(40), borderRadius: scale(12) }]} onPress={handleLogoutPress}>
                            <Ionicons name="log-out" size={scale(24)} color={colors.error} />
                        </Pressable>
                    ) : (
                        <Pressable style={[styles.headerButton, { width: scale(40), height: scale(40), borderRadius: scale(12) }]} onPress={handleLoginPress}>
                            <Ionicons name="log-in" size={scale(24)} color="#333" />
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
        backgroundColor: colors.base100,
    },
    brandContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    brandText: {
        ...typography.title,
        fontWeight: 'bold',
        color: colors.primary,
    },
    headerButton: {
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerRight: {
        flexDirection: 'row',
    },
});
export default Header;