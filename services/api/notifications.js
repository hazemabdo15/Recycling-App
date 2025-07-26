import apiService from './apiService';

export const notificationsAPI = {

  getNotifications: async () => {
    try {
      const response = await apiService.get('/notifications');
      return response;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await apiService.patch('/notifications/mark-read');
      return response;
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw error;
    }
  },

  markAsRead: async (notificationId) => {
    try {
      const response = await apiService.patch(`/notifications/${notificationId}/mark-read`);
      return response;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  deleteNotification: async (notificationId) => {
    try {
      const response = await apiService.delete(`/notifications/${notificationId}`);
      return response;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

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
