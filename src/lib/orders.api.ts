import { supabase } from './supabase';
import {
  Order,
  OrderItem,
  Retailer,
  OrderWithRetailer,
  OrderDetailsResponse,
  OrderFilters,
  Shipment,
  ShipmentItem,
  OrderStatus,
} from '../types/database';
import { CartItemWithDetails } from './cart.api';
import {
  calculateDiscountedPrice,
  generateShipmentNumber,
  generateInvoiceNumber,
  calculateOrderStatus,
  validateShipmentQuantities,
} from './utils';
import { clearCart } from './cart.api';
import { notificationsApi } from './notifications.api';

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

  // Send notification to admin/ops users
  try {
    console.log('🔔 [Notification] Starting notification flow for order:', orderNumber);
    console.log('🔔 [Notification] Order ID:', order.id);
    console.log('🔔 [Notification] Retailer ID:', retailerId);
    
    // Get retailer info
    const { data: retailer, error: retailerError } = await supabase
      .from('retailers')
      .select('business_name, user_id')
      .eq('id', retailerId)
      .single();
    
    console.log('🔔 [Notification] Retailer data:', { 
      business_name: retailer?.business_name,
      has_user_id: !!retailer?.user_id,
      error: retailerError 
    });

    // Get all active admin/ops users using database function (bypasses RLS)
    console.log('🔔 [Notification] Querying active admin/ops users...');
    const { data: adminOpsUsers, error: staffError } = await supabase
      .rpc('get_active_admin_ops_users');
    
    console.log('🔔 [Notification] Staff users query result:', { 
      count: adminOpsUsers?.length || 0, 
      users: adminOpsUsers?.map((u: any) => ({ 
        user_id: u.user_id, 
        role: u.role,
        name: `${u.first_name} ${u.last_name}`
      })),
      error: staffError?.message || null
    });

    if (staffError) {
      console.error('🔔 [Notification] ERROR querying staff users:', staffError);
      throw staffError;
    }

    if (adminOpsUsers && adminOpsUsers.length > 0) {
      console.log('🔔 [Notification] Sending to', adminOpsUsers.length, 'admin/ops users');
      
      for (const staffUser of adminOpsUsers) {
        console.log('🔔 [Notification] Attempting to send to:', {
          user_id: staffUser.user_id,
          role: staffUser.role,
          name: `${staffUser.first_name} ${staffUser.last_name}`
        });
        
        try {
          await notificationsApi.sendNotificationWithPush({
            userId: staffUser.user_id,
            type: 'new_order',
            title: 'New Order Received',
            body: `Order #${orderNumber} from ${retailer?.business_name || 'Retailer'}`,
            data: {
              related_entity_type: 'order',
              related_entity_id: order.id,
            },
          });
          
          console.log('✅ [Notification] Successfully sent to:', staffUser.user_id);
        } catch (sendError: any) {
          console.error('❌ [Notification] Failed to send to user:', staffUser.user_id);
          console.error('❌ [Notification] Error details:', sendError?.message || sendError);
        }
      }
      
      console.log('🔔 [Notification] Notification flow completed for all users');
    } else {
      console.log('⚠️  [Notification] WARNING: No active admin/ops users found!');
      console.log('⚠️  [Notification] Please check:');
      console.log('   1. staff_users table has records with role="admin" or "operations"');
      console.log('   2. Those users have status="active"');
      console.log('   3. The database function get_active_admin_ops_users() exists');
    }
  } catch (notifError: any) {
    // Don't fail order creation if notification fails
    console.error('❌ [Notification] CRITICAL ERROR in notification flow:', notifError?.message || notifError);
    console.error('❌ [Notification] Stack trace:', notifError?.stack);
  }

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
      id,
      order_number,
      retailer_id,
      status,
      subtotal,
      total_freight,
      grand_total,
      delivery_address,
      cancellation_reason,
      cancelled_at,
      created_at,
      updated_at,
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
    .select(`
      id,
      order_number,
      retailer_id,
      status,
      subtotal,
      total_freight,
      grand_total,
      delivery_address,
      cancellation_reason,
      cancelled_at,
      created_at,
      updated_at
    `)
    .eq('retailer_id', retailerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch all orders with filters (admin/ops view)
 * Includes retailer details and order items
 */
export async function fetchAllOrders(
  filters?: OrderFilters
): Promise<OrderWithRetailer[]> {
  let query = supabase
    .from('orders')
    .select(`
      id,
      order_number,
      retailer_id,
      status,
      subtotal,
      total_freight,
      grand_total,
      delivery_address,
      cancellation_reason,
      cancelled_at,
      created_at,
      updated_at,
      retailer:retailers(
        id,
        retailer_code,
        business_name,
        owner_phone,
        pincode,
        city,
        state,
        credit_limit,
        outstanding_dues
      ),
      items:order_items(*)
    `);

  // Apply filters
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.retailerId) {
    query = query.eq('retailer_id', filters.retailerId);
  }

  if (filters?.pincode) {
    query = query.eq('retailers.pincode', filters.pincode);
  }

  if (filters?.dateRange) {
    query = query
      .gte('created_at', filters.dateRange.start)
      .lte('created_at', filters.dateRange.end);
  }

  if (filters?.searchQuery) {
    // Search in order number or retailer business name
    query = query.or(
      `order_number.ilike.%${filters.searchQuery}%,retailer.business_name.ilike.%${filters.searchQuery}%`
    );
  }

  // Order by created_at descending (newest first)
  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) throw error;
  return (data || []) as OrderWithRetailer[];
}

