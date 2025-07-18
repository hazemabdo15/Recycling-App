import { useState } from 'react';
import { StatusBar, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CategoriesGrid } from '../../components/sections';
import { SearchBar } from '../../components/ui';
import { exploreStyles } from '../../styles/components/exploreStyles';

const Explore = () => {
    const [searchText, setSearchText] = useState('');
    const insets = useSafeAreaInsets();

    const handleSearch = (text) => {
        setSearchText(text);
    };

    const handleFilter = () => {
        console.log('Filter button pressed');
    };

    const handleCategoryPress = (category) => {
        console.log(`Navigate to ${category.title} details`);
    };

    return (
        <View style={[exploreStyles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            
            <View style={exploreStyles.header}>
                <Text style={exploreStyles.title}>Explore Categories</Text>
                <Text style={exploreStyles.subtitle}>Find the right recycling category for your items</Text>
            </View>

            <View style={exploreStyles.content}>
                <SearchBar 
                    placeholder="Search categories..."
                    onSearch={handleSearch}
                    onFilter={handleFilter}
                />
                
                <CategoriesGrid 
                    searchText={searchText}
                    onCategoryPress={handleCategoryPress}
                />
            </View>
        </View>
    );
};

export default Explore;
