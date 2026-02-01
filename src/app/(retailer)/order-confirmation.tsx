import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LoadingSpinner, Button, Badge } from '../../components/ui';
import { formatPrice } from '../../lib/utils';
import { fetchOrderById } from '../../lib/orders.api';

/**
 * Order Confirmation Screen
 * Displays order success message with order details
 * Shown after successful order placement
 */
export default function OrderConfirmationScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const [order, setOrder] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    if (!orderId) {
      router.replace('/(retailer)/cart');
      return;
    }

    const loadOrder = async () => {
      try {
        const data = await fetchOrderById(orderId);
        setOrder(data);
      } catch (err) {
        console.error('Failed to load order:', err);
        router.replace('/(retailer)/cart');
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading order..." />;
  }

  if (!order) {
    return null;
  }

  const handleViewOrder = () => {
    // Future: Navigate to order details
    // router.push(`/(retailer)/orders/${order.id}`);
    console.log('View order details:', order.id);
    router.push('/(retailer)/orders');
  };

  const handleContinueShopping = () => {
    router.push('/(retailer)/catalog');
  };

  const orderDate = new Date(order.created_at);
  const formattedDate = orderDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = orderDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Success Icon */}
      <View style={styles.successIcon}>
        <Text style={styles.successIconText}>✓</Text>
      </View>

      {/* Success Message */}
      <Text style={styles.successTitle}>Order Placed Successfully!</Text>
      <Text style={styles.successSubtitle}>
        Thank you for your order. We'll notify you when it's shipped.
      </Text>

      {/* Order Details Card */}
      <View style={styles.card}>
        {/* Order Number */}
        <View style={styles.orderNumberContainer}>
          <Text style={styles.orderNumberLabel}>Order Number</Text>
          <Text style={styles.orderNumber}>{order.order_number}</Text>
        </View>

        {/* Order Date */}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date</Text>
          <Text style={styles.detailValue}>
            {formattedDate}, {formattedTime}
          </Text>
        </View>

        {/* Items Count */}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Items</Text>
          <Text style={styles.detailValue}>{order.items?.length || 0} items</Text>
        </View>

        {/* Order Total */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>{formatPrice(order.grand_total)}</Text>
        </View>

        {/* Status */}
        <View style={styles.statusRow}>
          <Badge label="Placed" variant="success" size="md" />
          <Text style={styles.statusNote}>Processing your order...</Text>
        </View>
      </View>

      {/* Delivery Address */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Delivery Address</Text>
        <Text style={styles.addressText}>{order.delivery_address}</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button
          title="View Order Details"
          onPress={handleViewOrder}
          variant="outline"
          fullWidth
          style={styles.actionButton}
        />
        <Button
          title="Continue Shopping"
          onPress={handleContinueShopping}
          variant="primary"
          fullWidth
          style={styles.actionButton}
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
  content: {
    padding: 16,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#34C759',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 32,
    marginBottom: 24,
  },
  successIconText: {
    fontSize: 48,
    color: '#fff',
    fontWeight: '700',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderNumberContainer: {
    alignItems: 'center',
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  orderNumberLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
    letterSpacing: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
  },
  statusRow: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 8,
  },
  statusNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  actions: {
    gap: 12,
    marginTop: 8,
    marginBottom: 32,
  },
  actionButton: {
    marginBottom: 0,
  },
});
