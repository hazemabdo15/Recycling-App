import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { clearSession, getLoggedInUser } from '../../utils/authUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const scale = (size) => (SCREEN_WIDTH / 375) * size;

const Header = () => {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const { colors, typography } = useThemedStyles();

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
            await clearSession();
            router.replace('/login');
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    const styles = getStyles(colors, typography);

    return (
        <View style={[styles.header, { paddingHorizontal: scale(20), paddingVertical: scale(15) }]}> 
            <View style={styles.brandContainer}>
                <MaterialCommunityIcons name="recycle" size={scale(28)} color={colors.primary} />
                <Text style={[styles.brandText, { fontSize: scale(20), marginLeft: scale(8) }]}>Karakeeb</Text>
            </View>
            <View style={[styles.headerRight, { gap: scale(12) }]}> 
                <TouchableOpacity style={[styles.headerButton, { width: scale(40), height: scale(40), borderRadius: scale(12) }]}> 
                    <MaterialCommunityIcons name="bell-outline" size={scale(24)} color={colors.text} />
                </TouchableOpacity>
                {user ? (
                        <Pressable style={[styles.headerButton, { width: scale(40), height: scale(40), borderRadius: scale(12) }]} onPress={handleLogoutPress}>
                            <Ionicons name="log-out" size={scale(24)} color={colors.error} />
                        </Pressable>
                    ) : (
                        <Pressable style={[styles.headerButton, { width: scale(40), height: scale(40), borderRadius: scale(12) }]} onPress={handleLoginPress}>
                            <Ionicons name="log-in" size={scale(24)} color={colors.text} />
                        </Pressable>
                )}
            </View>
        </View>
    );
};
const getStyles = (colors, typography) => StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.background,
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
        backgroundColor: colors.headerButtonBg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerRight: {
        flexDirection: 'row',
    },
});
export default Header;