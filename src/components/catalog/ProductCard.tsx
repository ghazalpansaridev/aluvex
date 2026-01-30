import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { ItemWithDetails } from '../../lib/items.api';
import { Badge } from '../ui';
import {
  calculateDiscountedPrice,
  formatDiscount,
  getPrimaryImage,
  getStockStatus,
} from '../../lib/utils';
import { PriceDisplay } from './PriceDisplay';

interface ProductCardProps {
  item: ItemWithDetails;
  onPress: () => void;
  showMrpOnly?: boolean;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 columns with 16px padding on each side and 16px gap

/**
 * ProductCard Component
 * Displays an item in a card format for the catalog grid
 * - Shows primary image
 * - Item name (2 lines max)
 * - SKU code
 * - Pricing (discounted or MRP only based on showMrpOnly prop)
 * - Discount badge (if applicable)
 * - Stock status badge
 * - Out of stock overlay (if no stock)
 */
export function ProductCard({
  item,
  onPress,
  showMrpOnly = false,
}: ProductCardProps) {
  const categoryDiscount = item.category?.discount_percent || 0;
  const subcategoryDiscount = item.subcategory?.discount_percent;
  const discountedPrice = calculateDiscountedPrice(
    item.mrp,
    categoryDiscount,
    subcategoryDiscount
  );
  const hasDiscount = discountedPrice < item.mrp;
  const stockStatus = getStockStatus(item.current_stock, item.min_stock_level);
  const isOutOfStock = item.current_stock <= 0;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: getPrimaryImage(item.images) }}
          style={styles.image}
          resizeMode="cover"
        />
        {/* Discount badge (top-left) */}
        {hasDiscount && !showMrpOnly && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>
              {formatDiscount(subcategoryDiscount || categoryDiscount)}
            </Text>
          </View>
        )}
        {/* Out of stock overlay */}
        {isOutOfStock && (
          <View style={styles.oosOverlay}>
            <Text style={styles.oosText}>Out of Stock</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.sku}>{item.sku}</Text>

        {/* Pricing */}
        <View style={styles.priceContainer}>
          <PriceDisplay
            mrp={item.mrp}
            categoryDiscount={categoryDiscount}
            subcategoryDiscount={subcategoryDiscount}
            showMrpOnly={showMrpOnly}
            size="sm"
          />
        </View>

        {/* Stock status badge */}
        <Badge
          label={stockStatus.label}
          variant={stockStatus.variant}
          size="sm"
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: CARD_WIDTH,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  oosOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  oosText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    padding: 12,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    lineHeight: 20,
  },
  sku: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  priceContainer: {
    marginBottom: 8,
  },
});
