import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api/apiService';

export function useUserPoints({ userId, name, email }) {
  const { isLoggedIn } = useAuth();
  const [userPoints, setUserPoints] = useState(null);
  const [pointsLoading, setPointsLoading] = useState(false);
  const [error, setError] = useState(null);


  const getUserPoints = useCallback(async () => {
    // If user is not logged in, clear points and skip fetch
    if (!isLoggedIn) {
      console.log('getUserPoints: User not logged in, clearing points');
      setUserPoints(null);
      setError(null);
      setPointsLoading(false);
      return;
    }

    if (!userId) {
      console.log('getUserPoints: No userId provided, clearing points and skipping fetch');
      setUserPoints(null);
      setError(null);
      setPointsLoading(false);
      return;
    }

    console.log('getUserPoints: Starting fetch for userId:', userId);
    
    try {
      setPointsLoading(true);
      setError(null);

      // Double-check authentication before making API call
      if (!isLoggedIn) {
        console.log('getUserPoints: User logged out during fetch, aborting');
        setUserPoints(null);
        setPointsLoading(false);
        return;
      }

      console.log(`Making API call to: /users/${userId}/points`);
      
      const res = await apiService.get(`/users/${userId}/points`);
      
      // Check authentication again after API call
      if (!isLoggedIn) {
        console.log('getUserPoints: User logged out after API call, ignoring response');
        setUserPoints(null);
        setPointsLoading(false);
        return;
      }
      
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

      // If user logged out, don't process error
      if (!isLoggedIn) {
        console.log('getUserPoints: User logged out, ignoring error');
        setUserPoints(null);
        setPointsLoading(false);
        return;
      }

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
  }, [userId, name, email, isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn && userId) {
      console.log('useUserPoints: userId changed and user is logged in, auto-fetching points');
      getUserPoints();
    } else if (!isLoggedIn) {
      console.log('useUserPoints: User logged out, clearing points');
      setUserPoints(null);
      setError(null);
    }
  }, [userId, isLoggedIn, getUserPoints]);

  return {
    userPoints,
    pointsLoading,
    error,
    getUserPoints,

    hasValidPoints: userPoints !== null && !pointsLoading,
  };
}