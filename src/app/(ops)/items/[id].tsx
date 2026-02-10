import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { HeaderLogo } from '../../../components/ui/HeaderLogo';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../../lib/auth-context';
import { supabase } from '../../../lib/supabase';
import {
  fetchItemById,
  updateItem,
  setItemPincodes,
  uploadItemImage,
  deleteItemImage,
  UpdateItemParams,
  ItemWithDetails,
} from '../../../lib/api';
import { Input, Button, Select, LoadingSpinner } from '../../../components/ui';

// Validation schema (SKU is not editable)
const itemSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(150, 'Name must be at most 150 characters'),
  description: z.string().max(1000, 'Description must be at most 1000 characters').optional(),
  mrp: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Enter valid price'),
  unit: z.string().min(1, 'Select a unit'),
  category_id: z.string().min(1, 'Select a category'),
  subcategory_id: z.string().optional(),
  min_stock_level: z.string().regex(/^\d+$/, 'Enter valid number'),
  current_stock: z.string().regex(/^\d+$/, 'Enter valid number'),
  status: z.string(),
});

type ItemFormData = z.infer<typeof itemSchema>;

const UNITS = [
  { label: 'Piece', value: 'Piece' },
  { label: 'Kilogram', value: 'Kg' },
  { label: 'Liter', value: 'Liter' },
  { label: 'Box', value: 'Box' },
  { label: 'Packet', value: 'Packet' },
  { label: 'Dozen', value: 'Dozen' },
];

const STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Draft', value: 'draft' },
];

const ADJUSTMENT_REASONS = [
  { label: 'New Stock', value: 'new_stock' },
  { label: 'Sold', value: 'sold' },
  { label: 'Damaged', value: 'damaged' },
  { label: 'Returned', value: 'returned' },
  { label: 'Other', value: 'other' },
];

// Available pincodes (same as ItemsFilters)
const AVAILABLE_PINCODES = [
  '400001', '400002', '400003', '400004', '400005', // Mumbai
  '110001', '110002', '110003', '110004', '110005', // Delhi
  '560001', '560002', '560003', '560004', '560005', // Bangalore
  '600001', '600002', '600003', '600004', '600005', // Chennai
  '700001', '700002', '700003', '700004', '700005', // Kolkata
];

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

interface ImageFile {
  uri: string;
  name: string;
  type: string;
}

interface ExistingImage {
  id: string;
  image_url: string;
  is_primary: boolean;
}

