import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect, useNavigation } from 'expo-router';
import { useCart } from '../../hooks/useCart';
import { LoadingSpinner, EmptyState, Button } from '../../components/ui';
import { CartItem, CartSummary } from '../../components/cart';

/**
 * Cart Screen
 * Displays cart items with quantity management
 * Only accessible to approved retailers
 */
export default function CartScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const {
    cartItems,
    cartCount,
    loading,
    error,
    updateQuantity,
    removeItem,
    clear,
    refetch,
    subtotal,
    calculateItemPrice,
  } = useCart();

  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  // Set header with Clear button
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        cartItems.length > 0 ? (
          <TouchableOpacity onPress={handleClearCart}>
            <Text style={styles.clearButton}>Clear</Text>
          </TouchableOpacity>
        ) : null,
    });
  }, [navigation, cartItems.length]);

  // Refresh cart when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleUpdateQuantity = async (cartItemId: string, quantity: number) => {
    try {
      setUpdatingItemId(cartItemId);
      await updateQuantity(cartItemId, quantity);
    } catch (err: any) {
      console.error('Failed to update quantity:', err.message);
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemoveItem = (cartItemId: string, itemName: string) => {
    // Web-compatible confirmation
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Remove "${itemName}" from cart?`);
      if (confirmed) {
        removeItemAsync(cartItemId);
      }
    } else {
      Alert.alert(
        'Remove Item',
        `Remove "${itemName}" from cart?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => removeItemAsync(cartItemId),
          },
        ]
      );
    }
  };

  const removeItemAsync = async (cartItemId: string) => {
    try {
      await removeItem(cartItemId);
    } catch (err: any) {
      console.error('Failed to remove item:', err);
      if (Platform.OS === 'web') {
        window.alert('Failed to remove item. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to remove item. Please try again.');
      }
    }
  };

  const handleClearCart = () => {
    // Web-compatible confirmation
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Remove all items from cart?');
      if (confirmed) {
        clearCartAsync();
      }
    } else {
      Alert.alert(
        'Clear Cart',
        'Remove all items from cart?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear All',
            style: 'destructive',
            onPress: clearCartAsync,
          },
        ]
      );
    }
  };

  const clearCartAsync = async () => {
    try {
      await clear();
    } catch (err: any) {
      console.error('Failed to clear cart:', err);
      if (Platform.OS === 'web') {
        window.alert('Failed to clear cart. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to clear cart. Please try again.');
      }
    }
  };

  const handleContinueShopping = () => {
    router.push('/(retailer)/catalog');
  };

  const handleCheckout = () => {
    router.push('/(retailer)/checkout');
  };

  const renderEmptyState = () => (
    <EmptyState
      title="Your cart is empty"
      description="Add items from the catalog to get started"
      icon="🛒"
      action={{
        label: 'Browse Catalog',
        onPress: handleContinueShopping,
      }}
    />
  );

  if (loading && cartItems.length === 0) {
    return <LoadingSpinner fullScreen message="Loading cart..." />;
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <EmptyState
          title="Error loading cart"
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

  if (cartItems.length === 0) {
    return <View style={styles.container}>{renderEmptyState()}</View>;
  }

  return (
    <View style={styles.container}>
      {/* Cart items list */}
      <FlatList
        data={cartItems}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <CartItem
            cartItem={item}
            itemPrice={calculateItemPrice(item)}
            onUpdateQuantity={handleUpdateQuantity}
            onRemove={() => handleRemoveItem(item.id, item.item.name)}
            calculating={updatingItemId === item.id}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} />
        }
        ListFooterComponent={
          <>
            {/* Cart summary */}
            <CartSummary itemCount={cartCount} subtotal={subtotal} />

            {/* Action buttons */}
            <View style={styles.actions}>
              <Button
                title="Continue Shopping"
                onPress={handleContinueShopping}
                variant="outline"
                style={styles.actionButton}
              />
              <Button
                title="Proceed to Checkout"
                onPress={handleCheckout}
                variant="primary"
                style={styles.actionButton}
                disabled={cartItems.length === 0}
              />
            </View>
          </>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButton: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
    marginRight: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingBottom: 32,
  },
  actionButton: {
    flex: 1,
  },
});
