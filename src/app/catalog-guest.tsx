import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { useItems } from '../hooks/useItems';
import { useCategories } from '../hooks/useCategories';
import { LoadingSpinner, EmptyState } from '../components/ui';
import {
  ProductCard,
  CategoryFilter,
  SearchBar,
} from '../components/catalog';
import { ItemFilters } from '../lib/items.api';

export default function GuestCatalogPage() {
  const router = useRouter();
  const navigation = useNavigation();

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

  // Header configuration removed - login button removed from top right

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
    // Redirect to login for guests
    router.push('/(auth)/login');
  };

  const handleLoginPress = () => {
    router.push('/(auth)/login');
  };

  const renderItem = useCallback(
    ({ item }: { item: any }) => (
      <ProductCard
        item={item}
        onPress={() => handleProductPress(item.id)}
        showMrpOnly={true}
        cartQuantity={0}
        onIncrementQuantity={() => handleLoginPress()}
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

  const renderListHeader = () => (
    <View style={styles.guestBanner}>
      <Text style={styles.guestBannerTitle}>👋 Welcome, Guest!</Text>
      <Text style={styles.guestBannerText}>
        Browse our catalog. Login to place orders and access full features.
      </Text>
      <TouchableOpacity style={styles.loginButton} onPress={handleLoginPress}>
        <Text style={styles.loginButtonText}>Login / Register</Text>
      </TouchableOpacity>
    </View>
  );

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
        ListHeaderComponent={renderListHeader}
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
  headerButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestBanner: {
    backgroundColor: '#4A90E2',
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  guestBannerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  guestBannerText: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.95,
  },
  loginButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  loginButtonText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '600',
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
