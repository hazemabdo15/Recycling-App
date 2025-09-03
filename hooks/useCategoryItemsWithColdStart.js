/**
 * Enhanced Categories API Hook with Cold Start Handling
 * Provides better cold start detection and recovery for category items
 */

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocalization } from "../context/LocalizationContext";
import { categoriesAPI } from "../services/api";
import coldStartHandler, { isColdStartError } from "../utils/coldStartHandler";
import { smartWarmServer } from "../utils/serverWarming";

export const useCategoryItemsWithColdStart = (categoryName) => {
  const { user } = useAuth();
  const { t } = useLocalization();
  
  const [coldStartState, setColdStartState] = useState({
    isDetected: false,
    isRetrying: false,
    retryCount: 0,
    message: null
  });

  // Query for category items with enhanced cold start handling
  const categoryItemsQuery = useQuery({
    queryKey: ['category-items', categoryName, user?.role || 'customer'],
    queryFn: async () => {
      console.log('[useCategoryItemsWithColdStart] Fetching items for category:', categoryName);
      
      // Reset cold start state for new request
      setColdStartState(prev => ({ ...prev, isDetected: false, isRetrying: false }));
      
      try {
        const result = await coldStartHandler.executeWithRetry(
          `category-items-enhanced-${categoryName}`,
          () => categoriesAPI.getCategoryItems(user?.role || 'customer', categoryName),
          {
            maxRetries: 3,
            onColdStartDetected: () => {
              console.log('[useCategoryItemsWithColdStart] Cold start detected');
              setColdStartState(prev => ({
                ...prev,
                isDetected: true,
                message: t('coldStart.warming.message', 'Server is starting up, please wait...')
              }));
            },
            onRetry: (attempt, delay, isColdStartError) => {
              console.log(`[useCategoryItemsWithColdStart] Retry attempt ${attempt}`);
              setColdStartState(prev => ({
                ...prev,
                isRetrying: true,
                retryCount: attempt,
                message: isColdStartError 
                  ? t('coldStart.retrying.coldStart', `Server warming up... Retrying in ${Math.ceil(delay/1000)}s (${attempt}/3)`)
                  : t('coldStart.retrying.general', `Retrying... (${attempt}/3)`)
              }));
            },
            fallbackData: {
              success: false,
              data: [],
              message: t('coldStart.fallback.message', 'Server is temporarily unavailable. Please try again in a few moments.')
            }
          }
        );

        // Clear cold start state on success
        setColdStartState({
          isDetected: false,
          isRetrying: false,
          retryCount: 0,
          message: null
        });

        return result;
      } catch (error) {
        // Handle final error after all retries failed
        const isServerError = isColdStartError(error);
        setColdStartState({
          isDetected: isServerError,
          isRetrying: false,
          retryCount: 3,
          message: isServerError 
            ? t('coldStart.error.server', 'Server is not responding. Please try again in a few minutes.')
            : t('coldStart.error.general', 'Failed to load data')
        });
        
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes (shorter for category items)
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: false, // We handle retries manually with cold start handler
    enabled: !!categoryName,
  });

  // Manual retry function that also attempts to warm the server
  const retryWithWarming = useCallback(async () => {
    console.log('[useCategoryItemsWithColdStart] Manual retry with server warming');
    
    setColdStartState(prev => ({
      ...prev,
      isRetrying: true,
      message: t('coldStart.warming.retry', 'Warming up server and retrying...')
    }));

    try {
      // First try to warm the server
      await smartWarmServer({ 
        role: user?.role || 'customer',
        silent: false // Show warming progress
      });
      
      // Then refetch the query
      await categoryItemsQuery.refetch();
    } catch (error) {
      console.log('[useCategoryItemsWithColdStart] Retry with warming failed:', error.message);
      setColdStartState(prev => ({
        ...prev,
        isRetrying: false,
        message: t('coldStart.error.retryFailed', 'Retry failed. Please check your connection.')
      }));
    }
  }, [categoryItemsQuery, user?.role, t]);

  // Auto-clear cold start state after successful data fetch
  useEffect(() => {
    if (categoryItemsQuery.data && !categoryItemsQuery.error) {
      setColdStartState(prev => {
        if (prev.isDetected || prev.isRetrying) {
          return {
            isDetected: false,
            isRetrying: false,
            retryCount: 0,
            message: null
          };
        }
        return prev;
      });
    }
  }, [categoryItemsQuery.data, categoryItemsQuery.error]);

  // Process the response data
  const processedData = categoryItemsQuery.data?.data || categoryItemsQuery.data || [];
  const isUsingFallback = categoryItemsQuery.data?.success === false;

  return {
    items: Array.isArray(processedData) ? processedData : [],
    loading: categoryItemsQuery.isLoading,
    error: categoryItemsQuery.error?.message || null,
    refetch: categoryItemsQuery.refetch,
    retryWithWarming,
    coldStart: coldStartState,
    isUsingFallback,
    fallbackMessage: isUsingFallback ? categoryItemsQuery.data?.message : null
  };
};
