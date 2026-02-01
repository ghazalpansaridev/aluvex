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
