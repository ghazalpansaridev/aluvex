import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../../lib/auth-context';
import { EmptyState, LoadingSpinner, Badge } from '../../../components/ui';
import { fetchOrders } from '../../../lib/orders.api';
import { Order } from '../../../types/database';
import { formatPrice } from '../../../lib/utils';

/**
 * Order History Screen
 * Displays list of orders for the logged-in retailer
 */
export default function OrdersScreen() {
  const router = useRouter();
  const { retailer } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = async () => {
    if (!retailer) return;

    try {
      const data = await fetchOrders(retailer.id);
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load orders on initial mount
  useEffect(() => {
    loadOrders();
  }, [retailer]);

  // Reload orders when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (retailer) {
        loadOrders();
      }
    }, [retailer])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const handleOrderPress = (orderId: string) => {
    router.push(`/(retailer)/orders/${orderId}`);
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

  const renderOrderCard = ({ item }: { item: Order }) => {
    const orderDate = new Date(item.created_at);
    const formattedDate = orderDate.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => handleOrderPress(item.id)}
        activeOpacity={0.7}
      >
        {/* Order Header */}
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <Text style={styles.orderNumber}>{item.order_number}</Text>
            <Text style={styles.orderDate}>{formattedDate}</Text>
          </View>
          <Badge
            label={getStatusLabel(item.status)}
            variant={getStatusVariant(item.status)}
            size="sm"
          />
        </View>

        {/* Order Details */}
        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order Total</Text>
            <Text style={styles.detailValue}>{formatPrice(item.grand_total)}</Text>
          </View>
        </View>

        {/* View Details Button */}
        <View style={styles.viewDetailsContainer}>
          <Text style={styles.viewDetailsText}>View Details →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading orders..." />;
  }

  if (orders.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          title="No orders yet"
          description="Your order history will appear here"
          icon="📋"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        renderItem={renderOrderCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  orderCard: {
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#999',
  },
  orderDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  viewDetailsContainer: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'right',
  },
});
