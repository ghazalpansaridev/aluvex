import React from 'react';
import { EditItemScreenBase } from '../../(ops)/items/[id]';

/**
 * Admin Edit Item screen
 * Wraps the ops EditItemScreenBase with admin-specific back route
 * so after saving, navigation stays within the (admin) route group.
 */
export default function AdminEditItemScreen() {
  return <EditItemScreenBase backRoute="/(admin)/items" />;
}
