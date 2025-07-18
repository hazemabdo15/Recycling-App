import { useState } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CategoriesGrid from '../../components/CategoriesGrid';
import SearchBar from '../../components/SearchBar';

const colors = {
  primary: "#0E9F6E",
  secondary: "#8BC34A", 
  accent: "#FFC107",
  neutral: "#607D8B",
  base100: "#F8FFFE", 
  base300: "#E0E0E0",
  white: "#ffffff",
  black: "#171717",
};

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
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            
            <View style={styles.header}>
                <Text style={styles.title}>Explore Categories</Text>
                <Text style={styles.subtitle}>Find the right recycling category for your items</Text>
            </View>

            <View style={styles.content}>
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.base100,
        paddingBottom: 20,
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.base300,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.black,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: colors.neutral,
        lineHeight: 22,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
});

export default Explore;
