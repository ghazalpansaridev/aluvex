import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { CategoryWithSubcategories } from '../../lib/categories.api';

interface CategoryFilterProps {
  categories: CategoryWithSubcategories[];
  selectedCategoryId?: string;
  selectedSubcategoryId?: string;
  onSelectCategory: (categoryId: string | undefined) => void;
  onSelectSubcategory: (subcategoryId: string | undefined) => void;
}

/**
 * CategoryFilter Component
 * Two-row horizontal scrollable filter with chips
 * - Row 1: Categories (with "All" option)
 * - Row 2: Subcategories (shown only when category is selected and has subcategories)
 * Active chips have blue background, inactive have gray background
 */
export function CategoryFilter({
  categories,
  selectedCategoryId,
  selectedSubcategoryId,
  onSelectCategory,
  onSelectSubcategory,
}: CategoryFilterProps) {
  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  return (
    <View style={styles.container}>
      {/* Categories row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <TouchableOpacity
          style={[styles.chip, !selectedCategoryId && styles.chipActive]}
          onPress={() => {
            onSelectCategory(undefined);
            onSelectSubcategory(undefined);
          }}
        >
          <Text
            style={[
              styles.chipText,
              !selectedCategoryId && styles.chipTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        {categories.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.chip,
              selectedCategoryId === category.id && styles.chipActive,
            ]}
            onPress={() => {
              onSelectCategory(category.id);
              onSelectSubcategory(undefined);
            }}
          >
            <Text
              style={[
                styles.chipText,
                selectedCategoryId === category.id && styles.chipTextActive,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Subcategories row (if category selected and has subcategories) */}
      {selectedCategory && selectedCategory.subcategories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <TouchableOpacity
            style={[
              styles.subChip,
              !selectedSubcategoryId && styles.subChipActive,
            ]}
            onPress={() => onSelectSubcategory(undefined)}
          >
            <Text
              style={[
                styles.subChipText,
                !selectedSubcategoryId && styles.subChipTextActive,
              ]}
            >
              All {selectedCategory.name}
            </Text>
          </TouchableOpacity>
          {selectedCategory.subcategories.map(sub => (
            <TouchableOpacity
              key={sub.id}
              style={[
                styles.subChip,
                selectedSubcategoryId === sub.id && styles.subChipActive,
              ]}
              onPress={() => onSelectSubcategory(sub.id)}
            >
              <Text
                style={[
                  styles.subChipText,
                  selectedSubcategoryId === sub.id && styles.subChipTextActive,
                ]}
              >
                {sub.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  scrollView: {
    marginBottom: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#007AFF',
  },
  chipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
  },
  subChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  subChipActive: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  subChipText: {
    fontSize: 12,
    color: '#666',
  },
  subChipTextActive: {
    color: '#007AFF',
    fontWeight: '500',
  },
});
