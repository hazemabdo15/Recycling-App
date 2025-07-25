import { useState, useCallback, useEffect } from 'react';
import apiService from '../services/api/apiService';

export function useUserPoints({ userId, name, email }) {
  const [userPoints, setUserPoints] = useState(null);
  const [pointsLoading, setPointsLoading] = useState(false);
  const [error, setError] = useState(null);

//   // Debug logging
//   useEffect(() => {
//     console.log('useUserPoints hook initialized with:', { userId, name, email });
//   }, [userId, name, email]);

  const getUserPoints = useCallback(async () => {
    if (!userId) {
      console.log('getUserPoints: No userId provided, skipping fetch');
      return;
    }

    console.log('getUserPoints: Starting fetch for userId:', userId);
    
    try {
      setPointsLoading(true);
      setError(null);
      
      // Log the API call
      console.log(`Making API call to: /users/${userId}/points`);
      
      const res = await apiService.get(`/users/${userId}/points`);
      
      console.log('getUserPoints: API response:', res);
      
      if (res) {
        console.log("res:",res)
        setUserPoints(res.data.totalPoints);
        console.log('getUserPoints: Successfully set user points:', res.data.totalPoints);
      } else {
        console.log('getUserPoints: API response indicates failure:', res);
        throw new Error('API response indicates failure');
      }
    } catch (err) {
      console.error('Error fetching user points:', err);
      
      // Log more details about the error
      if (err.response) {
        console.error('Error response data:', err.response.data);
        console.error('Error response status:', err.response.status);
        console.error('Error response headers:', err.response.headers);
      } else if (err.request) {
        console.error('Error request:', err.request);
      } else {
        console.error('Error message:', err.message);
      }
      
      setError(err);
      
      // Set fallback data
      const fallbackData = {
        userId: userId || '',
        name: name || '',
        email: email || '',
        totalPoints: 0,
        pointsHistory: [],
        pagination: {
          currentPage: 1,
          totalItems: 0,
          totalPages: 0,
          hasMore: false,
        },
      };
      
      console.log('getUserPoints: Setting fallback data:', fallbackData);
      setUserPoints(fallbackData);
    } finally {
      setPointsLoading(false);
      console.log('getUserPoints: Finished loading');
    }
  }, [userId, name, email]);

  // Auto-fetch when userId changes and is available
  useEffect(() => {
    if (userId) {
      console.log('useUserPoints: userId changed, auto-fetching points');
      getUserPoints();
    }
  }, [userId, getUserPoints]);

  return {
    userPoints,
    pointsLoading,
    error,
    getUserPoints,
    // Helper function to check if points are loaded
    hasValidPoints: userPoints !== null && !pointsLoading,
  };
}