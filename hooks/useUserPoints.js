import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api/apiService';

export function useUserPoints({ userId, name, email }) {
  const { isLoggedIn } = useAuth();
  const [userPoints, setUserPoints] = useState(null);
  const [totalRecycled, setTotalRecycled] = useState(0);
  const [pointsLoading, setPointsLoading] = useState(false);
  const [error, setError] = useState(null);

  const getUserPoints = useCallback(async () => {

    if (!isLoggedIn) {
      setUserPoints(null);
      setError(null);
      setPointsLoading(false);
      return;
    }

    if (!userId) {
      setUserPoints(null);
      setError(null);
      setPointsLoading(false);
      return;
    }

    try {
      setPointsLoading(true);
      setError(null);

      if (!isLoggedIn) {
        setUserPoints(null);
        setPointsLoading(false);
        return;
      }

      const res = await apiService.get(`/users/${userId}/points`);
      if (!isLoggedIn) {
        setUserPoints(null);
        setPointsLoading(false);
        return;
      }

      if (!res) {
        setUserPoints(0);
        return;
      }
      if (!res.data) {
        setUserPoints(0);
        return;
      }
      if (typeof res.data.totalPoints === 'undefined') {
        setUserPoints(0);
        setTotalRecycled(0);
        return;
      }
      setUserPoints(res.data.totalPoints);
      setTotalRecycled(res.data.totalRecycled ?? 0);
    } catch (err) {
      console.error('Error fetching user points:', err);

      if (!isLoggedIn) {
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
      setUserPoints(0);
      setTotalRecycled(0);
    } finally {
      setPointsLoading(false);
    }
  }, [userId, isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn && userId) {
      getUserPoints();
    } else if (!isLoggedIn) {
      setUserPoints(null);
      setError(null);
    }
  }, [userId, isLoggedIn, getUserPoints]);

  return {
  userPoints,
  totalRecycled,
  pointsLoading,
  error,
  getUserPoints,
  hasValidPoints: userPoints !== null && !pointsLoading,
  };
}