import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { useAuth } from '../../lib/auth-context';
import { useCart } from '../../hooks/useCart';
import { LoadingSpinner, Button } from '../../components/ui';
import { formatPrice } from '../../lib/utils';
import { createOrder } from '../../lib/orders.api';

/**
 * Checkout Screen
 * Displays order summary, delivery address, and T&C
 * Only accessible to approved retailers with items in cart
 */
export default function CheckoutScreen() {
  const router = useRouter();
  const { retailer } = useAuth();
  const { cartItems, cartCount, subtotal, calculateItemPrice } = useCart();
  
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);

  // Redirect if cart is empty
  if (cartItems.length === 0) {
    return <Redirect href="/(retailer)/cart" />;
  }

  if (!retailer) {
    return <LoadingSpinner fullScreen />;
  }

  const handlePlaceOrder = async () => {
    if (!termsAccepted) {
      Alert.alert('Terms Required', 'Please accept the terms and conditions to proceed');
      return;
    }

    try {
      setPlacingOrder(true);
      // Format delivery address
      const deliveryAddress = `${retailer.business_name}\n${retailer.business_address}\n${retailer.city}, ${retailer.state} - ${retailer.pincode}`;
      const order = await createOrder(retailer.id, cartItems, deliveryAddress);
      console.log('Order placed successfully:', order.order_number);
      // Navigate to confirmation screen with order ID
      router.replace(`/(retailer)/order-confirmation?orderId=${order.id}`);
    } catch (err: any) {
      console.error('Failed to place order:', err.message);
      Alert.alert('Order Failed', 'Failed to place order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleBackToCart = () => {
    router.back();
  };

  return (
    <ScrollView style={styles.container}>
      {/* Order Summary Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        
        {/* Items list (read-only) */}
        {cartItems.map((cartItem) => {
          const itemPrice = calculateItemPrice(cartItem);
          const lineTotal = itemPrice * cartItem.quantity;
          
          return (
            <View key={cartItem.id} style={styles.orderItem}>
              <View style={styles.orderItemInfo}>
                <Text style={styles.orderItemName} numberOfLines={1}>
                  {cartItem.item.name}
                </Text>
                <Text style={styles.orderItemQty}>Qty: {cartItem.quantity}</Text>
              </View>
              <Text style={styles.orderItemTotal}>{formatPrice(lineTotal)}</Text>
            </View>
          );
        })}

        {/* Subtotal */}
        <View style={styles.subtotalRow}>
          <Text style={styles.subtotalLabel}>Subtotal</Text>
          <Text style={styles.subtotalValue}>{formatPrice(subtotal)}</Text>
        </View>

        {/* Notes */}
        <View style={styles.notesContainer}>
          <Text style={styles.note}>
            • Freight charges will be determined and added during shipment
          </Text>
          <Text style={styles.note}>
            • Invoice will be generated upon shipment
          </Text>
        </View>
      </View>

      {/* Delivery Address Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Address</Text>
        <View style={styles.addressContainer}>
          <Text style={styles.addressLine}>{retailer.business_name}</Text>
          <Text style={styles.addressLine}>{retailer.business_address}</Text>
          <Text style={styles.addressLine}>
            {retailer.city}, {retailer.state} - {retailer.pincode}
          </Text>
        </View>
        <Text style={styles.addressNote}>
          To change delivery address, please update in Settings
        </Text>
      </View>

      {/* Terms & Conditions Section */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.termsRow}
          onPress={() => setTermsAccepted(!termsAccepted)}
        >
          <View style={styles.checkbox}>
            {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.termsText}>
            I agree to the{' '}
            <Text style={styles.termsLink}>Terms & Conditions</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button
          title="Back to Cart"
          onPress={handleBackToCart}
          variant="outline"
          style={styles.actionButton}
        />
        <Button
          title="Place Order"
          onPress={handlePlaceOrder}
          variant="primary"
          style={styles.actionButton}
          disabled={!termsAccepted}
          loading={placingOrder}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  orderItemInfo: {
    flex: 1,
    marginRight: 16,
  },
  orderItemName: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  orderItemQty: {
    fontSize: 12,
    color: '#999',
  },
  orderItemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  subtotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  subtotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
  notesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  note: {
    fontSize: 12,
    color: '#999',
    lineHeight: 18,
    marginBottom: 4,
  },
  addressContainer: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  addressLine: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    lineHeight: 20,
  },
  addressNote: {
    fontSize: 12,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#007AFF',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '700',
  },
  termsText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  termsLink: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingBottom: 32,
  },
  actionButton: {
    flex: 1,
  },
});
