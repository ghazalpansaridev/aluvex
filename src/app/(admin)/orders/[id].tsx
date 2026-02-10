import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  Pressable,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../../lib/auth-context';
import { LoadingSpinner, Badge, Button } from '../../../components/ui';
import { ShipmentForm, ShipmentHistoryItem } from '../../../components/orders';
import {
  fetchOrderDetails,
  createShipment,
  cancelOrder,
  cancelOrderItems,
  updateOrderStatus,
} from '../../../lib/orders.api';
import { OrderDetailsResponse } from '../../../types/database';
import { formatPrice } from '../../../lib/utils';

export default function AdminOrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [shipmentLoading, setShipmentLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');

  useEffect(() => {
    loadOrderDetails();
  }, [id]);

  const loadOrderDetails = async () => {
    try {
      if (!id) return;
      const data = await fetchOrderDetails(id);
      setOrder(data);
    } catch (err) {
      console.error('Failed to load order details:', err);
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShipment = async (data: {
    items: Array<{ orderItemId: string; itemId: string; quantity: number; unitPrice: number }>;
    freightCharge: number;
    notes: string;
  }) => {
    if (!order || !user) return;

    try {
      setShipmentLoading(true);
      await createShipment({
        orderId: order.id,
        items: data.items,
        freightCharge: data.freightCharge,
        notes: data.notes,
        createdBy: user.id,
      });

      Alert.alert('Success', 'Shipment created successfully', [
        {
          text: 'OK',
          onPress: () => {
            loadOrderDetails();
          },
        },
      ]);
    } catch (err: any) {
      console.error('Failed to create shipment:', err);
      Alert.alert('Error', err.message || 'Failed to create shipment');
    } finally {
      setShipmentLoading(false);
    }
  };

  const handleCancelItems = async (data: {
    items: Array<{ orderItemId: string; quantity: number }>;
    reason: string;
  }) => {
    if (!order || !user) return;

    try {
      setShipmentLoading(true);
      await cancelOrderItems({
        orderId: order.id,
        items: data.items,
        reason: data.reason,
        cancelledBy: user.id,
      });

      Alert.alert('Success', 'Selected items cancelled successfully', [
        {
          text: 'OK',
          onPress: () => {
            loadOrderDetails();
          },
        },
      ]);
    } catch (err: any) {
      console.error('Failed to cancel items:', err);
      Alert.alert('Error', err.message || 'Failed to cancel items');
    } finally {
      setShipmentLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order || !user || !cancellationReason.trim()) {
      Alert.alert('Error', 'Please provide a cancellation reason');
      return;
    }

    try {
      await cancelOrder(order.id, cancellationReason, user.id);
      setShowCancelModal(false);
      setCancellationReason('');
      Alert.alert('Success', 'Order cancelled successfully', [
        {
          text: 'OK',
          onPress: () => {
            router.back();
          },
        },
      ]);
    } catch (err: any) {
      console.error('Failed to cancel order:', err);
      Alert.alert('Error', err.message || 'Failed to cancel order');
    }
  };

  const handleProcessOrder = async () => {
    if (!order || !user) return;

    try {
      await updateOrderStatus(order.id, 'processing');
      Alert.alert('Success', 'Order moved to processing', [
        {
          text: 'OK',
          onPress: () => {
            loadOrderDetails();
          },
        },
      ]);
    } catch (err: any) {
      console.error('Failed to process order:', err);
      Alert.alert('Error', err.message || 'Failed to process order');
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'placed':
        return 'info';
      case 'processing':
        return 'warning';
      case 'partially_shipped':
        return 'success';
      case 'shipped':
        return 'default';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'placed':
        return 'PLACED';
      case 'processing':
        return 'PROCESSING';
      case 'partially_shipped':
        return 'PARTIALLY SHIPPED';
      case 'shipped':
        return 'SHIPPED';
      case 'cancelled':
        return 'CANCELLED';
      default:
        return status.toUpperCase();
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading order details..." />;
  }

  if (!order) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Order not found</Text>
      </View>
    );
  }

  const canCreateShipment = order.status === 'processing' || order.status === 'partially_shipped';
  const hasShipments = order.shipments && order.shipments.length > 0;

  // Cancel Order button: only for 'placed' status.
  // Once processing starts (and shipments may exist), use line-level cancel instead.
  const canCancelFullOrder = order.status === 'placed';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Order Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.orderNumber}>{order.order_number}</Text>
            <Badge
              label={getStatusLabel(order.status)}
              variant={getStatusVariant(order.status)}
            />
          </View>
          <Text style={styles.orderDate}>
            {new Date(order.created_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        {/* Retailer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Retailer Information</Text>
          <View style={styles.infoCard}>
            <Text style={styles.retailerName}>{order.retailer?.business_name}</Text>
            <Text style={styles.infoText}>Owner: {order.retailer?.owner_name}</Text>
            <Text style={styles.infoText}>Phone: {order.retailer?.owner_phone}</Text>
            <Text style={styles.infoText}>
              {order.retailer?.business_address}
            </Text>
            <Text style={styles.infoText}>
              {order.retailer?.city}, {order.retailer?.state} - {order.retailer?.pincode}
            </Text>
            {order.retailer?.credit_limit && (
              <View style={styles.creditInfo}>
                <Text style={styles.creditLabel}>Credit Limit:</Text>
                <Text style={styles.creditValue}>
                  {formatPrice(order.retailer.credit_limit)}
                </Text>
                <Text style={styles.creditLabel}>Outstanding:</Text>
                <Text style={styles.creditValue}>
                  {formatPrice(order.retailer.outstanding_dues || 0)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Read-only Order Items - visible for ALL statuses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {order.items.map(item => (
            <View key={item.id} style={styles.readOnlyItemCard}>
              <View style={styles.readOnlyItemHeader}>
                <Text style={styles.readOnlyItemName}>{item.item_name}</Text>
                <Text style={styles.readOnlyItemSku}>SKU: {item.item_sku}</Text>
              </View>
              <View style={styles.readOnlyItemDetails}>
                <View style={styles.readOnlyItemRow}>
                  <Text style={styles.readOnlyDetailLabel}>Qty</Text>
                  <Text style={styles.readOnlyDetailValue}>{item.quantity}</Text>
                </View>
                <View style={styles.readOnlyItemRow}>
                  <Text style={styles.readOnlyDetailLabel}>Unit Price</Text>
                  <Text style={styles.readOnlyDetailValue}>{formatPrice(item.unit_price)}</Text>
                </View>
                {item.discount_percent > 0 && (
                  <View style={styles.readOnlyItemRow}>
                    <Text style={styles.readOnlyDetailLabel}>Discount</Text>
                    <Text style={[styles.readOnlyDetailValue, styles.discountText]}>
                      {item.discount_percent}%
                    </Text>
                  </View>
                )}
                <View style={[styles.readOnlyItemRow, styles.lineTotalRow]}>
                  <Text style={styles.lineTotalLabel}>Line Total</Text>
                  <Text style={styles.lineTotalValue}>{formatPrice(item.line_total)}</Text>
                </View>
              </View>
              {/* Fulfillment status for items that have activity */}
              {(item.shipped_quantity > 0 || (item.cancelled_quantity || 0) > 0) && (
                <View style={styles.fulfillmentStatus}>
                  <Text style={styles.fulfillmentText}>
                    Shipped: {item.shipped_quantity} / {item.quantity}
                    {(item.cancelled_quantity || 0) > 0 && (
                      <Text style={styles.cancelledText}>
                        {' '}| Cancelled: {item.cancelled_quantity}
                      </Text>
                    )}
                  </Text>
                  {item.remaining_quantity > 0 && (
                    <Text style={styles.pendingText}>
                      Remaining: {item.remaining_quantity}
                    </Text>
                  )}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Process Order Button - Only for 'placed' status */}
        {order.status === 'placed' && (
          <View style={styles.section}>
            <Button
              title="Process Order"
              onPress={handleProcessOrder}
              variant="primary"
            />
          </View>
        )}

        {/* Create Shipment / Cancel Items Section */}
        {canCreateShipment && order.items.some(item => item.remaining_quantity > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Process Items</Text>
            <ShipmentForm
              orderItems={order.items}
              onSubmit={handleCreateShipment}
              onCancelItems={handleCancelItems}
              loading={shipmentLoading}
            />
          </View>
        )}

        {/* Shipment History */}
        {hasShipments && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shipment History</Text>
            {order.shipments.map(shipment => (
              <ShipmentHistoryItem
                key={shipment.id}
                shipment={shipment}
                onDownloadInvoice={() => {
                  // TODO: Implement invoice download
                  Alert.alert('Info', 'Invoice download coming soon');
                }}
              />
            ))}
          </View>
        )}

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal:</Text>
              <Text style={styles.summaryValue}>{formatPrice(order.subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Freight:</Text>
              <Text style={styles.summaryValue}>{formatPrice(order.total_freight)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Grand Total:</Text>
              <Text style={styles.grandTotalValue}>
                {formatPrice(order.grand_total)}
              </Text>
            </View>
          </View>
        </View>

        {/* Cancel Order Button - Only for 'placed' status (before any processing/shipments) */}
        {canCancelFullOrder && (
          <View style={styles.section}>
            <Button
              title="Cancel Order"
              onPress={() => setShowCancelModal(true)}
              variant="outline"
            />
          </View>
        )}

        {/* Cancellation Info */}
        {order.status === 'cancelled' && order.cancellation_reason && (
          <View style={styles.section}>
            <View style={styles.cancelledCard}>
              <Text style={styles.cancelledTitle}>Order Cancelled</Text>
              <Text style={styles.cancelledReason}>{order.cancellation_reason}</Text>
              {order.cancelled_at && (
                <Text style={styles.cancelledDate}>
                  Cancelled on:{' '}
                  {new Date(order.cancelled_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Cancel Order Modal */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowCancelModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancel Order</Text>
            <Text style={styles.modalDescription}>
              Please provide a reason for cancelling this order:
            </Text>
            <TextInput
              style={styles.modalInput}
              value={cancellationReason}
              onChangeText={setCancellationReason}
              placeholder="Enter cancellation reason..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => {
                  setShowCancelModal(false);
                  setCancellationReason('');
                }}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonConfirm}
                onPress={handleCancelOrder}
              >
                <Text style={styles.modalButtonConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  retailerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00897B',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 20,
  },
  creditInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
    gap: 8,
  },
  creditLabel: {
    fontSize: 13,
    color: '#666',
    marginRight: 4,
  },
  creditValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginRight: 16,
  },
  // Read-only order items styles
  readOnlyItemCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  readOnlyItemHeader: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  readOnlyItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  readOnlyItemSku: {
    fontSize: 12,
    color: '#999',
  },
  readOnlyItemDetails: {
    gap: 6,
  },
  readOnlyItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  readOnlyDetailLabel: {
    fontSize: 13,
    color: '#666',
  },
  readOnlyDetailValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
  },
  discountText: {
    color: '#4CAF50',
  },
  lineTotalRow: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  lineTotalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  lineTotalValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#007AFF',
  },
  fulfillmentStatus: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fulfillmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  cancelledText: {
    color: '#ef5350',
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9800',
  },
  // Summary styles
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#666',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  grandTotalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4CAF50',
  },
  cancelledCard: {
    backgroundColor: '#ffebee',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ef5350',
  },
  cancelledTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#c62828',
    marginBottom: 8,
  },
  cancelledReason: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  cancelledDate: {
    fontSize: 12,
    color: '#999',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  modalButtonConfirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#ef5350',
    alignItems: 'center',
  },
  modalButtonConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
