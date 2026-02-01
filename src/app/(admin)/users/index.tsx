import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { AddUserModal } from './add-user-modal';
import { EditUserModal } from './edit-user-modal';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth-context';
import { StaffUser } from '../../../types/database';

export default function AdminUsersScreen() {
  const { session } = useAuth();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<StaffUser | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  
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
      
      // Use RPC function to fetch staff users with emails from auth.users
      const { data, error } = await supabase.rpc('get_staff_users_with_email', {
        p_role: roleFilter || null,
        p_status: statusFilter || null,
      });

      if (error) {
        console.error('Error loading users:', error);
        Alert.alert('Error', 'Failed to load users');
        return;
      }

      setUsers(data || []);
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

  const handleShowDetails = (user: StaffUser) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const handleEditUser = (user: StaffUser) => {
    setMenuVisible(null);
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleDeleteUser = (user: StaffUser) => {
    setMenuVisible(null);
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user.first_name} ${user.last_name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Call edge function to delete user
              const { data: { session: currentSession } } = await supabase.auth.getSession();
              if (!currentSession?.access_token) {
                Alert.alert('Error', 'Not authenticated');
                return;
              }

              const response = await fetch(
                `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/delete-user`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentSession.access_token}`,
                  },
                  body: JSON.stringify({ email: user.email }),
                }
              );

              const result = await response.json();

              if (!response.ok || !result.success) {
                throw new Error(result.error || 'Failed to delete user');
              }

              Alert.alert('Success', 'User deleted successfully');
              loadUsers(); // Reload the list
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  const toggleMenu = (userId: string) => {
    setMenuVisible(menuVisible === userId ? null : userId);
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_password':
        return 'Pending Password';
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderUserItem = ({ item }: { item: StaffUser }) => (
    <View style={styles.userRow}>
      <View style={styles.userRowContent}>
        {/* User (Name + Status) */}
        <View style={styles.userColumn}>
          <Text style={styles.userName}>
            {item.first_name} {item.last_name}
          </Text>
          <View style={styles.statusBadgeWrapper}>
            <Badge
              label={getStatusLabel(item.status)}
              variant={getStatusBadgeVariant(item.status)}
              size="sm"
            />
          </View>
        </View>

        {/* Email */}
        <View style={styles.emailColumn}>
          <Text style={styles.userEmail} numberOfLines={1}>
            {item.email || 'No email'}
          </Text>
        </View>

        {/* Role Badge */}
        <View style={styles.roleColumn}>
          <Badge
            label={getRoleLabel(item.role)}
            variant="info"
            size="sm"
          />
        </View>

        {/* Three-dot Menu */}
        <View style={styles.menuColumn}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => toggleMenu(item.id)}
          >
            <Text style={styles.menuIcon}>⋮</Text>
          </TouchableOpacity>

          {/* Dropdown Menu */}
          {menuVisible === item.id && (
            <>
              <TouchableOpacity
                style={styles.menuOverlay}
                onPress={() => setMenuVisible(null)}
              />
              <View style={styles.menuDropdown}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleShowDetails(item)}
                >
                  <Text style={styles.menuItemText}>👁️ View</Text>
                </TouchableOpacity>
                <View style={styles.menuDivider} />
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleEditUser(item)}
                >
                  <Text style={styles.menuItemText}>✏️ Edit</Text>
                </TouchableOpacity>
                <View style={styles.menuDivider} />
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleDeleteUser(item)}
                >
                  <Text style={[styles.menuItemText, styles.menuItemDanger]}>🗑️ Delete</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
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

      {/* Table Header */}
      <View style={styles.tableHeader}>
        <View style={styles.userColumn}>
          <Text style={styles.tableHeaderText}>User</Text>
        </View>
        <View style={styles.emailColumn}>
          <Text style={styles.tableHeaderText}>Email</Text>
        </View>
        <View style={styles.roleColumn}>
          <Text style={styles.tableHeaderText}>Role</Text>
        </View>
        <View style={styles.menuColumn}>
          <Text style={styles.tableHeaderText}></Text>
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

      {/* User Details Modal */}
      <Modal
        visible={showDetailsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>User Details</Text>
              <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedUser && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Personal Information</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Full Name:</Text>
                    <Text style={styles.detailValue}>
                      {selectedUser.first_name} {selectedUser.last_name}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Email:</Text>
                    <Text style={styles.detailValue}>
                      {selectedUser.email || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Phone:</Text>
                    <Text style={styles.detailValue}>{selectedUser.phone}</Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Role & Status</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Role:</Text>
                    <Text style={styles.detailValue}>
                      {getRoleLabel(selectedUser.role)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <Text style={styles.detailValue}>
                      {getStatusLabel(selectedUser.status)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Last Login:</Text>
                    <Text style={styles.detailValue}>
                      {formatDate(selectedUser.last_login || null)}
                    </Text>
                  </View>
                </View>

                {selectedUser.role === 'sales' && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Sales Information</Text>
                    {selectedUser.region && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Region:</Text>
                        <Text style={styles.detailValue}>{selectedUser.region}</Text>
                      </View>
                    )}
                    {selectedUser.pincode && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Pincode:</Text>
                        <Text style={styles.detailValue}>{selectedUser.pincode}</Text>
                      </View>
                    )}
                    {selectedUser.address && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Address:</Text>
                        <Text style={styles.detailValue}>{selectedUser.address}</Text>
                      </View>
                    )}
                  </View>
                )}

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Account Information</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>User ID:</Text>
                    <Text style={[styles.detailValue, styles.monoText]}>
                      {selectedUser.user_id}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Created:</Text>
                    <Text style={styles.detailValue}>
                      {formatDate(selectedUser.created_at)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Updated:</Text>
                    <Text style={styles.detailValue}>
                      {formatDate(selectedUser.updated_at)}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            )}

            <View style={styles.modalFooter}>
              <Button
                title="Close"
                onPress={() => setShowDetailsModal(false)}
                variant="secondary"
              />
            </View>
          </View>
        </View>
      </Modal>

      <AddUserModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
      />

      <EditUserModal
        visible={showEditModal}
        user={selectedUser}
        onClose={() => {
          setShowEditModal(false);
          setSelectedUser(null);
        }}
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
  tableHeader: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 2,
    borderBottomColor: '#ddd',
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
  },
  listContainer: {
    paddingBottom: 16,
  },
  emptyContainer: {
    flex: 1,
  },
  userRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  userRowContent: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  userColumn: {
    flex: 3,
    paddingRight: 8,
  },
  emailColumn: {
    flex: 3,
    paddingRight: 8,
  },
  roleColumn: {
    flex: 2,
    paddingRight: 8,
  },
  menuColumn: {
    width: 40,
    alignItems: 'center',
    position: 'relative',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  statusBadgeWrapper: {
    marginTop: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  menuButton: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 998,
  },
  menuDropdown: {
    position: 'absolute',
    top: 35,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 120,
    zIndex: 999,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontSize: 14,
    color: '#333',
  },
  menuItemDanger: {
    color: '#dc3545',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#eee',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxWidth: 600,
    maxHeight: '80%',
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
  closeButton: {
    fontSize: 24,
    color: '#666',
    paddingHorizontal: 8,
  },
  modalBody: {
    padding: 16,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    width: 120,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  monoText: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
});
