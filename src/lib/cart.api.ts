import { supabase } from './supabase';
import { CartItem, Item, ItemImage } from '../types/database';
import { fetchItemById } from './items.api';

export interface CartItemWithDetails extends CartItem {
  item: Item & {
    category: { discount_percent: number };
    subcategory?: { discount_percent: number };
    images: ItemImage[];
  };
}

/**
 * Fetch cart items for a retailer with full item details
 */
export async function fetchCartItems(retailerId: string): Promise<CartItemWithDetails[]> {
  const { data, error } = await supabase
    .from('cart_items')
    .select(`
      *,
      item:items(
        *,
        category:categories(id, name, discount_percent),
        subcategory:subcategories(id, name, discount_percent),
        images:item_images(id, image_url, is_primary, sort_order)
      )
    `)
    .eq('retailer_id', retailerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Add item to cart
 * If item already exists, updates quantity
 * Validates pincode availability
 */
export async function addToCart(
  retailerId: string,
  itemId: string,
  quantity: number
): Promise<CartItem> {
  // Validate item exists and get pincode info
  const item = await fetchItemById(itemId);
  if (!item) {
    throw new Error('Product not available');
  }

  // Get retailer's pincode
  const { data: retailer, error: retailerError } = await supabase
    .from('retailers')
    .select('pincode')
    .eq('id', retailerId)
    .single();

  if (retailerError) throw retailerError;

  // Validate item is available in retailer's pincode
  if (!item.available_pincodes.includes(retailer.pincode)) {
    throw new Error('Item unavailable at your location');
  }

  // Check if item already in cart
  const { data: existing } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('retailer_id', retailerId)
    .eq('item_id', itemId)
    .maybeSingle();

  if (existing) {
    // Update quantity
    const { data, error } = await supabase
      .from('cart_items')
      .update({ 
        quantity: existing.quantity + quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Insert new cart item
  const { data, error } = await supabase
    .from('cart_items')
    .insert({ retailer_id: retailerId, item_id: itemId, quantity })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update cart item quantity
 * If quantity <= 0, removes the item
 */
export async function updateCartQuantity(
  cartItemId: string,
  quantity: number
): Promise<CartItem | null> {
  if (quantity <= 0) {
    await removeFromCart(cartItemId);
    return null;
  }

  const { data, error } = await supabase
    .from('cart_items')
    .update({ 
      quantity,
      updated_at: new Date().toISOString()
    })
    .eq('id', cartItemId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Remove item from cart
 */
export async function removeFromCart(cartItemId: string): Promise<void> {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', cartItemId);

  if (error) throw error;
}

/**
 * Clear all items from cart
 */
export async function clearCart(retailerId: string): Promise<void> {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('retailer_id', retailerId);

  if (error) throw error;
}

/**
 * Get cart count for badge
 */
export async function getCartCount(retailerId: string): Promise<number> {
  const { count, error } = await supabase
    .from('cart_items')
    .select('*', { count: 'exact', head: true })
    .eq('retailer_id', retailerId);

  if (error) throw error;
  return count || 0;
}
