import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

interface AddToCartButtonProps {
  itemId: string;
  cartQuantity: number;
  onAddToCart: () => Promise<void>;
  onIncrement: () => Promise<void>;
  onDecrement: () => Promise<void>;
  disabled?: boolean;
  availabilityMessage?: string;
}

/**
 * AddToCartButton Component
 * Displays a wide button that transforms to show inline quantity controls
 * - When quantity is 0: Shows "Add to Cart" text
 * - When quantity > 0: Shows "[N added to cart] [-] [N] [+]" layout
 */
export function AddToCartButton({
  itemId,
  cartQuantity,
  onAddToCart,
  onIncrement,
  onDecrement,
  disabled = false,
  availabilityMessage = 'Add to Cart',
}: AddToCartButtonProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleAddToCart = async () => {
    try {
      setIsUpdating(true);
      await onAddToCart();
    } catch (err) {
      console.error('Failed to add to cart:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleIncrement = async () => {
    try {
      setIsUpdating(true);
      await onIncrement();
    } catch (err) {
      console.error('Failed to increment:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDecrement = async () => {
    try {
      setIsUpdating(true);
      await onDecrement();
    } catch (err) {
      console.error('Failed to decrement:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // State 1: Not in cart - show "Add to Cart" button
  if (cartQuantity === 0) {
    return (
      <TouchableOpacity
        style={[styles.button, disabled && styles.buttonDisabled]}
        onPress={handleAddToCart}
        disabled={disabled || isUpdating}
        activeOpacity={0.7}
      >
        {isUpdating ? (
          <ActivityIndicator color="#ffffff" size="small" />
        ) : (
          <Text style={styles.buttonText}>{availabilityMessage}</Text>
        )}
      </TouchableOpacity>
    );
  }

  // State 2: In cart - show inline quantity controls
  return (
    <View style={[styles.button, disabled && styles.buttonDisabled]}>
      <Text style={styles.addedText}>
        {cartQuantity} added to cart
      </Text>
      
      {isUpdating ? (
        <ActivityIndicator color="#ffffff" size="small" style={styles.loader} />
      ) : (
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleDecrement}
            disabled={disabled || isUpdating}
            activeOpacity={0.7}
          >
            <Text style={styles.controlButtonText}>−</Text>
          </TouchableOpacity>

          <Text style={styles.quantityText}>{cartQuantity}</Text>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleIncrement}
            disabled={disabled || isUpdating}
            activeOpacity={0.7}
          >
            <Text style={styles.controlButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  addedText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  loader: {
    marginLeft: 8,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  controlButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    minWidth: 24,
    textAlign: 'center',
  },
});
