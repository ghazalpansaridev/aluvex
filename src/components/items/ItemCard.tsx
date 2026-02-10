import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ItemWithPrice } from '../../lib/api';

interface ItemCardProps {
  item: ItemWithPrice;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleStatus?: (newStatus: 'active' | 'inactive') => void;
}

export function ItemCard({ item, onPress, onEdit, onDelete, onToggleStatus }: ItemCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  
  // Get primary image (prefer is_primary flag, fall back to first image)
  const primaryImage =
    item.images?.find((img: any) => img.is_primary)?.image_url ||
    item.images?.[0]?.image_url;
  const hasImage = !!primaryImage;

  // Stock status logic
  const getStockStatus = () => {
    if (item.current_stock === 0) {
      return { label: 'Out of Stock', color: '#FF3B30', bg: '#FEE2E2' };
    }
    if (item.current_stock <= item.min_stock_level) {
      return { label: 'Low Stock', color: '#F59E0B', bg: '#FEF3C7' };
    }
    return { label: 'In Stock', color: '#10B981', bg: '#D1FAE5' };
  };

  const stockStatus = getStockStatus();

  // Status badge variant mapping
  const getStatusVariant = (): 'success' | 'warning' | 'default' => {
    if (item.status === 'active') return 'success';
    if (item.status === 'inactive') return 'warning';
    return 'default';
  };

  // Format price
  const formatPrice = (price: number) => {
    return `₹${price.toFixed(2)}`;
  };

  // Category breadcrumb
  const categoryBreadcrumb = item.subcategory
    ? `${item.category?.name || ''} > ${item.subcategory.name}`
    : item.category?.name || 'Uncategorized';

  const handleMenuPress = (event: any) => {
    const { pageX, pageY } = event.nativeEvent;
    setMenuPosition({ x: pageX, y: pageY });
    setShowMenu(true);
  };

  const handleEdit = () => {
    setShowMenu(false);
    if (onEdit) {
      onEdit();
    }
  };

  const handleDelete = () => {
    setShowMenu(false);
    if (onDelete) {
      onDelete();
    }
  };

  const handleToggleStatus = () => {
    if (onToggleStatus) {
      const newStatus = item.status === 'active' ? 'inactive' : 'active';
      onToggleStatus(newStatus);
    }
  };

  return (
    <View style={styles.cardWrapper}>
    <Card onPress={onPress} padding="none" style={styles.card}>
      <View style={styles.container}>
        {/* Image Section */}
        <View style={styles.imageContainer}>
          {hasImage ? (
            <Image
              source={{ uri: primaryImage }}
              style={styles.image}
              resizeMode="cover"
              onError={(e) => {
                console.log('Image load error:', e.nativeEvent.error);
              }}
            />
          ) : (
            <View style={styles.placeholderContainer}>
              <Text style={styles.placeholderText}>📦</Text>
              <Text style={styles.placeholderLabel}>No Image</Text>
            </View>
          )}
        </View>

        {/* Content Section */}
        <View style={styles.content}>
          {/* Name */}
          <Text style={styles.itemName} numberOfLines={2}>
            {item.name}
          </Text>

          {/* SKU */}
          <Text style={styles.sku}>{item.sku}</Text>

          {/* Price and Stock in one row */}
          <View style={styles.priceStockRow}>
            <View style={styles.priceSection}>
              {item.discount_applied > 0 ? (
                <View>
                  <Text style={styles.finalPrice}>{formatPrice(item.final_price)}</Text>
                  <Text style={styles.savings}>
                    Save {formatPrice(item.savings)}
                  </Text>
                </View>
              ) : (
                <Text style={styles.finalPrice}>{formatPrice(item.mrp)}</Text>
              )}
            </View>

            {/* Stock Badge */}
            <View
              style={[
                styles.stockBadge,
                { backgroundColor: stockStatus.bg },
              ]}
            >
              <Text style={[styles.stockText, { color: stockStatus.color }]}>
                {stockStatus.label}
              </Text>
            </View>
          </View>

          {/* Stock Quantity */}
          <Text style={styles.stockQuantity}>
            Stock: {item.current_stock} {item.unit}
          </Text>
        </View>

        {/* Right Side Actions */}
        <View style={styles.actionsContainer}>
          {/* Active/Inactive Toggle */}
          <TouchableOpacity
            style={styles.toggleContainer}
            onPress={handleToggleStatus}
            activeOpacity={0.7}
          >
            <View style={[
              styles.toggleSwitch,
              item.status === 'active' && styles.toggleSwitchActive
            ]}>
              <View style={[
                styles.toggleThumb,
                item.status === 'active' && styles.toggleThumbActive
              ]} />
            </View>
            <Text style={[
              styles.toggleLabel,
              item.status === 'active' && styles.toggleLabelActive
            ]}>
              {item.status === 'active' ? 'Active' : 'Inactive'}
            </Text>
          </TouchableOpacity>
          
          {/* Three-dot Menu */}
          <TouchableOpacity
            style={styles.menuButton}
            onPress={handleMenuPress}
            activeOpacity={0.7}
          >
            <Text style={styles.menuIcon}>⋮</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Card>

      {/* Dropdown Menu Modal */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={[
            styles.menuDropdown,
            Platform.OS === 'web' ? {
              position: 'absolute',
              top: menuPosition.y,
              right: 20,
            } : {}
          ]}>
            {onEdit && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleEdit}
                activeOpacity={0.7}
              >
                <Text style={styles.menuItemIcon}>✏️</Text>
                <Text style={styles.menuItemText}>Edit</Text>
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleDelete}
                activeOpacity={0.7}
              >
                <Text style={styles.menuItemIcon}>🗑️</Text>
                <Text style={styles.menuItemTextDanger}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    position: 'relative',
    marginBottom: 12,
    marginHorizontal: 16,
  },
  card: {
    flex: 1,
  },
  container: {
    flexDirection: 'row',
    padding: 14,
    alignItems: 'flex-start',
  },
  imageContainer: {
    marginRight: 14,
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  placeholderContainer: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 24,
    marginBottom: 2,
  },
  placeholderLabel: {
    fontSize: 9,
    color: '#999',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  itemName: {
    fontSize: 15,
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
  priceStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  priceSection: {
    flexDirection: 'column',
  },
  finalPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 2,
  },
  savings: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '500',
  },
  stockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  stockText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  stockQuantity: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  actionsContainer: {
    alignItems: 'flex-end',
    gap: 10,
    marginLeft: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleSwitch: {
    width: 42,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: '#10B981',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  toggleLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  toggleLabelActive: {
    color: '#10B981',
  },
  menuButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6B7280',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuDropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 10,
  },
  menuItemIcon: {
    fontSize: 16,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  menuItemTextDanger: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
  },
});
