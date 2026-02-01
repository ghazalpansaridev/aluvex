import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { CartItemWithDetails } from '../../lib/cart.api';
import { formatPrice, getPrimaryImage } from '../../lib/utils';

interface CartItemProps {
  cartItem: CartItemWithDetails;
  itemPrice: number;
  onUpdateQuantity: (cartItemId: string, quantity: number) => void;
  onRemove: (cartItemId: string) => void;
  calculating?: boolean;
}

/**
 * CartItem Component
 * Displays a single cart item with image, details, quantity controls, and remove button
 */
export function CartItem({
  cartItem,
  itemPrice,
  onUpdateQuantity,
  onRemove,
  calculating = false,
}: CartItemProps) {
  const lineTotal = itemPrice * cartItem.quantity;

  const handleIncrement = () => {
    onUpdateQuantity(cartItem.id, cartItem.quantity + 1);
  };

  const handleDecrement = () => {
    if (cartItem.quantity > 1) {
      onUpdateQuantity(cartItem.id, cartItem.quantity - 1);
    }
  };

  const handleRemove = () => {
    onRemove(cartItem.id);
  };

  return (
    <View style={styles.container}>
      {/* Image */}
      <Image
        source={{ uri: getPrimaryImage(cartItem.item.images) }}
        style={styles.image}
        resizeMode="cover"
      />

      {/* Content */}
      <View style={styles.content}>
        {/* Header with name and remove button */}
        <View style={styles.header}>
          <View style={styles.itemInfo}>
            <Text style={styles.name} numberOfLines={2}>
              {cartItem.item.name}
            </Text>
            <Text style={styles.sku}>SKU: {cartItem.item.sku}</Text>
            <Text style={styles.pricePerUnit}>
              {formatPrice(itemPrice)} per {cartItem.item.unit.toLowerCase()}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleRemove}
            style={styles.removeButton}
            disabled={calculating}
          >
            <Text style={styles.removeIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>

        {/* Quantity controls and line total */}
        <View style={styles.footer}>
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={[
                styles.quantityButton,
                (calculating || cartItem.quantity <= 1) && styles.quantityButtonDisabled,
              ]}
              onPress={handleDecrement}
              disabled={calculating || cartItem.quantity <= 1}
            >
              <Text style={styles.quantityButtonText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.quantity}>{cartItem.quantity}</Text>
            <TouchableOpacity
              style={[styles.quantityButton, calculating && styles.quantityButtonDisabled]}
              onPress={handleIncrement}
              disabled={calculating}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.lineTotal}>{formatPrice(lineTotal)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    lineHeight: 22,
  },
  sku: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  pricePerUnit: {
    fontSize: 14,
    color: '#666',
  },
  removeButton: {
    padding: 4,
  },
  removeIcon: {
    fontSize: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonDisabled: {
    opacity: 0.3,
  },
  quantityButtonText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    minWidth: 30,
    textAlign: 'center',
  },
  lineTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
});
