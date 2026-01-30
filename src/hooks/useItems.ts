import { useState, useEffect, useCallback } from 'react';
import { fetchItems, fetchItemById, ItemWithDetails, ItemFilters } from '../lib/items.api';

/**
 * Hook to fetch and manage items with filters
 * Auto-refetches when filters change
 */
export function useItems(filters: ItemFilters = {}) {
  const [items, setItems] = useState<ItemWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchItems(filters);
      setItems(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load items');
      console.error('Error loading items:', err);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]); // Stringify to properly compare filter objects

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  return { items, loading, error, refetch: loadItems };
}

/**
 * Hook to fetch a single item by ID
 */
export function useItem(id: string | null) {
  const [item, setItem] = useState<ItemWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setItem(null);
      setLoading(false);
      return;
    }

    const loadItem = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchItemById(id);
        setItem(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load item');
        console.error('Error loading item:', err);
      } finally {
        setLoading(false);
      }
    };

    loadItem();
  }, [id]);

  return { item, loading, error };
}
