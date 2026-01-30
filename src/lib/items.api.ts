import { supabase } from './supabase';
import { Item, ItemImage, Category, Subcategory } from '../types/database';

export interface ItemWithDetails extends Item {
  category: Category;
  subcategory?: Subcategory;
  images: ItemImage[];
  available_pincodes: string[];
}

export interface ItemFilters {
  categoryId?: string;
  subcategoryId?: string;
  pincode?: string;
  status?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}

/**
 * Fetch items with filters and related data
 * Returns items with joined category, subcategory, images, and pincodes
 */
export async function fetchItems(filters: ItemFilters = {}): Promise<ItemWithDetails[]> {
  let query = supabase
    .from('items')
    .select(`
      *,
      category:categories(*),
      subcategory:subcategories(*),
      images:item_images(*),
      item_pincodes(pincode)
    `)
    .order('created_at', { ascending: false });

  // Filter by status (default to active)
  if (filters.status) {
    query = query.eq('status', filters.status);
  } else {
    query = query.eq('status', 'active');
  }

  // Filter by category
  if (filters.categoryId) {
    query = query.eq('category_id', filters.categoryId);
  }

  // Filter by subcategory
  if (filters.subcategoryId) {
    query = query.eq('subcategory_id', filters.subcategoryId);
  }

  // Search by name or SKU
  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);
  }

  // Filter by price range
  if (filters.minPrice !== undefined) {
    query = query.gte('mrp', filters.minPrice);
  }

  if (filters.maxPrice !== undefined) {
    query = query.lte('mrp', filters.maxPrice);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Transform data to include pincodes array
  const items = (data || []).map((item: any) => ({
    ...item,
    available_pincodes: item.item_pincodes?.map((p: any) => p.pincode) || [],
  }));

  // Filter by pincode if provided (post-query filter)
  if (filters.pincode) {
    return items.filter((item: ItemWithDetails) => 
      item.available_pincodes.includes(filters.pincode!)
    );
  }

  return items;
}

/**
 * Fetch single item by ID with all relationships
 * Used for product detail view
 */
export async function fetchItemById(id: string): Promise<ItemWithDetails | null> {
  const { data, error } = await supabase
    .from('items')
    .select(`
      *,
      category:categories(*),
      subcategory:subcategories(*),
      images:item_images(*),
      item_pincodes(pincode)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  return {
    ...data,
    available_pincodes: data.item_pincodes?.map((p: any) => p.pincode) || [],
  };
}

/**
 * Create new item (Ops/Admin only)
 */
export async function createItem(item: Partial<Item>): Promise<Item> {
  const { data, error } = await supabase
    .from('items')
    .insert(item)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update item (Ops/Admin only)
 */
export async function updateItem(id: string, updates: Partial<Item>): Promise<Item> {
  const { data, error } = await supabase
    .from('items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete item (soft delete - set status to inactive)
 */
export async function deleteItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('items')
    .update({ status: 'inactive' })
    .eq('id', id);

  if (error) throw error;
}

/**
 * Manage item pincodes
 * Replaces all pincodes for an item
 */
export async function setItemPincodes(itemId: string, pincodes: string[]): Promise<void> {
  // Delete existing pincodes
  await supabase.from('item_pincodes').delete().eq('item_id', itemId);

  // Insert new pincodes
  if (pincodes.length > 0) {
    const { error } = await supabase.from('item_pincodes').insert(
      pincodes.map(pincode => ({ item_id: itemId, pincode }))
    );
    if (error) throw error;
  }
}

/**
 * Upload item image to Supabase Storage
 */
export async function uploadItemImage(
  itemId: string,
  file: { uri: string; name: string; type: string },
  isPrimary: boolean = false
): Promise<ItemImage> {
  const fileName = `${itemId}/${Date.now()}-${file.name}`;
  
  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('item-images')
    .upload(fileName, {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);

  if (uploadError) throw uploadError;

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('item-images')
    .getPublicUrl(fileName);

  // If setting as primary, unset other primary images
  if (isPrimary) {
    await supabase
      .from('item_images')
      .update({ is_primary: false })
      .eq('item_id', itemId);
  }

  // Get max sort order
  const { data: maxOrder } = await supabase
    .from('item_images')
    .select('sort_order')
    .eq('item_id', itemId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single();

  // Insert image record
  const { data, error } = await supabase
    .from('item_images')
    .insert({
      item_id: itemId,
      image_url: urlData.publicUrl,
      is_primary: isPrimary,
      sort_order: (maxOrder?.sort_order || 0) + 1,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete item image
 */
export async function deleteItemImage(imageId: string): Promise<void> {
  const { error } = await supabase
    .from('item_images')
    .delete()
    .eq('id', imageId);

  if (error) throw error;
}
