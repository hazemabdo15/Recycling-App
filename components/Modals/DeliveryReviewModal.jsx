import { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { showGlobalToast } from "../../components/common/GlobalToast";
import { useTheme } from "../../context/ThemeContext";
import optimizedApiService from "../../services/api/apiService";
import { colors, getColors } from "../../styles/theme";

export default function DeliveryReviewModal({
  isOpen,
  onClose,
  orderId,
  orderInfo,
  existingReview,
  onSubmitted,
}) {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const colors = getColors(isDarkMode);
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
      showGlobalToast(t('toast.delivery.missingOrderId'), 2000, 'error');
      return;
    }
    if (rating === 0) {
      showGlobalToast(t('toast.delivery.selectRating'), 1500, 'warning');
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
        existingReview ? t('toast.delivery.reviewUpdated') : t('toast.delivery.reviewSubmitted'),
        1500,
        'success'
      );

      onSubmitted?.(submittedReview);
      onClose();

    } catch (error) {
      console.error("Review submission error:", error);
      showGlobalToast(error.message || t('toast.delivery.reviewFailed'), 2000, 'error');
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
        <View
          style={[
            styles.modal,
            {
              backgroundColor: colors.cardBackground,
              shadowColor: colors.shadowColor || colors.shadow,
            },
          ]}
        >
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.text }] }>
                {existingReview ? t("recyclingHistory.review.modal.title.edit") : t("recyclingHistory.review.modal.title.create")}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {existingReview
                  ? t("recyclingHistory.review.modal.subtitle.edit")
                  : t("recyclingHistory.review.modal.subtitle.create")}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {orderInfo && (
              <View style={[styles.orderInfo, { backgroundColor: colors.base100 }] }>
                <Text style={[styles.orderText, { color: colors.textSecondary }]}>
                  {t("recyclingHistory.review.modal.orderNumber", { orderNumber: orderInfo.orderNumber || orderId?.slice(-8) || "N/A" })}
                </Text>
                {orderInfo.itemCount && (
                  <Text style={[styles.orderText, { color: colors.textSecondary }]}>
                    {t("recyclingHistory.review.modal.itemCount", { count: orderInfo.itemCount })}
                  </Text>
                )}
                {orderInfo.courierName && (
                  <Text style={[styles.orderText, { color: colors.textSecondary }]}>{orderInfo.courierName}</Text>
                )}
                {orderInfo.orderDate && (
                  <Text style={[styles.orderText, { color: colors.textSecondary }]}>
                    {new Date(orderInfo.orderDate).toLocaleDateString()}
                  </Text>
                )}
              </View>
            )}

            <Text style={styles.question}>{t("recyclingHistory.review.modal.question")}</Text>
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
              <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
                {t("recyclingHistory.review.modal.ratingText", { rating })}
              </Text>
            )}

            <Text style={styles.label}>{t("recyclingHistory.review.modal.commentsLabel")}</Text>
            <TextInput
              style={[styles.textarea, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
              placeholder={t("recyclingHistory.review.modal.commentsPlaceholder")}
              placeholderTextColor={colors.textTertiary}
              value={comments}
              onChangeText={setComments}
              editable={!loading}
              multiline
              maxLength={1000}
            />
            <Text style={styles.charCount}>
              {t("recyclingHistory.review.modal.charCount", { current: comments.length, max: 1000 })}
            </Text>

            {submissionAttempted && rating === 0 && (
              <Text style={[styles.error, { color: colors.error }] }>
                {t("recyclingHistory.review.modal.errors.selectRating")}
              </Text>
            )}

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.cancelButton,
                  { backgroundColor: isDarkMode ? colors.base100 : '#f3f4f6' },
                ]}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={[styles.cancelText, { color: colors.text }]}>{t("recyclingHistory.review.modal.buttons.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  rating === 0 ? styles.disabledButton : styles.submitButton,
                  { backgroundColor: rating === 0 ? '#9ca3af' : colors.success },
                ]}
                onPress={handleSubmit}
                disabled={loading || rating === 0}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.submitText, { color: '#fff' }]}>
                    {existingReview ? t("recyclingHistory.review.modal.buttons.update") : t("recyclingHistory.review.modal.buttons.submit")}
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
  backdrop: { flex: 1, backgroundColor: "transparent", justifyContent: "flex-end", alignItems: 'stretch' },
  modal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxHeight: "90%",
    paddingBottom: 10,
    // keep full width like before (no horizontal margin)
    // shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    // elevation for Android
    elevation: 8,
  },
  header: { flexDirection: "row", justifyContent: "space-between", padding: 15, borderBottomWidth: 1, borderBottomColor: "#eee" },
  title: { fontSize: 16, fontWeight: "600", color: "#111" },
  subtitle: { fontSize: 12, color: "#666" },
  content: { paddingHorizontal: 15, paddingVertical: 10 },
  orderInfo: { backgroundColor: "#ecfdf5", padding: 10, borderRadius: 8, marginBottom: 15 },
  orderText: { fontSize: 12, color: "#555" },
  question: { fontSize: 14, fontWeight: "500", marginBottom: 8, color: colors.title },
  stars: { flexDirection: "row", justifyContent: "center", marginBottom: 5 },
  ratingText: { textAlign: "center", color: "#555", marginBottom: 10 },
  label: { fontSize: 13, fontWeight: "500", marginBottom: 5,color: colors.title },
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
