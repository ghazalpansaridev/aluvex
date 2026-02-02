import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { OrderItemWithShipments } from '../../types/database';
import { formatPrice } from '../../lib/utils';
import { Button } from '../ui';

interface ShipmentFormProps {
  orderItems: OrderItemWithShipments[];
  onSubmit: (data: {
    items: Array<{ orderItemId: string; itemId: string; quantity: number; unitPrice: number }>;
    freightCharge: number;
    notes: string;
  }) => void;
  loading?: boolean;
}

interface SelectedItem {
  orderItemId: string;
  itemId: string;
  quantity: number;
  unitPrice: number;
  maxQuantity: number;
}

export default function ShipmentForm({
  orderItems,
  onSubmit,
  loading = false,
}: ShipmentFormProps) {
  const [selectedItems, setSelectedItems] = useState<Record<string, SelectedItem>>({});
  const [freightCharge, setFreightCharge] = useState('');
  const [notes, setNotes] = useState('');

  const toggleItemSelection = (item: OrderItemWithShipments) => {
    const newSelected = { ...selectedItems };
    
    if (newSelected[item.id]) {
      delete newSelected[item.id];
    } else {
      newSelected[item.id] = {
        orderItemId: item.id,
        itemId: item.item_id,
        quantity: item.remaining_quantity,
        unitPrice: item.unit_price,
        maxQuantity: item.remaining_quantity,
      };
    }
    
    setSelectedItems(newSelected);
  };

  const updateQuantity = (orderItemId: string, quantity: number) => {
    const item = selectedItems[orderItemId];
    if (!item) return;

    const validQuantity = Math.max(1, Math.min(quantity, item.maxQuantity));
    
    setSelectedItems({
      ...selectedItems,
      [orderItemId]: {
        ...item,
        quantity: validQuantity,
      },
    });
  };

  const handleSubmit = () => {
    const items = Object.values(selectedItems);
    
    if (items.length === 0) {
      Alert.alert('Error', 'Please select at least one item to ship');
      return;
    }

    const freight = parseFloat(freightCharge);
    if (isNaN(freight) || freight < 0) {
      Alert.alert('Error', 'Please enter a valid freight charge');
      return;
    }

    onSubmit({
      items,
      freightCharge: freight,
      notes: notes.trim(),
    });
  };

  const calculateTotal = () => {
    const itemsTotal = Object.values(selectedItems).reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const freight = parseFloat(freightCharge) || 0;
    return itemsTotal + freight;
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Select Items to Ship</Text>

      {/* Items List */}
      {orderItems.map(item => {
        const isSelected = !!selectedItems[item.id];
        const canShip = item.remaining_quantity > 0;

        return (
          <View
            key={item.id}
            style={[
              styles.itemCard,
              !canShip && styles.itemCardDisabled,
              isSelected && styles.itemCardSelected,
            ]}
          >
            <View style={styles.itemHeader}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => canShip && toggleItemSelection(item)}
                disabled={!canShip}
              >
                <View style={[styles.checkboxInner, isSelected && styles.checkboxChecked]}>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
              
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.item_name}</Text>
                <Text style={styles.itemSku}>SKU: {item.item_sku}</Text>
                <View style={styles.quantityInfo}>
                  <Text style={styles.quantityText}>
                    Ordered: {item.quantity} | Shipped: {item.shipped_quantity} | 
                    Remaining: <Text style={styles.remainingQty}>{item.remaining_quantity}</Text>
                  </Text>
                </View>
              </View>
            </View>

            {/* Quantity Input */}
            {isSelected && (
              <View style={styles.quantityControl}>
                <Text style={styles.quantityLabel}>Ship Quantity:</Text>
                <View style={styles.quantityInputContainer}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() =>
                      updateQuantity(item.id, selectedItems[item.id].quantity - 1)
                    }
                  >
                    <Text style={styles.quantityButtonText}>−</Text>
                  </TouchableOpacity>
                  
                  <TextInput
                    style={styles.quantityInput}
                    value={selectedItems[item.id].quantity.toString()}
                    onChangeText={text => {
                      const qty = parseInt(text) || 0;
                      updateQuantity(item.id, qty);
                    }}
                    keyboardType="number-pad"
                  />
                  
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() =>
                      updateQuantity(item.id, selectedItems[item.id].quantity + 1)
                    }
                  >
                    <Text style={styles.quantityButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        );
      })}

      {/* Shipment Details */}
      <View style={styles.shipmentDetails}>
        <Text style={styles.sectionTitle}>Shipment Details</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Freight Charges (₹) *</Text>
          <TextInput
            style={styles.input}
            value={freightCharge}
            onChangeText={setFreightCharge}
            placeholder="0"
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add shipment notes..."
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Summary */}
        {Object.keys(selectedItems).length > 0 && (
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Selected Items:</Text>
              <Text style={styles.summaryValue}>
                {Object.keys(selectedItems).length}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Freight Charges:</Text>
              <Text style={styles.summaryValue}>
                {formatPrice(parseFloat(freightCharge) || 0)}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Shipment Total:</Text>
              <Text style={styles.totalValue}>{formatPrice(calculateTotal())}</Text>
            </View>
          </View>
        )}

        {/* Submit Button */}
        <Button
          title="Create Shipment"
          onPress={handleSubmit}
          disabled={loading || Object.keys(selectedItems).length === 0}
          loading={loading}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  itemCardDisabled: {
    opacity: 0.5,
  },
  itemCardSelected: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    padding: 4,
    marginRight: 12,
  },
  checkboxInner: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemSku: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  quantityInfo: {
    marginTop: 4,
  },
  quantityText: {
    fontSize: 13,
    color: '#666',
  },
  remainingQty: {
    fontWeight: '600',
    color: '#4CAF50',
  },
  quantityControl: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  quantityInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 36,
    height: 36,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 20,
    color: '#333',
    fontWeight: '600',
  },
  quantityInput: {
    width: 60,
    height: 36,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    textAlign: 'center',
    marginHorizontal: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  shipmentDetails: {
    marginTop: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  summary: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4CAF50',
  },
});
