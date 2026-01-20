import React from 'react';
import { View, StyleSheet } from 'react-native';
import { EmptyState } from '../../../components/ui';

export default function OpsOrdersScreen() {
  return (
    <View style={styles.container}>
      <EmptyState
        title="No orders to process"
        description="Orders will appear here when retailers place them"
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
