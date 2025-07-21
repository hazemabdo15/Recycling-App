import { useCallback, useState } from 'react';
import { extractMaterialsFromTranscription } from '../services/materialExtraction';
import { useTranscription } from './useTranscription';

export const useAIWorkflow = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [extractedMaterials, setExtractedMaterials] = useState([]);
  
  const { transcribe, isLoading: isTranscribing, error: transcriptionError } = useTranscription();

  const processAudioToMaterials = useCallback(async (audioURI) => {
    setIsProcessing(true);
    setError(null);
    setExtractedMaterials([]);

    try {
      // Step 1: Transcribe audio
      console.log('🎤 Starting transcription...');
      const transcription = await transcribe(audioURI);
      
      if (!transcription) {
        throw new Error(transcriptionError || 'Failed to transcribe audio');
      }

      console.log('✅ Transcription successful:', transcription);

      // Step 2: Extract materials from transcription
      console.log('🤖 Extracting materials...');
      const materials = await extractMaterialsFromTranscription(transcription);
      
      console.log('✅ Materials extracted:', materials);
      
      setExtractedMaterials(materials);
      
      return {
        success: true,
        transcription,
        materials,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'AI processing failed';
      console.error('❌ AI workflow error:', err);
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage,
        transcription: null,
        materials: [],
      };
    } finally {
      setIsProcessing(false);
    }
  }, [transcribe, transcriptionError]);

  const reset = useCallback(() => {
    setIsProcessing(false);
    setError(null);
    setExtractedMaterials([]);
  }, []);

  return {
    processAudioToMaterials,
    isProcessing: isProcessing || isTranscribing,
    error,
    extractedMaterials,
    reset,
  };
};
