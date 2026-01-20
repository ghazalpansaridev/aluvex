import React from 'react';
import { View, StyleSheet } from 'react-native';
import { EmptyState } from '../../../components/ui';

export default function OpsItemsScreen() {
  return (
    <View style={styles.container}>
      <EmptyState
        title="Item Management"
        description="Manage product inventory and details"
        icon="📝"
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
