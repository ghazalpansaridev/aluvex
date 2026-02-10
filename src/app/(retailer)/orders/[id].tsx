import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { LoadingSpinner, Badge, Button, HeaderLogo } from '../../../components/ui';
import { fetchOrderById, OrderWithItems } from '../../../lib/orders.api';
import { formatPrice } from '../../../lib/utils';

/**
 * Order Detail Screen
 * Displays full order information with items and shipment details
 */
export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      router.back();
      return;
    }

    const loadOrder = async () => {
      try {
        const data = await fetchOrderById(id);
        if (!data) {
          router.back();
          return;
        }
        setOrder(data);
      } catch (err) {
        console.error('Failed to load order:', err);
        router.back();
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [id]);

  const handleContactSupport = () => {
    router.push('/(retailer)/contact-us' as any);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'placed':
        return 'info';
      case 'partially_shipped':
        return 'warning';
      case 'shipped':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'placed':
        return 'Placed';
      case 'partially_shipped':
        return 'Partially Shipped';
      case 'shipped':
        return 'Shipped';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'placed':
        return 'Your order is being processed. You will be notified when it ships.';
      case 'processing':
        return 'Your order is being prepared for shipment. You will be notified when items are shipped.';
      case 'partially_shipped':
        return 'Some items have been shipped. Remaining items will be shipped soon.';
      case 'shipped':
        return 'Your order has been fully shipped.';
      case 'cancelled':
        return 'This order has been cancelled.';
      default:
        return '';
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading order details..." />;
  }

  if (!order) {
    return null;
  }

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
    <>
      <Stack.Screen
        options={{
          title: order.order_number,
          headerBackTitle: 'Orders',
          headerTitle: () => <HeaderLogo />,
        }}
      />
      <ScrollView style={styles.container}>
        {/* Order Header */}
        <View style={styles.section}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Text style={styles.orderNumber}>{order.order_number}</Text>
              <Text style={styles.orderDate}>
                {formattedDate} • {formattedTime}
              </Text>
            </View>
            <Badge
              label={getStatusLabel(order.status)}
              variant={getStatusVariant(order.status)}
              size="md"
            />
          </View>
        </View>

        {/* Status Message */}
        <View style={styles.statusMessageContainer}>
          <Text style={styles.statusMessage}>{getStatusMessage(order.status)}</Text>
        </View>

        {/* Items Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {order.items.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.item_name}
                </Text>
                <Text style={styles.itemSku}>SKU: {item.item_sku}</Text>
              </View>

              <View style={styles.itemDetails}>
                <View style={styles.itemDetailRow}>
                  <Text style={styles.itemDetailLabel}>Quantity</Text>
                  <Text style={styles.itemDetailValue}>{item.quantity}</Text>
                </View>
                <View style={styles.itemDetailRow}>
                  <Text style={styles.itemDetailLabel}>Unit Price</Text>
                  <Text style={styles.itemDetailValue}>
                    {formatPrice(item.unit_price)}
                  </Text>
                </View>
                {item.discount_percent > 0 && (
                  <View style={styles.itemDetailRow}>
                    <Text style={styles.itemDetailLabel}>Discount</Text>
                    <Text style={[styles.itemDetailValue, styles.discountText]}>
                      {item.discount_percent}%
                    </Text>
                  </View>
                )}
                <View style={[styles.itemDetailRow, styles.itemTotalRow]}>
                  <Text style={styles.itemTotalLabel}>Line Total</Text>
                  <Text style={styles.itemTotalValue}>
                    {formatPrice(item.line_total)}
                  </Text>
                </View>
              </View>

              {/* Shipment Status */}
              {item.shipped_quantity > 0 && (
                <View style={styles.shipmentStatus}>
                  <Text style={styles.shipmentStatusText}>
                    Shipped: {item.shipped_quantity} / {item.quantity}
                  </Text>
                  {item.shipped_quantity < item.quantity && (
                    <Text style={styles.pendingText}>
                      Pending: {item.quantity - item.shipped_quantity}
                    </Text>
                  )}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatPrice(order.subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Freight Charges</Text>
              <Text style={styles.summaryValue}>
                {order.total_freight > 0
                  ? formatPrice(order.total_freight)
                  : 'TBD on shipment'}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalValue}>
                {formatPrice(order.grand_total)}
              </Text>
            </View>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <View style={styles.addressCard}>
            <Text style={styles.addressText}>{order.delivery_address}</Text>
          </View>
        </View>

        {/* Contact Support */}
        <View style={styles.supportSection}>
          <Text style={styles.supportText}>Need help with your order?</Text>
          <Button
            title="Contact Support"
            onPress={handleContactSupport}
            variant="outline"
            fullWidth
          />
        </View>
      </ScrollView>
    </>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    marginRight: 16,
  },
  orderNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#999',
  },
  statusMessageContainer: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    marginBottom: 12,
  },
  statusMessage: {
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  itemCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  itemHeader: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemSku: {
    fontSize: 12,
    color: '#999',
  },
  itemDetails: {
    gap: 8,
  },
  itemDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemDetailLabel: {
    fontSize: 14,
    color: '#666',
  },
  itemDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  discountText: {
    color: '#34C759',
  },
  itemTotalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  itemTotalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  itemTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
  shipmentStatus: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shipmentStatusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#34C759',
  },
  pendingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF9500',
  },
  summaryCard: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  grandTotalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  grandTotalValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#007AFF',
  },
  addressCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  supportSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 32,
  },
  supportText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
});
