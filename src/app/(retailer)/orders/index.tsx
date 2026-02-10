import React, { useState, useCallback } from 'react';
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
import { SearchBar, OrderFilterBar } from '../../../components/orders';
import { fetchRetailerOrders } from '../../../lib/orders.api';
import { Order, OrderStatus, OrderFilters } from '../../../types/database';
import { formatPrice, formatDateRange } from '../../../lib/utils';

/**
 * Order History Screen
 * Displays list of orders for the logged-in retailer with search and filters
 */
export default function OrdersScreen() {
  const router = useRouter();
  const { retailer } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');
  const [selectedDateRange, setSelectedDateRange] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);

  const loadOrders = useCallback(async () => {
    if (!retailer) return;

    try {
      const filters: OrderFilters = {};

      if (selectedStatus !== 'all') {
        filters.status = selectedStatus;
      }

      if (selectedDateRange) {
        const dateRange = formatDateRange(selectedDateRange);
        filters.dateRange = {
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
        };
      }

      if (searchQuery.trim()) {
        filters.searchQuery = searchQuery.trim();
      }

      const data = await fetchRetailerOrders(retailer.id, filters);
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [retailer, selectedStatus, selectedDateRange, searchQuery]);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const handleOrderPress = (orderId: string) => {
    router.push(`/(retailer)/orders/${orderId}`);
  };

  const handleClearFilters = () => {
    setSelectedStatus('all');
    setSelectedDateRange('');
    setSearchQuery('');
  };

  const getStatusCounts = () => {
    const counts: Record<string, number> = {
      all: orders.length,
      placed: 0,
      partially_shipped: 0,
      shipped: 0,
      cancelled: 0,
    };

    orders.forEach(order => {
      counts[order.status] = (counts[order.status] || 0) + 1;
    });

    return counts;
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'placed':
        return 'info';
      case 'processing':
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
      case 'processing':
        return 'Processing';
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

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        onFilterPress={() => setShowFilterModal(true)}
        placeholder="Search by order number"
      />

      {/* Orders List */}
      {orders.length === 0 ? (
        <EmptyState
          title={searchQuery || selectedStatus !== 'all' || selectedDateRange
            ? 'No orders found'
            : 'No orders yet'}
          description={searchQuery || selectedStatus !== 'all' || selectedDateRange
            ? 'Try adjusting your search or filters'
            : 'Your order history will appear here'}
          icon="📋"
        />
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}

      {/* Filter Modal */}
      <OrderFilterBar
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        selectedStatus={selectedStatus}
        selectedDateRange={selectedDateRange}
        onApply={(status, dateRange) => {
          setSelectedStatus(status);
          setSelectedDateRange(dateRange);
        }}
        onClearFilters={handleClearFilters}
        statusCounts={getStatusCounts()}
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