export default function EditItemScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, session } = useAuth();
  const [item, setItem] = useState<ItemWithDetails | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPincodes, setSelectedPincodes] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [newImages, setNewImages] = useState<ImageFile[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: '',
      description: '',
      mrp: '',
      unit: 'Piece',
      category_id: '',
      subcategory_id: '',
      min_stock_level: '10',
      current_stock: '0',
      status: 'draft',
    },
  });

  const selectedCategoryId = watch('category_id');
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const subcategories = selectedCategory?.subcategories || [];

  // Fetch item and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
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

        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);

        // Fetch item
        if (id) {
          const itemData = await fetchItemById(id, supabase);
          setItem(itemData);
          setSelectedPincodes(itemData.available_pincodes || []);
          setExistingImages(itemData.images || []);

          // Reset form with item data
          reset({
            name: itemData.name,
            description: itemData.description || '',
            mrp: itemData.mrp.toString(),
            unit: itemData.unit,
            category_id: itemData.category_id,
            subcategory_id: itemData.subcategory_id || '',
            min_stock_level: itemData.min_stock_level.toString(),
            current_stock: itemData.current_stock.toString(),
            status: itemData.status,
          });
        }
      } catch (err: any) {
        console.error('Error fetching data:', err);
        Alert.alert('Error', err.message || 'Failed to load item');
        if (err.message === 'Item not found') {
          router.back();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, reset, router]);

  const handlePickImage = async () => {
    const totalImages = existingImages.length + newImages.length - imagesToDelete.length;
    if (totalImages >= 5) {
      if (Platform.OS === 'web') {
        alert('You can have a maximum of 5 images');
      } else {
        Alert.alert('Limit Reached', 'You can have a maximum of 5 images');
      }
      return;
    }

    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      if (Platform.OS === 'web') {
        alert('Permission to access camera roll is required!');
      } else {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
      }
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5 - totalImages,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newImageFiles: ImageFile[] = result.assets.map((asset: any) => ({
        uri: asset.uri || '',
        name: asset.fileName || `image_${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      }));
      setNewImages([...newImages, ...newImageFiles]);
    }
  };

  const handleRemoveNewImage = (index: number) => {
    setNewImages(newImages.filter((_, i) => i !== index));
  };

  const handleDeleteExistingImage = (imageId: string) => {
    Alert.alert('Delete Image', 'Are you sure you want to delete this image?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setExistingImages(existingImages.filter((img) => img.id !== imageId));
          setImagesToDelete([...imagesToDelete, imageId]);
        },
      },
    ]);
  };

  const handleSetPrimaryImage = async (imageId: string) => {
    if (!id) return;

    try {
      // Update all images to not primary first
      const { error: updateAllError } = await supabase
        .from('item_images')
        .update({ is_primary: false })
        .eq('item_id', id);

      if (updateAllError) {
        console.error('Error updating all images:', updateAllError);
        throw updateAllError;
      }

      // Set selected image as primary
      const { error: updatePrimaryError } = await supabase
        .from('item_images')
        .update({ is_primary: true })
        .eq('id', imageId);

      if (updatePrimaryError) {
        console.error('Error setting primary image:', updatePrimaryError);
        throw updatePrimaryError;
      }

      // Update local state
      setExistingImages(
        existingImages.map((img) => ({
          ...img,
          is_primary: img.id === imageId,
        }))
      );

      Alert.alert('Success', 'Primary image updated');
    } catch (err: any) {
      console.error('Error in handleSetPrimaryImage:', err);
      Alert.alert('Error', err.message || 'Failed to update primary image. Please check your permissions.');
    }
  };

  const togglePincode = (pincode: string) => {
    setSelectedPincodes((prev) =>
      prev.includes(pincode)
        ? prev.filter((p) => p !== pincode)
        : [...prev, pincode]
    );
  };

  const onSubmit = async (data: ItemFormData) => {
    // Validate pincodes
    if (selectedPincodes.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one pincode');
      return;
    }

    // Validate images
    const totalImages = existingImages.length + newImages.length - imagesToDelete.length;
    if (totalImages === 0) {
      Alert.alert('Validation Error', 'Please keep at least one image');
      return;
    }

    if (!id || !item) return;

    try {
      setSubmitting(true);

      // Ensure user is authenticated
      if (!session || !user) {
        throw new Error('You must be logged in to update items');
      }

      // Ensure supabase client has the session
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        throw new Error('Session expired. Please log in again.');
      }

      // Calculate stock adjustment
      let finalStock = parseInt(data.current_stock);
      if (adjustmentQuantity && adjustmentQuantity !== '0') {
        finalStock = item.current_stock + parseInt(adjustmentQuantity);
        if (finalStock < 0) {
          Alert.alert('Validation Error', 'Stock cannot be negative');
          setSubmitting(false);
          return;
        }
      }

      // Update item
      const updateData: UpdateItemParams = {
        name: data.name,
        description: data.description || undefined,
        mrp: parseFloat(data.mrp),
        unit: data.unit,
        category_id: data.category_id,
        subcategory_id: data.subcategory_id || undefined,
        min_stock_level: parseInt(data.min_stock_level),
        current_stock: finalStock,
        status: data.status as 'active' | 'inactive' | 'draft',
      };

      console.log('Updating item with data:', updateData);
      await updateItem(id, updateData, supabase);
      console.log('Item updated successfully');

      // Update pincodes (non-blocking - continue even if fails)
      try {
        await setItemPincodes(id, selectedPincodes, supabase);
        console.log('Pincodes updated successfully');
      } catch (pincodeError: any) {
        console.error('Error updating pincodes:', pincodeError);
        // Continue - item is already updated
      }

      // Delete images (non-blocking)
      setUploadingImages(true);
      try {
        for (const imageId of imagesToDelete) {
          await deleteItemImage(imageId, supabase);
        }
        console.log('Images deleted successfully');
      } catch (deleteImageError: any) {
        console.error('Error deleting images:', deleteImageError);
        // Continue - item is already updated
      }

      // Upload new images (non-blocking)
      try {
        const isFirstImage = existingImages.length - imagesToDelete.length === 0;
        for (let i = 0; i < newImages.length; i++) {
          const isPrimary = isFirstImage && i === 0;
          await uploadItemImage(id, newImages[i], isPrimary, supabase);
        }
        console.log('New images uploaded successfully');
      } catch (uploadImageError: any) {
        console.error('Error uploading images:', uploadImageError);
        // Continue - item is already updated
      }
      setUploadingImages(false);

      // Show success message and navigate back
      if (Platform.OS === 'web') {
        alert('Item updated successfully');
        router.push('/(ops)/items');
      } else {
        Alert.alert('Success', 'Item updated successfully', [
          { text: 'OK', onPress: () => router.push('/(ops)/items') },
        ]);
      }
    } catch (err: any) {
      console.error('Error updating item:', err);
      const errorMessage = err.message || 'Failed to update item';
      if (Platform.OS === 'web') {
        alert(`Error: ${errorMessage}`);
      } else {
        Alert.alert('Error', errorMessage);
      }
      setUploadingImages(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading item..." />;
  }

  if (!item) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Item not found</Text>
        <Button title="Go Back" onPress={() => router.back()} />
      </View>
    );
  }

  const categoryOptions = categories.map((c) => ({ label: c.name, value: c.id }));
  const subcategoryOptions = subcategories.map((s) => ({ label: s.name, value: s.id }));
  const totalImages = existingImages.length + newImages.length - imagesToDelete.length;

  return (
    <>
      <Stack.Screen options={{ title: 'Edit Item', headerTitle: () => <HeaderLogo /> }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.skuContainer}>
            <Text style={styles.skuLabel}>SKU (Cannot be changed)</Text>
            <Text style={styles.skuValue}>{item.sku}</Text>
          </View>

          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Item Name"
                value={value}
                onChangeText={onChange}
                error={errors.name?.message}
                placeholder="Enter item name"
                required
              />
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Description"
                value={value || ''}
                onChangeText={onChange}
                error={errors.description?.message}
                placeholder="Item description (optional)"
                multiline
                numberOfLines={3}
              />
            )}
          />

          <Text style={styles.sectionTitle}>Pricing & Inventory</Text>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Controller
                control={control}
                name="mrp"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="MRP (₹)"
                    value={value}
                    onChangeText={onChange}
                    error={errors.mrp?.message}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    required
                  />
                )}
              />
            </View>
            <View style={styles.halfField}>
              <Controller
                control={control}
                name="unit"
                render={({ field: { onChange, value } }) => (
                  <Select
                    label="Unit"
                    value={value}
                    options={UNITS}
                    onChange={onChange}
                    error={errors.unit?.message}
                    required
                  />
                )}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Controller
                control={control}
                name="current_stock"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Current Stock"
                    value={value}
                    onChangeText={onChange}
                    error={errors.current_stock?.message}
                    keyboardType="number-pad"
                    required
                  />
                )}
              />
            </View>
            <View style={styles.halfField}>
              <Controller
                control={control}
                name="min_stock_level"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Min Stock Level"
                    value={value}
                    onChangeText={onChange}
                    error={errors.min_stock_level?.message}
                    keyboardType="number-pad"
                    required
                  />
                )}
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Inventory Adjustment</Text>
          <Text style={styles.hint}>
            Adjust stock quantity (positive to add, negative to remove)
          </Text>
          <View style={styles.row}>
            <View style={styles.halfField}>
              <Input
                label="Adjustment Quantity"
                value={adjustmentQuantity}
                onChangeText={setAdjustmentQuantity}
                placeholder="e.g., +10 or -5"
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.halfField}>
              <Select
                label="Reason"
                value={adjustmentReason}
                options={ADJUSTMENT_REASONS}
                onChange={setAdjustmentReason}
                placeholder="Select reason"
              />
            </View>
          </View>
          {adjustmentQuantity && adjustmentQuantity !== '0' && (
            <Text style={styles.adjustmentPreview}>
              New stock will be: {item.current_stock} + {adjustmentQuantity} ={' '}
              {item.current_stock + parseInt(adjustmentQuantity)}
            </Text>
          )}

          <Text style={styles.sectionTitle}>Categorization</Text>

          <Controller
            control={control}
            name="category_id"
            render={({ field: { onChange, value } }) => (
              <Select
                label="Category"
                value={value}
                options={categoryOptions}
                onChange={onChange}
                error={errors.category_id?.message}
                required
              />
            )}
          />

          {subcategories.length > 0 && (
            <Controller
              control={control}
              name="subcategory_id"
              render={({ field: { onChange, value } }) => (
                <Select
                  label="Subcategory"
                  value={value || ''}
                  options={[{ label: 'None', value: '' }, ...subcategoryOptions]}
                  onChange={onChange}
                />
              )}
            />
          )}

          <Text style={styles.sectionTitle}>Status</Text>

          <Controller
            control={control}
            name="status"
            render={({ field: { onChange, value } }) => (
              <Select
                label="Status"
                value={value}
                options={STATUS_OPTIONS}
                onChange={onChange}
                required
              />
            )}
          />

          <Text style={styles.sectionTitle}>Available Pincodes</Text>
          <Text style={styles.hint}>
            Select at least one pincode ({selectedPincodes.length} selected)
          </Text>
          <View style={styles.pincodeContainer}>
            {AVAILABLE_PINCODES.map((pincode) => (
              <TouchableOpacity
                key={pincode}
                style={[
                  styles.pincodeChip,
                  selectedPincodes.includes(pincode) && styles.pincodeChipActive,
                ]}
                onPress={() => togglePincode(pincode)}
              >
                <Text
                  style={[
                    styles.pincodeText,
                    selectedPincodes.includes(pincode) && styles.pincodeTextActive,
                  ]}
                >
                  {pincode}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Item Images</Text>
          <Text style={styles.hint}>
            Manage images (max 5 images, {totalImages}/5)
          </Text>
          <View style={styles.imageContainer}>
            {/* Existing images */}
            {existingImages.map((image) => (
              <View key={image.id} style={styles.imageWrapper}>
                <TouchableOpacity onPress={() => handleSetPrimaryImage(image.id)}>
                  <Image source={{ uri: image.image_url }} style={styles.imagePreview} />
                </TouchableOpacity>
                {image.is_primary && (
                  <View style={styles.primaryBadge}>
                    <Text style={styles.primaryText}>Primary</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => handleDeleteExistingImage(image.id)}
                >
                  <Text style={styles.removeImageText}>×</Text>
                </TouchableOpacity>
                {!image.is_primary && (
                  <TouchableOpacity
                    style={styles.setPrimaryButton}
                    onPress={() => handleSetPrimaryImage(image.id)}
                  >
                    <Text style={styles.setPrimaryText}>Set Primary</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            {/* New images */}
            {newImages.map((image, index) => (
              <View key={`new-${index}`} style={styles.imageWrapper}>
                <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => handleRemoveNewImage(index)}
                >
                  <Text style={styles.removeImageText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
            {totalImages < 5 && (
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={handlePickImage}
              >
                <Text style={styles.addImageText}>+ Add Image</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title={submitting || uploadingImages ? 'Updating...' : 'Update Item'}
              onPress={handleSubmit(onSubmit)}
              loading={submitting || uploadingImages}
              fullWidth
            />
            <Button
              title="Cancel"
              onPress={() => router.back()}
              variant="outline"
              fullWidth
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 12,
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  skuContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  skuLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  skuValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  adjustmentPreview: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginTop: 8,
  },
  pincodeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  pincodeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  pincodeChipActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  pincodeText: {
    fontSize: 14,
    color: '#666',
  },
  pincodeTextActive: {
    color: '#007AFF',
    fontWeight: '500',
  },
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  imageWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  primaryBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#007AFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  primaryText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  setPrimaryButton: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 4,
    borderRadius: 4,
  },
  setPrimaryText: {
    color: '#fff',
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '600',
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  addImageText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 24,
    gap: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
});
