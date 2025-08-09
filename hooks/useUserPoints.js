import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api/apiService';

export function useUserPoints({ userId, name, email }) {
  const { isLoggedIn } = useAuth();
  console.log('useUserPoints hook: userId =', userId, 'isLoggedIn =', isLoggedIn);
  const [userPoints, setUserPoints] = useState(null);
  const [pointsLoading, setPointsLoading] = useState(false);
  const [error, setError] = useState(null);

  const getUserPoints = useCallback(async () => {

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
      console.log('getUserPoints: About to fetch points for userId:', userId);
      setPointsLoading(true);
      setError(null);

      if (!isLoggedIn) {
        console.log('getUserPoints: User logged out during fetch, aborting');
        setUserPoints(null);
        setPointsLoading(false);
        return;
      }

      console.log(`Making API call to: /users/${userId}/points`);
      
      const res = await apiService.get(`/users/${userId}/points`);

      if (!isLoggedIn) {
        console.log('getUserPoints: User logged out after API call, ignoring response');
        setUserPoints(null);
        setPointsLoading(false);
        return;
      }

      // Defensive logging and checks
      console.log('getUserPoints: Full API response:', res);
      if (!res) {
        console.log('getUserPoints: API response is undefined or null:', res);
        setUserPoints(0);
        return;
      }
      if (!res.data) {
        console.log('getUserPoints: API response missing data property:', res);
        setUserPoints(0);
        return;
      }
      if (typeof res.data.totalPoints === 'undefined') {
        console.log('getUserPoints: API response missing totalPoints property:', res.data);
        setUserPoints(0);
        return;
      }
      setUserPoints(res.data.totalPoints);
      console.log('getUserPoints: Successfully set user points:', res.data.totalPoints);
    } catch (err) {
      console.error('Error fetching user points:', err);

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