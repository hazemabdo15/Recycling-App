import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { scaleSize } from '../../utils/scale';

const SkeletonLoader = ({ 
  width = '100%', 
  height = 20, 
  style = {},
  borderRadius = 8,
  count = 1,
  spacing = 10 
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    };

    startAnimation();
  }, [animatedValue]);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E1E9EE', '#F2F8FC'],
  });

  const skeletons = Array.from({ length: count }, (_, index) => (
    <Animated.View
      key={index}
      style={[
        styles.skeleton,
        {
          width,
          height,
          backgroundColor,
          borderRadius,
          marginBottom: index < count - 1 ? spacing : 0,
        },
        style,
      ]}
    />
  ));

  return <View style={styles.container}>{skeletons}</View>;
};

const CategoryCardSkeleton = () => (
  <View style={styles.categoryCardSkeleton}>
    <SkeletonLoader width={60} height={60} borderRadius={30} />
    <SkeletonLoader width="80%" height={16} style={{ marginTop: 10 }} />
  </View>
);

const CategoriesGridSkeleton = () => (
  <View style={styles.categoriesGrid}>
    {Array.from({ length: 4 }, (_, index) => (
      <CategoryCardSkeleton key={index} />
    ))}
  </View>
);

const ListItemSkeleton = () => (
  <View style={styles.listItemSkeleton}>
    <SkeletonLoader width={80} height={80} borderRadius={8} />
    <View style={styles.listItemContent}>
      <SkeletonLoader width="70%" height={18} />
      <SkeletonLoader width="50%" height={14} style={{ marginTop: 8 }} />
      <SkeletonLoader width="40%" height={14} style={{ marginTop: 4 }} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skeleton: {
    backgroundColor: '#E1E9EE',
  },
  categoryCardSkeleton: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSize(18),
    padding: scaleSize(20),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scaleSize(15),
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  listItemSkeleton: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSize(12),
    padding: scaleSize(16),
    marginBottom: scaleSize(12),
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  listItemContent: {
    flex: 1,
    marginLeft: scaleSize(16),
    justifyContent: 'center',
  },
});

export { CategoriesGridSkeleton, CategoryCardSkeleton, ListItemSkeleton, SkeletonLoader };

