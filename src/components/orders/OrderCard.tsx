import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { OrderWithRetailer } from '../../types/database';
import { formatPrice } from '../../lib/utils';
import { Badge } from '../ui';

interface OrderCardProps {
  order: OrderWithRetailer;
  onPress: () => void;
  onProcess?: () => void;
  onReject?: () => void;
  showActions?: boolean;
}

export default function OrderCard({
  order,
  onPress,
  onProcess,
  onReject,
  showActions = true,
}: OrderCardProps) {
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
        return 'ORDER PLACED';
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

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) {
      return `Today, ${date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })}`;
    }
    
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Show only first 2 items
  const displayItems = order.items?.slice(0, 2) || [];
  const hasMore = (order.items?.length || 0) > 2;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.orderNumber}>{order.order_number}</Text>
        <Text style={styles.timestamp}>
          {formatTimestamp(order.created_at)}
        </Text>
      </View>

      {/* Status and Retailer */}
      <View style={styles.statusRow}>
        <Badge
          label={getStatusLabel(order.status)}
          variant={getStatusVariant(order.status)}
          size="sm"
        />
        <Text style={styles.retailerName}>
          {order.retailer?.business_name || 'Unknown Retailer'}
        </Text>
      </View>

      {/* Order Items */}
      <View style={styles.itemsContainer}>
        {displayItems.map((item, index) => (
          <View key={item.id} style={styles.itemRow}>
            <View style={styles.itemImage}>
              <Text style={styles.itemImagePlaceholder}>📦</Text>
            </View>
            <View style={styles.itemDetails}>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.item_name}
              </Text>
              <Text style={styles.itemQuantity}>Qty: {item.quantity} N</Text>
            </View>
            <Text style={styles.itemPrice}>{formatPrice(item.line_total)}</Text>
          </View>
        ))}
        
        {hasMore && (
          <TouchableOpacity onPress={onPress}>
            <Text style={styles.viewMore}>View more</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Total */}
      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>Total:</Text>
        <Text style={styles.totalAmount}>{formatPrice(order.grand_total)}</Text>
      </View>

      {/* Actions */}
      {showActions && order.status === 'placed' && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={(e) => {
              e.stopPropagation();
              onReject?.();
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.rejectButtonText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.processButton}
            onPress={(e) => {
              e.stopPropagation();
              onProcess?.();
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.processButtonText}>Process</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  retailerName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#00897B',
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  itemsContainer: {
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  itemImage: {
    width: 50,
    height: 50,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemImagePlaceholder: {
    fontSize: 24,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 12,
    color: '#666',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  viewMore: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B35',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
  },
  rejectButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  processButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  processButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
