import { useEffect } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EarnPointsCard } from '../../components/cards';
import { Header } from '../../components/common';
import { CategoriesSection, TopRecycledSection } from '../../components/sections';

const Index = () => {
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
    
    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content"/>
            <Animated.View style={[styles.headerContainer, { paddingTop: insets.top }, headerAnimatedStyle]}>
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
        backgroundColor: '#F8F9FA',
    },
    headerContainer: {
        backgroundColor: '#fff',
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
