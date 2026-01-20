import React from 'react';
import { View, StyleSheet } from 'react-native';
import { EmptyState } from '../../../components/ui';

export default function AdminUsersScreen() {
  return (
    <View style={styles.container}>
      <EmptyState
        title="User Management"
        description="Manage admin, ops, and sales users"
        icon="👥"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
