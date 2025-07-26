import { useCallback, useState } from 'react';
import { extractMaterialsFromTranscription } from '../services/materialExtraction';
import { verifyMaterialsAgainstDatabase } from '../services/materialVerification';
import { useTranscription } from './useTranscription';

export const useAIWorkflow = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [extractedMaterials, setExtractedMaterials] = useState([]);
  const [verifiedMaterials, setVerifiedMaterials] = useState([]);
  
  const { transcribe, isLoading: isTranscribing, error: transcriptionError } = useTranscription();

  const processAudioToMaterials = useCallback(async (audioURI) => {
    setIsProcessing(true);
    setError(null);
    setExtractedMaterials([]);
    setVerifiedMaterials([]);

    try {

      console.log('🎤 Starting transcription...');
      const transcription = await transcribe(audioURI);
      
      if (!transcription) {
        throw new Error(transcriptionError || 'Failed to transcribe audio');
      }

      console.log('✅ Transcription successful:', transcription);

      console.log('🤖 Extracting materials...');
      const materials = await extractMaterialsFromTranscription(transcription);
      
      console.log('✅ Materials extracted:', materials);
      setExtractedMaterials(materials);

      console.log('🔍 Verifying materials against database...');
      const verified = await verifyMaterialsAgainstDatabase(materials);
      
      console.log('✅ Materials verified:', verified);
      setVerifiedMaterials(verified);
      
      return {
        success: true,
        transcription,
        extractedMaterials: materials,
        verifiedMaterials: verified,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'AI processing failed';
      console.error('❌ AI workflow error:', err);
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage,
        transcription: null,
        extractedMaterials: [],
        verifiedMaterials: [],
      };
    } finally {
      setIsProcessing(false);
    }
  }, [transcribe, transcriptionError]);

  const reset = useCallback(() => {
    setIsProcessing(false);
    setError(null);
    setExtractedMaterials([]);
    setVerifiedMaterials([]);
  }, []);

  return {
    processAudioToMaterials,
    isProcessing: isProcessing || isTranscribing,
    error,
    extractedMaterials,
    verifiedMaterials,
    reset,
  };
};
