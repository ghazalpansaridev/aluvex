import { useState, useEffect } from 'react';
import { fetchCategories, fetchAllCategories, CategoryWithSubcategories } from '../lib/categories.api';

/**
 * Hook to fetch categories with subcategories
 * @param includeInactive - If true, fetches all categories including inactive ones (for admin)
 */
export function useCategories(includeInactive: boolean = false) {
  const [categories, setCategories] = useState<CategoryWithSubcategories[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = includeInactive 
          ? await fetchAllCategories() 
          : await fetchCategories();
        setCategories(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load categories');
        console.error('Error loading categories:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, [includeInactive]);

  return { categories, loading, error };
}
