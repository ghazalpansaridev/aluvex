import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../../lib/auth-context';
import { useItem } from '../../../hooks/useItems';
import { useCart } from '../../../hooks/useCart';
import { LoadingSpinner, Button, Badge } from '../../../components/ui';
import { PriceDisplay, QuantityCapsule } from '../../../components/catalog';
import { getPrimaryImage, getStockStatus, formatDiscount, calculateDiscountedPrice } from '../../../lib/utils';

const { width } = Dimensions.get('window');

/**
 * Product Detail Screen
 * Displays comprehensive product information with image gallery
 * - Approved retailers see discounted pricing
 * - Pending retailers see MRP only
 * - View-only mode (no cart/favorites in this phase)
 */
export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { retailer, retailerStatus } = useAuth();
  const { item, loading, error } = useItem(id);
  const { addItem, getItemQuantity, getCartItemId, updateQuantity } = useCart();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantityToAdd, setQuantityToAdd] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  const isPending = retailerStatus === 'pending';
  const cartQuantity = item ? getItemQuantity(item.id) : 0;

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading product..." />;
  }

  if (error || !item) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {error || 'Product not found'}
        </Text>
        <Button title="Go Back" onPress={() => router.back()} />
      </View>
    );
  }

  const stockStatus = getStockStatus(item.current_stock, item.min_stock_level);
  const isOutOfStock = item.current_stock <= 0;
  const images = item.images || [];
  const categoryDiscount = item.category?.discount_percent || 0;
  const subcategoryDiscount = item.subcategory?.discount_percent;
  const discountedPrice = calculateDiscountedPrice(
    item.mrp,
    categoryDiscount,
    subcategoryDiscount
  );
  const hasDiscount = discountedPrice < item.mrp;
  const discountPercent = subcategoryDiscount && subcategoryDiscount > 0 
    ? subcategoryDiscount 
    : categoryDiscount;
  
  // Check if item is available in retailer's pincode
  const isAvailableInPincode = retailer?.pincode 
    ? item.available_pincodes.includes(retailer.pincode)
    : false;

  const handleAddToCart = async () => {
    if (!isAvailableInPincode) {
      console.error('Item unavailable at your location');
      return;
    }

    try {
      setAddingToCart(true);
      await addItem(item.id, quantityToAdd);
      console.log(`Added ${quantityToAdd} item(s) to cart successfully`);
      setQuantityToAdd(1); // Reset quantity after adding
    } catch (err: any) {
      console.error('Failed to add to cart:', err.message);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleIncrementQuantity = async () => {
    if (!isAvailableInPincode) {
      console.error('Item unavailable at your location');
      return;
    }
    
    try {
      await addItem(item.id, 1);
    } catch (err: any) {
      console.error('Failed to update cart:', err.message);
    }
  };

  const handleDecrementQuantity = async () => {
    const cartItemId = getCartItemId(item.id);
    if (!cartItemId) return;
    
    if (cartQuantity > 0) {
      try {
        await updateQuantity(cartItemId, cartQuantity - 1);
      } catch (err: any) {
        console.error('Failed to update cart:', err.message);
      }
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image gallery */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: images[selectedImageIndex]?.image_url || getPrimaryImage(images) }}
            style={styles.mainImage}
            resizeMode="cover"
          />
          {/* Discount badge overlay */}
          {hasDiscount && !isPending && (
            <View style={styles.discountBadgeOverlay}>
              <Text style={styles.discountBadgeText}>
                {formatDiscount(discountPercent)}
              </Text>
            </View>
          )}
        </View>

        {/* Thumbnail strip (if multiple images) */}
        {images.length > 1 && (
          <ScrollView
            horizontal
            style={styles.thumbnailContainer}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbnailContent}
          >
            {images.map((img, index) => (
              <TouchableOpacity
                key={img.id}
                onPress={() => setSelectedImageIndex(index)}
                style={[
                  styles.thumbnail,
                  selectedImageIndex === index && styles.thumbnailActive,
                ]}
              >
                <Image
                  source={{ uri: img.image_url }}
                  style={styles.thumbnailImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Product info */}
        <View style={styles.infoContainer}>
          {/* SKU */}
          <Text style={styles.sku}>SKU: {item.sku}</Text>
          
          {/* Product name */}
          <Text style={styles.name}>{item.name}</Text>

          {/* Price */}
          <View style={styles.priceRow}>
            <PriceDisplay
              mrp={item.mrp}
              categoryDiscount={categoryDiscount}
              subcategoryDiscount={subcategoryDiscount}
              showMrpOnly={isPending}
              size="lg"
            />
          </View>

          {/* Stock status */}
          <View style={styles.stockRow}>
            <Badge
              label={stockStatus.label}
              variant={stockStatus.variant}
              size="sm"
            />
            {item.current_stock > 0 && item.current_stock <= 10 && (
              <Text style={styles.stockWarning}>
                Only {item.current_stock} left!
              </Text>
            )}
          </View>

          {/* Category breadcrumb */}
          <View style={styles.categoryRow}>
            <Text style={styles.categoryLabel}>Category: </Text>
            <Text style={styles.categoryValue}>
              {item.category?.name}
              {item.subcategory && ` > ${item.subcategory.name}`}
            </Text>
          </View>

          {/* Unit */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Unit: </Text>
            <Text style={styles.infoValue}>{item.unit}</Text>
          </View>

          {/* Description */}
          {item.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionTitle}>Description</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          )}

          {/* Quantity selector - only for approved retailers when NOT in cart */}
          {!isPending && isAvailableInPincode && !isOutOfStock && cartQuantity === 0 && (
            <View style={styles.quantityContainer}>
              <Text style={styles.quantityLabel}>Add Quantity</Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantityToAdd(Math.max(1, quantityToAdd - 1))}
                  disabled={quantityToAdd <= 1}
                >
                  <Text style={styles.quantityButtonText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.quantityValue}>{quantityToAdd}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantityToAdd(quantityToAdd + 1)}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Capsule controls - when item is already in cart */}
          {!isPending && isAvailableInPincode && !isOutOfStock && cartQuantity > 0 && (
            <View style={styles.capsuleContainer}>
              <Text style={styles.quantityLabel}>Quantity in Cart</Text>
              <QuantityCapsule
                quantity={cartQuantity}
                onIncrement={handleIncrementQuantity}
                onDecrement={handleDecrementQuantity}
                size="md"
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add to Cart button - only show when item NOT in cart */}
      {!isPending && cartQuantity === 0 && (
        <View style={styles.bottomAction}>
          <Button
            title={isAvailableInPincode ? "Add to Cart" : "Not Available in Your Area"}
            onPress={handleAddToCart}
            disabled={!isAvailableInPincode || isOutOfStock || addingToCart}
            loading={addingToCart}
            variant="primary"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  imageContainer: {
    position: 'relative',
    backgroundColor: '#f9f9f9',
  },
  mainImage: {
    width: width,
    height: width,
  },
  discountBadgeOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  discountBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  thumbnailContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  thumbnailContent: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  thumbnail: {
    width: 60,
    height: 60,
    marginRight: 8,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    borderColor: '#007AFF',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    padding: 16,
  },
  sku: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
    lineHeight: 28,
  },
  priceRow: {
    marginBottom: 16,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  stockWarning: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '500',
  },
  categoryRow: {
    flexDirection: 'row',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  categoryLabel: {
    fontSize: 14,
    color: '#666',
  },
  categoryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  descriptionContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    fontSize: 20,
    color: '#333',
    fontWeight: '600',
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    minWidth: 40,
    textAlign: 'center',
  },
  bottomAction: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  capsuleContainer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cartQuantityInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  cartQuantityText: {
    fontSize: 14,
    color: '#1565C0',
    fontWeight: '500',
  },
});
