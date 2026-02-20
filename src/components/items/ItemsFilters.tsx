import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Select } from '../ui/Select';
import { supabase } from '../../lib/supabase';

interface Category {
  id: string;
  name: string;
  subcategories?: Subcategory[];
}

interface Subcategory {
  id: string;
  name: string;
  category_id: string;
}

type StatusFilter = 'all' | 'active' | 'inactive' | 'draft';

interface ItemsFiltersProps {
  categoryId?: string;
  subcategoryId?: string;
  availability: 'all' | 'in_stock' | 'out_of_stock';
  status?: StatusFilter;
  onCategoryChange: (categoryId: string | undefined) => void;
  onSubcategoryChange: (subcategoryId: string | undefined) => void;
  onAvailabilityChange: (availability: 'all' | 'in_stock' | 'out_of_stock') => void;
  onStatusChange?: (status: StatusFilter) => void;
  onClear: () => void;
}

export function ItemsFilters({
  categoryId,
  subcategoryId,
  availability,
  status = 'all',
  onCategoryChange,
  onSubcategoryChange,
  onAvailabilityChange,
  onStatusChange,
  onClear,
}: ItemsFiltersProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch categories with subcategories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select(`
            *,
            subcategories (
              id,
              name,
              category_id
            )
          `)
          .eq('status', 'active')
          .order('name', { ascending: true });

        if (error) throw error;
        setCategories(data || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Get subcategories for selected category
  const selectedCategory = categories.find((c) => c.id === categoryId);
  const subcategories = selectedCategory?.subcategories || [];

  // Category options
  const categoryOptions = [
    { label: 'All Categories', value: '' },
    ...categories.map((cat) => ({ label: cat.name, value: cat.id })),
  ];

  // Subcategory options
  const subcategoryOptions = [
    { label: 'All Subcategories', value: '' },
    ...subcategories.map((sub) => ({ label: sub.name, value: sub.id })),
  ];

  const handleCategorySelect = (value: string) => {
    onCategoryChange(value || undefined);
    if (!value) {
      onSubcategoryChange(undefined);
    }
  };

  const handleSubcategorySelect = (value: string) => {
    onSubcategoryChange(value || undefined);
  };

  const hasActiveFilters =
    categoryId ||
    subcategoryId ||
    availability !== 'all' ||
    status !== 'all';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Filters</Text>
        {hasActiveFilters && (
          <TouchableOpacity onPress={onClear}>
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Category Filter */}
        <Select
          label="Category"
          value={categoryId || ''}
          options={categoryOptions}
          onChange={handleCategorySelect}
          placeholder="Select category"
        />

        {/* Subcategory Filter */}
        <Select
          label="Subcategory"
          value={subcategoryId || ''}
          options={subcategoryOptions}
          onChange={handleSubcategorySelect}
          placeholder="Select subcategory"
          disabled={!categoryId}
        />

        {/* Status Filter */}
        {onStatusChange && (
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Status</Text>
            <View style={styles.chipContainer}>
              {(['all', 'active', 'inactive', 'draft'] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.chip,
                    status === s && styles.chipActive,
                  ]}
                  onPress={() => onStatusChange(s)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      status === s && styles.chipTextActive,
                    ]}
                  >
                    {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Availability Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Availability</Text>
          <View style={styles.chipContainer}>
            {(['all', 'in_stock', 'out_of_stock'] as const).map((avail) => (
              <TouchableOpacity
                key={avail}
                style={[
                  styles.chip,
                  availability === avail && styles.chipActive,
                ]}
                onPress={() => onAvailabilityChange(avail)}
              >
                <Text
                  style={[
                    styles.chipText,
                    availability === avail && styles.chipTextActive,
                  ]}
                >
                  {avail === 'all'
                    ? 'All'
                    : avail === 'in_stock'
                    ? 'In Stock'
                    : 'Out of Stock'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    maxHeight: 500,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  clearText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  chipActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  chipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
