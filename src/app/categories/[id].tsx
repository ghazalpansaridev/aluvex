import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

interface Subcategory {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  created_at: string;
  subcategories?: Subcategory[];
}

export default function CategoryDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchCategory(id);
    }
  }, [id]);

  const fetchCategory = async (categoryId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch category with subcategories
      const { data, error: fetchError } = await supabase
        .from('categories')
        .select(`
          *,
          subcategories (
            id,
            name,
            description,
            image_url
          )
        `)
        .eq('id', categoryId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      setCategory(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load category');
      console.error('Error fetching category:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubcategoryPress = (subcategoryId: string) => {
    // Navigate to subcategory detail page or products filtered by subcategory
    router.push(`/categories/${id}/subcategories/${subcategoryId}`);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading category...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchCategory(id!)}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!category) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Category not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{category.name}</Text>
        {category.description && (
          <Text style={styles.description}>{category.description}</Text>
        )}

        {/* Subcategories Section */}
        {category.subcategories && category.subcategories.length > 0 ? (
          <View style={styles.subcategoriesSection}>
            <Text style={styles.sectionTitle}>Subcategories</Text>
            <FlatList
              data={category.subcategories}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.subcategoryCard}
                  onPress={() => handleSubcategoryPress(item.id)}
                >
                  <View style={styles.subcategoryContent}>
                    <Text style={styles.subcategoryName}>{item.name}</Text>
                    {item.description && (
                      <Text style={styles.subcategoryDescription}>{item.description}</Text>
                    )}
                  </View>
                  <Text style={styles.arrow}>→</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        ) : (
          <View style={styles.noSubcategoriesContainer}>
            <Text style={styles.noSubcategoriesText}>No subcategories available</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 24,
  },
  subcategoriesSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  subcategoryCard: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  subcategoryContent: {
    flex: 1,
  },
  subcategoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  subcategoryDescription: {
    fontSize: 14,
    color: '#666',
  },
  arrow: {
    fontSize: 18,
    color: '#007AFF',
    marginLeft: 12,
  },
  noSubcategoriesContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noSubcategoriesText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});