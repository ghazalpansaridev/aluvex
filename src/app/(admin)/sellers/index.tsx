import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useRetailers } from '../../../hooks/useRetailers';
import { RetailerWithEmail, RetailerStatus } from '../../../types/database';

type TabKey = 'all' | 'pending' | 'approved' | 'rejected';

const TABS: { key: TabKey; label: string; status: RetailerStatus | null }[] = [
  { key: 'all', label: 'All', status: null },
  { key: 'pending', label: 'Pending', status: 'pending' },
  { key: 'approved', label: 'Approved', status: 'approved' },
  { key: 'rejected', label: 'Rejected', status: 'rejected' },
];

const STATUS_COLORS: Record<RetailerStatus, string> = {
  pending: '#F59E0B',
  approved: '#10B981',
  rejected: '#EF4444',
};

const STATUS_BG: Record<RetailerStatus, string> = {
  pending: '#FEF3C7',
  approved: '#D1FAE5',
  rejected: '#FEE2E2',
};

export default function AdminSellersScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const statusFilter = TABS.find((t) => t.key === activeTab)?.status || undefined;

  const { retailers, loading, refreshing, refresh } = useRetailers({
    status: statusFilter,
  });

  // Client-side search filtering
  const filteredRetailers = useMemo(() => {
    if (!searchQuery.trim()) return retailers;
    const query = searchQuery.toLowerCase().trim();
    return retailers.filter(
      (r) =>
        r.business_name?.toLowerCase().includes(query) ||
        r.owner_name?.toLowerCase().includes(query) ||
        r.gst_number?.toLowerCase().includes(query) ||
        r.owner_phone?.includes(query) ||
        r.retailer_code?.toLowerCase().includes(query) ||
        r.email?.toLowerCase().includes(query) ||
        r.city?.toLowerCase().includes(query)
    );
  }, [retailers, searchQuery]);

  // Count pending for badge
  const pendingCount = useMemo(() => {
    if (activeTab === 'all') {
      return retailers.filter((r) => r.status === 'pending').length;
    }
    return 0;
  }, [retailers, activeTab]);

  const getAvatarColor = (status: RetailerStatus): string => {
    return STATUS_BG[status] || '#E5E5EA';
  };

  const getAvatarTextColor = (status: RetailerStatus): string => {
    return STATUS_COLORS[status] || '#666';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusLabel = (status: RetailerStatus) => {
    switch (status) {
      case 'pending':
        return 'Pending Verification';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  const handleSellerPress = (retailer: RetailerWithEmail) => {
    router.push(`/(admin)/sellers/${retailer.id}` as any);
  };

  const renderSellerItem = ({ item }: { item: RetailerWithEmail }) => (
    <TouchableOpacity
      style={styles.sellerRow}
      onPress={() => handleSellerPress(item)}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View
        style={[
          styles.avatar,
          { backgroundColor: getAvatarColor(item.status) },
        ]}
      >
        <Text
          style={[
            styles.avatarText,
            { color: getAvatarTextColor(item.status) },
          ]}
        >
          {item.business_name?.charAt(0)?.toUpperCase() || '?'}
        </Text>
      </View>

      {/* Info */}
      <View style={styles.sellerInfo}>
        <Text style={styles.businessName} numberOfLines={1}>
          {item.business_name}
        </Text>
        <Text style={styles.ownerName} numberOfLines={1}>
          {item.owner_name}
        </Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={12} color="#999" />
          <Text style={styles.locationText}>
            {item.city}
            {item.pincode ? ` - ${item.pincode}` : ''}
          </Text>
        </View>
      </View>

      {/* Right side: status + date */}
      <View style={styles.rightColumn}>
        <Badge
          label={getStatusLabel(item.status)}
          variant={item.status as any}
          size="sm"
        />
        <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading && retailers.length === 0) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Seller Management</Text>
        <Text style={styles.subtitle}>
          {retailers.length} seller{retailers.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const showBadge = tab.key === 'pending' && pendingCount > 0 && activeTab === 'all';
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
              {showBadge && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{pendingCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Input
          placeholder="Search by name, GST, phone, email..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={styles.searchInput}
          leftIcon={<Ionicons name="search-outline" size={20} color="#999" />}
        />
      </View>

      {/* List */}
      <FlatList
        data={filteredRetailers}
        renderItem={renderSellerItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          filteredRetailers.length === 0 ? styles.emptyContainer : styles.listContainer
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
        ListEmptyComponent={
          <EmptyState
            title={
              searchQuery
                ? 'No sellers match your search'
                : activeTab === 'pending'
                ? 'No pending applications'
                : activeTab === 'approved'
                ? 'No approved sellers'
                : activeTab === 'rejected'
                ? 'No rejected applications'
                : 'No sellers found'
            }
            description={
              searchQuery
                ? 'Try adjusting your search terms'
                : activeTab === 'pending'
                ? 'All applications have been reviewed'
                : 'Sellers will appear here once they register'
            }
            icon="storefront-outline"
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  tabActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  tabTextActive: {
    color: '#fff',
  },
  tabBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    paddingHorizontal: 6,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchInput: {
    marginBottom: 0,
  },
  listContainer: {
    paddingBottom: 16,
  },
  emptyContainer: {
    flex: 1,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
  },
  sellerInfo: {
    flex: 1,
    marginRight: 8,
  },
  businessName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  ownerName: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  locationText: {
    fontSize: 12,
    color: '#999',
  },
  rightColumn: {
    alignItems: 'flex-end',
    gap: 6,
  },
  dateText: {
    fontSize: 11,
    color: '#999',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 76, // align with text after avatar
  },
});
