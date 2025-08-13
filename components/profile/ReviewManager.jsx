import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import optimizedApiService from '../../services/api/apiService';
import DeliveryReviewModal from '../../components/Modals/DeliveryReviewModal';

export default function ReviewManager({ children }) {
  const [userReviews, setUserReviews] = useState([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState(null);
  const [existingReviewForOrder, setExistingReviewForOrder] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchReviews = async () => {
    try {
      setIsReviewsLoading(true);
      const res = await optimizedApiService.get('/reviews/my-reviews'); 
      setUserReviews(res.reviews || []);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
      Alert.alert('Error', 'Could not load reviews');
    } finally {
      setIsReviewsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const getCourierDisplayName = (courier) => {
    if (!courier) return 'Unknown Courier';
    return (
      courier.name ||
      courier.userName ||
      (courier.email ? courier.email.split('@')[0] : null) ||
      courier.phoneNumber ||
      'Unknown Courier'
    );
  };

  const openReviewModal = (order) => {
    if (!order || !order._id) {
      console.error('Invalid order passed to openReviewModal:', order);
      return;
    }
    const existingReview = userReviews.find((review) => review.orderId === order._id);
    console.log("existing review:", existingReview)
    setSelectedOrderForReview(order);
    setExistingReviewForOrder(existingReview || null);
    setIsReviewModalOpen(true);
  };

  const closeReviewModal = () => {
    setSelectedOrderForReview(null);
    setExistingReviewForOrder(null);
    setIsReviewModalOpen(false);
  };

  const handleReviewSubmitted = () => {
    fetchReviews();
    closeReviewModal();
  };

  const deleteReview = async (orderId) => {
    try {
      setIsDeleting(true);
      if (!orderId) throw new Error('Order ID is missing');
      await optimizedApiService.delete(`/${orderId}/review`);
      await fetchReviews();
    } catch (error) {
      console.error('Failed to delete review:', error);
      if (error.response?.status === 404) {
        Alert.alert('Error', 'Review not found.');
      } else if (error.response?.status === 403) {
        Alert.alert('Error', 'You are not authorized to delete this review.');
      } else if (error.response?.status >= 500) {
        Alert.alert('Error', 'Server error. Please try again later.');
      } else {
        Alert.alert('Error', 'Failed to delete review. Please try again.');
      }
    } finally {
        setIsDeleting(false)
    }
  };

  return (
    <>
      {children({
        openReviewModal,
        deleteReview,
        userReviews,
        isReviewsLoading,
        isDeleting
      })}

      <DeliveryReviewModal
        isOpen={isReviewModalOpen}
        onClose={closeReviewModal}
        orderId={selectedOrderForReview?._id || ''}
        orderInfo={
          selectedOrderForReview
            ? {
                orderNumber: selectedOrderForReview._id.slice(-8).toUpperCase(),
                courierName:
                  getCourierDisplayName(selectedOrderForReview.courier) ||
                  existingReviewForOrder?.courier?.name ||
                  'Unknown Courier',
                orderDate: selectedOrderForReview.createdAt,
                itemCount:
                  selectedOrderForReview.items?.length ||
                  existingReviewForOrder?.itemCount ||
                  0,
              }
            : undefined
        }
        existingReview={
          existingReviewForOrder
            ? {
                rating: existingReviewForOrder.stars,
                comments: existingReviewForOrder.comment,
              }
            : undefined
        }
        onSubmitted={handleReviewSubmitted}
      />
    </>
  );
}
