import { useCallback } from 'react';
import { showGlobalToast } from '../components/common/GlobalToast';

// Unified toast hook using the new global toast system
export const useToast = () => {
  const showToast = useCallback((message, type = 'success', duration = 2000) => {
    showGlobalToast(message, duration, type);
  }, []);

  const showSuccess = useCallback((message, duration) => {
    showToast(message, 'success', duration);
  }, [showToast]);

  const showError = useCallback((message, duration) => {
    showToast(message, 'error', duration);
  }, [showToast]);

  const showWarning = useCallback((message, duration) => {
    showToast(message, 'warning', duration);
  }, [showToast]);

  const showInfo = useCallback((message, duration) => {
    showToast(message, 'info', duration);
  }, [showToast]);

  return {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};
