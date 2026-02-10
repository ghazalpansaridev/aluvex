import React, { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { ItemsScreen } from '../../(ops)/items/index';

/**
 * Admin Items Management screen
 * Wraps the ops ItemsScreen with admin-specific navigation routes
 * to keep navigation within the (admin) route group.
 */
export default function AdminItemsScreen() {
  const router = useRouter();

  // Card press -> Product Detail within items stack
  const handleItemPress = useCallback((itemId: string) => {
    router.push(`/(admin)/items/detail/${itemId}` as any);
  }, [router]);

  // Triple-dot Edit -> Edit form within items stack
  const handleEditItem = useCallback((itemId: string) => {
    router.push(`/(admin)/items/${itemId}` as any);
  }, [router]);

  // Add button -> Add form within items stack
  const handleAddItem = useCallback(() => {
    router.push('/(admin)/items/add' as any);
  }, [router]);

  return (
    <ItemsScreen
      onItemPress={handleItemPress}
      onEditItem={handleEditItem}
      onAddItem={handleAddItem}
    />
  );
}
