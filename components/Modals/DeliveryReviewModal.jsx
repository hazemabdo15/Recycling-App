import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import optimizedApiService from "../../services/api/apiService";
import { showGlobalToast } from "../../components/common/GlobalToast";

export default function DeliveryReviewModal({
  isOpen,
  onClose,
  orderId,
  orderInfo,
  existingReview,
  onSubmitted,
}) {
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);
  const [submissionAttempted, setSubmissionAttempted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (existingReview) {
        setRating(existingReview.rating || 0);
        setComments(existingReview.comments || "");
      } else {
        setRating(0);
        setComments("");
      }
      setSubmissionAttempted(false);
    }
  }, [isOpen, existingReview]);

  const handleSubmit = async () => {
    if (!orderId) {
      showGlobalToast("Missing order ID", 2000);
      return;
    }
    if (rating === 0) {
      showGlobalToast("Please select a rating", 1500);
      return;
    }

    setLoading(true);
    setSubmissionAttempted(true);

    try {
      if (rating < 1 || rating > 5) throw new Error("Invalid rating value");
      if (comments.length > 1000) throw new Error("Comments are too long");

      const endpoint = `/${orderId}/review`;
      const method = existingReview ? "put" : "post";
      const reviewData = { rating, comments: comments.trim() };

      const response = await optimizedApiService[method](endpoint, reviewData);

      const submittedReview = {
        orderId,
        rating,
        comments: comments.trim(),
        ...response?.data,
        id: response?.data?.id || response?.data?._id || response?.id || response?._id,
        createdAt: response?.data?.createdAt || response?.createdAt || new Date().toISOString(),
        updatedAt: response?.data?.updatedAt || response?.updatedAt || new Date().toISOString(),
      };

      showGlobalToast(
        existingReview ? "Review updated successfully!" : "Review submitted successfully!",
        1500
      );

      onSubmitted?.(submittedReview);
      onClose();

    } catch (error) {
      console.error("Review submission error:", error);
      showGlobalToast(error.message || "Failed to submit review", 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={() => !loading && onClose()}
    >
      <View style={styles.backdrop}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>
                {existingReview ? "Edit Your Review" : "Rate Your Experience"}
              </Text>
              <Text style={styles.subtitle}>
                {existingReview
                  ? "Update your feedback for this delivery"
                  : "Help us improve by sharing your feedback"}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <Ionicons name="close" size={20} color="#555" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {orderInfo && (
              <View style={styles.orderInfo}>
                <Text style={styles.orderText}>
                  Order #{orderInfo.orderNumber || orderId?.slice(-8) || "N/A"}
                </Text>
                {orderInfo.itemCount && (
                  <Text style={styles.orderText}>
                    {orderInfo.itemCount} item(s)
                  </Text>
                )}
                {orderInfo.courierName && (
                  <Text style={styles.orderText}>{orderInfo.courierName}</Text>
                )}
                {orderInfo.orderDate && (
                  <Text style={styles.orderText}>
                    {new Date(orderInfo.orderDate).toLocaleDateString()}
                  </Text>
                )}
              </View>
            )}

            <Text style={styles.question}>How was your delivery?</Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  disabled={loading}
                >
                  <MaterialCommunityIcons
                    name={star <= rating ? "star" : "star-outline"}
                    size={32}
                    color={star <= rating ? "#fbbf24" : "#d1d5db"}
                  />
                </TouchableOpacity>
              ))}
            </View>
            {rating > 0 && (
              <Text style={styles.ratingText}>
                You rated this {rating} out of 5
              </Text>
            )}

            <Text style={styles.label}>Additional Comments (Optional)</Text>
            <TextInput
              style={styles.textarea}
              placeholder="Tell us about your experience..."
              value={comments}
              onChangeText={setComments}
              editable={!loading}
              multiline
              maxLength={1000}
            />
            <Text style={styles.charCount}>{comments.length}/1000</Text>

            {submissionAttempted && rating === 0 && (
              <Text style={styles.error}>
                Please select a rating before submitting your review.
              </Text>
            )}

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  rating === 0 ? styles.disabledButton : styles.submitButton,
                ]}
                onPress={handleSubmit}
                disabled={loading || rating === 0}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitText}>
                    {existingReview ? "Update Review" : "Submit Review"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modal: { backgroundColor: "#fff", borderTopLeftRadius: 12, borderTopRightRadius: 12, maxHeight: "90%", paddingBottom: 10 },
  header: { flexDirection: "row", justifyContent: "space-between", padding: 15, borderBottomWidth: 1, borderBottomColor: "#eee" },
  title: { fontSize: 16, fontWeight: "600", color: "#111" },
  subtitle: { fontSize: 12, color: "#666" },
  content: { paddingHorizontal: 15, paddingVertical: 10 },
  orderInfo: { backgroundColor: "#ecfdf5", padding: 10, borderRadius: 8, marginBottom: 15 },
  orderText: { fontSize: 12, color: "#555" },
  question: { fontSize: 14, fontWeight: "500", marginBottom: 8 },
  stars: { flexDirection: "row", justifyContent: "center", marginBottom: 5 },
  ratingText: { textAlign: "center", color: "#555", marginBottom: 10 },
  label: { fontSize: 13, fontWeight: "500", marginBottom: 5 },
  textarea: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, fontSize: 13, minHeight: 70, textAlignVertical: "top" },
  charCount: { fontSize: 10, color: "#888", textAlign: "right", marginTop: 3 },
  error: { color: "#dc2626", fontSize: 12, marginTop: 5 },
  buttonRow: { flexDirection: "row", marginTop: 15, gap: 10 },
  button: { flex: 1, padding: 12, borderRadius: 8, alignItems: "center" },
  cancelButton: { backgroundColor: "#f3f4f6" },
  cancelText: { color: "#374151", fontWeight: "500" },
  submitButton: { backgroundColor: "#10b981" },
  submitText: { color: "#fff", fontWeight: "500" },
  disabledButton: { backgroundColor: "#9ca3af" },
});
