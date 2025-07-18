import { useEffect } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProfileHeader, ProfileMenu, StatsCard } from '../../components/profile';
import { colors } from '../../styles/theme';

const Profile = () => {
    const insets = useSafeAreaInsets();
    
    const headerOpacity = useSharedValue(0);
    const contentTranslateY = useSharedValue(50);
    const contentOpacity = useSharedValue(0);

    useEffect(() => {
        headerOpacity.value = withTiming(1, { duration: 600 });
        
        setTimeout(() => {
            contentOpacity.value = withTiming(1, { duration: 800 });
            contentTranslateY.value = withSpring(0, {
                damping: 15,
                stiffness: 100,
            });
        }, 200);
    }, [headerOpacity, contentOpacity, contentTranslateY]);

    const headerAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity: headerOpacity.value,
        };
    });

    const contentAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity: contentOpacity.value,
            transform: [{ translateY: contentTranslateY.value }],
        };
    });

    const handleMenuItemPress = (item) => {
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
                        name="Hazem"
                        email="hazem@gmail.com"
                        points={2847}
                        level="Eco Champion"
                    />
                </Animated.View>
                
                <StatsCard />
                
                <ProfileMenu onItemPress={handleMenuItemPress} />
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
