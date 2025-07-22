import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProfileHeader, ProfileMenu, StatsCard } from '../../components/profile';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../styles/theme';
import { getLoggedInUser } from '../../utils/authUtils';

let Animated, useAnimatedStyle, useSharedValue, withSpring, withTiming;

try {
  const reanimated = require('react-native-reanimated');
  Animated = reanimated.default;
  useAnimatedStyle = reanimated.useAnimatedStyle;
  useSharedValue = reanimated.useSharedValue;
  withSpring = reanimated.withSpring;
  withTiming = reanimated.withTiming;
} catch (_error) {
  const { View: RNView } = require('react-native');
  Animated = { View: RNView };
  useAnimatedStyle = () => ({});
  useSharedValue = (value) => ({ value });
  withSpring = (value) => value;
  withTiming = (value) => value;
} 

const Profile = () => {
    const insets = useSafeAreaInsets();
    const headerOpacity = useSharedValue(0);
    const contentTranslateY = useSharedValue(50);
    const contentOpacity = useSharedValue(0);
    const { setUser } = useAuth();

    const [loggedUser, setloggedUser] = useState(null);

    useFocusEffect(
        useCallback(() => {
            const loadUser = async () => {
                const user = await getLoggedInUser();
                setloggedUser(user);
                console.log('Header user:', user);
            };

            loadUser();

            headerOpacity.value = withTiming(1, { duration: 600 });
            setTimeout(() => {
                contentOpacity.value = withTiming(1, { duration: 800 });
                contentTranslateY.value = withSpring(0, {
                    damping: 15,
                    stiffness: 100,
                });
            }, 200);

            return () => { };
        }, [])
    );

    const headerAnimatedStyle = useAnimatedStyle(() => ({
        opacity: headerOpacity.value,
    }));

    const contentAnimatedStyle = useAnimatedStyle(() => ({
        opacity: contentOpacity.value,
        transform: [{ translateY: contentTranslateY.value }],
    }));

    const handleMenuItemPress = (item) => {
        if (!loggedUser || loggedUser.isGuest) {
            console.log('Guest user cannot access this feature');
            return;
        }

        switch (item.id) {
            case 'edit-profile':
                console.log('Navigate to Edit Profile');
                break;
            case 'recycling-history':
                console.log('Navigate to Recycling History');
                break;
            case 'achievements':
                console.log('Navigate to Achievements');
                break;
            case 'notifications':
                console.log('Navigate to Notifications');
                break;
            case 'help':
                console.log('Navigate to Help & Support');
                break;
            case 'settings':
                console.log('Navigate to Settings');
                break;
            default:
                console.log('Unknown menu item');
        }
    };

    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem('accessToken');
            await AsyncStorage.removeItem('user');
            const token = await AsyncStorage.getItem('accessToken');
            const savedUser = await AsyncStorage.getItem('user');
            console.log('Still exists:', { token, savedUser });
            setUser(null);
            setloggedUser(null);
            router.replace('/login');
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    const isGuest = !loggedUser || loggedUser.isGuest;

    return (
        <Animated.View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            <Animated.ScrollView
                style={[styles.scrollView, contentAnimatedStyle]}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <Animated.View style={headerAnimatedStyle}>
                    <ProfileHeader
                        name={loggedUser?.name || 'Guest'}
                        email={loggedUser?.email || 'Not logged in'}
                        points={!isGuest ? 2847 : 0}
                        level={!isGuest ? 'Eco Champion' : 'Guest Mode'}
                    />
                </Animated.View>

                {!isGuest ? (
                    <>
                        <StatsCard />
                        <ProfileMenu onItemPress={handleMenuItemPress} />

                        <View style={{ alignItems: 'center', marginTop: 30 }}>
                            <Pressable
                                onPress={handleLogout}
                                style={{
                                    paddingVertical: 12,
                                    paddingHorizontal: 30,
                                    backgroundColor: 'red',
                                    borderRadius: 8,
                                }}
                            >
                                <Text style={{ color: 'white', fontSize: 16 }}>Log Out</Text>
                            </Pressable>
                        </View>
                    </>
                ) : (
                    <View style={{ marginTop: 40, alignItems: 'center' }}>
                        <Text style={{ fontSize: 16, textAlign: 'center' }}>
                            You are using a guest profile. Log in to track your progress and unlock features.
                        </Text>
                        <View style={{ marginTop: 20 }}>
                            <Pressable
                                onPress={() => router.replace('/login')}
                                style={{
                                    paddingVertical: 12,
                                    paddingHorizontal: 30,
                                    backgroundColor: colors.primary,
                                    borderRadius: 8,
                                }}
                            >
                                <Text style={{ color: 'white', fontSize: 16, textAlign: 'center' }}>
                                    Log In Now!
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                )}
            </Animated.ScrollView>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.base100,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingVertical: 20,
        paddingBottom: 130,
    },
});

export default Profile;
