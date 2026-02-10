import React from 'react';
import { EditItemScreenBase } from '../../../(ops)/items/[id]';

/**
 * Edit Item screen within the catalog stack.
 * Navigated to from catalog Product Detail "Edit Item" button.
 * After saving, navigates back to catalog (stays within catalog tab context).
 */
export default function CatalogEditItemScreen() {
  return <EditItemScreenBase backRoute="/(admin)/catalog" />;
}
