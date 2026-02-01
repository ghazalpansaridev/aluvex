import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { supabase } from '../../../lib/supabase';
import { StaffUser } from '../../../types/database';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface EditUserModalProps {
  visible: boolean;
  user: StaffUser | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditUserModal({ visible, user, onClose, onSuccess }: EditUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<string>('');
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    if (user) {
      setRole(user.role);
      setStatus(user.status);
    }
  }, [user]);

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('staff_users')
        .update({
          role,
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating user:', error);
        Alert.alert('Error', 'Failed to update user. Please try again.');
        return;
      }

      Alert.alert(
        'Success',
        'User has been updated successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              handleClose();
              onSuccess();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error updating user:', error);
      Alert.alert('Error', 'Failed to update user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = () => {
    if (!user) return false;
    return role !== user.role || status !== user.status;
  };

  if (!user) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Edit User</Text>
              <Button
                title="✕"
                onPress={handleClose}
                variant="ghost"
                size="sm"
                style={styles.closeButton}
              />
            </View>

            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.scrollViewContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.userInfo}>
                <Text style={styles.userInfoLabel}>User:</Text>
                <Text style={styles.userInfoValue}>
                  {user.first_name} {user.last_name}
                </Text>
                <Text style={styles.userInfoEmail}>{user.email}</Text>
              </View>

              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>Update User Details</Text>

              <Select
                label="Role"
                placeholder="Select role"
                value={role}
                onChange={setRole}
                options={[
                  { label: 'Admin', value: 'admin' },
                  { label: 'Operations', value: 'operations' },
                  { label: 'Sales', value: 'sales' },
                ]}
                required
              />

              <Select
                label="Status"
                placeholder="Select status"
                value={status}
                onChange={setStatus}
                options={[
                  { label: 'Active', value: 'active' },
                  { label: 'Pending Password', value: 'pending_password' },
                  { label: 'Inactive', value: 'inactive' },
                ]}
                required
              />

              {hasChanges() && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoBoxText}>
                    Changes will be applied immediately upon saving.
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.footer}>
              <Button
                title="Cancel"
                onPress={handleClose}
                variant="outline"
                style={styles.cancelButton}
              />
              <View style={styles.spacer} />
              <Button
                title="Save Changes"
                onPress={handleSubmit}
                loading={loading}
                disabled={!hasChanges()}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 500,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    maxHeight: SCREEN_HEIGHT * 0.75,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    minWidth: 40,
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollViewContent: {
    paddingBottom: 10,
  },
  userInfo: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  userInfoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  userInfoValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userInfoEmail: {
    fontSize: 14,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  infoBoxText: {
    fontSize: 13,
    color: '#1976D2',
  },
  footer: {
    flexDirection: 'row',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelButton: {
    flex: 1,
  },
  spacer: {
    width: 12,
  },
});
