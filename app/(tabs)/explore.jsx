import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { StatusBar, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CategoriesGrid } from '../../components/sections';
import { SearchBar } from '../../components/ui';
import { exploreStyles } from '../../styles/components/exploreStyles';
const Explore = () => {
    const [searchText, setSearchText] = useState('');
    const [filteredCount, setFilteredCount] = useState(0);
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
    const handleSearch = (text) => {
        setSearchText(text);
    };
    const handleFilter = () => {
        console.log('Filter button pressed');
    };
    const handleCategoryPress = (category) => {
        console.log(`Navigate to ${category.name} details`);
        router.push({
            pathname: '/category-details',
            params: { categoryName: category.name }
        });
    };
    const handleFilteredCountChange = (count) => {
        setFilteredCount(count);
    };
    return (
        <Animated.View style={[exploreStyles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            <Animated.View style={[exploreStyles.header, headerAnimatedStyle]}>
                <Text style={exploreStyles.title}>Explore Categories</Text>
                <Text style={exploreStyles.subtitle}>
                    {searchText ? `${filteredCount} categories found` : 'Find the right recycling category for your items'}
                </Text>
            </Animated.View>
            <Animated.ScrollView
                style={[exploreStyles.content, contentAnimatedStyle]}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
            >
                <SearchBar
                    placeholder="Search categories..."
                    onSearch={handleSearch}
                    onFilter={handleFilter}
                />
                <CategoriesGrid
                    searchText={searchText}
                    onCategoryPress={handleCategoryPress}
                    onFilteredCountChange={handleFilteredCountChange}
                />
            </Animated.ScrollView>
        </Animated.View>
    );
};
export default Explore;