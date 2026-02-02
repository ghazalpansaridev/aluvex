// Utility functions for the application

/**
 * Calculate discounted price based on MRP and discount percentages
 * Priority: subcategory discount > category discount
 */
export function calculateDiscountedPrice(
  mrp: number,
  categoryDiscount: number,
  subcategoryDiscount?: number
): number {
  const discount = subcategoryDiscount && subcategoryDiscount > 0 
    ? subcategoryDiscount 
    : categoryDiscount;
  return Math.round((mrp - (mrp * discount / 100)) * 100) / 100;
}

/**
 * Format price for display in Indian Rupee format
 * Example: 1800 -> ₹1,800
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format discount percentage for display
 * Example: 10 -> "10% OFF"
 */
export function formatDiscount(percent: number): string {
  return `${percent}% OFF`;
}

/**
 * Get primary image URL or fallback to first image or placeholder
 */
export function getPrimaryImage(
  images: { image_url: string; is_primary: boolean }[] | undefined
): string {
  if (!images || images.length === 0) {
    return 'https://via.placeholder.com/400x400?text=No+Image';
  }
  const primary = images.find(img => img.is_primary);
  return primary?.image_url || images[0].image_url;
}

/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Get stock status with label and variant for Badge component
 */
export function getStockStatus(currentStock: number, minStock: number): {
  label: string;
  variant: 'success' | 'warning' | 'error';
} {
  if (currentStock <= 0) {
    return { label: 'Out of Stock', variant: 'error' };
  }
  if (currentStock <= minStock) {
    return { label: 'Low Stock', variant: 'warning' };
  }
  return { label: 'In Stock', variant: 'success' };
}

/**
 * Debounce function for search input and other delayed operations
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Generate shipment number in format: SHP-YYYYMMDD-XXXXX
 */
export function generateShipmentNumber(): string {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const randomNum = Math.floor(Math.random() * 99999) + 1;
  return `SHP-${dateStr}-${randomNum.toString().padStart(5, '0')}`;
}

/**
 * Generate invoice number in format: INV-YYYYMMDD-XXXXX
 */
export function generateInvoiceNumber(): string {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const randomNum = Math.floor(Math.random() * 99999) + 1;
  return `INV-${dateStr}-${randomNum.toString().padStart(5, '0')}`;
}

/**
 * Calculate order status based on order items
 * Rules:
 * - Placed: No shipments (all shipped_quantity = 0)
 * - Processing: Admin acknowledged, no shipments yet
 * - Partially Shipped: Some items shipped but not all
 * - Shipped: All items fully shipped (quantity = shipped_quantity for all)
 */
export function calculateOrderStatus(
  orderItems: Array<{ quantity: number; shipped_quantity: number }>,
  currentStatus?: 'placed' | 'processing' | 'partially_shipped' | 'shipped' | 'cancelled'
): 'placed' | 'processing' | 'partially_shipped' | 'shipped' {
  // If currently processing and no shipments yet, keep as processing
  if (currentStatus === 'processing') {
    const hasShipments = orderItems.some(item => item.shipped_quantity > 0);
    if (!hasShipments) return 'processing';
  }

  const allUnshipped = orderItems.every(item => item.shipped_quantity === 0);
  if (allUnshipped) return currentStatus === 'processing' ? 'processing' : 'placed';

  const allShipped = orderItems.every(
    item => item.shipped_quantity === item.quantity
  );
  if (allShipped) return 'shipped';

  return 'partially_shipped';
}

/**
 * Format date range for filtering
 * @param range - 'last_week' | 'last_month' | 'last_3_months' | 'custom'
 * @returns Object with start and end dates
 */
export function formatDateRange(range: string): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();

  switch (range) {
    case 'last_week':
      start.setDate(start.getDate() - 7);
      break;
    case 'last_month':
      start.setMonth(start.getMonth() - 1);
      break;
    case 'last_3_months':
      start.setMonth(start.getMonth() - 3);
      break;
    default:
      // Default to last week
      start.setDate(start.getDate() - 7);
  }

  return { start, end };
}

/**
 * Validate shipment quantities against order items
 * Ensures quantities don't exceed remaining quantities
 */
export function validateShipmentQuantities(
  orderItems: Array<{ id: string; quantity: number; shipped_quantity: number }>,
  shipmentItems: Array<{ orderItemId: string; quantity: number }>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const shipmentItem of shipmentItems) {
    const orderItem = orderItems.find(oi => oi.id === shipmentItem.orderItemId);
    
    if (!orderItem) {
      errors.push(`Order item ${shipmentItem.orderItemId} not found`);
      continue;
    }

    const remaining = orderItem.quantity - orderItem.shipped_quantity;
    if (shipmentItem.quantity > remaining) {
      errors.push(
        `Cannot ship ${shipmentItem.quantity} units - only ${remaining} remaining`
      );
    }

    if (shipmentItem.quantity <= 0) {
      errors.push(`Shipment quantity must be greater than 0`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
