import apiService from './apiService';

export const notificationsAPI = {
  // Get all notifications for the user
  getNotifications: async () => {
    try {
      const response = await apiService.get('/notifications');
      return response;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      const response = await apiService.patch('/notifications/mark-read');
      return response;
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw error;
    }
  },

  // Mark a specific notification as read
  markAsRead: async (notificationId) => {
    try {
      const response = await apiService.patch(`/notifications/${notificationId}/mark-read`);
      return response;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  // Delete a specific notification
  deleteNotification: async (notificationId) => {
    try {
      const response = await apiService.delete(`/notifications/${notificationId}`);
      return response;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  // Delete all notifications
  deleteAllNotifications: async () => {
    try {
      const response = await apiService.delete('/notifications');
      return response;
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      throw error;
    }
  },
};
