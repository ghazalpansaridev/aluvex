import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../lib/auth-context';
import { useItems } from '../../../hooks/useItems';
import { useCategories } from '../../../hooks/useCategories';
import { useCart } from '../../../hooks/useCart';
import { LoadingSpinner, EmptyState } from '../../../components/ui';
import {
  ProductCard,
  CategoryFilter,
  SearchBar,
} from '../../../components/catalog';
import { ItemFilters } from '../../../lib/items.api';

/**
 * Retailer Catalog Screen
 * Displays items in a 2-column grid with filtering capabilities
 * - Approved retailers see discounted prices
 * - Pending retailers see MRP only
 * - Items are filtered by retailer's pincode
 */
export default function RetailerCatalogScreen() {
  const router = useRouter();
  const { retailer, retailerStatus } = useAuth();
  const { addItem } = useCart();

  // Filters state
  const [filters, setFilters] = useState<ItemFilters>({
    status: 'active',
    pincode: retailer?.pincode,
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Data hooks
  const { categories, loading: categoriesLoading } = useCategories();
  const { items, loading, error, refetch } = useItems({
    ...filters,
    search: searchQuery,
  });

  const isPending = retailerStatus === 'pending';

  const handleCategorySelect = (categoryId: string | undefined) => {
    setFilters(prev => ({ ...prev, categoryId, subcategoryId: undefined }));
  };

  const handleSubcategorySelect = (subcategoryId: string | undefined) => {
    setFilters(prev => ({ ...prev, subcategoryId }));
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleProductPress = (itemId: string) => {
    router.push(`/(retailer)/catalog/${itemId}`);
  };

  const handleAddToCart = async (item: any) => {
    // Check if item available in retailer's pincode
    if (retailer?.pincode && !item.available_pincodes.includes(retailer.pincode)) {
      console.error('Item unavailable at your location');
      return;
    }
    
    try {
      await addItem(item.id, 1);
      console.log('Added to cart successfully');
    } catch (err: any) {
      console.error('Failed to add to cart:', err.message);
    }
  };

  const renderItem = useCallback(
    ({ item }: { item: any }) => (
      <ProductCard
        item={item}
        onPress={() => handleProductPress(item.id)}
        showMrpOnly={isPending}
        onAddToCart={() => handleAddToCart(item)}
        showAddToCart={!isPending}
      />
    ),
    [isPending, retailer?.pincode]
  );

  const renderEmptyComponent = () => {
    if (loading) return null;
    
    return (
      <EmptyState
        title="No products found"
        description={
          searchQuery
            ? 'Try a different search term'
            : filters.categoryId || filters.subcategoryId
            ? 'No products in this category'
            : retailer?.pincode
            ? 'No products available in your area'
            : 'No products available'
        }
        icon="📦"
      />
    );
  };

  if (loading && items.length === 0) {
    return <LoadingSpinner fullScreen message="Loading catalog..." />;
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <EmptyState
          title="Error loading catalog"
          description={error}
          icon="❌"
          action={{
            label: 'Retry',
            onPress: refetch,
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search */}
      <SearchBar
        value={searchQuery}
        onSearch={handleSearch}
        placeholder="Search products..."
      />

      {/* Category filters */}
      {!categoriesLoading && (
        <CategoryFilter
          categories={categories}
          selectedCategoryId={filters.categoryId}
          selectedSubcategoryId={filters.subcategoryId}
          onSelectCategory={handleCategorySelect}
          onSelectSubcategory={handleSubcategorySelect}
        />
      )}

      {/* Products grid */}
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} />
        }
        ListEmptyComponent={renderEmptyComponent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 100,
  },
});
