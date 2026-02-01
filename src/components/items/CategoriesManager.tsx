import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  Category,
  Subcategory,
} from '../../lib/api';
import { LoadingSpinner, Button } from '../ui';

export function CategoriesManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'category' | 'subcategory'>('category');
  const [editingItem, setEditingItem] = useState<Category | Subcategory | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDiscount, setFormDiscount] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchCategories(supabase);
      setCategories(data);
    } catch (err: any) {
      console.error('Error loading categories:', err);
      if (Platform.OS === 'web') {
        alert(`Error: ${err.message || 'Failed to load categories'}`);
      } else {
        Alert.alert('Error', err.message || 'Failed to load categories');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const openAddCategoryModal = () => {
    setModalType('category');
    setEditingItem(null);
    setFormName('');
    setFormDiscount('0');
    setShowModal(true);
  };

  const openEditCategoryModal = (category: Category) => {
    setModalType('category');
    setEditingItem(category);
    setFormName(category.name);
    setFormDiscount(category.discount_percent.toString());
    setShowModal(true);
  };

  const openAddSubcategoryModal = (categoryId: string) => {
    setModalType('subcategory');
    setEditingItem(null);
    setSelectedCategory(categoryId);
    setFormName('');
    setFormDiscount('0');
    setShowModal(true);
  };

  const openEditSubcategoryModal = (subcategory: Subcategory) => {
    setModalType('subcategory');
    setEditingItem(subcategory);
    setSelectedCategory(subcategory.category_id);
    setFormName(subcategory.name);
    setFormDiscount(subcategory.discount_percent.toString());
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      if (Platform.OS === 'web') {
        alert('Name is required');
      } else {
        Alert.alert('Error', 'Name is required');
      }
      return;
    }

    const discount = parseFloat(formDiscount) || 0;

    try {
      if (modalType === 'category') {
        if (editingItem) {
          await updateCategory(editingItem.id, formName, discount, supabase);
        } else {
          await createCategory(formName, discount, supabase);
        }
      } else {
        if (!selectedCategory) return;
        if (editingItem) {
          await updateSubcategory(editingItem.id, formName, discount, supabase);
        } else {
          await createSubcategory(selectedCategory, formName, discount, supabase);
        }
      }

      setShowModal(false);
      loadCategories();

      if (Platform.OS === 'web') {
        alert('Saved successfully');
      } else {
        Alert.alert('Success', 'Saved successfully');
      }
    } catch (err: any) {
      console.error('Error saving:', err);
      if (Platform.OS === 'web') {
        alert(`Error: ${err.message || 'Failed to save'}`);
      } else {
        Alert.alert('Error', err.message || 'Failed to save');
      }
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    const performDelete = async () => {
      try {
        await deleteCategory(id, supabase);
        loadCategories();
        if (Platform.OS === 'web') {
          alert('Category deleted successfully');
        } else {
          Alert.alert('Success', 'Category deleted successfully');
        }
      } catch (err: any) {
        console.error('Error deleting category:', err);
        if (Platform.OS === 'web') {
          alert(`Error: ${err.message || 'Failed to delete'}`);
        } else {
          Alert.alert('Error', err.message || 'Failed to delete');
        }
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Are you sure you want to delete "${name}"? This will also delete all subcategories.`
      );
      if (confirmed) {
        performDelete();
      }
    } else {
      Alert.alert(
        'Delete Category',
        `Are you sure you want to delete "${name}"? This will also delete all subcategories.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: performDelete,
          },
        ]
      );
    }
  };

  const handleDeleteSubcategory = async (id: string, name: string) => {
    const performDelete = async () => {
      try {
        await deleteSubcategory(id, supabase);
        loadCategories();
        if (Platform.OS === 'web') {
          alert('Subcategory deleted successfully');
        } else {
          Alert.alert('Success', 'Subcategory deleted successfully');
        }
      } catch (err: any) {
        console.error('Error deleting subcategory:', err);
        if (Platform.OS === 'web') {
          alert(`Error: ${err.message || 'Failed to delete'}`);
        } else {
          Alert.alert('Error', err.message || 'Failed to delete');
        }
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Are you sure you want to delete subcategory "${name}"?`
      );
      if (confirmed) {
        performDelete();
      }
    } else {
      Alert.alert(
        'Delete Subcategory',
        `Are you sure you want to delete subcategory "${name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: performDelete,
          },
        ]
      );
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading categories..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Categories</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={openAddCategoryModal}
        >
          <Text style={styles.addButtonText}>+ Category</Text>
        </TouchableOpacity>
      </View>

      {/* Categories List */}
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={({ item: category }) => (
          <View style={styles.categoryContainer}>
            {/* Category Header */}
            <TouchableOpacity
              style={styles.categoryHeader}
              onPress={() => toggleCategory(category.id)}
            >
              <View style={styles.categoryLeft}>
                <Text style={styles.expandIcon}>
                  {expandedCategories.has(category.id) ? '▼' : '▶'}
                </Text>
                <View>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryDiscount}>
                    {category.discount_percent}% discount
                  </Text>
                </View>
              </View>
              <View style={styles.categoryActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => openEditCategoryModal(category)}
                >
                  <Text style={styles.actionIcon}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() =>
                    handleDeleteCategory(category.id, category.name)
                  }
                >
                  <Text style={styles.actionIcon}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>

            {/* Subcategories */}
            {expandedCategories.has(category.id) && (
              <View style={styles.subcategoriesContainer}>
                <TouchableOpacity
                  style={styles.addSubcategoryButton}
                  onPress={() => openAddSubcategoryModal(category.id)}
                >
                  <Text style={styles.addSubcategoryText}>+ Subcategory</Text>
                </TouchableOpacity>

                {category.subcategories?.map((subcategory) => (
                  <View key={subcategory.id} style={styles.subcategoryItem}>
                    <View style={styles.subcategoryLeft}>
                      <Text style={styles.subcategoryName}>
                        {subcategory.name}
                      </Text>
                      <Text style={styles.subcategoryDiscount}>
                        {subcategory.discount_percent}% discount
                      </Text>
                    </View>
                    <View style={styles.subcategoryActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => openEditSubcategoryModal(subcategory)}
                      >
                        <Text style={styles.actionIcon}>✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() =>
                          handleDeleteSubcategory(subcategory.id, subcategory.name)
                        }
                      >
                        <Text style={styles.actionIcon}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />

      {/* Add/Edit Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingItem ? 'Edit' : 'Add'}{' '}
              {modalType === 'category' ? 'Category' : 'Subcategory'}
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={formName}
                onChangeText={setFormName}
                placeholder="Enter name"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Discount (%)</Text>
              <TextInput
                style={styles.input}
                value={formDiscount}
                onChangeText={setFormDiscount}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setShowModal(false)}
                variant="outline"
              />
              <View style={{ width: 12 }} />
              <Button title="Save" onPress={handleSave} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  listContent: {
    padding: 16,
  },
  categoryContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  expandIcon: {
    fontSize: 12,
    color: '#666',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  categoryDiscount: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 2,
  },
  categoryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  actionIcon: {
    fontSize: 14,
  },
  subcategoriesContainer: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 14,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  addSubcategoryButton: {
    paddingVertical: 10,
    paddingLeft: 32,
  },
  addSubcategoryText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
  },
  subcategoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingLeft: 32,
    paddingRight: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  subcategoryLeft: {
    flex: 1,
  },
  subcategoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  subcategoryDiscount: {
    fontSize: 11,
    color: '#10B981',
    marginTop: 2,
  },
  subcategoryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 20,
  },
});
