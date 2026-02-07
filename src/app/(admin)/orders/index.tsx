import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { EmptyState, LoadingSpinner } from '../../../components/ui';
import { OrderFilterBar, OrderCard, SearchBar } from '../../../components/orders';
import { fetchAllOrders, updateOrderStatus } from '../../../lib/orders.api';
import { OrderWithRetailer, OrderStatus, OrderFilters } from '../../../types/database';
import { formatDateRange } from '../../../lib/utils';

export default function AdminOrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderWithRetailer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');
  const [selectedDateRange, setSelectedDateRange] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);

  const loadOrders = useCallback(async () => {
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

      const data = await fetchAllOrders(filters);
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedStatus, selectedDateRange, searchQuery]);

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
    router.push(`/(admin)/orders/${orderId}`);
  };

  const handleProcessOrder = async (orderId: string) => {
    try {
      // Process button changes status to 'processing'
      await updateOrderStatus(orderId, 'processing');
      loadOrders();
    } catch (err) {
      console.error('Failed to process order:', err);
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    try {
      // Navigate to order details where they can cancel with reason
      router.push(`/(admin)/orders/${orderId}`);
    } catch (err) {
      console.error('Failed to reject order:', err);
    }
  };

  const getStatusCounts = () => {
    const counts: Record<string, number> = {
      all: orders.length,
      placed: 0,
      processing: 0,
      partially_shipped: 0,
      shipped: 0,
      cancelled: 0,
    };

    orders.forEach(order => {
      counts[order.status] = (counts[order.status] || 0) + 1;
    });

    return counts;
  };

  const handleClearFilters = () => {
    setSelectedStatus('all');
    setSelectedDateRange('');
    setSearchQuery('');
  };

  const renderOrderCard = ({ item }: { item: OrderWithRetailer }) => (
    <OrderCard
      order={item}
      onPress={() => handleOrderPress(item.id)}
      onProcess={() => handleProcessOrder(item.id)}
      onReject={() => handleRejectOrder(item.id)}
      showActions={item.status === 'placed'}
    />
  );

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
      />

      {/* Orders List */}
      {orders.length === 0 ? (
        <EmptyState
          title="No orders found"
          description="Orders matching your filters will appear here"
          icon="📦"
        />
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderCard}
          keyExtractor={item => item.id}
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
  },
});
