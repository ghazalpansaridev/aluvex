import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import { OrderStatus } from '../../types/database';

interface FilterChip {
  id: string;
  label: string;
  value: OrderStatus | 'all';
  count?: number;
}

interface DateRangeOption {
  id: string;
  label: string;
  value: string; // '' | 'last_week' | 'last_month' | 'last_3_months'
}

interface OrderFilterBarProps {
  visible: boolean;
  onClose: () => void;
  selectedStatus: OrderStatus | 'all';
  selectedDateRange: string;
  onApply: (status: OrderStatus | 'all', dateRange: string) => void;
  onClearFilters: () => void;
  statusCounts?: Record<string, number>;
}

const STATUS_CHIPS: FilterChip[] = [
  { id: 'all', label: 'All', value: 'all' },
  { id: 'placed', label: 'Order Placed', value: 'placed' },
  { id: 'processing', label: 'Processing', value: 'processing' },
  { id: 'partially_shipped', label: 'Partially Shipped', value: 'partially_shipped' },
  { id: 'shipped', label: 'Shipped', value: 'shipped' },
  { id: 'cancelled', label: 'Cancelled', value: 'cancelled' },
];

const DATE_RANGE_OPTIONS: DateRangeOption[] = [
  { id: 'all_time', label: 'All Time', value: '' },
  { id: 'last_week', label: 'Last Week', value: 'last_week' },
  { id: 'last_month', label: 'Last Month', value: 'last_month' },
  { id: 'last_3_months', label: 'Last 3 Months', value: 'last_3_months' },
];

export default function OrderFilterBar({
  visible,
  onClose,
  selectedStatus,
  selectedDateRange,
  onApply,
  onClearFilters,
  statusCounts,
}: OrderFilterBarProps) {
  // Local state so changes only apply on "Apply" press
  const [localStatus, setLocalStatus] = useState<OrderStatus | 'all'>(selectedStatus);
  const [localDateRange, setLocalDateRange] = useState(selectedDateRange);

  // Sync local state when modal opens
  useEffect(() => {
    if (visible) {
      setLocalStatus(selectedStatus);
      setLocalDateRange(selectedDateRange);
    }
  }, [visible, selectedStatus, selectedDateRange]);

  const handleApply = () => {
    onApply(localStatus, localDateRange);
    onClose();
  };

  const handleClear = () => {
    setLocalStatus('all');
    setLocalDateRange('');
    onClearFilters();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Filters</Text>
            <TouchableOpacity onPress={handleClear}>
              <Text style={styles.clearButton}>Clear Filter</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Order Status */}
            <Text style={styles.sectionTitle}>Order Status</Text>
            <View style={styles.chipsContainer}>
              {STATUS_CHIPS.map(chip => {
                const isActive = localStatus === chip.value;
                const count = statusCounts?.[chip.value];
                
                return (
                  <TouchableOpacity
                    key={chip.id}
                    style={[styles.chip, isActive && styles.chipActive]}
                    onPress={() => setLocalStatus(chip.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {chip.label}
                      {count !== undefined && count > 0 && ` (${count})`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Order Time */}
            <Text style={styles.sectionTitle}>Order Time</Text>
            <View style={styles.dateRangeContainer}>
              {DATE_RANGE_OPTIONS.map(option => {
                const isActive = localDateRange === option.value;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[styles.chip, isActive && styles.chipActive]}
                    onPress={() => setLocalDateRange(option.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApply}
              activeOpacity={0.7}
            >
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  clearButton: {
    fontSize: 14,
    color: '#999',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    marginTop: 8,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  chipActive: {
    backgroundColor: '#FF8C42',
    borderColor: '#FF8C42',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  chipTextActive: {
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#FF8C42',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
