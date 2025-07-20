import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
const colors = {
  primary: "#0E9F6E",
  secondary: "#8BC34A", 
  accent: "#FFC107",
  neutral: "#607D8B",
  base100: "#E8F5E9",
  base300: "#E0E0E0",
  white: "#ffffff",
  black: "#171717",
};
const borderRadius = {
  xs: 6,    
  sm: 12,   
  md: 18,   
  lg: 24,   
  xl: 32,   
};
const SearchBar = ({ placeholder = "Search categories...", onSearch, onFilter }) => {
  const [searchText, setSearchText] = useState('');
  const handleSearchChange = (text) => {
    setSearchText(text);
    if (onSearch) {
      onSearch(text);
    }
  };
  const clearSearch = () => {
    setSearchText('');
    if (onSearch) {
      onSearch('');
    }
  };
  return (
    <View style={styles.container}>
      <View style={styles.searchInputContainer}>
        <MaterialCommunityIcons 
          name="magnify" 
          size={20} 
          color={colors.neutral} 
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder}
          placeholderTextColor={colors.neutral}
          value={searchText}
          onChangeText={handleSearchChange}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <MaterialCommunityIcons 
              name="close-circle" 
              size={20} 
              color={colors.neutral}
            />
          </TouchableOpacity>
        )}
      </View>
      {onFilter && (
        <TouchableOpacity style={styles.filterButton} onPress={onFilter}>
          <MaterialCommunityIcons 
            name="filter-variant" 
            size={20} 
            color={colors.white}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 0,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginRight: 10,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.base300,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.black,
  },
  clearButton: {
    padding: 4,
  },
  filterButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: 12,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
export default SearchBar;

