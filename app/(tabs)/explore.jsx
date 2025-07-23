import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StatusBar, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabScreenWrapper } from '../../components/common';
import { CategoriesGrid } from '../../components/sections';
import { SearchBar } from '../../components/ui';
import { exploreStyles } from '../../styles/components/exploreStyles';

const Explore = () => {
    const [searchText, setSearchText] = useState('');
    const [filteredCount, setFilteredCount] = useState(0);
    const insets = useSafeAreaInsets();

    useFocusEffect(useCallback(() => {

        return () => {
        };
    }, []));

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
        <TabScreenWrapper>
            <View style={[exploreStyles.container, { paddingTop: insets.top }]}>
                <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
                <View style={[exploreStyles.header]}>
                    <Text style={exploreStyles.title}>🔍 What Can You Recycle?</Text>
                    <Text style={exploreStyles.subtitle}>
                        {searchText ? `${filteredCount} categories found` : 'Browse materials and find what you can recycle at home'}
                    </Text>
                </View>
                <ScrollView
                    style={[exploreStyles.content]}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 120 }}
                >
                    <SearchBar
                        placeholder="Search recyclable materials..."
                        onSearch={handleSearch}
                        onFilter={handleFilter}
                    />
                    <CategoriesGrid
                        searchText={searchText}
                        onCategoryPress={handleCategoryPress}
                        onFilteredCountChange={handleFilteredCountChange}
                    />
                </ScrollView>
            </View>
        </TabScreenWrapper>
    );
};
export default Explore;