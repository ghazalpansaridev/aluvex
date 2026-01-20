import React from 'react';
import { View, StyleSheet } from 'react-native';
import { EmptyState } from '../../../components/ui';

export default function AdminOrdersScreen() {
  return (
    <View style={styles.container}>
      <EmptyState
        title="All Orders"
        description="View and manage all orders across the platform"
        icon="📦"
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
