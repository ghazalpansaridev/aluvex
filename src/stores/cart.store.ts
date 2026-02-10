import { create } from 'zustand';
import {
  fetchCartItems,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  CartItemWithDetails,
} from '../lib/cart.api';
import { calculateDiscountedPrice } from '../lib/utils';

interface CartState {
  cartItems: CartItemWithDetails[];
  cartCount: number;
  loading: boolean;
  error: string | null;
  /** Tracks which retailer's cart is loaded to avoid stale cross-user data */
  _retailerId: string | null;
}

interface CartActions {
  loadCart: (retailerId: string) => Promise<void>;
  addItem: (retailerId: string, itemId: string, quantity?: number) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  clear: (retailerId: string) => Promise<void>;
  reset: () => void;
}

type CartStore = CartState & CartActions;

const initialState: CartState = {
  cartItems: [],
  cartCount: 0,
  loading: true,
  error: null,
  _retailerId: null,
};

/** Sum of all item quantities in cart */
const totalQuantity = (items: CartItemWithDetails[]): number =>
  items.reduce((sum, ci) => sum + ci.quantity, 0);

export const useCartStore = create<CartStore>((set, get) => ({
  ...initialState,

  loadCart: async (retailerId: string) => {
    if (!retailerId) {
      set({ cartItems: [], cartCount: 0, loading: false, _retailerId: null });
      return;
    }

    try {
      set({ loading: true, error: null, _retailerId: retailerId });
      const items = await fetchCartItems(retailerId);
      // Only apply if still the same retailer (guard against race conditions)
      if (get()._retailerId === retailerId) {
        set({ cartItems: items, cartCount: totalQuantity(items), loading: false });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load cart';
      console.error('Error loading cart:', err);
      if (get()._retailerId === retailerId) {
        set({ error: message, loading: false });
      }
    }
  },

  addItem: async (retailerId: string, itemId: string, quantity: number = 1) => {
    const prev = { cartItems: get().cartItems, cartCount: get().cartCount };

    // Optimistic update — always increment total quantity count
    const existingItem = prev.cartItems.find(ci => ci.item_id === itemId);
    if (existingItem) {
      const updatedItems = prev.cartItems.map(ci =>
        ci.item_id === itemId
          ? { ...ci, quantity: ci.quantity + quantity }
          : ci
      );
      set({ cartItems: updatedItems, cartCount: totalQuantity(updatedItems) });
    } else {
      // New item — add quantity to total
      set({ cartCount: prev.cartCount + quantity });
    }

    try {
      await addToCart(retailerId, itemId, quantity);
      // Reconcile with server
      const items = await fetchCartItems(retailerId);
      if (get()._retailerId === retailerId) {
        set({ cartItems: items, cartCount: totalQuantity(items) });
      }
    } catch (err: unknown) {
      // Rollback on error
      console.error('Failed to add item to cart:', err);
      set({ cartItems: prev.cartItems, cartCount: prev.cartCount });
      throw err;
    }
  },

  updateQuantity: async (cartItemId: string, quantity: number) => {
    const prev = { cartItems: get().cartItems, cartCount: get().cartCount };
    const retailerId = get()._retailerId;

    // Optimistic update
    if (quantity <= 0) {
      const updatedItems = prev.cartItems.filter(ci => ci.id !== cartItemId);
      set({ cartItems: updatedItems, cartCount: totalQuantity(updatedItems) });
    } else {
      const updatedItems = prev.cartItems.map(ci =>
        ci.id === cartItemId ? { ...ci, quantity } : ci
      );
      set({ cartItems: updatedItems, cartCount: totalQuantity(updatedItems) });
    }

    try {
      await updateCartQuantity(cartItemId, quantity);
      // Reconcile with server
      if (retailerId) {
        const items = await fetchCartItems(retailerId);
        if (get()._retailerId === retailerId) {
          set({ cartItems: items, cartCount: totalQuantity(items) });
        }
      }
    } catch (err: unknown) {
      // Rollback on error
      console.error('Failed to update cart quantity:', err);
      set({ cartItems: prev.cartItems, cartCount: prev.cartCount });
      throw err;
    }
  },

  removeItem: async (cartItemId: string) => {
    const prev = { cartItems: get().cartItems, cartCount: get().cartCount };
    const retailerId = get()._retailerId;

    // Optimistic update
    const updatedItems = prev.cartItems.filter(ci => ci.id !== cartItemId);
    set({ cartItems: updatedItems, cartCount: totalQuantity(updatedItems) });

    try {
      await removeFromCart(cartItemId);
      // Reconcile with server
      if (retailerId) {
        const items = await fetchCartItems(retailerId);
        if (get()._retailerId === retailerId) {
          set({ cartItems: items, cartCount: totalQuantity(items) });
        }
      }
    } catch (err: unknown) {
      // Rollback on error
      console.error('Failed to remove cart item:', err);
      set({ cartItems: prev.cartItems, cartCount: prev.cartCount });
      throw err;
    }
  },

  clear: async (retailerId: string) => {
    const prev = { cartItems: get().cartItems, cartCount: get().cartCount };

    // Optimistic update
    set({ cartItems: [], cartCount: 0 });

    try {
      await clearCart(retailerId);
    } catch (err: unknown) {
      // Rollback on error
      console.error('Failed to clear cart:', err);
      set({ cartItems: prev.cartItems, cartCount: prev.cartCount });
      throw err;
    }
  },

  reset: () => {
    set(initialState);
  },
}));

// --- Selectors ---

/** Get quantity of a specific item in cart */
export const selectItemQuantity = (state: CartState, itemId: string): number => {
  const cartItem = state.cartItems.find(ci => ci.item_id === itemId);
  return cartItem?.quantity || 0;
};

/** Get cart item ID for a specific item */
export const selectCartItemId = (state: CartState, itemId: string): string | undefined => {
  const cartItem = state.cartItems.find(ci => ci.item_id === itemId);
  return cartItem?.id;
};

/** Calculate price for a single cart item (with discount) */
export const calculateItemPrice = (cartItem: CartItemWithDetails): number => {
  const mrp = cartItem.item.mrp;
  const categoryDiscount = cartItem.item.category?.discount_percent || 0;
  const subcategoryDiscount = cartItem.item.subcategory?.discount_percent;
  return calculateDiscountedPrice(mrp, categoryDiscount, subcategoryDiscount);
};

/** Calculate subtotal for all items in cart */
export const selectSubtotal = (state: CartState): number => {
  return state.cartItems.reduce((sum, cartItem) => {
    return sum + calculateItemPrice(cartItem) * cartItem.quantity;
  }, 0);
};
