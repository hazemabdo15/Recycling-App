import { router } from 'expo-router';
import { useCallback } from 'react';
export const useVoiceModal = () => {
  const openVoiceModal = useCallback(() => {
    router.push('/voice-modal');
  }, []);
  const closeVoiceModal = useCallback(() => {
    router.back();
  }, []);
  return {
    openVoiceModal,
    closeVoiceModal,
  };
};