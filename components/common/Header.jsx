import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity, View, Pressable} from 'react-native';
import { colors } from '../../styles/theme';
import { useRouter } from 'expo-router';

const Header = () => {
    const router = useRouter();

    const handleLoginPress = () => {
        router.push('/login');
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
                <Pressable style={styles.headerButton}>
                    <Ionicons name="log-in" size={24} color="#333" onPress={handleLoginPress}/>
                </Pressable>
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