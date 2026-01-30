import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { calculateDiscountedPrice, formatPrice, formatDiscount } from '../../lib/utils';

interface PriceDisplayProps {
  mrp: number;
  categoryDiscount: number;
  subcategoryDiscount?: number;
  showMrpOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * PriceDisplay Component
 * Displays pricing with discount information
 * - For approved retailers: Shows discounted price with strikethrough MRP and discount badge
 * - For pending retailers: Shows MRP only
 */
export function PriceDisplay({
  mrp,
  categoryDiscount,
  subcategoryDiscount,
  showMrpOnly = false,
  size = 'md',
}: PriceDisplayProps) {
  const discountedPrice = calculateDiscountedPrice(mrp, categoryDiscount, subcategoryDiscount);
  const hasDiscount = discountedPrice < mrp;
  const discountPercent = subcategoryDiscount && subcategoryDiscount > 0 
    ? subcategoryDiscount 
    : categoryDiscount;

  const sizeStyles = {
    sm: { price: 14, mrp: 10, discount: 10 },
    md: { price: 18, mrp: 12, discount: 11 },
    lg: { price: 24, mrp: 14, discount: 12 },
  };

  if (showMrpOnly) {
    return (
      <Text style={[styles.mrpOnly, { fontSize: sizeStyles[size].price }]}>
        {formatPrice(mrp)}
      </Text>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.price, { fontSize: sizeStyles[size].price }]}>
        {formatPrice(discountedPrice)}
      </Text>
      {hasDiscount && (
        <>
          <Text style={[styles.mrp, { fontSize: sizeStyles[size].mrp }]}>
            {formatPrice(mrp)}
          </Text>
          <View style={styles.discountBadge}>
            <Text style={[styles.discountText, { fontSize: sizeStyles[size].discount }]}>
              {formatDiscount(discountPercent)}
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  price: {
    fontWeight: '700',
    color: '#007AFF',
  },
  mrp: {
    color: '#999',
    textDecorationLine: 'line-through',
  },
  mrpOnly: {
    fontWeight: '700',
    color: '#333',
  },
  discountBadge: {
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: '#FF3B30',
    fontWeight: '600',
  },
});
