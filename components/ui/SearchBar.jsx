import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
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
  const debounceTimer = useRef(null);

  const debouncedSearch = useCallback((text) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(() => {
      if (onSearch) {
        onSearch(text);
      }
    }, 300);
  }, [onSearch]);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const handleSearchChange = useCallback((text) => {
    setSearchText(text);
    debouncedSearch(text);
  }, [debouncedSearch]);

  const clearSearch = useCallback(() => {
    setSearchText('');
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    if (onSearch) {
      onSearch('');
    }
  }, [onSearch]);
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
          accessible={true}
          accessibilityLabel="Search input"
          accessibilityHint="Type to search through categories"
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