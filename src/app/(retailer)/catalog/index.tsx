import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
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
  const { addItem, getItemQuantity, getCartItemId, updateQuantity, refetch: refetchCart } = useCart();

  // Filters state - no pincode filter; restricted items are shown with an overlay instead
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

  const isPending = retailerStatus === 'pending';

  // Refresh cart when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetchCart();
    }, [refetchCart])
  );

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

  const handleIncrementQuantity = async (item: any) => {
    // Check if item is restricted for the retailer's pincode
    if (retailer?.pincode && item.restricted_pincodes.includes(retailer.pincode)) {
      Alert.alert('Not Available', 'This item is not available for delivery in your area.');
      return;
    }

    try {
      await addItem(item.id, 1);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to add item to cart. Please try again.');
    }
  };

  const handleDecrementQuantity = async (itemId: string) => {
    const cartItemId = getCartItemId(itemId);
    if (!cartItemId) return;

    const currentQty = getItemQuantity(itemId);
    if (currentQty > 0) {
      try {
        await updateQuantity(cartItemId, currentQty - 1);
      } catch (err: any) {
        Alert.alert('Error', 'Failed to update cart. Please try again.');
      }
    }
  };

  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      const isRestricted = retailer?.pincode
        ? item.restricted_pincodes.includes(retailer.pincode)
        : false;

      return (
        <ProductCard
          item={item}
          onPress={() => handleProductPress(item.id)}
          showMrpOnly={isPending}
          cartQuantity={getItemQuantity(item.id)}
          onIncrementQuantity={() => handleIncrementQuantity(item)}
          onDecrementQuantity={() => handleDecrementQuantity(item.id)}
          showQuantityControls={!isPending && !isRestricted}
          isRestricted={isRestricted}
        />
      );
    },
    [isPending, retailer?.pincode, getItemQuantity, getCartItemId]
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
