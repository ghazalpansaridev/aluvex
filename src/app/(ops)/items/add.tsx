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
import { useRouter, Stack } from 'expo-router';
import { HeaderLogo } from '../../../components/ui/HeaderLogo';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../../lib/auth-context';
import { supabase } from '../../../lib/supabase';
import {
  createItem,
  setItemPincodes,
  uploadItemImage,
  CreateItemParams,
} from '../../../lib/api';
import { Input, Button, Select, LoadingSpinner } from '../../../components/ui';

// Validation schema
const itemSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(150, 'Name must be at most 150 characters'),
  sku: z.string().min(3, 'SKU must be at least 3 characters').max(50, 'SKU must be at most 50 characters'),
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

export interface AddItemScreenProps {
  backRoute?: string;
}

export function AddItemScreenBase({ backRoute }: AddItemScreenProps = {}) {
  const router = useRouter();
  const navigateBackRoute = backRoute || '/(ops)/items';
  const { user, session } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPincodes, setSelectedPincodes] = useState<string[]>([]);
  const [images, setImages] = useState<ImageFile[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: '',
      sku: '',
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

  // Fetch categories
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
        Alert.alert('Error', 'Failed to load categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handlePickImage = async () => {
    if (images.length >= 5) {
      if (Platform.OS === 'web') {
        alert('You can upload a maximum of 5 images');
      } else {
        Alert.alert('Limit Reached', 'You can upload a maximum of 5 images');
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
      selectionLimit: 5 - images.length,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newImages: ImageFile[] = result.assets.map((asset: any) => ({
        uri: asset.uri || '',
        name: asset.fileName || `image_${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      }));
      setImages([...images, ...newImages]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const togglePincode = (pincode: string) => {
    setSelectedPincodes((prev) =>
      prev.includes(pincode)
        ? prev.filter((p) => p !== pincode)
        : [...prev, pincode]
    );
  };

  const onSubmit = async (data: ItemFormData) => {
    console.log('Form submitted with data:', data);
    console.log('Selected pincodes:', selectedPincodes);
    console.log('Images:', images.length);

    // Validate pincodes
    if (selectedPincodes.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one pincode');
      return;
    }

    // Validate images
    if (images.length === 0) {
      Alert.alert('Validation Error', 'Please upload at least one image');
      return;
    }

    try {
      setSubmitting(true);
      console.log('Starting item creation...');

      // Create item
      const itemData: CreateItemParams = {
        name: data.name,
        sku: data.sku,
        description: data.description || undefined,
        mrp: parseFloat(data.mrp),
        unit: data.unit,
        category_id: data.category_id,
        subcategory_id: data.subcategory_id || undefined,
        min_stock_level: parseInt(data.min_stock_level),
        current_stock: parseInt(data.current_stock),
        status: data.status as 'active' | 'inactive' | 'draft',
      };

      // Ensure user is authenticated
      if (!session || !user) {
        throw new Error('You must be logged in to create items');
      }

      // Ensure supabase client has the session
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        throw new Error('Session expired. Please log in again.');
      }

      console.log('Creating item with data:', itemData);
      const createdItem = await createItem(itemData, supabase);
      console.log('Item created successfully:', createdItem.id);

      let pincodesSet = false;
      let imagesUploaded = false;

      // Set pincodes
      try {
        console.log('Setting pincodes...');
        await setItemPincodes(createdItem.id, selectedPincodes, supabase);
        console.log('Pincodes set successfully');
        pincodesSet = true;
      } catch (pincodeError: any) {
        console.error('Error setting pincodes:', pincodeError);
        // Continue even if pincodes fail - item is already created
      }

      // Upload images
      try {
        console.log('Uploading images...');
        setUploadingImages(true);
        for (let i = 0; i < images.length; i++) {
          const isPrimary = i === 0; // First image is primary
          console.log(`Uploading image ${i + 1}/${images.length}...`);
          await uploadItemImage(
            createdItem.id,
            images[i],
            isPrimary,
            supabase
          );
          console.log(`Image ${i + 1} uploaded successfully`);
        }
        setUploadingImages(false);
        console.log('All images uploaded successfully');
        imagesUploaded = true;
      } catch (imageError: any) {
        console.error('Error uploading images:', imageError);
        setUploadingImages(false);
        // Continue even if images fail - item is already created
      }

      // Show success message with any warnings
      console.log('Item creation completed');
      setSubmitting(false);
      setUploadingImages(false);
      
      if (pincodesSet && imagesUploaded) {
        if (Platform.OS === 'web') {
          alert('Item created successfully');
          router.push(navigateBackRoute as any);
        } else {
          Alert.alert('Success', 'Item created successfully', [
            { text: 'OK', onPress: () => router.push(navigateBackRoute as any) },
          ]);
        }
      } else {
        const warnings = [];
        if (!pincodesSet) warnings.push('pincodes');
        if (!imagesUploaded) warnings.push('images');
        
        const message = `Item created successfully, but failed to set ${warnings.join(' and ')}. You can edit the item to add them.`;
        
        if (Platform.OS === 'web') {
          alert(message);
          router.push(navigateBackRoute as any);
        } else {
          Alert.alert('Item Created', message, [
            { text: 'OK', onPress: () => router.push(navigateBackRoute as any) },
          ]);
        }
      }
    } catch (err: any) {
      console.error('Error creating item:', err);
      console.error('Error details:', JSON.stringify(err, null, 2));
      
      setSubmitting(false);
      setUploadingImages(false);
      
      const errorMessage = err.message || err.error?.message || 'Failed to create item';
      
      if (Platform.OS === 'web') {
        alert(`Error: ${errorMessage}`);
      } else {
        Alert.alert('Error', errorMessage);
      }
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading categories..." />;
  }

  const categoryOptions = categories.map((c) => ({ label: c.name, value: c.id }));
  const subcategoryOptions = subcategories.map((s) => ({ label: s.name, value: s.id }));

  return (
    <>
      <Stack.Screen options={{ title: 'Add New Item', headerTitle: () => <HeaderLogo /> }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sectionTitle}>Basic Information</Text>

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
            name="sku"
            render={({ field: { onChange, value } }) => (
              <Input
                label="SKU / Item Code"
                value={value}
                onChangeText={onChange}
                error={errors.sku?.message}
                placeholder="e.g., TIL-001"
                autoCapitalize="characters"
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
                    label="Opening Stock"
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
            Upload at least one image (max 5 images, {images.length}/5 uploaded)
          </Text>
          <View style={styles.imageContainer}>
            {images.map((image, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                {index === 0 && (
                  <View style={styles.primaryBadge}>
                    <Text style={styles.primaryText}>Primary</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => handleRemoveImage(index)}
                >
                  <Text style={styles.removeImageText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 5 && (
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
              title={submitting || uploadingImages ? 'Creating...' : 'Create Item'}
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

// Default export for ops route - uses default backRoute (/(ops)/items)
export default function AddItemScreen() {
  return <AddItemScreenBase />;
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
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
});
