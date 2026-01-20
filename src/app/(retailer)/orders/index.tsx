import React from 'react';
import { View, StyleSheet } from 'react-native';
import { EmptyState } from '../../../components/ui';

export default function OrdersScreen() {
  return (
    <View style={styles.container}>
      <EmptyState
        title="No orders yet"
        description="Your order history will appear here"
        icon="📋"
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
