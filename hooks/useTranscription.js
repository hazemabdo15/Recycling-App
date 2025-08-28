import { useCallback, useEffect, useState } from 'react';
import apiService from '../services/api/apiService';

export const useTranscription = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastTranscription, setLastTranscription] = useState(null);
  const [usageInfo, setUsageInfo] = useState({ count: 0, limit: 3, remaining: 3 });
  const [isLoadingUsage, setIsLoadingUsage] = useState(true); // Add loading state for usage

  const fetchCurrentUsage = useCallback(async () => {
    try {
      setIsLoadingUsage(true);
      console.log('📊 Fetching current voice usage...');
      const response = await apiService.get('/transcription/usage');
      
      if (response.success && response.usage) {
        const usage = response.usage;
        setUsageInfo({
          count: usage.count,
          limit: usage.limit,
          remaining: usage.remaining
        });
        console.log('✅ Current usage loaded:', usage);
        
        // Log additional info for debugging
        if (usage.hoursUntilReset) {
          console.log(`⏰ Usage resets in ${usage.hoursUntilReset} hours`);
        }
      }
    } catch (err) {
      console.log('ℹ️ Could not fetch current usage:', err.message);
      // Don't set error here as this is just for initial load
      // The user might not have voice usage fields yet
    } finally {
      setIsLoadingUsage(false);
    }
  }, []);

  // Fetch current usage on mount
  useEffect(() => {
    fetchCurrentUsage();
  }, [fetchCurrentUsage]);

  const transcribe = useCallback(async (audioURI) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🎤 Starting transcription for:', audioURI);
      
      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('audioFile', {
        uri: audioURI,
        type: 'audio/m4a',
        name: 'recording.m4a',
      });
      
      // Optional: Add language if needed
      formData.append('language', 'ar');

      console.log('📡 Making API request to backend transcription service...');
      
      // Call your backend transcription endpoint
      const response = await apiService.post('/transcription/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('✅ Backend transcription response:', response);
      
      const transcription = response.transcription?.trim() || '';
      console.log('🎯 Final transcription:', transcription);
      
      // Update usage info from response
      if (response.usage) {
        setUsageInfo({
          count: response.usage.count,
          limit: response.usage.limit,
          remaining: response.usage.remaining
        });
        console.log('📊 Usage updated:', response.usage);
      }
      
      setLastTranscription(transcription);
      return transcription;
    } catch (err) {
      console.error('❌ Transcription error details:', {
        message: err.message,
        status: err.status,
        data: err.data,
        error: err
      });

      // Handle specific error cases
      if (err.status === 429) {
        // Usage limit exceeded
        const errorData = err.data || {};
        const resetTime = errorData.resetTime ? new Date(errorData.resetTime) : null;
        const hoursLeft = resetTime ? Math.ceil((resetTime - new Date()) / (1000 * 60 * 60)) : 24;
        
        const limitMessage = `You've used all ${errorData.limit || 3} voice transcriptions for today. Limit resets in ${hoursLeft} hours.`;
        setError(limitMessage);
        
        // Update usage info to show limit reached
        if (errorData.limit) {
          setUsageInfo({
            count: errorData.currentUsage || errorData.limit || 3,
            limit: errorData.limit || 3,
            remaining: 0
          });
        }
      } else if (err.status === 401) {
        setError('Authentication required. Please log in again.');
      } else if (err.status === 400) {
        setError('Invalid audio file. Please try recording again.');
      } else {
        const errorMessage = err.message || err.data?.error || 'Transcription failed';
        setError(errorMessage);
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetTranscription = useCallback(() => {
    setLastTranscription(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    transcribe,
    isLoading,
    error,
    lastTranscription,
    usageInfo, // Add usage info for UI display
    isLoadingUsage, // Add loading state for usage display
    fetchCurrentUsage, // Add function to manually refresh usage
    resetTranscription,
  };
};
