import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../../lib/supabase';
import { fetchItemById, ItemWithDetails } from '../../../../lib/api';
import { LoadingSpinner, EmptyState } from '../../../../components/ui';

const { width } = Dimensions.get('window');
const IMAGE_WIDTH = width;

/**
 * Product Detail screen within the admin items stack.
 * Navigated to from Item Management list (card press).
 * "Edit Item" stays within the items stack: /(admin)/items/[id].
 */
export default function ItemsProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<ItemWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (!id) {
      setError('Invalid item ID');
      setLoading(false);
      return;
    }

    const loadItem = async () => {
      try {
        setLoading(true);
        setError(null);
        const itemData = await fetchItemById(id, supabase);
        setItem(itemData);
      } catch (err: any) {
        console.error('Error loading item:', err);
        setError(err.message || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    loadItem();
  }, [id]);

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading product..." />;
  }

  if (error || !item) {
    return (
      <View style={styles.centerContainer}>
        <EmptyState
          title="Product not found"
          description={error || 'This product could not be loaded'}
          icon="📦"
          actionLabel="Go Back"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  const images = item.images || [];
  const primaryImage = images.find((img) => img.is_primary) || images[0];
  const displayImages = images.length > 0 ? images : [];

  const getStockStatus = () => {
    if (item.current_stock === 0) {
      return { label: 'Out of Stock', color: '#EF4444', bg: '#FEE2E2' };
    } else if (item.current_stock <= item.min_stock_level) {
      return { label: 'Low Stock', color: '#F59E0B', bg: '#FEF3C7' };
    } else {
      return { label: 'In Stock', color: '#10B981', bg: '#D1FAE5' };
    }
  };

  const stockStatus = getStockStatus();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Image Gallery */}
      {displayImages.length > 0 ? (
        <View style={styles.imageGalleryContainer}>
          <Image
            source={{ uri: displayImages[selectedImageIndex]?.image_url || primaryImage?.image_url }}
            style={styles.mainImage}
            resizeMode="cover"
          />
          {displayImages.length > 1 && (
            <View style={styles.thumbnailContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {displayImages.map((img, index) => (
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
            </View>
          )}
        </View>
      ) : (
        <View style={styles.noImageContainer}>
          <Ionicons name="image-outline" size={64} color="#ccc" />
          <Text style={styles.noImageText}>No image available</Text>
        </View>
      )}

      {/* Product Info */}
      <View style={styles.contentContainer}>
        {/* Status Badge */}
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: stockStatus.bg }]}>
            <Text style={[styles.badgeText, { color: stockStatus.color }]}>
              {stockStatus.label}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: '#F3F4F6' }]}>
            <Text style={[styles.badgeText, { color: '#6B7280' }]}>
              SKU: {item.sku}
            </Text>
          </View>
        </View>

        {/* Product Name */}
        <Text style={styles.productName}>{item.name}</Text>

        {/* Category */}
        {item.category && (
          <View style={styles.categoryRow}>
            <Ionicons name="pricetag-outline" size={16} color="#666" />
            <Text style={styles.categoryText}>
              {item.category.name}
              {item.subcategory && ` › ${item.subcategory.name}`}
            </Text>
          </View>
        )}

        {/* Price */}
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>MRP</Text>
          <Text style={styles.price}>₹{item.mrp.toFixed(2)}</Text>
          <Text style={styles.priceUnit}>per {item.unit}</Text>
        </View>

        {/* Description */}
        {item.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        )}

        {/* Stock Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stock Information</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Current Stock</Text>
              <Text style={styles.infoValue}>{item.current_stock} {item.unit}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Min Stock Level</Text>
              <Text style={styles.infoValue}>{item.min_stock_level} {item.unit}</Text>
            </View>
          </View>
        </View>

        {/* Availability */}
        {item.available_pincodes && item.available_pincodes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available in Pincodes</Text>
            <View style={styles.pincodeContainer}>
              {item.available_pincodes.slice(0, 10).map((pincode) => (
                <View key={pincode} style={styles.pincodeChip}>
                  <Text style={styles.pincodeText}>{pincode}</Text>
                </View>
              ))}
              {item.available_pincodes.length > 10 && (
                <View style={styles.pincodeChip}>
                  <Text style={styles.pincodeText}>
                    +{item.available_pincodes.length - 10} more
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(`/(admin)/items/${id}` as any)}
          >
            <Ionicons name="create-outline" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>Edit Item</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  imageGalleryContainer: {
    backgroundColor: '#f5f5f5',
  },
  mainImage: {
    width: IMAGE_WIDTH,
    height: IMAGE_WIDTH * 0.75,
    backgroundColor: '#f0f0f0',
  },
  thumbnailContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  thumbnail: {
    width: 60,
    height: 60,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  thumbnailActive: {
    borderColor: '#007AFF',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  noImageContainer: {
    width: IMAGE_WIDTH,
    height: IMAGE_WIDTH * 0.75,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
  },
  contentContainer: {
    padding: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 6,
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: '#007AFF',
    marginRight: 6,
  },
  priceUnit: {
    fontSize: 14,
    color: '#999',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#444',
  },
  infoRow: {
    flexDirection: 'row',
    gap: 16,
  },
  infoItem: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  pincodeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pincodeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  pincodeText: {
    fontSize: 13,
    color: '#666',
  },
  actionContainer: {
    marginTop: 8,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
});
