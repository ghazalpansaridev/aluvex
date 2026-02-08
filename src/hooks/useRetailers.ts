import { useState, useEffect, useCallback } from 'react';
import {
  fetchRetailers,
  fetchRetailerById,
} from '../lib/retailers.api';
import { RetailerWithEmail, RetailerFilters } from '../types/database';

/**
 * Hook to fetch and manage retailer list with filters
 * Auto-refetches when filters change
 */
export function useRetailers(filters: RetailerFilters = {}) {
  const [retailers, setRetailers] = useState<RetailerWithEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRetailers = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const { data, error: fetchError } = await fetchRetailers(filters);

      if (fetchError) {
        setError(fetchError);
        return;
      }

      setRetailers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load retailers');
      console.error('Error loading retailers:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    loadRetailers();
  }, [loadRetailers]);

  const refresh = useCallback(() => {
    loadRetailers(true);
  }, [loadRetailers]);

  return {
    retailers,
    loading,
    refreshing,
    error,
    refresh,
    refetch: loadRetailers,
  };
}

/**
 * Hook to fetch a single retailer by ID with documents
 */
export function useRetailer(id: string | null) {
  const [retailer, setRetailer] = useState<RetailerWithEmail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRetailer = useCallback(async () => {
    if (!id) {
      setRetailer(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await fetchRetailerById(id);

      if (fetchError) {
        setError(fetchError);
        return;
      }

      setRetailer(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load retailer');
      console.error('Error loading retailer:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadRetailer();
  }, [loadRetailer]);

  return {
    retailer,
    loading,
    error,
    refetch: loadRetailer,
  };
}
