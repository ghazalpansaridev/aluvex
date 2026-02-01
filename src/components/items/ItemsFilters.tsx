import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  SafeAreaView,
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

interface ItemsFiltersProps {
  categoryId?: string;
  subcategoryId?: string;
  availability: 'all' | 'in_stock' | 'out_of_stock';
  pincodes: string[];
  onCategoryChange: (categoryId: string | undefined) => void;
  onSubcategoryChange: (subcategoryId: string | undefined) => void;
  onAvailabilityChange: (availability: 'all' | 'in_stock' | 'out_of_stock') => void;
  onPincodesChange: (pincodes: string[]) => void;
  onClear: () => void;
}

// Sample pincodes - in production, fetch from database or config
const AVAILABLE_PINCODES = [
  '400001', '400002', '400003', '400004', '400005', // Mumbai
  '110001', '110002', '110003', '110004', '110005', // Delhi
  '560001', '560002', '560003', '560004', '560005', // Bangalore
  '600001', '600002', '600003', '600004', '600005', // Chennai
  '700001', '700002', '700003', '700004', '700005', // Kolkata
];

export function ItemsFilters({
  categoryId,
  subcategoryId,
  availability,
  pincodes,
  onCategoryChange,
  onSubcategoryChange,
  onAvailabilityChange,
  onPincodesChange,
  onClear,
}: ItemsFiltersProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPincodeModal, setShowPincodeModal] = useState(false);

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
    // Clear subcategory when category changes
    if (!value) {
      onSubcategoryChange(undefined);
    }
  };

  const handleSubcategorySelect = (value: string) => {
    onSubcategoryChange(value || undefined);
  };

  const togglePincode = (pincode: string) => {
    if (pincodes.includes(pincode)) {
      onPincodesChange(pincodes.filter((p) => p !== pincode));
    } else {
      onPincodesChange([...pincodes, pincode]);
    }
  };

  const hasActiveFilters =
    categoryId ||
    subcategoryId ||
    availability !== 'all' ||
    pincodes.length > 0;

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

        {/* Pincode Filter */}
        <View style={styles.filterSection}>
          <View style={styles.pincodeHeader}>
            <Text style={styles.filterLabel}>Pincodes ({pincodes.length} selected)</Text>
            <TouchableOpacity onPress={() => setShowPincodeModal(true)}>
              <Text style={styles.selectText}>Select</Text>
            </TouchableOpacity>
          </View>
          {pincodes.length > 0 && (
            <View style={styles.selectedPincodes}>
              {pincodes.slice(0, 3).map((pincode) => (
                <View key={pincode} style={styles.pincodeChip}>
                  <Text style={styles.pincodeChipText}>{pincode}</Text>
                  <TouchableOpacity
                    onPress={() => togglePincode(pincode)}
                    style={styles.removePincode}
                  >
                    <Text style={styles.removePincodeText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {pincodes.length > 3 && (
                <Text style={styles.morePincodes}>+{pincodes.length - 3} more</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Pincode Selection Modal */}
      <Modal
        visible={showPincodeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPincodeModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Pincodes</Text>
              <TouchableOpacity onPress={() => setShowPincodeModal(false)}>
                <Text style={styles.modalClose}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pincodeList}>
              <View style={styles.pincodeGrid}>
                {AVAILABLE_PINCODES.map((pincode) => (
                  <TouchableOpacity
                    key={pincode}
                    style={[
                      styles.pincodeOption,
                      pincodes.includes(pincode) && styles.pincodeOptionSelected,
                    ]}
                    onPress={() => togglePincode(pincode)}
                  >
                    <Text
                      style={[
                        styles.pincodeOptionText,
                        pincodes.includes(pincode) && styles.pincodeOptionTextSelected,
                      ]}
                    >
                      {pincode}
                    </Text>
                    {pincodes.includes(pincode) && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
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
  pincodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  selectedPincodes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  pincodeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  pincodeChipText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
    marginRight: 4,
  },
  removePincode: {
    marginLeft: 4,
  },
  removePincodeText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '700',
  },
  morePincodes: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalClose: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  pincodeList: {
    padding: 16,
  },
  pincodeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  pincodeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 100,
    justifyContent: 'space-between',
  },
  pincodeOptionSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  pincodeOptionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  pincodeOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '700',
  },
});