/**
 * Fetch order details with full shipment history
 * Used for order processing screen
 */
export async function fetchOrderDetails(
  orderId: string
): Promise<OrderDetailsResponse | null> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      retailer_id,
      status,
      subtotal,
      total_freight,
      grand_total,
      delivery_address,
      cancellation_reason,
      cancelled_at,
      created_at,
      updated_at,
      retailer:retailers(
        id,
        retailer_code,
        business_name,
        owner_name,
        owner_phone,
        business_address,
        pincode,
        city,
        state,
        credit_limit,
        outstanding_dues
      ),
      items:order_items(*),
      shipments(
        id,
        order_id,
        shipment_number,
        freight_charge,
        notes,
        invoice_number,
        invoice_url,
        created_at,
        items:shipment_items(*)
      )
    `)
    .eq('id', orderId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  // Calculate remaining quantities for each order item
  const itemsWithRemaining = data.items.map((item: OrderItem) => ({
    ...item,
    remaining_quantity: item.quantity - item.shipped_quantity,
    shipment_items: [],
  }));

  return {
    ...data,
    items: itemsWithRemaining,
  } as OrderDetailsResponse;
}

/**
 * Create shipment for order items
 * Steps:
 * 1. Validate shipment quantities
 * 2. Check stock availability
 * 3. Create shipment record
 * 4. Create shipment_items records
 * 5. Update order_items.shipped_quantity
 * 6. Update order status
 * 7. Update order totals
 * 8. Deduct from item stock
 */
export async function createShipment(data: {
  orderId: string;
  items: Array<{ orderItemId: string; itemId: string; quantity: number; unitPrice: number }>;
  freightCharge: number;
  notes?: string;
  createdBy: string;
}): Promise<Shipment> {
  if (data.items.length === 0) {
    throw new Error('At least one item is required for shipment');
  }

  if (data.freightCharge < 0) {
    throw new Error('Freight charge must be 0 or greater');
  }

  // Fetch order items to validate quantities
  const { data: orderItems, error: orderItemsError } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', data.orderId);

  if (orderItemsError) throw orderItemsError;

  // Validate shipment quantities
  const validation = validateShipmentQuantities(
    orderItems,
    data.items.map(i => ({ orderItemId: i.orderItemId, quantity: i.quantity }))
  );

  if (!validation.valid) {
    throw new Error(validation.errors.join('; '));
  }

  // Check stock availability for each item
  const itemIds = data.items.map(i => i.itemId);
  const { data: items, error: itemsError } = await supabase
    .from('items')
    .select('id, current_stock, name')
    .in('id', itemIds);

  if (itemsError) throw itemsError;

  for (const shipmentItem of data.items) {
    const item = items.find(i => i.id === shipmentItem.itemId);
    if (!item) {
      throw new Error(`Item not found: ${shipmentItem.itemId}`);
    }
    if (item.current_stock < shipmentItem.quantity) {
      throw new Error(
        `Insufficient stock for ${item.name}. Available: ${item.current_stock}, Requested: ${shipmentItem.quantity}`
      );
    }
  }

  // Generate shipment and invoice numbers
  const shipmentNumber = generateShipmentNumber();
  const invoiceNumber = generateInvoiceNumber();

  // Create shipment record
  const { data: shipment, error: shipmentError } = await supabase
    .from('shipments')
    .insert({
      order_id: data.orderId,
      shipment_number: shipmentNumber,
      freight_charge: data.freightCharge,
      notes: data.notes,
      invoice_number: invoiceNumber,
      created_by: data.createdBy,
    })
    .select()
    .single();

  if (shipmentError) throw shipmentError;

  // Create shipment_items records
  const shipmentItemsData = data.items.map(item => ({
    shipment_id: shipment.id,
    order_item_id: item.orderItemId,
    item_id: item.itemId,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    line_total: item.quantity * item.unitPrice,
  }));

  const { error: shipmentItemsError } = await supabase
    .from('shipment_items')
    .insert(shipmentItemsData);

  if (shipmentItemsError) throw shipmentItemsError;

  // Update order_items.shipped_quantity
  for (const item of data.items) {
    const orderItem = orderItems.find(oi => oi.id === item.orderItemId);
    if (!orderItem) continue;

    const newShippedQuantity = orderItem.shipped_quantity + item.quantity;
    
    const { error: updateError } = await supabase
      .from('order_items')
      .update({ shipped_quantity: newShippedQuantity })
      .eq('id', item.orderItemId);

    if (updateError) throw updateError;
  }

  // Fetch updated order items to calculate new status
  const { data: updatedOrderItems, error: updatedError } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', data.orderId);

  if (updatedError) throw updatedError;

  // Fetch current order to update totals
  const { data: currentOrder, error: orderError } = await supabase
    .from('orders')
    .select('total_freight, subtotal, status')
    .eq('id', data.orderId)
    .single();

  if (orderError) throw orderError;

  // Calculate new order status (pass current status to preserve 'processing')
  const newStatus = calculateOrderStatus(updatedOrderItems, currentOrder.status as OrderStatus);

  // Update order with new status and totals
  const newTotalFreight = currentOrder.total_freight + data.freightCharge;
  const newGrandTotal = currentOrder.subtotal + newTotalFreight;

  const { error: orderUpdateError } = await supabase
    .from('orders')
    .update({
      status: newStatus,
      total_freight: newTotalFreight,
      grand_total: newGrandTotal,
    })
    .eq('id', data.orderId);

  if (orderUpdateError) throw orderUpdateError;

  // Deduct shipped quantities from item stock
  for (const shipmentItem of data.items) {
    const item = items.find(i => i.id === shipmentItem.itemId);
    if (!item) continue;

    const newStock = item.current_stock - shipmentItem.quantity;
    
    const { error: stockError } = await supabase
      .from('items')
      .update({ current_stock: newStock })
      .eq('id', shipmentItem.itemId);

    if (stockError) throw stockError;
  }

  // TODO: Create payment debit transaction if credit limit assigned
  // TODO: Generate invoice PDF

  // Send notification to retailer
  try {
    // Get order with retailer info
    const { data: orderWithRetailer } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        retailer:retailers!orders_retailer_id_fkey(user_id)
      `)
      .eq('id', data.orderId)
      .single();

    if (orderWithRetailer && orderWithRetailer.retailer) {
      const retailer = orderWithRetailer.retailer as any;
      await notificationsApi.sendNotificationWithPush({
        userId: retailer.user_id,
        type: 'order_shipped',
        title: 'Order Shipped',
        body: `Your order #${orderWithRetailer.order_number} has been shipped`,
        data: {
          related_entity_type: 'shipment',
          related_entity_id: shipment.id,
        },
      });
    }
  } catch (notifError) {
    // Don't fail shipment creation if notification fails
    console.error('Error sending shipment notification:', notifError);
  }

  return shipment;
}

