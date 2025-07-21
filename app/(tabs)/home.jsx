import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EarnPointsCard } from '../../components/cards';
import { Header } from '../../components/common';
import { CategoriesSection, TopRecycledSection } from '../../components/sections';
import { colors } from '../../styles/theme';
const Index = () => {
    const insets = useSafeAreaInsets();
    const headerOpacity = useSharedValue(0);
    const contentTranslateY = useSharedValue(50);
    const contentOpacity = useSharedValue(0);
    useFocusEffect(useCallback(() => {
        headerOpacity.value = withTiming(1, { duration: 600 });
        setTimeout(() => {
            contentOpacity.value = withTiming(1, { duration: 800 });
            contentTranslateY.value = withSpring(0, {
                damping: 15,
                stiffness: 100,
            });
        }, 200);
        return () => {
        };
    }, [headerOpacity, contentOpacity, contentTranslateY]));
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
    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            <Animated.View style={[styles.headerContainer, headerAnimatedStyle]}>
                <Header />
            </Animated.View>
            <Animated.ScrollView
                style={[styles.content, contentAnimatedStyle]}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <EarnPointsCard />
                <TopRecycledSection />
                <CategoriesSection />
            </Animated.ScrollView>
        </View>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.base100,
    },
    headerContainer: {
        backgroundColor: colors.base100,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    scrollContent: {
        paddingBottom: 120,
    },
})
export default Index;