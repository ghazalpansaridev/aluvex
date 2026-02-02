import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useItems } from '../../../hooks/useItems';
import { useCategories } from '../../../hooks/useCategories';
import { LoadingSpinner, EmptyState } from '../../../components/ui';
import {
  ProductCard,
  CategoryFilter,
  SearchBar,
} from '../../../components/catalog';
import { ItemFilters } from '../../../lib/items.api';

/**
 * Admin Catalog Screen
 * Displays items in a 2-column grid with filtering capabilities
 * - Admin users can view all products
 * - No cart functionality (view-only for admin team)
 */
export default function AdminCatalogScreen() {
  const router = useRouter();

  // Filters state
  const [filters, setFilters] = useState<ItemFilters>({
    status: 'active',
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Data hooks
  const { categories, loading: categoriesLoading } = useCategories();
  const { items, loading, error, refetch } = useItems({
    ...filters,
    search: searchQuery,
  });

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
    router.push(`/(ops)/items/${itemId}`);
  };

  const renderItem = useCallback(
    ({ item }: { item: any }) => (
      <ProductCard
        item={item}
        onPress={() => handleProductPress(item.id)}
        showMrpOnly={false}
        cartQuantity={0}
        onIncrementQuantity={() => {}}
        onDecrementQuantity={() => {}}
        showQuantityControls={false}
      />
    ),
    []
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
          actionLabel="Retry"
          onAction={refetch}
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
