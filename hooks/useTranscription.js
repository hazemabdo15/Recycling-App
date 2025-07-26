import { useCallback, useState } from 'react';
import { getSecureApiKey } from '../config/env';

export const useTranscription = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastTranscription, setLastTranscription] = useState(null);

  const transcribe = useCallback(async (audioURI) => {
    setIsLoading(true);
    setError(null);

    try {
      const apiKey = getSecureApiKey();
      console.log('🎤 Starting transcription for:', audioURI);
      console.log('🔑 API Key present:', !!apiKey);
      
      if (!apiKey) {
        throw new Error('No API key found. Please check your environment configuration.');
      }
      
      const formData = new FormData();

      formData.append('file', {
        uri: audioURI,
        type: 'audio/m4a',
        name: 'recording.m4a',
      });
      
      formData.append('model', 'whisper-large-v3');
      formData.append('language', 'ar');
      formData.append('response_format', 'json');
      formData.append(
        'prompt',
        'المتحدث يسرد مواد قابلة لإعادة التدوير باللغة العربية المصرية. يجب كتابة النص بالعربية فقط. مواد شائعة تشمل: كرسي، مكواة، بلاستيك، حديد، كولمان مياه، ورق متقطع، كتب، جرايد، كرتون، مراوح، موبايل، لابتوب، طابعة، نحاس، ألومنيوم، ستانلس. يرجى النسخ بدقة مع الكميات والوحدات مثل كيلو وقطعة.'
      );

      console.log('📡 Making API request to Groq...');
      const apiResponse = await fetch(
        'https://api.groq.com/openai/v1/audio/transcriptions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          body: formData,
        }
      );

      console.log('📡 API Response status:', apiResponse.status);

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        console.error('❌ Groq Transcription Error:', errorData);
        throw new Error(`Transcription failed: ${apiResponse.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await apiResponse.json();
      console.log('✅ Transcription response:', data);
      
      const transcription = data.text?.trim() || '';
      console.log('🎯 Final transcription:', transcription);
      
      setLastTranscription(transcription);
      return transcription;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transcription failed';
      console.error('❌ Transcription error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name,
        error: err
      });
      setError(errorMessage);
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
    resetTranscription,
  };
};
