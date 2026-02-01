import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../lib/auth-context';
import {
  fetchCartItems,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  getCartCount,
  CartItemWithDetails,
} from '../lib/cart.api';
import { calculateDiscountedPrice } from '../lib/utils';

/**
 * Hook to manage cart operations
 * Provides cart data, operations, and calculated totals
 */
export function useCart() {
  const { retailer } = useAuth();
  const [cartItems, setCartItems] = useState<CartItemWithDetails[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCart = useCallback(async () => {
    if (!retailer?.id) {
      setCartItems([]);
      setCartCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [items, count] = await Promise.all([
        fetchCartItems(retailer.id),
        getCartCount(retailer.id),
      ]);
      setCartItems(items);
      setCartCount(count);
    } catch (err: any) {
      setError(err.message || 'Failed to load cart');
      console.error('Error loading cart:', err);
    } finally {
      setLoading(false);
    }
  }, [retailer?.id]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const addItem = async (itemId: string, quantity: number = 1) => {
    if (!retailer?.id) throw new Error('Not authenticated');
    await addToCart(retailer.id, itemId, quantity);
    await loadCart();
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    await updateCartQuantity(cartItemId, quantity);
    await loadCart();
  };

  const removeItem = async (cartItemId: string) => {
    await removeFromCart(cartItemId);
    await loadCart();
  };

  const clear = async () => {
    if (!retailer?.id) return;
    await clearCart(retailer.id);
    await loadCart();
  };

  // Calculate price for a single cart item (with discount)
  const calculateItemPrice = (cartItem: CartItemWithDetails) => {
    const mrp = cartItem.item.mrp;
    const categoryDiscount = cartItem.item.category?.discount_percent || 0;
    const subcategoryDiscount = cartItem.item.subcategory?.discount_percent;
    return calculateDiscountedPrice(mrp, categoryDiscount, subcategoryDiscount);
  };

  // Calculate subtotal for all items in cart
  const subtotal = cartItems.reduce((sum, cartItem) => {
    return sum + (calculateItemPrice(cartItem) * cartItem.quantity);
  }, 0);

  return {
    cartItems,
    cartCount,
    loading,
    error,
    addItem,
    updateQuantity,
    removeItem,
    clear,
    refetch: loadCart,
    subtotal,
    calculateItemPrice,
  };
}
