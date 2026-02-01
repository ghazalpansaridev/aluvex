import { supabase } from './supabase';
import { Order, OrderItem, Retailer } from '../types/database';
import { CartItemWithDetails } from './cart.api';
import { calculateDiscountedPrice } from './utils';
import { clearCart } from './cart.api';

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

/**
 * Generate order number in format: ORD-YYYYMMDD-XXXXX
 */
function generateOrderNumber(): string {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const randomNum = Math.floor(Math.random() * 99999) + 1;
  return `ORD-${dateStr}-${randomNum.toString().padStart(5, '0')}`;
}

/**
 * Create order from cart items
 * Steps:
 * 1. Calculate order totals
 * 2. Create order record with provided delivery address
 * 3. Create order_items records
 * 4. Clear cart
 * 5. Return created order
 */
export async function createOrder(
  retailerId: string,
  cartItems: CartItemWithDetails[],
  deliveryAddress: string
): Promise<OrderWithItems> {
  if (!cartItems || cartItems.length === 0) {
    throw new Error('Cart is empty');
  }

  if (!deliveryAddress) {
    throw new Error('Delivery address is required');
  }

  // Calculate order totals
  const subtotal = cartItems.reduce((sum, cartItem) => {
    const categoryDiscount = cartItem.item.category?.discount_percent || 0;
    const subcategoryDiscount = cartItem.item.subcategory?.discount_percent;
    const itemPrice = calculateDiscountedPrice(
      cartItem.item.mrp,
      categoryDiscount,
      subcategoryDiscount
    );
    return sum + (itemPrice * cartItem.quantity);
  }, 0);

  // Generate order number
  const orderNumber = generateOrderNumber();

  // Create order record
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      retailer_id: retailerId,
      subtotal,
      total_freight: 0,
      grand_total: subtotal,
      delivery_address: deliveryAddress,
      status: 'placed',
    })
    .select()
    .single();

  if (orderError) throw orderError;

  // Create order items
  const orderItemsData = cartItems.map(cartItem => {
    const categoryDiscount = cartItem.item.category?.discount_percent || 0;
    const subcategoryDiscount = cartItem.item.subcategory?.discount_percent;
    const unitPrice = calculateDiscountedPrice(
      cartItem.item.mrp,
      categoryDiscount,
      subcategoryDiscount
    );
    const discountPercent = subcategoryDiscount && subcategoryDiscount > 0
      ? subcategoryDiscount
      : categoryDiscount;

    return {
      order_id: order.id,
      item_id: cartItem.item_id,
      item_name: cartItem.item.name,
      item_sku: cartItem.item.sku,
      quantity: cartItem.quantity,
      unit_price: unitPrice,
      discount_percent: discountPercent,
      line_total: unitPrice * cartItem.quantity,
    };
  });

  const { data: orderItems, error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItemsData)
    .select();

  if (itemsError) throw itemsError;

  // Clear cart
  await clearCart(retailerId);

  // Return order with items
  return {
    ...order,
    items: orderItems,
  };
}

/**
 * Fetch order by ID with items
 */
export async function fetchOrderById(orderId: string): Promise<OrderWithItems | null> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      items:order_items(*)
    `)
    .eq('id', orderId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

/**
 * Fetch orders for a retailer
 */
export async function fetchOrders(retailerId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('retailer_id', retailerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
