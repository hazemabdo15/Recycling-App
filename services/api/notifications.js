import logger from '../../utils/logger';
import { measureApiCall } from '../../utils/performanceMonitor';
import apiService from './apiService';

export const notificationsAPI = {

  getNotifications: async () => {
    return measureApiCall(
      async () => {
        try {
          const response = await apiService.get('/notifications');
          logger.api('Notifications retrieved successfully', {
            count: response?.length || response?.data?.length || 0
          });
          return response;
        } catch (error) {
          logger.api('Error fetching notifications', {
            error: error.message,
            status: error.response?.status
          }, 'ERROR');
          throw error;
        }
      },
      'notifications-get'
    );
  },

  markAllAsRead: async () => {
    return measureApiCall(
      async () => {
        try {
          const response = await apiService.patch('/notifications/mark-read');
          logger.success('All notifications marked as read');
          return response;
        } catch (error) {
          logger.api('Error marking all notifications as read', {
            error: error.message,
            status: error.response?.status
          }, 'ERROR');
          throw error;
        }
      },
      'notifications-mark-all-read'
    );
  },

  markAsRead: async (notificationId) => {
    return measureApiCall(
      async () => {
        try {
          const response = await apiService.patch(`/notifications/${notificationId}/mark-read`);
          logger.success('Notification marked as read', { notificationId });
          return response;
        } catch (error) {
          logger.api('Error marking notification as read', {
            error: error.message,
            status: error.response?.status,
            notificationId
          }, 'ERROR');
          throw error;
        }
      },
      'notifications-mark-read'
    );
  },

  deleteNotification: async (notificationId) => {
    return measureApiCall(
      async () => {
        try {
          const response = await apiService.delete(`/notifications/${notificationId}`);
          logger.success('Notification deleted successfully', { notificationId });
          return response;
        } catch (error) {
          logger.api('Error deleting notification', {
            error: error.message,
            status: error.response?.status,
            notificationId
          }, 'ERROR');
          throw error;
        }
      },
      'notifications-delete'
    );
  },

  deleteAllNotifications: async () => {
    return measureApiCall(
      async () => {
        try {
          const response = await apiService.delete('/notifications');
          logger.success('All notifications deleted successfully');
          return response;
        } catch (error) {
          logger.api('Error deleting all notifications', {
            error: error.message,
            status: error.response?.status
          }, 'ERROR');
          throw error;
        }
      },
      'notifications-delete-all'
    );
  },
};
