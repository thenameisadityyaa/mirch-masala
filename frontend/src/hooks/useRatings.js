import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

/**
 * Fetches the global rating summary for all menu items.
 * Returns: { [itemId]: { avgRating: number, count: number } }
 */
export const useRatings = () => {
  const [ratings, setRatings]     = useState({});
  const [loading, setLoading]     = useState(true);

  const fetch = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/reviews/summary`);
      setRatings(res.data);
    } catch {
      // Fail silently — ratings are non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { ratings, loadingRatings: loading, refetchRatings: fetch };
};

/**
 * Fetches the current user's reviews as a map: { [itemId]: reviewObject }
 */
export const useMyReviews = () => {
  const [myReviews, setMyReviews] = useState({});

  const fetch = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/reviews/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyReviews(res.data);
    } catch {
      // fail silently
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { myReviews, setMyReviews, refetchMyReviews: fetch };
};
