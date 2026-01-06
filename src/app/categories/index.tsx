import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';

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

export default function CategoriesPage() {
  const router = useRouter();
  const { logout, session, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Define fetchCategories before using it in useEffect
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch categories with their subcategories
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
        .order('name', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setCategories(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load categories');
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  // All hooks must be called before any early returns
  useEffect(() => {
    if (session) {
      fetchCategories();
    }
  }, [session]);

  // Watch for session becoming null and navigate
  useEffect(() => {
    if (isLoggingOut && !session) {
      setIsLoggingOut(false);
      router.replace('/auth');
    }
  }, [session, isLoggingOut, router]);

  // Protect route - redirect to auth if no session (after all hooks)
  if (authLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/auth" />;
  }

  const handleCategoryPress = (categoryId: string) => {
    router.push(`/categories/${categoryId}`);
  };

  const performLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      // Navigation will happen via useEffect when session becomes null
      // Also try direct navigation
      router.replace('/auth');
    } catch (error) {
      setIsLoggingOut(false);
      router.replace('/auth');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: performLogout,
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading categories...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchCategories}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.categoryCard}
            onPress={() => handleCategoryPress(item.id)}
          >
            <View style={styles.categoryContent}>
              <Text style={styles.categoryName}>{item.name}</Text>
              {item.description && (
                <Text style={styles.categoryDescription}>{item.description}</Text>
              )}
              {/* Show subcategory count if available */}
              {item.subcategories && item.subcategories.length > 0 && (
                <Text style={styles.subcategoryCount}>
                  {item.subcategories.length} subcategor{item.subcategories.length === 1 ? 'y' : 'ies'}
                </Text>
              )}
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No categories found</Text>
          </View>
        }
      />
      {/* Move logout button outside FlatList for better touch handling */}
      <View style={styles.logoutContainer}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={async () => {
            console.log('LOGOUT BUTTON CLICKED!');
            try {
              // Perform logout directly
              console.log('Starting logout...');
              await logout();
              console.log('Logout completed, navigating...');
              
              // Navigate immediately
              router.replace('/auth');
              console.log('Navigation called');
            } catch (error) {
              console.error('Logout error:', error);
              router.replace('/auth');
            }
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 16,
  },
  categoryCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryContent: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  subcategoryCount: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
    marginTop: 4,
  },
  arrow: {
    fontSize: 20,
    color: '#007AFF',
    marginLeft: 12,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  logoutContainer: {
    padding: 16,
    paddingBottom: 20,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  logoutButton: {
    backgroundColor: '#ff3b30',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});