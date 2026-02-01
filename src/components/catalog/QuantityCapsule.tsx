import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

interface QuantityCapsuleProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

/**
 * QuantityCapsule Component
 * Displays quantity controls in capsule style
 * - Shows "+ Add" button when quantity is 0
 * - Shows [−] qty [+] capsule when quantity > 0
 */
export function QuantityCapsule({
  quantity,
  onIncrement,
  onDecrement,
  disabled = false,
  size = 'md',
}: QuantityCapsuleProps) {
  // State 1: Not in cart - show "+ Add" button
  if (quantity === 0) {
    return (
      <TouchableOpacity
        style={[styles.addButton, size === 'sm' && styles.addButtonSm]}
        onPress={onIncrement}
        disabled={disabled}
      >
        <Text style={[styles.addButtonText, size === 'sm' && styles.addButtonTextSm]}>
          + Add
        </Text>
      </TouchableOpacity>
    );
  }

  // State 2: In cart - show capsule with quantity controls
  return (
    <View style={[styles.capsule, size === 'sm' && styles.capsuleSm]}>
      <TouchableOpacity
        style={[styles.capsuleButton, size === 'sm' && styles.capsuleButtonSm]}
        onPress={onDecrement}
        disabled={disabled}
      >
        <Text style={[styles.capsuleButtonText, size === 'sm' && styles.capsuleButtonTextSm]}>
          −
        </Text>
      </TouchableOpacity>

      <Text style={[styles.capsuleQuantity, size === 'sm' && styles.capsuleQuantitySm]}>
        {quantity}
      </Text>

      <TouchableOpacity
        style={[styles.capsuleButton, size === 'sm' && styles.capsuleButtonSm]}
        onPress={onIncrement}
        disabled={disabled}
      >
        <Text style={[styles.capsuleButtonText, size === 'sm' && styles.capsuleButtonTextSm]}>
          +
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // Add button styles (when quantity is 0)
  addButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    width: '100%',
  },
  addButtonSm: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 32,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addButtonTextSm: {
    fontSize: 14,
  },

  // Capsule container (when quantity > 0)
  capsule: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingVertical: 4,
    minHeight: 40,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    width: '100%',
  },
  capsuleSm: {
    minHeight: 32,
    borderRadius: 16,
    paddingHorizontal: 3,
    paddingVertical: 3,
  },

  // Capsule button styles (- and +)
  capsuleButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  capsuleButtonSm: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  capsuleButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  capsuleButtonTextSm: {
    fontSize: 16,
  },

  // Quantity display in center
  capsuleQuantity: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    minWidth: 40,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  capsuleQuantitySm: {
    fontSize: 14,
    minWidth: 32,
    paddingHorizontal: 6,
  },
});