/**
 * Cancel order
 * Can only cancel orders with status 'placed' or 'partially_shipped'
 */
export async function cancelOrder(
  orderId: string,
  reason: string,
  cancelledBy: string
): Promise<Order> {
  if (!reason || reason.trim().length === 0) {
    throw new Error('Cancellation reason is required');
  }

  // Fetch order to check current status
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .single();

  if (fetchError) throw fetchError;

  if (order.status === 'cancelled') {
    throw new Error('Order is already cancelled');
  }

  if (order.status === 'shipped') {
    throw new Error('Cannot cancel a fully shipped order');
  }

  // Update order status to cancelled
  const { data: cancelledOrder, error: cancelError } = await supabase
    .from('orders')
    .update({
      status: 'cancelled',
      cancellation_reason: reason,
      cancelled_by: cancelledBy,
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .select(`
      id,
      order_number,
      retailer_id,
      status,
      subtotal,
      total_freight,
      grand_total,
      delivery_address,
      cancellation_reason,
      cancelled_at,
      created_at,
      updated_at
    `)
    .single();

  if (cancelError) throw cancelError;

  // TODO: If credit limit assigned, reverse debit transaction

  // Send notification to retailer
  try {
    // Get order with retailer info
    const { data: orderWithRetailer } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        retailer:retailers!orders_retailer_id_fkey(user_id)
      `)
      .eq('id', orderId)
      .single();

    if (orderWithRetailer && orderWithRetailer.retailer) {
      const retailer = orderWithRetailer.retailer as any;
      await notificationsApi.sendNotificationWithPush({
        userId: retailer.user_id,
        type: 'order_cancelled',
        title: 'Order Cancelled',
        body: `Order #${orderWithRetailer.order_number} has been cancelled. Reason: ${reason}`,
        data: {
          related_entity_type: 'order',
          related_entity_id: orderId,
        },
      });
    }
  } catch (notifError) {
    // Don't fail cancellation if notification fails
    console.error('Error sending cancellation notification:', notifError);
  }

  return cancelledOrder;
}

/**
 * Update order status
 * Used for quick status updates (e.g., processing an order)
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select(`
      id,
      order_number,
      retailer_id,
      status,
      subtotal,
      total_freight,
      grand_total,
      delivery_address,
      cancellation_reason,
      cancelled_at,
      created_at,
      updated_at
    `)
    .single();

  if (error) throw error;
  return data;
}
