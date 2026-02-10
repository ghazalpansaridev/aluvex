import React from 'react';
import { AddItemScreenBase } from '../../(ops)/items/add';

/**
 * Admin Add Item screen
 * Wraps the ops AddItemScreenBase with admin-specific back route
 * so after saving, navigation stays within the (admin) route group.
 */
export default function AdminAddItemScreen() {
  return <AddItemScreenBase backRoute="/(admin)/items" />;
}
