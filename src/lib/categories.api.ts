import { supabase } from './supabase';
import { Category, Subcategory } from '../types/database';

export interface CategoryWithSubcategories extends Category {
  subcategories: Subcategory[];
}

/**
 * Fetch all active categories with their active subcategories
 * Used for retailer catalog filtering
 */
export async function fetchCategories(): Promise<CategoryWithSubcategories[]> {
  const { data, error } = await supabase
    .from('categories')
    .select(`
      *,
      subcategories(*)
    `)
    .eq('status', 'active')
    .order('name');

  if (error) throw error;

  // Filter out inactive subcategories
  return (data || []).map(cat => ({
    ...cat,
    subcategories: (cat.subcategories || []).filter(
      (sub: Subcategory) => sub.status === 'active'
    ),
  }));
}

/**
 * Fetch all categories (including inactive) for admin/ops
 * Used for items management
 */
export async function fetchAllCategories(): Promise<CategoryWithSubcategories[]> {
  const { data, error } = await supabase
    .from('categories')
    .select(`
      *,
      subcategories(*)
    `)
    .order('name');

  if (error) throw error;
  return data || [];
}

/**
 * Fetch single category by ID with subcategories
 */
export async function fetchCategoryById(id: string): Promise<CategoryWithSubcategories | null> {
  const { data, error } = await supabase
    .from('categories')
    .select(`
      *,
      subcategories(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  return data;
}
