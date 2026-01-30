import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { AddUserModal } from './add-user-modal';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth-context';
import { StaffUser } from '../../../types/database';

export default function AdminUsersScreen() {
  const { session } = useAuth();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Filters
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUsers();
  }, [roleFilter, statusFilter]); // Reload when filters change

  const loadUsers = async () => {
    if (!session?.access_token) return;

    try {
      setLoading(true);
      
      // Query staff_users table
      // Note: We can't directly join auth.users, so we'll fetch email separately
      let query = supabase
        .from('staff_users')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (roleFilter) {
        query = query.eq('role', roleFilter);
      }
      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading users:', error);
        Alert.alert('Error', 'Failed to load users');
        return;
      }

      // Fetch email addresses from auth.users via Edge Function or RPC
      // For now, we'll use the user_id to fetch email if needed
      // In production, you might want to create an RPC function that joins both tables
      const transformedUsers = (data || []).map((user: any) => ({
        ...user,
        email: '', // Will be populated if we add RPC function
        last_login: null, // Will be populated if we add RPC function
      }));

      setUsers(transformedUsers);
    } catch (error) {
      console.error('Error in loadUsers:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const handleAddSuccess = () => {
    loadUsers();
  };

  // Filter users by search query
  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.first_name.toLowerCase().includes(query) ||
      user.last_name.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.phone.includes(query)
    );
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending_password':
        return 'warning';
      case 'inactive':
        return 'error';
      default:
        return 'default';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'operations':
        return 'Operations';
      case 'sales':
        return 'Sales';
      default:
        return role;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderUserItem = ({ item }: { item: StaffUser }) => (
    <TouchableOpacity style={styles.userCard}>
      <View style={styles.userCardHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {item.first_name} {item.last_name}
          </Text>
          <Text style={styles.userEmail}>{item.email || 'No email'}</Text>
        </View>
        <View style={styles.badges}>
          <Badge
            label={getRoleLabel(item.role)}
            variant="info"
            size="sm"
          />
          <Badge
            label={
              item.status === 'pending_password'
                ? 'Pending Password'
                : item.status === 'active'
                ? 'Active'
                : 'Inactive'
            }
            variant={getStatusBadgeVariant(item.status)}
            size="sm"
          />
        </View>
      </View>
      <View style={styles.userCardDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Phone:</Text>
          <Text style={styles.detailValue}>{item.phone}</Text>
        </View>
        {item.role === 'sales' && item.region && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Region:</Text>
            <Text style={styles.detailValue}>{item.region}</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Last Login:</Text>
          <Text style={styles.detailValue}>{formatDate(item.last_login || null)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && users.length === 0) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>User Management</Text>
        <Button
          title="+ Add User"
          onPress={() => setShowAddModal(true)}
          size="sm"
        />
      </View>

      <View style={styles.filters}>
        <Input
          placeholder="Search by name, email, or phone..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={styles.searchInput}
        />

        <View style={styles.filterRow}>
          <View style={styles.filterSelect}>
            <Select
              placeholder="All Roles"
              value={roleFilter || ''}
              onChange={setRoleFilter}
              options={[
                { label: 'All Roles', value: '' },
                { label: 'Admin', value: 'admin' },
                { label: 'Operations', value: 'operations' },
                { label: 'Sales', value: 'sales' },
              ]}
            />
          </View>

          <View style={styles.filterSelect}>
            <Select
              placeholder="All Status"
              value={statusFilter || ''}
              onChange={setStatusFilter}
              options={[
                { label: 'All Status', value: '' },
                { label: 'Active', value: 'active' },
                { label: 'Pending Password', value: 'pending_password' },
                { label: 'Inactive', value: 'inactive' },
              ]}
            />
          </View>
        </View>
      </View>

      <FlatList
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          filteredUsers.length === 0 ? styles.emptyContainer : styles.listContainer
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            title="No users found"
            description={
              searchQuery || roleFilter || statusFilter
                ? 'Try adjusting your filters'
                : 'Add your first user to get started'
            }
            icon="👥"
          />
        }
      />

      <AddUserModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  filters: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
  },
  filterSelect: {
    flex: 1,
    marginBottom: 0,
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
  },
  userCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  userCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  userCardDetails: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    width: 80,
  },
  detailValue: {
    fontSize: 12,
    color: '#333',
    flex: 1,
  },
});
