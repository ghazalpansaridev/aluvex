import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../lib/auth-context';
import { supabase } from '../../../lib/supabase';
import { fetchItems, ItemWithPrice, FetchItemsResponse, deleteItem, toggleItemStatus } from '../../../lib/api';
import { LoadingSpinner, EmptyState, Button } from '../../../components/ui';
import { ItemCard, SearchBar, ItemsFilters, ItemsSort, SortOption, StockTrackCard, CategoriesManager } from '../../../components/items';

type StatusFilter = 'all' | 'active' | 'inactive' | 'draft';
type TabType = 'items' | 'stock' | 'categories';

export interface ItemsScreenProps {
  onItemPress?: (itemId: string) => void;
  onEditItem?: (itemId: string) => void;
  onAddItem?: () => void;
}

export function ItemsScreen({ onItemPress, onEditItem, onAddItem }: ItemsScreenProps) {
  const router = useRouter();
  const { user } = useAuth();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('items');
  
  // Items state
  const [items, setItems] = useState<ItemWithPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [subcategoryFilter, setSubcategoryFilter] = useState<string | undefined>();
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');
  const [pincodeFilter, setPincodeFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('latest');

  // UI states
  const [showFilters, setShowFilters] = useState(false);

  // Stock tracking state
  const [stockChanges, setStockChanges] = useState<Record<string, number>>({});
  const [updatingStock, setUpdatingStock] = useState(false);

  // Categories for filter chips
  const [allCategories, setAllCategories] = useState<Array<{ id: string; name: string }>>([]);

  // Fetch items function with all filters
  const loadItems = useCallback(
    async (pageNum: number, append: boolean = false) => {
      try {
        if (pageNum === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        setError(null);

        const response: FetchItemsResponse = await fetchItems(
          {
            page: pageNum,
            limit: 20,
            categoryId: categoryFilter,
            subcategoryId: subcategoryFilter,
            availability: availabilityFilter,
            pincodes: pincodeFilter.length > 0 ? pincodeFilter : undefined,
            status: statusFilter === 'all' ? undefined : statusFilter,
            search: searchQuery.trim() || undefined,
            sortBy,
          },
          supabase
        );

        if (!response.success) {
          throw new Error(response.error || 'Failed to fetch items');
        }

        if (append) {
          setItems((prev) => [...prev, ...(response.items || [])]);
        } else {
          setItems(response.items || []);
        }

        setHasMore(response.hasMore || false);
        setTotal(response.total || 0);
      } catch (err: any) {
        console.error('Error loading items:', err);
        setError(err.message || 'Failed to load items');
        if (!append) {
          Alert.alert('Error', err.message || 'Failed to load items');
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [categoryFilter, subcategoryFilter, availabilityFilter, pincodeFilter, statusFilter, searchQuery, sortBy]
  );

  // Load categories for filter chips
  useEffect(() => {
    const fetchCategoriesForFilters = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name')
          .order('name')
          .limit(6);

        if (!error && data) {
          setAllCategories(data);
        }
      } catch (err) {
        console.error('Error loading categories:', err);
      }
    };

    fetchCategoriesForFilters();
  }, []);

  // Initial load and reload when filters change
  useEffect(() => {
    if (user) {
      setPage(1);
      setItems([]);
      loadItems(1, false);
    }
  }, [user, loadItems]);

  // Load more handler
  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadItems(nextPage, true);
    }
  }, [loadingMore, hasMore, page, loadItems]);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    setPage(1);
    setItems([]);
    loadItems(1, false);
  }, [loadItems]);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setCategoryFilter(undefined);
    setSubcategoryFilter(undefined);
    setAvailabilityFilter('all');
    setPincodeFilter([]);
    setStatusFilter('all');
    setSearchQuery('');
    setSortBy('latest');
  }, []);

  // Check if any filters are active (excluding status which has its own chips)
  const hasActiveFilters = categoryFilter || subcategoryFilter || availabilityFilter !== 'all' || pincodeFilter.length > 0;

  // Category filter chip component
  const CategoryFilterChip = ({ categoryId, label }: { categoryId: string | null; label: string }) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        categoryFilter === categoryId && styles.categoryChipActive,
      ]}
      onPress={() => {
        setCategoryFilter(categoryId || undefined);
        setSubcategoryFilter(undefined); // Clear subcategory when changing category
      }}
    >
      <Text
        style={[
          styles.categoryChipText,
          categoryFilter === categoryId && styles.categoryChipTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  // Status filter chip component
  const StatusFilterChip = ({ status, label }: { status: StatusFilter; label: string }) => (
    <TouchableOpacity
      style={[
        styles.statusChip,
        statusFilter === status && styles.statusChipActive,
      ]}
      onPress={() => setStatusFilter(status)}
    >
      <Text
        style={[
          styles.statusChipText,
          statusFilter === status && styles.statusChipTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  // Retry handler
  const handleRetry = useCallback(() => {
    setError(null);
    loadItems(page, false);
  }, [page, loadItems]);

  // Item press handler - navigate to detail/edit screen
  const handleItemPress = useCallback((itemId: string) => {
    if (onItemPress) {
      onItemPress(itemId);
    } else {
      router.push(`/(ops)/items/${itemId}`);
    }
  }, [router, onItemPress]);

  // Edit item handler
  const handleEditItem = useCallback((itemId: string) => {
    if (onEditItem) {
      onEditItem(itemId);
    } else {
      router.push(`/(ops)/items/${itemId}`);
    }
  }, [router, onEditItem]);

  // Toggle item status handler
  const handleToggleStatus = useCallback(async (itemId: string, currentStatus: string, newStatus: 'active' | 'inactive') => {
    try {
      await toggleItemStatus(itemId, newStatus, supabase);
      
      // Update item in list
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId ? { ...item, status: newStatus } : item
        )
      );

      if (Platform.OS === 'web') {
        alert(`Item ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
      } else {
        Alert.alert('Success', `Item ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
      }
    } catch (err: any) {
      console.error('Error toggling item status:', err);
      const errorMessage = err.message || 'Failed to update item status';
      if (Platform.OS === 'web') {
        alert(`Error: ${errorMessage}`);
      } else {
        Alert.alert('Error', errorMessage);
      }
    }
  }, []);

  // Stock change handler
  const handleStockChange = useCallback((itemId: string, newStock: number) => {
    setStockChanges((prev) => ({
      ...prev,
      [itemId]: newStock,
    }));
  }, []);

  // Bulk update stock handler
  const handleBulkUpdateStock = useCallback(async () => {
    const changedItems = Object.entries(stockChanges);
    if (changedItems.length === 0) {
      if (Platform.OS === 'web') {
        alert('No changes to update');
      } else {
        Alert.alert('Info', 'No changes to update');
      }
      return;
    }

    try {
      setUpdatingStock(true);
      
      // Update each item's stock
      for (const [itemId, newStock] of changedItems) {
        await supabase
          .from('items')
          .update({ current_stock: newStock })
          .eq('id', itemId);
      }

      // Update local state
      setItems((prevItems) =>
        prevItems.map((item) => {
          const newStock = stockChanges[item.id];
          return newStock !== undefined ? { ...item, current_stock: newStock } : item;
        })
      );

      // Clear changes
      setStockChanges({});

      if (Platform.OS === 'web') {
        alert('Stock updated successfully');
      } else {
        Alert.alert('Success', 'Stock updated successfully');
      }
    } catch (err: any) {
      console.error('Error updating stock:', err);
      const errorMessage = err.message || 'Failed to update stock';
      if (Platform.OS === 'web') {
        alert(`Error: ${errorMessage}`);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setUpdatingStock(false);
    }
  }, [stockChanges]);

  // Delete item handler
  const handleDeleteItem = useCallback(async (itemId: string, itemName: string) => {
    console.log('handleDeleteItem called for:', itemId, itemName);
    
    const performDelete = async () => {
      console.log('Delete confirmed, calling deleteItem API for:', itemId);
      try {
        await deleteItem(itemId, supabase);
        console.log('Item deleted successfully:', itemId);
        // Refresh items list
        setPage(1);
        setItems([]);
        loadItems(1, false);
        
        if (Platform.OS === 'web') {
          alert('Item deactivated successfully');
        } else {
          Alert.alert('Success', 'Item deactivated successfully');
        }
      } catch (err: any) {
        console.error('Error deleting item:', err);
        const errorMessage = err.message || 'Failed to deactivate item';
        if (Platform.OS === 'web') {
          alert(`Error: ${errorMessage}`);
        } else {
          Alert.alert('Error', errorMessage);
        }
      }
    };

    // For web, use confirm dialog, for mobile use Alert
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Are you sure you want to deactivate "${itemName}"? This will set the item status to inactive.`
      );
      if (confirmed) {
        performDelete();
      }
    } else {
      Alert.alert(
        'Deactivate Item',
        `Are you sure you want to deactivate "${itemName}"? This will set the item status to inactive.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Deactivate',
            style: 'destructive',
            onPress: performDelete,
          },
        ]
      );
    }
  }, [loadItems]);

  // Render item
  const renderItem = useCallback(
    ({ item }: { item: ItemWithPrice }) => (
      <ItemCard
        item={item}
        onPress={() => handleItemPress(item.id)}
        onEdit={() => handleEditItem(item.id)}
        onDelete={() => handleDeleteItem(item.id, item.name)}
        onToggleStatus={(newStatus) => handleToggleStatus(item.id, item.status, newStatus)}
      />
    ),
    [handleItemPress, handleEditItem, handleDeleteItem, handleToggleStatus]
  );

  // Render footer (Load More button)
  const renderFooter = useCallback(() => {
    if (!hasMore) return null;

    return (
      <View style={styles.footer}>
        <Button
          title={loadingMore ? 'Loading...' : 'Load More'}
          onPress={handleLoadMore}
          disabled={loadingMore}
          loading={loadingMore}
          variant="outline"
          fullWidth
        />
      </View>
    );
  }, [hasMore, loadingMore, handleLoadMore]);

  // Render empty state
  const renderEmpty = useCallback(() => {
    if (loading) return null;

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <EmptyState
            title="Error Loading Items"
            description={error}
            icon="⚠️"
            actionLabel="Retry"
            onAction={handleRetry}
          />
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <EmptyState
          title="No items found"
          description="Start by adding your first item to the inventory"
          icon="📦"
          actionLabel="Add Item"
          onAction={() => {
            if (onAddItem) {
              onAddItem();
            } else {
              router.push('/(ops)/items/add');
            }
          }}
        />
      </View>
    );
  }, [loading, error, handleRetry, onAddItem]);

  // Loading state
  if (loading && items.length === 0) {
    return <LoadingSpinner fullScreen message="Loading items..." />;
  }

  // Tab button component
  const TabButton = ({ tab, label }: { tab: TabType; label: string }) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
      onPress={() => setActiveTab(tab)}
    >
      <Text style={[styles.tabButtonText, activeTab === tab && styles.tabButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header with count and Add button */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {total > 0 && activeTab === 'items' && (
            <Text style={styles.itemCount}>
              📦 {total} {total === 1 ? 'item' : 'items'} in inventory
            </Text>
          )}
        </View>
        {activeTab === 'items' && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              if (onAddItem) {
                onAddItem();
              } else {
                router.push('/(ops)/items/add');
              }
            }}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TabButton tab="items" label="ITEM LISTS" />
        <TabButton tab="stock" label="STOCK TRACK" />
        <TabButton tab="categories" label="CATEGORIES" />
      </View>

      {/* Tab Content */}
      {activeTab === 'items' && (
        <>
          {/* Category Filter Chips */}
          {allCategories.length > 0 && (
            <View style={styles.categoryFilterContainer}>
              <FlatList
                horizontal
                data={[{ id: null, name: 'All' }, ...allCategories]}
                keyExtractor={(item) => item.id || 'all'}
                renderItem={({ item }) => (
                  <CategoryFilterChip categoryId={item.id} label={item.name} />
                )}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryChipsContent}
              />
            </View>
          )}

          {/* Search Bar */}
          <SearchBar
            value={searchQuery}
            onSearch={setSearchQuery}
            placeholder="Search item..."
          />

          {/* Status Filter Chips */}
          <View style={styles.statusFilterContainer}>
            <StatusFilterChip status="all" label="All" />
            <StatusFilterChip status="active" label="Active" />
            <StatusFilterChip status="inactive" label="Inactive" />
            <StatusFilterChip status="draft" label="Draft" />
          </View>

          {/* Filter and Sort Buttons */}
          <View style={styles.filterBar}>
            <TouchableOpacity
              style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
              onPress={() => setShowFilters(true)}
            >
              <Text style={[styles.filterButtonText, hasActiveFilters && styles.filterButtonTextActive]}>
                🔍 Filters{hasActiveFilters && ` (${[categoryFilter && 'Cat', subcategoryFilter && 'Sub', availabilityFilter !== 'all' && 'Avail', pincodeFilter.length > 0 && `${pincodeFilter.length} Pins`].filter(Boolean).length})`}
              </Text>
            </TouchableOpacity>
            <View style={styles.sortContainer}>
              <ItemsSort sortBy={sortBy} onSortChange={setSortBy} compact />
            </View>
          </View>

          {/* Items List */}
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={
              items.length === 0 ? styles.emptyListContent : styles.listContent
            }
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={loading && items.length > 0} onRefresh={handleRefresh} />
            }
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderFooter}
          />
        </>
      )}

      {activeTab === 'stock' && (
        <>
          {/* Search Bar */}
          <SearchBar
            value={searchQuery}
            onSearch={setSearchQuery}
            placeholder="Search items..."
          />

          {/* Stock Items List */}
          <FlatList
            data={items}
            renderItem={({ item }) => (
              <StockTrackCard
                item={item}
                stockQuantity={stockChanges[item.id] ?? item.current_stock}
                onStockChange={(newStock) => handleStockChange(item.id, newStock)}
              />
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={
              items.length === 0 ? styles.emptyListContent : styles.listContent
            }
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={loading && items.length > 0} onRefresh={handleRefresh} />
            }
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderFooter}
          />

          {/* Bulk Update Button */}
          {Object.keys(stockChanges).length > 0 && (
            <View style={styles.bulkUpdateContainer}>
              <TouchableOpacity
                style={styles.bulkUpdateButton}
                onPress={handleBulkUpdateStock}
                disabled={updatingStock}
                activeOpacity={0.8}
              >
                <Text style={styles.bulkUpdateIcon}>🔄</Text>
                <Text style={styles.bulkUpdateText}>
                  {updatingStock ? 'Updating...' : 'Update'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {activeTab === 'categories' && <CategoriesManager />}

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ItemsFilters
              categoryId={categoryFilter}
              subcategoryId={subcategoryFilter}
              availability={availabilityFilter}
              pincodes={pincodeFilter}
              onCategoryChange={setCategoryFilter}
              onSubcategoryChange={setSubcategoryFilter}
              onAvailabilityChange={setAvailabilityFilter}
              onPincodesChange={setPincodeFilter}
              onClear={handleClearFilters}
            />
            <View style={styles.modalFooter}>
              <Button
                title="Apply Filters"
                onPress={() => setShowFilters(false)}
                fullWidth
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Default export for ops route - uses default navigation (/(ops)/ routes)
export default function OpsItemsScreen() {
  return <ItemsScreen />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  itemCount: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 2,
    borderBottomColor: '#e5e5e5',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#FF9500',
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    letterSpacing: 0.5,
  },
  tabButtonTextActive: {
    color: '#FF9500',
    fontWeight: '700',
  },
  tabContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
  filterBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 12,
  },
  filterButtonActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#007AFF',
    fontWeight: '700',
  },
  sortContainer: {
    flex: 1,
  },
  categoryFilterContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  categoryChipsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f8f8f8',
    marginRight: 10,
  },
  categoryChipActive: {
    backgroundColor: '#FF9500',
  },
  categoryChipText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  statusFilterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    gap: 10,
  },
  statusChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statusChipActive: {
    backgroundColor: '#FF9500',
    borderColor: '#FF9500',
  },
  statusChipText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  statusChipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: 20,
  },
  emptyListContent: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  footer: {
    padding: 16,
    paddingTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  bulkUpdateContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  bulkUpdateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9500',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    gap: 8,
  },
  bulkUpdateIcon: {
    fontSize: 18,
  },
  bulkUpdateText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
