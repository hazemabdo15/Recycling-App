import { useCallback } from 'react';
import { showGlobalToast } from '../components/common/GlobalToast';

// Unified toast hook using the new global toast system
export const useToast = () => {
  const DEFAULT_DURATION = 1200;
  const showToast = useCallback((message, type = 'success', duration = DEFAULT_DURATION) => {
    showGlobalToast(message, duration, type);
  }, []);

  const showSuccess = useCallback((message, duration = DEFAULT_DURATION) => {
    showToast(message, 'success', duration);
  }, [showToast]);

  const showError = useCallback((message, duration = DEFAULT_DURATION) => {
    showToast(message, 'error', duration);
  }, [showToast]);

  const showWarning = useCallback((message, duration = DEFAULT_DURATION) => {
    showToast(message, 'warning', duration);
  }, [showToast]);

  const showInfo = useCallback((message, duration = DEFAULT_DURATION) => {
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
