import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useThemedStyles } from '../../hooks/useThemedStyles';

// Dynamic styles function for ReviewsTab
const getReviewsTabStyles = (colors) => StyleSheet.create({
  container: { padding: 16 },
  header: { fontSize: 18, fontWeight: '600', marginBottom: 12, color: colors.text },
  emptyContainer: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { fontSize: 16, color: colors.textSecondary, marginTop: 8 },
  emptySubText: { fontSize: 14, color: colors.textTertiary, textAlign: 'center', marginTop: 4 },
  reviewCard: {
    backgroundColor: colors.infoLight,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.infoBorder,
    marginBottom: 12,
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  orderText: { fontWeight: '500', fontSize: 15, color: colors.text },
  courierText: { fontSize: 13, color: colors.textSecondary },
  dateRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  dateText: { fontSize: 12, color: colors.textSecondary, marginLeft: 4 },
  actionsRow: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { padding: 4 },
  starsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  starsText: { fontSize: 12, color: colors.textSecondary, marginLeft: 4 },
  commentText: { fontSize: 14, color: colors.text, fontStyle: 'italic' },
});

export default function ReviewsTab({ userReviews, onEditReview, onDeleteReview }) {
  const { colors } = useThemedStyles();
  const styles = getReviewsTabStyles(colors);
  const [deletingReviewId, setDeletingReviewId] = useState(null);

  const createMockOrderFromReview = (review) => {
    return {
      _id: review.orderId,
      createdAt: review.orderDate || review.reviewedAt,
      items: new Array(review.itemCount || 0).fill({}),
      courier: {
        _id: review.courier.id,
        name: review.courier.name,
      },
      address: {},
      status: 'completed',
    };
  };

  const handleDeleteReview = (orderId) => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete this review? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingReviewId(orderId);
            try {
              await onDeleteReview(orderId);
              Alert.alert('Success', 'Review deleted successfully');
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to delete review. Please try again.');
            } finally {
              setDeletingReviewId(null);
            }
          },
        },
      ]
    );
  };

  if (!userReviews || userReviews.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="star-outline" size={48} color="#d1d5db" />
        <Text style={styles.emptyText}>No reviews yet</Text>
        <Text style={styles.emptySubText}>
          Complete an order and rate it to see your reviews here
        </Text>
      </View>
    );
  }

  const renderReview = ({ item: review }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View>
          <Text style={styles.orderText}>
            Order #{review.orderId.slice(-8).toUpperCase()}
          </Text>
          <Text style={styles.courierText}>
            Courier: {review.courier.name}
          </Text>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={12} color="#6b7280" />
            <Text style={styles.dateText}>
              {new Date(review.reviewedAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={() => onEditReview(createMockOrderFromReview(review))}
            style={styles.iconButton}
          >
            <Ionicons name="create-outline" size={18} color="#2563eb" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteReview(review.orderId)}
            disabled={deletingReviewId === review.orderId}
            style={styles.iconButton}
          >
            {deletingReviewId === review.orderId ? (
              <ActivityIndicator size="small" color="#dc2626" />
            ) : (
              <Ionicons name="trash-outline" size={18} color="#dc2626" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= review.stars ? 'star' : 'star-outline'}
            size={16}
            color={star <= review.stars ? '#fbbf24' : '#d1d5db'}
          />
        ))}
        <Text style={styles.starsText}>({review.stars}/5)</Text>
      </View>

      {review.comment ? (
        <Text style={styles.commentText}>{review.comment}</Text>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        <Ionicons name="chatbubble-ellipses-outline" size={20} /> Your Reviews ({userReviews.length})
      </Text>
      <FlatList
        data={userReviews}
        keyExtractor={(item) => item.orderId}
        renderItem={renderReview}
        contentContainerStyle={{ paddingVertical: 8 }}
      />
    </View>
  );
}
