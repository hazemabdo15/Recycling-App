import { Ionicons } from '@expo/vector-icons';
import { router, useNavigation, usePathname } from 'expo-router';
import { createContext, useContext, useState, useEffect, useRef} from 'react';
import { StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { colors } from '../styles';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const pathname = usePathname();
    const [modalOpen, setModalOpen] = useState(false);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const hiddenPaths = ['/chat-modal', '/login', '/register'];
        setModalOpen(hiddenPaths.includes(pathname));
    }, [pathname]);

    useEffect(() => {
        const pulse = () => {
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ]).start(() => pulse());
        };
        
        pulse();
        return () => pulseAnim.stopAnimation();
    }, []);

    const openChat = () => {
        Animated.sequence([
            Animated.timing(pulseAnim, {
                toValue: 0.9,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start(() => router.push('/chat-modal'));
    };

    return (
        <ChatContext.Provider value={{ openChat }}>
            {children}
            {!modalOpen && (
                <Animated.View style={[
                    styles.fab,
                    { transform: [{ scale: pulseAnim }] }
                ]}>
                    <TouchableOpacity
                        onPress={openChat}
                        activeOpacity={0.7}
                        style={styles.touchable}
                    >
                        <MaterialCommunityIcons name="robot-outline" size={24} color="white" />
                    </TouchableOpacity>
                </Animated.View>
            )}
        </ChatContext.Provider>
    );
};

export const useChat = () => useContext(ChatContext);

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        bottom: 130,
        right: 20,
        backgroundColor: colors.primary,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        zIndex: 1000,
    },
    touchable: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
});