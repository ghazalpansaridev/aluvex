import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../../lib/auth-context';
import { useItem } from '../../../hooks/useItems';
import { useCart } from '../../../hooks/useCart';
import { LoadingSpinner, Button, Badge } from '../../../components/ui';
import { PriceDisplay, AddToCartButton } from '../../../components/catalog';
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
  
  // Check if item is available in retailer's pincode (not restricted)
  const isAvailableInPincode = retailer?.pincode
    ? !item.restricted_pincodes.includes(retailer.pincode)
    : true;

  const handleAddToCart = async () => {
    if (!isAvailableInPincode) {
      Alert.alert('Not Available', 'This item is not available for delivery in your area.');
      return;
    }

    try {
      await addItem(item.id, 1);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to add item to cart. Please try again.');
    }
  };

  const handleIncrementQuantity = async () => {
    if (!isAvailableInPincode) {
      Alert.alert('Not Available', 'This item is not available for delivery in your area.');
      return;
    }

    try {
      await addItem(item.id, 1);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to update cart. Please try again.');
    }
  };

  const handleDecrementQuantity = async () => {
    const cartItemId = getCartItemId(item.id);
    if (!cartItemId) return;

    if (cartQuantity > 0) {
      try {
        await updateQuantity(cartItemId, cartQuantity - 1);
      } catch (err: any) {
        Alert.alert('Error', 'Failed to update cart. Please try again.');
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
        </View>
      </ScrollView>

      {/* Add to Cart button with inline quantity controls */}
      {!isPending && (
        <View style={styles.bottomAction}>
          <AddToCartButton
            itemId={item.id}
            cartQuantity={cartQuantity}
            onAddToCart={handleAddToCart}
            onIncrement={handleIncrementQuantity}
            onDecrement={handleDecrementQuantity}
            disabled={!isAvailableInPincode || isOutOfStock}
            availabilityMessage={isAvailableInPincode ? "Add to Cart" : "Not Available in Your Area"}
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
  bottomAction: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
});
