import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatPrice } from '../../lib/utils';

interface CartSummaryProps {
  itemCount: number;
  subtotal: number;
}

/**
 * CartSummary Component
 * Displays order summary with item count and subtotal
 */
export function CartSummary({ itemCount, subtotal }: CartSummaryProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Order Summary</Text>
      
      {/* Items count and subtotal */}
      <View style={styles.row}>
        <Text style={styles.label}>Items ({itemCount})</Text>
        <Text style={styles.value}>{formatPrice(subtotal)}</Text>
      </View>

      {/* Freight note */}
      <View style={styles.noteContainer}>
        <Text style={styles.note}>
          Freight charges will be added based on shipment
        </Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Subtotal */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Subtotal</Text>
        <Text style={styles.totalValue}>{formatPrice(subtotal)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  noteContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  note: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
});
