import { useEffect, useCallback } from 'react';
import { useAuth } from '../lib/auth-context';
import { CartItemWithDetails } from '../lib/cart.api';
import {
  useCartStore,
  selectItemQuantity,
  selectCartItemId,
  calculateItemPrice,
  selectSubtotal,
} from '../stores/cart.store';

/**
 * Hook to manage cart operations
 * Thin wrapper around the Zustand cart store.
 * Provides cart data, operations, and calculated totals.
 * All consumers share the same global state so updates
 * (e.g. badge count) propagate instantly.
 */
export function useCart() {
  const { retailer } = useAuth();

  // Read from the global Zustand store
  const cartItems = useCartStore(s => s.cartItems);
  const cartCount = useCartStore(s => s.cartCount);
  const loading = useCartStore(s => s.loading);
  const error = useCartStore(s => s.error);
  const storeRetailerId = useCartStore(s => s._retailerId);

  // Store actions (stable references — Zustand actions never change identity)
  const storeLoadCart = useCartStore(s => s.loadCart);
  const storeAddItem = useCartStore(s => s.addItem);
  const storeUpdateQuantity = useCartStore(s => s.updateQuantity);
  const storeRemoveItem = useCartStore(s => s.removeItem);
  const storeClear = useCartStore(s => s.clear);
  const storeReset = useCartStore(s => s.reset);

  // Load cart when retailer changes or on first mount
  useEffect(() => {
    if (!retailer?.id) {
      storeReset();
      return;
    }
    // Only reload if retailer changed or store was never initialized
    if (storeRetailerId !== retailer.id) {
      storeLoadCart(retailer.id);
    }
  }, [retailer?.id, storeRetailerId, storeLoadCart, storeReset]);

  // --- Actions that bind retailerId automatically ---

  const addItem = useCallback(
    async (itemId: string, quantity: number = 1) => {
      if (!retailer?.id) throw new Error('Not authenticated');
      await storeAddItem(retailer.id, itemId, quantity);
    },
    [retailer?.id, storeAddItem]
  );

  const updateQuantity = useCallback(
    async (cartItemId: string, quantity: number) => {
      await storeUpdateQuantity(cartItemId, quantity);
    },
    [storeUpdateQuantity]
  );

  const removeItem = useCallback(
    async (cartItemId: string) => {
      await storeRemoveItem(cartItemId);
    },
    [storeRemoveItem]
  );

  const clear = useCallback(async () => {
    if (!retailer?.id) return;
    await storeClear(retailer.id);
  }, [retailer?.id, storeClear]);

  const refetch = useCallback(async () => {
    if (!retailer?.id) return;
    await storeLoadCart(retailer.id);
  }, [retailer?.id, storeLoadCart]);

  // --- Derived values ---

  const subtotal = selectSubtotal({ cartItems, cartCount, loading, error, _retailerId: storeRetailerId });

  const getItemQuantity = useCallback(
    (itemId: string): number => {
      return selectItemQuantity({ cartItems, cartCount, loading, error, _retailerId: storeRetailerId }, itemId);
    },
    [cartItems, cartCount, loading, error, storeRetailerId]
  );

  const getCartItemId = useCallback(
    (itemId: string): string | undefined => {
      return selectCartItemId({ cartItems, cartCount, loading, error, _retailerId: storeRetailerId }, itemId);
    },
    [cartItems, cartCount, loading, error, storeRetailerId]
  );

  return {
    cartItems,
    cartCount,
    loading,
    error,
    addItem,
    updateQuantity,
    removeItem,
    clear,
    refetch,
    subtotal,
    calculateItemPrice,
    getItemQuantity,
    getCartItemId,
  };
}
