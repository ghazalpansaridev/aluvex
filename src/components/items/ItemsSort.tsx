import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Select } from '../ui/Select';

export type SortOption = 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'latest';

interface ItemsSortProps {
  sortBy: SortOption;
  onSortChange: (sortBy: SortOption) => void;
  compact?: boolean;
}

const SORT_OPTIONS = [
  { label: 'Latest Added', value: 'latest' as SortOption },
  { label: 'Name A-Z', value: 'name_asc' as SortOption },
  { label: 'Name Z-A', value: 'name_desc' as SortOption },
  { label: 'Price Low-High', value: 'price_asc' as SortOption },
  { label: 'Price High-Low', value: 'price_desc' as SortOption },
];

export function ItemsSort({ sortBy, onSortChange, compact = false }: ItemsSortProps) {
  return (
    <View style={[styles.container, compact && styles.compact]}>
      <Select
        label={compact ? undefined : "Sort By"}
        value={sortBy}
        options={SORT_OPTIONS}
        onChange={(value) => onSortChange(value as SortOption)}
        placeholder="Sort by..."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  compact: {
    padding: 0,
    borderBottomWidth: 0,
  },
});
